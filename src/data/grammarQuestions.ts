import { 
  logQuizSubmissionToFirestore, 
  syncGrammarResultToFirestore, 
  fetchFirestoreGrammarResults, 
  syncUserToFirestore 
} from '../services/firestoreActivityService';

export interface GrammarQuestion {
  id: string;
  classLevel: '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | string;
  topic: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tenseType?: 'Identify Tense' | 'Fill Verb Form' | 'Tense Conversion' | 'Error Spotting';
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
}

export interface SavedGrammarResult {
  code: string;
  date: string;
  timestamp?: string;
  createdAt?: string;
  classLevel: '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | string;
  topic: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  score: number;
  total: number;
  percentage: number;
  timeTakenSeconds: number;
  userEmail?: string;
  userName?: string;
  questions: {
    questionText: string;
    topic: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export function getQuestionDifficulty(q: GrammarQuestion): 'Easy' | 'Medium' | 'Hard' {
  if (q.difficulty) return q.difficulty;
  
  // Deterministic fallback based on id and classLevel
  const charCodeSum = q.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const mod = charCodeSum % 3;
  
  if (q.classLevel === '4' || q.classLevel === '5') {
    return mod === 2 ? 'Medium' : 'Easy';
  } else if (q.classLevel === '6') {
    return mod === 0 ? 'Easy' : mod === 1 ? 'Medium' : 'Hard';
  } else if (q.classLevel === '7') {
    return mod === 0 ? 'Medium' : mod === 1 ? 'Hard' : 'Easy';
  } else {
    return mod === 0 ? 'Hard' : 'Medium';
  }
}

const GRAMMAR_STORAGE_KEY = 'examcraft_grammar_results';

export function getAllGrammarResults(): SavedGrammarResult[] {
  // Background server fetch
  syncGrammarResultsWithServer().catch(() => {});

  try {
    const stored = localStorage.getItem(GRAMMAR_STORAGE_KEY);
    if (stored) {
      const parsed: SavedGrammarResult[] = JSON.parse(stored);
      return parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  } catch (e) {
    console.warn('Failed to fetch grammar results:', e);
  }
  return [];
}

export async function syncGrammarResultsWithServer(): Promise<SavedGrammarResult[]> {
  try {
    const stored = localStorage.getItem(GRAMMAR_STORAGE_KEY);
    let localList: SavedGrammarResult[] = stored ? JSON.parse(stored) : [];
    const map = new Map<string, SavedGrammarResult>();

    localList.forEach(r => map.set(r.code, r));

    // 1. Fetch from server endpoint
    try {
      const resp = await fetch('/api/grammar-results');
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.results)) {
          data.results.forEach((r: SavedGrammarResult) => {
            if (r.code) map.set(r.code, r);
          });
        }
      }
    } catch (err) {
      console.warn('Server grammar results fetch warning:', err);
    }

    // 2. Fetch from Firebase Firestore grammar_results collection
    try {
      const firestoreResults = await fetchFirestoreGrammarResults();
      if (Array.isArray(firestoreResults)) {
        firestoreResults.forEach(r => {
          if (r.code) map.set(r.code, r);
        });
      }
    } catch (err) {
      console.warn('Firestore grammar results fetch warning:', err);
    }

    const merged = Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(GRAMMAR_STORAGE_KEY, JSON.stringify(merged));

    // Sync missing items to server in background
    merged.forEach(r => {
      fetch('/api/grammar-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: r })
      }).catch(() => {});
    });

    return merged;
  } catch (e) {
    console.warn('Failed to sync grammar results:', e);
  }
  return getAllGrammarResults();
}

export function saveGrammarResult(result: SavedGrammarResult): void {
  try {
    let userEmail = result.userEmail;
    let userName = result.userName;

    if (!userEmail || userEmail === 'guest@examcraft.internal' || userEmail === 'unknown@guest') {
      try {
        const saved = localStorage.getItem('examidea_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            userEmail = parsed.email;
            userName = parsed.name || userEmail.split('@')[0];
          }
        }
      } catch {}
    }

    userEmail = userEmail || 'guest@examcraft.internal';
    userName = userName || (userEmail.includes('guest') ? 'Guest Student (Guest)' : userEmail.split('@')[0]);

    const isoTimestamp = (result as any).timestamp || (result as any).createdAt || new Date().toISOString();

    const normalizedResult: SavedGrammarResult = {
      ...result,
      timestamp: isoTimestamp,
      createdAt: isoTimestamp,
      userEmail,
      userName
    };

    // Submitting a test clears any stale deregistered flags for this user in localStorage
    try {
      const savedDereg = localStorage.getItem('examidea_deregistered_user_emails');
      if (savedDereg) {
        const parsed = JSON.parse(savedDereg);
        if (Array.isArray(parsed)) {
          const normE = userEmail.toLowerCase().trim();
          const filtered = parsed.filter((item: string) => {
            const normI = String(item).toLowerCase().trim();
            return normI !== normE && !normI.includes(normE) && !normE.includes(normI);
          });
          localStorage.setItem('examidea_deregistered_user_emails', JSON.stringify(filtered));
        }
      }
    } catch {}

    const stored = localStorage.getItem(GRAMMAR_STORAGE_KEY);
    const existing: SavedGrammarResult[] = stored ? JSON.parse(stored) : [];
    const updated = [normalizedResult, ...existing.filter(r => r && r.code !== normalizedResult.code)];
    localStorage.setItem(GRAMMAR_STORAGE_KEY, JSON.stringify(updated));

    // 1. Save to server store
    fetch('/api/grammar-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: normalizedResult })
    }).catch(err => console.warn('Save grammar result server warning:', err));

    // 2. Also log as server activity for real-time admin monitoring
    fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity: {
          id: `quiz_${normalizedResult.code}_${Date.now()}`,
          studentId: userEmail,
          studentName: userName,
          studentEmail: userEmail,
          activityType: 'quiz_submitted',
          paperId: normalizedResult.code,
          paperCode: normalizedResult.code,
          paperTitle: `${normalizedResult.topic} - Class ${normalizedResult.classLevel}`,
          subject: 'English Grammar & Practice',
          classLevel: String(normalizedResult.classLevel),
          score: normalizedResult.score,
          totalMarks: normalizedResult.total,
          percentage: normalizedResult.percentage,
          timeTakenSeconds: normalizedResult.timeTakenSeconds || 60,
          timestamp: isoTimestamp
        }
      })
    }).catch(() => {});

    // 3. Sync user profile into server store
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user: { 
          id: `usr-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: userName,
          email: userEmail,
          role: userEmail === 'mukesh186000@gmail.com' ? 'admin' : 'student',
          lastDownloadDate: new Date().toISOString().split('T')[0]
        } 
      })
    }).catch(() => {});

    // 4. Save directly to Firebase Firestore grammar_results collection
    syncGrammarResultToFirestore(normalizedResult).catch(err => console.warn('Firestore grammar sync error:', err));

    // 5. Sync user profile to Firestore 'users' collection
    syncUserToFirestore({
      id: `usr-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: userName,
      email: userEmail,
      role: userEmail === 'mukesh186000@gmail.com' ? 'admin' : 'student'
    }).catch(err => console.warn('Firestore user sync error:', err));

    // 6. Log activity and quiz submission to Firestore
    logQuizSubmissionToFirestore(
      {
        id: userEmail,
        name: userName,
        email: userEmail
      },
      {
        paperId: normalizedResult.code,
        paperCode: normalizedResult.code,
        paperTitle: `${normalizedResult.topic} - Class ${normalizedResult.classLevel}`,
        subjectName: 'English Grammar & Practice',
        classLevel: String(normalizedResult.classLevel),
        score: normalizedResult.score,
        totalMarks: normalizedResult.total,
        percentage: normalizedResult.percentage,
        timeTakenSeconds: normalizedResult.timeTakenSeconds || 60
      }
    ).catch(err => console.warn('Firestore grammar activity logging error:', err));
  } catch (e) {
    console.warn('Failed to save grammar result:', e);
  }
}

export function deleteGrammarResult(code: string): void {
  try {
    const stored = localStorage.getItem(GRAMMAR_STORAGE_KEY);
    const existing: SavedGrammarResult[] = stored ? JSON.parse(stored) : [];
    const updated = existing.filter(r => r.code !== code);
    localStorage.setItem(GRAMMAR_STORAGE_KEY, JSON.stringify(updated));

    fetch(`/api/grammar-results/${encodeURIComponent(code)}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Delete grammar result server warning:', err));
  } catch (e) {
    console.warn('Failed to delete grammar result:', e);
  }
}

export const GRAMMAR_TOPICS = [
  'All Topics (Mixed Test)',
  'Nouns & Pronouns',
  'Articles (A, An, The)',
  'Verbs & Tenses',
  'Adjectives & Adverbs',
  'Prepositions & Conjunctions',
  'Subject-Verb Agreement',
  'Direct & Indirect Speech',
  'Active & Passive Voice',
  'Sentence Correction & Punctuation',
  'Modals & Auxiliaries',
  'Editing & Omission'
];

export const GRAMMAR_QUESTION_BANK: GrammarQuestion[] = [
  // ==================== CLASS 3 ====================
  {
    id: 'c3-1',
    classLevel: '3',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Identify the noun in the sentence: "The cat runs fast."',
    options: ['runs', 'fast', 'cat', 'The'],
    correctAnswer: 'cat',
    explanation: 'A noun is the name of a person, animal, place, or thing. "Cat" is an animal.',
    hint: 'Look for the name of the animal.'
  },
  {
    id: 'c3-2',
    classLevel: '3',
    topic: 'Articles (A, An, The)',
    difficulty: 'Easy',
    questionText: 'Choose the correct article: "I ate ___ apple for breakfast."',
    options: ['a', 'an', 'the', 'no article'],
    correctAnswer: 'an',
    explanation: 'Use "an" before words starting with vowel sounds (a, e, i, o, u). "Apple" begins with "A".',
    hint: 'Apple starts with a vowel.'
  },
  {
    id: 'c3-3',
    classLevel: '3',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Identify Tense',
    questionText: 'Which word is the action verb: "Rohan plays football in the park."',
    options: ['Rohan', 'plays', 'football', 'park'],
    correctAnswer: 'plays',
    explanation: 'A verb is an action word. "Plays" describes the action Rohan is doing.',
    hint: 'Which word tells what Rohan is doing?'
  },
  {
    id: 'c3-4',
    classLevel: '3',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Replace the underlined word with a pronoun: "Priya is reading. Priya loves books."',
    options: ['He', 'She', 'It', 'They'],
    correctAnswer: 'She',
    explanation: 'Priya is a female singular noun, so we use the pronoun "She".',
    hint: 'Priya is a girl.'
  },
  {
    id: 'c3-5',
    classLevel: '3',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Fill Verb Form',
    questionText: 'Complete with past tense: "Yesterday, I ___ a song in class."',
    options: ['sing', 'sings', 'sang', 'singing'],
    correctAnswer: 'sang',
    explanation: '"Yesterday" indicates past time. The past tense of "sing" is "sang".',
    hint: 'Think about past action.'
  },
  {
    id: 'c3-6',
    classLevel: '3',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Easy',
    questionText: 'Find the describing word (adjective): "She wore a red dress."',
    options: ['She', 'wore', 'red', 'dress'],
    correctAnswer: 'red',
    explanation: 'Adjectives describe a noun. "Red" describes the color of the dress.',
    hint: 'Which word tells the color of the dress?'
  },
  {
    id: 'c3-7',
    classLevel: '3',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Easy',
    questionText: 'Choose the correct preposition: "The book is ___ the table."',
    options: ['on', 'in', 'underneath of', 'into'],
    correctAnswer: 'on',
    explanation: '"On" shows the position of the book touching the surface of the table.',
    hint: 'Where is the book placed?'
  },
  {
    id: 'c3-8',
    classLevel: '3',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Easy',
    questionText: 'Choose the correct option: "The dogs ___ barking at night."',
    options: ['is', 'are', 'was', 'am'],
    correctAnswer: 'are',
    explanation: 'Plural noun "dogs" takes the plural verb "are" in present tense.',
    hint: 'More than one dog.'
  },

  // ==================== CLASS 4 ====================
  {
    id: 'c4-1',
    classLevel: '4',
    topic: 'Articles (A, An, The)',
    difficulty: 'Easy',
    questionText: 'Choose the correct article: "There is ___ owl sitting on the branch."',
    options: ['a', 'an', 'the', 'no article'],
    correctAnswer: 'an',
    explanation: 'Rule: Use "an" before singular nouns starting with a vowel sound (a, e, i, o, u). "Owl" starts with "O".',
    hint: 'Check the starting sound of the word "owl".'
  },
  {
    id: 'c4-2',
    classLevel: '4',
    topic: 'Articles (A, An, The)',
    difficulty: 'Easy',
    questionText: 'Fill in the blank: "___ sun shines brightly in the sky."',
    options: ['A', 'An', 'The', 'No article'],
    correctAnswer: 'The',
    explanation: 'Rule: Use "The" before unique natural objects like the Sun, Moon, Earth, and Sky.',
    hint: 'The Sun is unique in our solar system.'
  },
  {
    id: 'c4-3',
    classLevel: '4',
    topic: 'Articles (A, An, The)',
    difficulty: 'Medium',
    questionText: 'Which sentence uses the article correctly?',
    options: ['An elephant is a large animal.', 'A elephant is a large animal.', 'The an elephant is large.', 'Elephant is an large animal.'],
    correctAnswer: 'An elephant is a large animal.',
    explanation: 'Rule: "Elephant" begins with a vowel sound "e", so it takes "an". "Large" begins with consonant "l", so it takes "a".',
    hint: 'Look for "an" before elephant and "a" before large.'
  },
  {
    id: 'c4-4',
    classLevel: '4',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Identify the Collective Noun: "A herd of cows was grazing in the green field."',
    options: ['cows', 'field', 'herd', 'grazing'],
    correctAnswer: 'herd',
    explanation: 'Rule: A Collective Noun names a group of animals or people together (e.g., herd, flock, team, class).',
    hint: 'A word used for a group of animals.'
  },
  {
    id: 'c4-5',
    classLevel: '4',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Choose the correct pronoun: "Aman and Riya are siblings. ___ play badminton together."',
    options: ['He', 'She', 'They', 'It'],
    correctAnswer: 'They',
    explanation: 'Rule: Use "They" as a plural pronoun for more than one person.',
    hint: 'Pronoun used for more than one person.'
  },
  {
    id: 'c4-6',
    classLevel: '4',
    topic: 'Nouns & Pronouns',
    difficulty: 'Medium',
    questionText: 'Select the Proper Noun in the sentence: "My pet dog Bruno loves chasing balls in Central Park."',
    options: ['dog', 'Bruno', 'balls', 'pet'],
    correctAnswer: 'Bruno',
    explanation: 'Rule: Proper Nouns are specific names of pets, people, or places, and they always start with a capital letter.',
    hint: 'The specific name given to the pet dog.'
  },
  {
    id: 'c4-7',
    classLevel: '4',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'What is the plural form of "Leaf"?',
    options: ['Leafs', 'Leaves', 'Leafes', 'Leafe'],
    correctAnswer: 'Leaves',
    explanation: 'Rule: Nouns ending in -f or -fe change to -ves in the plural (leaf -> leaves, knife -> knives).',
    hint: 'Change -f to -ves.'
  },
  {
    id: 'c4-8',
    classLevel: '4',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Identify Tense',
    questionText: 'Identify the tense: "The birds are singing sweet songs in the tree."',
    options: ['Simple Present Tense', 'Present Continuous Tense', 'Simple Past Tense', 'Simple Future Tense'],
    correctAnswer: 'Present Continuous Tense',
    explanation: 'Rule: Subject + is/am/are + verb(-ing) indicates Present Continuous Tense.',
    hint: 'Look for "are" + verb ending in "-ing".'
  },
  {
    id: 'c4-9',
    classLevel: '4',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Fill Verb Form',
    questionText: 'Fill in the blank with Simple Past Tense: "She ___ a delicious cake yesterday."',
    options: ['bake', 'bakes', 'baked', 'will bake'],
    correctAnswer: 'baked',
    explanation: 'Rule: Simple Past Tense uses the V2 form of the verb (bake -> baked) for past actions.',
    hint: 'Word "yesterday" shows a past action.'
  },
  {
    id: 'c4-10',
    classLevel: '4',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Fill Verb Form',
    questionText: 'Choose the Simple Future form: "We ___ Delhi tomorrow morning."',
    options: ['visit', 'visited', 'will visit', 'are visiting'],
    correctAnswer: 'will visit',
    explanation: 'Rule: Simple Future Tense uses "will/shall" + base verb (V1) for actions that will happen.',
    hint: '"Tomorrow" indicates future action.'
  },
  {
    id: 'c4-11',
    classLevel: '4',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Tense Conversion',
    questionText: 'Convert to Simple Past Tense: "Rohan drinks fresh milk every morning."',
    options: ['Rohan drank fresh milk.', 'Rohan will drink fresh milk.', 'Rohan is drinking fresh milk.', 'Rohan has drunk fresh milk.'],
    correctAnswer: 'Rohan drank fresh milk.',
    explanation: 'Rule: Past form of "drink" is "drank". Simple Past formula: Subject + V2 + Object.',
    hint: 'Past tense of "drink" is "drank".'
  },
  {
    id: 'c4-12',
    classLevel: '4',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Error Spotting',
    questionText: 'Find the mistake in this sentence: "Yesterday my brother will buy a new pencil box."',
    options: ['Replace "will buy" with "bought"', 'Replace "Yesterday" with "Tomorrow"', 'Replace "my" with "his"', 'No error in the sentence'],
    correctAnswer: 'Replace "will buy" with "bought"',
    explanation: 'Rule: "Yesterday" refers to past time, so we must use the past tense verb "bought" instead of "will buy".',
    hint: 'Check if "Yesterday" matches "will buy".'
  },
  {
    id: 'c4-13',
    classLevel: '4',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Easy',
    questionText: 'Identify the Adjective (describing word): "She wore a pretty pink dress to the party."',
    options: ['wore', 'pretty', 'dress', 'party'],
    correctAnswer: 'pretty',
    explanation: 'Rule: Adjectives describe nouns (e.g., pretty, pink describe the dress).',
    hint: 'Which word tells us how the dress looked?'
  },
  {
    id: 'c4-14',
    classLevel: '4',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Medium',
    questionText: 'Fill in the correct degree of adjective: "An elephant is ___ than a horse."',
    options: ['big', 'bigger', 'biggest', 'more big'],
    correctAnswer: 'bigger',
    explanation: 'Rule: Use comparative degree (-er) when comparing two things (elephant vs horse).',
    hint: 'Comparison between two animals uses "than".'
  },
  {
    id: 'c4-15',
    classLevel: '4',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Easy',
    questionText: 'Identify the Adverb in this sentence: "The tortoise walked slowly across the road."',
    options: ['tortoise', 'walked', 'slowly', 'road'],
    correctAnswer: 'slowly',
    explanation: 'Rule: An Adverb tells us HOW an action is done (walked how? -> slowly). Most adverbs end in -ly.',
    hint: 'Word ending in -ly that tells how the tortoise walked.'
  },
  {
    id: 'c4-16',
    classLevel: '4',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Easy',
    questionText: 'Choose the correct preposition: "The cat is sleeping ___ the table."',
    options: ['under', 'between', 'into', 'during'],
    correctAnswer: 'under',
    explanation: 'Rule: "Under" shows position below an object.',
    hint: 'Position beneath the table.'
  },
  {
    id: 'c4-17',
    classLevel: '4',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Easy',
    questionText: 'Choose the correct joining word (conjunction): "I like apples ___ I do not like grapes."',
    options: ['and', 'but', 'because', 'so'],
    correctAnswer: 'but',
    explanation: 'Rule: Use "but" to connect two contrasting or opposite ideas.',
    hint: 'Connects two contrasting statements.'
  },
  {
    id: 'c4-18',
    classLevel: '4',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Medium',
    questionText: 'Fill in the blank: "Riya stayed at home ___ she was feeling unwell."',
    options: ['or', 'but', 'because', 'until'],
    correctAnswer: 'because',
    explanation: 'Rule: "Because" gives the reason for an action.',
    hint: 'Gives the reason why she stayed at home.'
  },
  {
    id: 'c4-19',
    classLevel: '4',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Easy',
    questionText: 'Choose the correct verb: "Each student in Class 4 ___ a colorful drawing book."',
    options: ['have', 'has', 'having', 'are'],
    correctAnswer: 'has',
    explanation: 'Rule: "Each" is singular and takes the singular verb "has".',
    hint: '"Each" means one by one (singular).'
  },
  {
    id: 'c4-20',
    classLevel: '4',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Medium',
    questionText: 'Fill in the correct helping verb: "The children ___ playing football in the playground."',
    options: ['is', 'are', 'was', 'has'],
    correctAnswer: 'are',
    explanation: 'Rule: "Children" is a plural subject, so it takes the plural verb "are".',
    hint: '"Children" is plural.'
  },
  {
    id: 'c4-21',
    classLevel: '4',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Medium',
    questionText: 'Choose the correct verb: "My mother ___ delicious curry every Sunday."',
    options: ['cook', 'cooks', 'cooking', 'were cook'],
    correctAnswer: 'cooks',
    explanation: 'Rule: Singular subject (My mother) takes singular verb with -s/-es (cooks) in Simple Present Tense.',
    hint: 'Singular subject "mother" takes verb + "s".'
  },
  {
    id: 'c4-22',
    classLevel: '4',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Easy',
    questionText: 'Which punctuation mark should end this sentence? "Where are you going for summer holidays"',
    options: ['Full Stop (.)', 'Question Mark (?)', 'Exclamation Mark (!)', 'Comma (,)'],
    correctAnswer: 'Question Mark (?)',
    explanation: 'Rule: Sentences asking a question starting with "Where", "What", "Who", etc. end with a question mark (?)',
    hint: 'It is an asking sentence / question.'
  },
  {
    id: 'c4-23',
    classLevel: '4',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Medium',
    questionText: 'Identify the sentence with correct capitalization and punctuation:',
    options: ['my friend neha lives in delhi.', 'My friend Neha lives in Delhi.', 'my Friend Neha Lives in delhi.', 'My friend neha lives in Delhi'],
    correctAnswer: 'My friend Neha lives in Delhi.',
    explanation: 'Rule: First letter of a sentence, names of people (Neha), and names of cities (Delhi) must be capitalized, ending with a full stop.',
    hint: 'Proper names (Neha, Delhi) and start of sentence must have capital letters.'
  },
  {
    id: 'c4-24',
    classLevel: '4',
    topic: 'Nouns & Pronouns',
    difficulty: 'Medium',
    questionText: 'Choose the correct opposite gender of "Actor":',
    options: ['Actress', 'Actorese', 'Lady Actor', 'Female Actor'],
    correctAnswer: 'Actress',
    explanation: 'Rule: The feminine gender of "Actor" is "Actress".',
    hint: 'Feminine noun for actor.'
  },
  {
    id: 'c4-25',
    classLevel: '4',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Fill Verb Form',
    questionText: 'Complete the sentence in Past Continuous Tense: "I ___ my homework when the lights went out."',
    options: ['was doing', 'were doing', 'will do', 'am doing'],
    correctAnswer: 'was doing',
    explanation: 'Rule: Past Continuous Tense for "I" uses "was" + verb(-ing).',
    hint: 'Past continuous form for "I".'
  },

  // ==================== CLASS 5 ====================
  {
    id: 'c5-1',
    classLevel: '5',
    topic: 'Articles (A, An, The)',
    questionText: 'Choose the correct article: "Rahul ate ___ apple for breakfast."',
    options: ['a', 'an', 'the', 'no article needed'],
    correctAnswer: 'an',
    explanation: 'Rule: Use "an" before words starting with a vowel sound (a, e, i, o, u).',
    hint: 'Look at the sound of the letter A in apple.'
  },
  {
    id: 'c5-2',
    classLevel: '5',
    topic: 'Articles (A, An, The)',
    questionText: 'Fill in the blank: "___ Taj Mahal is a famous monument in India."',
    options: ['A', 'An', 'The', 'No article'],
    correctAnswer: 'The',
    explanation: 'Rule: Use "The" before famous historical monuments and specific unique places.',
    hint: 'Taj Mahal is a specific famous monument.'
  },
  {
    id: 'c5-3',
    classLevel: '5',
    topic: 'Articles (A, An, The)',
    questionText: 'Which sentence has the correct article?',
    options: ['He gave me an 1-rupee coin.', 'He gave me a one-rupee coin.', 'He gave me the an coin.', 'He gave me no coin.'],
    correctAnswer: 'He gave me a one-rupee coin.',
    explanation: 'Rule: "One" starts with a "w" consonant sound (/wʌn/), so we use "a", not "an".',
    hint: 'Listen to the sound of "one" (sounds like "won").'
  },
  {
    id: 'c5-4',
    classLevel: '5',
    topic: 'Nouns & Pronouns',
    questionText: 'Identify the Proper Noun: "My cat Whiskers loves drinking milk."',
    options: ['cat', 'Whiskers', 'milk', 'drinking'],
    correctAnswer: 'Whiskers',
    explanation: 'Rule: A Proper Noun is a special name given to a pet, person, or place. It starts with a capital letter.',
    hint: 'Special name of the cat.'
  },
  {
    id: 'c5-5',
    classLevel: '5',
    topic: 'Nouns & Pronouns',
    questionText: 'Replace the underlined word: "Sia is sleeping because Sia is tired."',
    options: ['He', 'She', 'They', 'It'],
    correctAnswer: 'She',
    explanation: 'Rule: Use the singular female pronoun "She" for Sia.',
    hint: 'Pronoun for a girl.'
  },
  {
    id: 'c5-6',
    classLevel: '5',
    topic: 'Nouns & Pronouns',
    questionText: 'Choose the Plural Noun of "Child":',
    options: ['Childs', 'Children', 'Childrens', 'Childes'],
    correctAnswer: 'Children',
    explanation: 'Rule: "Child" is an irregular noun; its plural form is "Children".',
    hint: 'It is an irregular plural.'
  },
  {
    id: 'c5-7',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    questionText: 'Select the verb in Simple Present Tense: "The sun ___ in the East."',
    options: ['rises', 'rose', 'rising', 'is rise'],
    correctAnswer: 'rises',
    explanation: 'Rule: Universal truths and daily facts use Simple Present Tense (singular verb + s).',
    hint: 'A fact that happens every single day.'
  },
  {
    id: 'c5-8',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    questionText: 'Fill in the blank: "Yesterday, we ___ a movie at the cinema."',
    options: ['watch', 'watched', 'watching', 'will watch'],
    correctAnswer: 'watched',
    explanation: 'Rule: Words like "Yesterday" indicate Simple Past Tense (verb + ed).',
    hint: 'Action happened yesterday (past).'
  },
  {
    id: 'c5-9',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    questionText: 'Complete the sentence: "Tomorrow, my uncle ___ visit us."',
    options: ['will', 'was', 'did', 'is'],
    correctAnswer: 'will',
    explanation: 'Rule: Use "will" + action verb for Simple Future Tense (actions happening tomorrow).',
    hint: 'Word "Tomorrow" indicates future.'
  },
  {
    id: 'c5-10',
    classLevel: '5',
    topic: 'Adjectives & Adverbs',
    questionText: 'Find the Adjective: "The little girl wore a red ribbon."',
    options: ['girl', 'little & red', 'wore', 'ribbon'],
    correctAnswer: 'little & red',
    explanation: 'Rule: Words that describe size (little) and color (red) are Adjectives.',
    hint: 'Words describing the girl and the ribbon.'
  },
  {
    id: 'c5-11',
    classLevel: '5',
    topic: 'Adjectives & Adverbs',
    questionText: 'Identify the Adverb: "The turtle walked slowly."',
    options: ['turtle', 'walked', 'slowly', 'the'],
    correctAnswer: 'slowly',
    explanation: 'Rule: Words ending in "-ly" that describe how an action (walked) is done are Adverbs.',
    hint: 'Word answering "How did the turtle walk?"'
  },
  {
    id: 'c5-12',
    classLevel: '5',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Fill in the correct preposition: "The ball rolled ___ the table."',
    options: ['under', 'on', 'at', 'into'],
    correctAnswer: 'under',
    explanation: 'Rule: "Under" means below or beneath a surface.',
    hint: 'Beneath the table surface.'
  },
  {
    id: 'c5-13',
    classLevel: '5',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Join the sentences: "I like ice cream. I do not like cake."',
    options: ['I like ice cream so I do not like cake.', 'I like ice cream but I do not like cake.', 'I like ice cream because I do not like cake.', 'I like ice cream or I do not like cake.'],
    correctAnswer: 'I like ice cream but I do not like cake.',
    explanation: 'Rule: Use "but" to connect two contrasting or opposite choices.',
    hint: 'Used when showing opposite preferences.'
  },
  {
    id: 'c5-14',
    classLevel: '5',
    topic: 'Sentence Correction & Punctuation',
    questionText: 'Select the sentence with correct capitalization and question mark:',
    options: [
      'what is your name rahul',
      'What is your name, Rahul?',
      'what Is Your Name Rahul.',
      'What is your name Rahul!'
    ],
    correctAnswer: 'What is your name, Rahul?',
    explanation: 'Rule: Sentence starts with Capital letter and ends with a question mark (?) for questions.',
    hint: 'Capital initial letter and ends with ?.'
  },
  {
    id: 'c5-15',
    classLevel: '5',
    topic: 'Subject-Verb Agreement',
    questionText: 'Choose the correct option: "The dogs ___ barking loudly in the street."',
    options: ['is', 'are', 'was', 'has'],
    correctAnswer: 'are',
    explanation: 'Rule: Plural subject ("dogs") takes a plural verb ("are").',
    hint: 'Subject "dogs" is more than one.'
  },

  // ==================== CLASS 6 ====================
  {
    id: 'c6-1',
    classLevel: '6',
    topic: 'Subject-Verb Agreement',
    questionText: 'Fill in the blank: "Either Aman or his friends ___ coming to the party."',
    options: ['is', 'are', 'was', 'has'],
    correctAnswer: 'are',
    explanation: 'Rule: When subjects are connected by "Either...or", the verb agrees with the subject closest to it ("his friends" is plural).',
    hint: 'Check the subject closest to the verb.'
  },
  {
    id: 'c6-2',
    classLevel: '6',
    topic: 'Subject-Verb Agreement',
    questionText: 'Select the correct verb: "Each of the students ___ received a medal."',
    options: ['has', 'have', 'are', 'were'],
    correctAnswer: 'has',
    explanation: 'Rule: Words like "Each", "Every", "Neither" take singular verbs ("has").',
    hint: '"Each" means one by one (singular).'
  },
  {
    id: 'c6-3',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    questionText: 'Identify the Tense: "She was playing badminton when it started to rain."',
    options: ['Simple Past', 'Past Continuous', 'Past Perfect', 'Present Continuous'],
    correctAnswer: 'Past Continuous',
    explanation: 'Rule: "was/were + verb(-ing)" forms the Past Continuous Tense.',
    hint: 'Look at "was + playing".'
  },
  {
    id: 'c6-4',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    questionText: 'Fill in the blank: "They ___ lived in Delhi since 2018."',
    options: ['have', 'has', 'are', 'were'],
    correctAnswer: 'have',
    explanation: 'Rule: Action started in the past and continuing with "since/for" uses Present Perfect Tense (have/has + V3).',
    hint: 'Plural subject "They" takes "have".'
  },
  {
    id: 'c6-5',
    classLevel: '6',
    topic: 'Articles (A, An, The)',
    questionText: 'Fill in the blanks: "He is ___ honest man. He studies in ___ university."',
    options: ['a, an', 'an, a', 'a, a', 'the, an'],
    correctAnswer: 'an, a',
    explanation: 'Rule: "Honest" has a silent H (vowel sound /ɒ/), while "University" starts with a consonant sound /juː/.',
    hint: 'Pay attention to starting sounds.'
  },
  {
    id: 'c6-6',
    classLevel: '6',
    topic: 'Adjectives & Adverbs',
    questionText: 'Choose the superlative form: "Mount Everest is the ___ peak in the world."',
    options: ['high', 'higher', 'highest', 'most high'],
    correctAnswer: 'highest',
    explanation: 'Rule: Use Superlative degree ("highest") when comparing one item against all others with "the".',
    hint: 'Preceded by "the".'
  },
  {
    id: 'c6-7',
    classLevel: '6',
    topic: 'Adjectives & Adverbs',
    questionText: 'Identify the comparative adjective: "Rohan is ___ than Sohan."',
    options: ['tall', 'taller', 'tallest', 'more tall'],
    correctAnswer: 'taller',
    explanation: 'Rule: When comparing two persons using "than", use Comparative degree (-er).',
    hint: 'Comparing two using "than".'
  },
  {
    id: 'c6-8',
    classLevel: '6',
    topic: 'Nouns & Pronouns',
    questionText: 'Identify the Collective Noun: "A flock of birds flew over the lake."',
    options: ['birds', 'flock', 'flew', 'lake'],
    correctAnswer: 'flock',
    explanation: 'Rule: A Collective Noun names a group of animals or things (flock, herd, team).',
    hint: 'Word representing a group.'
  },
  {
    id: 'c6-9',
    classLevel: '6',
    topic: 'Nouns & Pronouns',
    questionText: 'Choose the correct Reflexive Pronoun: "I completed the project by ___."',
    options: ['himself', 'myself', 'yourself', 'itself'],
    correctAnswer: 'myself',
    explanation: 'Rule: The pronoun "I" corresponds to the reflexive pronoun "myself".',
    hint: 'Matching pronoun for "I".'
  },
  {
    id: 'c6-10',
    classLevel: '6',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Fill in the blank: "The meeting starts ___ 10:00 AM."',
    options: ['on', 'in', 'at', 'by'],
    correctAnswer: 'at',
    explanation: 'Rule: Use "at" for specific clock times.',
    hint: 'Exact clock time.'
  },
  {
    id: 'c6-11',
    classLevel: '6',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Fill in the blank: "My birthday is ___ July."',
    options: ['at', 'on', 'in', 'by'],
    correctAnswer: 'in',
    explanation: 'Rule: Use "in" for months, years, and seasons (e.g. in July, in 2024).',
    hint: 'Month names use "in".'
  },
  {
    id: 'c6-12',
    classLevel: '6',
    topic: 'Sentence Correction & Punctuation',
    questionText: 'Turn into a Question: "She can play the guitar very well."',
    options: [
      'Can she play the guitar very well?',
      'She play the guitar very well?',
      'Does she can play guitar?',
      'Is she playing guitar well?'
    ],
    correctAnswer: 'Can she play the guitar very well?',
    explanation: 'Rule: Move the modal verb ("Can") to the front to form a question.',
    hint: 'Bring "Can" to the beginning.'
  },
  {
    id: 'c6-13',
    classLevel: '6',
    topic: 'Direct & Indirect Speech',
    questionText: 'Change into reported speech: Teacher said, "Stand up."',
    options: ['Teacher said to stand up.', 'Teacher ordered us to stand up.', 'Teacher told that stand up.', 'Teacher says stand up.'],
    correctAnswer: 'Teacher ordered us to stand up.',
    explanation: 'Rule: Commands in reported speech use reporting verbs like "ordered / commanded + to + verb".',
    hint: 'Teacher gives an order.'
  },
  {
    id: 'c6-14',
    classLevel: '6',
    topic: 'Active & Passive Voice',
    questionText: 'Convert to Passive: "The boy kicked the football."',
    options: ['The football is kicked by the boy.', 'The football was kicked by the boy.', 'The football has kicked the boy.', 'The boy was kicked by football.'],
    correctAnswer: 'The football was kicked by the boy.',
    explanation: 'Rule: Past verb "kicked" becomes "was kicked" in passive voice.',
    hint: 'Object "football" comes first with "was kicked".'
  },

  // ==================== CLASS 7 ====================
  {
    id: 'c7-1',
    classLevel: '7',
    topic: 'Active & Passive Voice',
    questionText: 'Convert to Passive Voice: "The teacher solved the difficult puzzle."',
    options: [
      'The difficult puzzle is solved by the teacher.',
      'The difficult puzzle was solved by the teacher.',
      'The difficult puzzle has been solved by the teacher.',
      'The teacher was solving the difficult puzzle.'
    ],
    correctAnswer: 'The difficult puzzle was solved by the teacher.',
    explanation: 'Rule: Simple Past "solved" becomes "was solved" in Passive Voice.',
    hint: 'Object comes first + was + past participle.'
  },
  {
    id: 'c7-2',
    classLevel: '7',
    topic: 'Active & Passive Voice',
    questionText: 'Change to Active Voice: "A song is being sung by Neha."',
    options: ['Neha sings a song.', 'Neha was singing a song.', 'Neha is singing a song.', 'Neha has sung a song.'],
    correctAnswer: 'Neha is singing a song.',
    explanation: 'Rule: Passive Present Continuous "is being sung" becomes Active Present Continuous "is singing".',
    hint: '"is being sung" matches active "is singing".'
  },
  {
    id: 'c7-3',
    classLevel: '7',
    topic: 'Direct & Indirect Speech',
    questionText: 'Change to Indirect Speech: Rohan said, "I am feeling tired today."',
    options: [
      'Rohan said that he is feeling tired today.',
      'Rohan said that he was feeling tired that day.',
      'Rohan said that I was feeling tired today.',
      'Rohan told he was feeling tired that day.'
    ],
    correctAnswer: 'Rohan said that he was feeling tired that day.',
    explanation: 'Rule: In Indirect speech, "I am" becomes "he was", and "today" becomes "that day".',
    hint: '"am feeling" -> "was feeling", "today" -> "that day".'
  },
  {
    id: 'c7-4',
    classLevel: '7',
    topic: 'Direct & Indirect Speech',
    questionText: 'Convert to Reported Speech: He said to me, "Where do you live?"',
    options: [
      'He asked me where I lived.',
      'He asked me where do I live.',
      'He told me where I am living.',
      'He enquired me that where I live.'
    ],
    correctAnswer: 'He asked me where I lived.',
    explanation: 'Rule: Wh- questions in indirect speech retain the question word ("where") followed by subject + past tense verb ("I lived").',
    hint: 'Question word "where" + subject "I" + past verb "lived".'
  },
  {
    id: 'c7-5',
    classLevel: '7',
    topic: 'Subject-Verb Agreement',
    questionText: 'Select the correct verb: "Bread and butter ___ my favorite breakfast."',
    options: ['is', 'are', 'were', 'have'],
    correctAnswer: 'is',
    explanation: 'Rule: When two items form a single compound meal or idea, a singular verb ("is") is used.',
    hint: 'Single breakfast item unit.'
  },
  {
    id: 'c7-6',
    classLevel: '7',
    topic: 'Subject-Verb Agreement',
    questionText: 'Fill in the blank: "The quality of these mangoes ___ not good."',
    options: ['are', 'is', 'were', 'have'],
    correctAnswer: 'is',
    explanation: 'Rule: The subject is singular noun "quality", not plural "mangoes". So we use "is".',
    hint: 'Subject is "quality" (singular).'
  },
  {
    id: 'c7-7',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    questionText: 'Choose the Future Perfect form: "By next month, we ___ living here for 5 years."',
    options: ['will be', 'will have been', 'were', 'have been'],
    correctAnswer: 'will have been',
    explanation: 'Rule: Future Perfect Continuous "will have been + verb(-ing)" expresses ongoing action up to a future point.',
    hint: 'Continuous action until future date ("By next month").'
  },
  {
    id: 'c7-8',
    classLevel: '7',
    topic: 'Adjectives & Adverbs',
    questionText: 'Identify the Adverb of Manner: "The old man walked slowly across the street."',
    options: ['old', 'walked', 'slowly', 'street'],
    correctAnswer: 'slowly',
    explanation: 'Rule: Adverbs of manner describe HOW an action is performed.',
    hint: 'Answers "How did he walk?"'
  },
  {
    id: 'c7-9',
    classLevel: '7',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Fill in the blank: "Distribute these sweets ___ the five children."',
    options: ['between', 'among', 'with', 'into'],
    correctAnswer: 'among',
    explanation: 'Rule: Use "between" for 2 persons, and "among" for more than 2 persons (5 children).',
    hint: 'More than 2 children.'
  },
  {
    id: 'c7-10',
    classLevel: '7',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Fill in the blank: "She has been studying ___ 4 o\'clock."',
    options: ['for', 'since', 'from', 'in'],
    correctAnswer: 'since',
    explanation: 'Rule: Use "since" for a specific point in time (e.g. since 4 o\'clock, since Monday). Use "for" for duration.',
    hint: 'Specific starting point in time.'
  },
  {
    id: 'c7-11',
    classLevel: '7',
    topic: 'Sentence Correction & Punctuation',
    questionText: 'Spot the incorrect part: "He is senior than me in the office."',
    options: ['He is', 'senior than', 'me in', 'the office'],
    correctAnswer: 'senior than',
    explanation: 'Rule: Latin adjectives like senior, junior, superior take preposition "to" (senior to me), not "than".',
    hint: 'Words like senior/junior take "to", not "than".'
  },
  {
    id: 'c7-12',
    classLevel: '7',
    topic: 'Nouns & Pronouns',
    questionText: 'Identify the Abstract Noun: "Honesty is the best policy."',
    options: ['Honesty', 'best', 'policy', 'is'],
    correctAnswer: 'Honesty',
    explanation: 'Rule: An Abstract Noun names a quality, state, or concept that cannot be physically touched.',
    hint: 'A quality or concept name.'
  },

  // ==================== CLASS 8 ====================
  {
    id: 'c8-1',
    classLevel: '8',
    topic: 'Direct & Indirect Speech',
    questionText: 'Convert to Indirect Speech: The doctor said to the patient, "Do you take your medicines on time?"',
    options: [
      'The doctor asked the patient if he took his medicines on time.',
      'The doctor said to the patient if he takes his medicines on time.',
      'The doctor asked the patient that do you take your medicines on time.',
      'The doctor enquired the patient whether did he take his medicines on time.'
    ],
    correctAnswer: 'The doctor asked the patient if he took his medicines on time.',
    explanation: 'Rule: Yes/No interrogatives use "if/whether", present tense ("take") becomes past ("took").',
    hint: 'Remove "Do" and use "if", change "take" to "took".'
  },
  {
    id: 'c8-2',
    classLevel: '8',
    topic: 'Direct & Indirect Speech',
    questionText: 'Convert to Reported Speech: "Alas! We lost the final match," said the captain.',
    options: [
      'The captain exclaimed with sorrow that they had lost the final match.',
      'The captain said alas that we lost the final match.',
      'The captain told that they lose the final match.',
      'The captain cried that we have lost the match.'
    ],
    correctAnswer: 'The captain exclaimed with sorrow that they had lost the final match.',
    explanation: 'Rule: Exclamations with "Alas!" are reported using "exclaimed with sorrow/grief that + past perfect".',
    hint: 'Expressing grief/sorrow in reported form.'
  },
  {
    id: 'c8-3',
    classLevel: '8',
    topic: 'Active & Passive Voice',
    questionText: 'Convert to Active Voice: "A new flyover is being constructed by the workers."',
    options: [
      'The workers constructed a new flyover.',
      'The workers are constructing a new flyover.',
      'The workers have constructed a new flyover.',
      'The workers were constructing a new flyover.'
    ],
    correctAnswer: 'The workers are constructing a new flyover.',
    explanation: 'Rule: Passive Continuous "is being constructed" matches Active Present Continuous "are constructing".',
    hint: 'Continuous present action.'
  },
  {
    id: 'c8-4',
    classLevel: '8',
    topic: 'Active & Passive Voice',
    questionText: 'Change to Passive: "Who wrote this famous novel?"',
    options: [
      'By whom was this famous novel written?',
      'Who was written this famous novel?',
      'By whom is this famous novel written?',
      'This famous novel was written by who?'
    ],
    correctAnswer: 'By whom was this famous novel written?',
    explanation: 'Rule: Questions starting with "Who" change to "By whom + auxiliary verb + subject + past participle?".',
    hint: '"Who" becomes "By whom".'
  },
  {
    id: 'c8-5',
    classLevel: '8',
    topic: 'Sentence Correction & Punctuation',
    questionText: 'Find the error: "Neither of the two students have submitted their assignment."',
    options: ['Neither', 'of the two', 'have submitted', 'their assignment'],
    correctAnswer: 'have submitted',
    explanation: 'Rule: "Neither" is a singular pronoun and requires singular verb ("has submitted").',
    hint: '"Neither" requires singular verb (has).'
  },
  {
    id: 'c8-6',
    classLevel: '8',
    topic: 'Subject-Verb Agreement',
    questionText: 'Select the correct verb: "One hundred rupees ___ a small amount for him."',
    options: ['are', 'is', 'were', 'have been'],
    correctAnswer: 'is',
    explanation: 'Rule: Sums of money, distances, and weights express a single unit and take singular verb ("is").',
    hint: 'Single total amount of money.'
  },
  {
    id: 'c8-7',
    classLevel: '8',
    topic: 'Subject-Verb Agreement',
    questionText: 'Fill in the blank: "The committee ___ divided in their opinions."',
    options: ['is', 'are', 'was', 'has'],
    correctAnswer: 'are',
    explanation: 'Rule: When members of a collective noun (committee) act individually or hold differing opinions, use plural verb ("are").',
    hint: 'Members are divided individually.'
  },
  {
    id: 'c8-8',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    questionText: 'Choose the correct form: "If I ___ hard, I would have passed the examination."',
    options: ['worked', 'had worked', 'have worked', 'was working'],
    correctAnswer: 'had worked',
    explanation: 'Rule: Third conditional structure: "If + Past Perfect (had worked), ... would have + V3".',
    hint: 'Notice "would have passed".'
  },
  {
    id: 'c8-9',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    questionText: 'Fill in the blank: "The train ___ before we reached the station."',
    options: ['left', 'had left', 'was leaving', 'has left'],
    correctAnswer: 'had left',
    explanation: 'Rule: When two past actions occur, the earlier past action uses Past Perfect ("had left").',
    hint: 'Action completed first before we reached.'
  },
  {
    id: 'c8-10',
    classLevel: '8',
    topic: 'Adjectives & Adverbs',
    questionText: 'Fill in the blank: "She had ___ hope left after hearing the bad news."',
    options: ['a little', 'little', 'few', 'a few'],
    correctAnswer: 'little',
    explanation: 'Rule: "Little" means "almost none" for uncountable nouns like hope.',
    hint: 'Uncountable noun with negative sense.'
  },
  {
    id: 'c8-11',
    classLevel: '8',
    topic: 'Sentence Correction & Punctuation',
    questionText: 'Identify the Relative Clause: "The girl who won the gold medal is my cousin."',
    options: ['The girl', 'who won the gold medal', 'is my cousin', 'gold medal'],
    correctAnswer: 'who won the gold medal',
    explanation: 'Rule: A Relative Clause starts with a relative pronoun (who/which/that) and modifies a noun.',
    hint: 'Starts with "who".'
  },
  {
    id: 'c8-12',
    classLevel: '8',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Fill in the blank: "He persevered ___ many difficulties and obstacles."',
    options: ['despite', 'in spite', 'although', 'because'],
    correctAnswer: 'despite',
    explanation: 'Rule: "Despite" takes no preposition (not despite of). "In spite" requires "of".',
    hint: 'Means notwithstanding without needing "of".'
  },

  // ==================== ADDITIONAL EXPANDED QUESTIONS FOR ALL TOPICS ====================
  // --- Articles (A, An, The) ---
  {
    id: 'c5-art-1',
    classLevel: '5',
    topic: 'Articles (A, An, The)',
    questionText: 'Fill in the blank: "My brother wants to buy ___ umbrella."',
    options: ['a', 'an', 'the', 'no article'],
    correctAnswer: 'an',
    explanation: 'Rule: "Umbrella" starts with the vowel sound /ʌ/, so we use "an".',
    hint: 'Starts with vowel sound U.'
  },
  {
    id: 'c5-art-2',
    classLevel: '5',
    topic: 'Articles (A, An, The)',
    questionText: 'Fill in the blank: "___ Earth revolves around the Sun."',
    options: ['A', 'An', 'The', 'No article'],
    correctAnswer: 'The',
    explanation: 'Rule: Unique celestial bodies like the Earth, Moon, and Sun take the definite article "The".',
    hint: 'Unique planet name.'
  },
  {
    id: 'c6-art-1',
    classLevel: '6',
    topic: 'Articles (A, An, The)',
    questionText: 'Choose the correct sentence:',
    options: [
      'He is a European doctor.',
      'He is an European doctor.',
      'He is the European doctor.',
      'He is European doctor.'
    ],
    correctAnswer: 'He is a European doctor.',
    explanation: 'Rule: "European" begins with a consonant sound /jʊərəˈpiːən/ (sounds like Y), so we use "a".',
    hint: 'Listen to the initial sound (Y-sound).'
  },
  {
    id: 'c7-art-1',
    classLevel: '7',
    topic: 'Articles (A, An, The)',
    questionText: 'Fill in the blank: "___ Ganges is a sacred river in India."',
    options: ['A', 'An', 'The', 'No article'],
    correctAnswer: 'The',
    explanation: 'Rule: Use "The" before names of rivers, mountain ranges, oceans, and holy books.',
    hint: 'River names take "The".'
  },
  {
    id: 'c8-art-1',
    classLevel: '8',
    topic: 'Articles (A, An, The)',
    questionText: 'Fill in the blank: "___ higher you go, ___ cooler it becomes."',
    options: ['The, the', 'A, a', 'An, the', 'The, a'],
    correctAnswer: 'The, the',
    explanation: 'Rule: Parallel comparative structures use "The... the..." (e.g. The higher..., the cooler...).',
    hint: 'Double comparative structure.'
  },

  // --- Nouns & Pronouns ---
  {
    id: 'c5-np-1',
    classLevel: '5',
    topic: 'Nouns & Pronouns',
    questionText: 'Identify the Material Noun: "This ring is made of pure gold."',
    options: ['ring', 'made', 'gold', 'pure'],
    correctAnswer: 'gold',
    explanation: 'Rule: A Material Noun is a substance from which things are made (gold, silver, wood).',
    hint: 'Name of the raw metal/material.'
  },
  {
    id: 'c6-np-1',
    classLevel: '6',
    topic: 'Nouns & Pronouns',
    questionText: 'Fill in the blank: "Between you and ___, this secret must be kept."',
    options: ['I', 'me', 'myself', 'mine'],
    correctAnswer: 'me',
    explanation: 'Rule: Prepositions like "between" take object pronouns ("me", not "I").',
    hint: 'Use objective case after prepositions.'
  },
  {
    id: 'c7-np-1',
    classLevel: '7',
    topic: 'Nouns & Pronouns',
    questionText: 'Choose the correct Possessive Pronoun: "This painting is yours, but that one is ___."',
    options: ['my', 'mine', 'me', 'myself'],
    correctAnswer: 'mine',
    explanation: 'Rule: "Mine" is a possessive pronoun used without a noun following it.',
    hint: 'Possessive pronoun at end of sentence.'
  },
  {
    id: 'c8-np-1',
    classLevel: '8',
    topic: 'Nouns & Pronouns',
    questionText: 'Identify the Indefinite Pronoun: "Somebody left their notebook in the library."',
    options: ['Somebody', 'notebook', 'library', 'left'],
    correctAnswer: 'Somebody',
    explanation: 'Rule: Indefinite pronouns (somebody, everyone, nobody) refer to non-specific people.',
    hint: 'Word referring to an unspecified person.'
  },

  // --- Verbs & Tenses ---
  {
    id: 'c5-vt-1',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    questionText: 'Choose the correct form: "Look! The birds ___ in the sky."',
    options: ['fly', 'are flying', 'flew', 'will fly'],
    correctAnswer: 'are flying',
    explanation: 'Rule: Actions happening right now at the moment of speaking use Present Continuous Tense.',
    hint: 'Action happening right now (Look!).'
  },
  {
    id: 'c6-vt-1',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    questionText: 'Fill in the blank: "She ___ her homework before going to play."',
    options: ['finish', 'has finished', 'had finished', 'was finishing'],
    correctAnswer: 'had finished',
    explanation: 'Rule: Action completed before another past event uses Past Perfect Tense (had finished).',
    hint: 'Action done first in past.'
  },
  {
    id: 'c7-vt-1',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    questionText: 'Identify the Tense: "By 8 PM, I will have finished my assignment."',
    options: ['Future Continuous', 'Future Perfect', 'Future Simple', 'Present Perfect'],
    correctAnswer: 'Future Perfect',
    explanation: 'Rule: "will have + V3" forms the Future Perfect Tense.',
    hint: 'Look at "will have + finished".'
  },
  {
    id: 'c8-vt-1',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    questionText: 'Select the correct sentence:',
    options: [
      'I am knowing the answer.',
      'I know the answer.',
      'I was knowing the answer.',
      'I have been knowing the answer.'
    ],
    correctAnswer: 'I know the answer.',
    explanation: 'Rule: Stative verbs like "know", "love", "understand" are not usually used in continuous (-ing) forms.',
    hint: '"Know" is a state of mind, not action.'
  },

  // --- Adjectives & Adverbs ---
  {
    id: 'c5-aa-1',
    classLevel: '5',
    topic: 'Adjectives & Adverbs',
    questionText: 'Find the Adverb of Frequency: "He always completes his work on time."',
    options: ['completes', 'always', 'work', 'time'],
    correctAnswer: 'always',
    explanation: 'Rule: Words showing how often an action happens (always, never, often) are Adverbs of Frequency.',
    hint: 'Answers "How often?"'
  },
  {
    id: 'c6-aa-1',
    classLevel: '6',
    topic: 'Adjectives & Adverbs',
    questionText: 'Fill in the blank: "This problem is ___ difficult than the previous one."',
    options: ['much', 'more', 'most', 'very'],
    correctAnswer: 'more',
    explanation: 'Rule: Use "more" for comparative degree with long adjectives (more difficult than).',
    hint: 'Used with "than" for comparison.'
  },
  {
    id: 'c7-aa-1',
    classLevel: '7',
    topic: 'Adjectives & Adverbs',
    questionText: 'Choose the correct order of adjectives: "She bought a ___ dress."',
    options: ['beautiful silk blue', 'beautiful blue silk', 'blue beautiful silk', 'silk beautiful blue'],
    correctAnswer: 'beautiful blue silk',
    explanation: 'Rule: Order of Adjectives: Opinion (beautiful) -> Color (blue) -> Material (silk).',
    hint: 'Opinion comes first, then color, then material.'
  },
  {
    id: 'c8-aa-1',
    classLevel: '8',
    topic: 'Adjectives & Adverbs',
    questionText: 'Identify the error: "She runs quick to catch the morning school bus."',
    options: ['She runs', 'quick', 'to catch', 'school bus'],
    correctAnswer: 'quick',
    explanation: 'Rule: Use the adverb "quickly" to describe the verb "runs", not the adjective "quick".',
    hint: 'Verb "runs" needs an adverb (-ly).'
  },

  // --- Prepositions & Conjunctions ---
  {
    id: 'c5-pc-1',
    classLevel: '5',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Fill in the blank: "The dog jumped ___ the fence."',
    options: ['over', 'in', 'at', 'on'],
    correctAnswer: 'over',
    explanation: 'Rule: "Over" indicates movement above and across something.',
    hint: 'Across and above the barrier.'
  },
  {
    id: 'c6-pc-1',
    classLevel: '6',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Choose the correct conjunction: "Work hard ___ you will fail."',
    options: ['and', 'or', 'so', 'because'],
    correctAnswer: 'or',
    explanation: 'Rule: "Or" expresses a warning or alternative consequence.',
    hint: 'Otherwise / alternative warning.'
  },
  {
    id: 'c7-pc-1',
    classLevel: '7',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Fill in the blank: "He is proficient ___ mathematics."',
    options: ['at', 'in', 'with', 'on'],
    correctAnswer: 'in',
    explanation: 'Rule: We say proficient "in" a subject or skill.',
    hint: 'Preposition used with subject proficiency.'
  },
  {
    id: 'c8-pc-1',
    classLevel: '8',
    topic: 'Prepositions & Conjunctions',
    questionText: 'Fill in the blank: "Not only Rahul ___ his brother came to help us."',
    options: ['and also', 'but also', 'as well as', 'or else'],
    correctAnswer: 'but also',
    explanation: 'Rule: Correlative conjunctions work in pairs: "Not only ... but also ...".',
    hint: 'Paired with "Not only".'
  },

  // --- Subject-Verb Agreement ---
  {
    id: 'c5-sva-1',
    classLevel: '5',
    topic: 'Subject-Verb Agreement',
    questionText: 'Choose the correct verb: "The teacher as well as the students ___ present."',
    options: ['was', 'were', 'are', 'have'],
    correctAnswer: 'was',
    explanation: 'Rule: When connected by "as well as", the verb agrees with the first subject ("teacher", singular).',
    hint: 'Agrees with the first subject ("teacher").'
  },
  {
    id: 'c6-sva-1',
    classLevel: '6',
    topic: 'Subject-Verb Agreement',
    questionText: 'Fill in the blank: "Ten miles ___ a long distance to walk."',
    options: ['is', 'are', 'were', 'have been'],
    correctAnswer: 'is',
    explanation: 'Rule: Specific measurements of distance, time, and weight take a singular verb.',
    hint: 'Total single unit of distance.'
  },
  {
    id: 'c7-sva-1',
    classLevel: '7',
    topic: 'Subject-Verb Agreement',
    questionText: 'Select the correct option: "Many a student ___ tried to solve this equation."',
    options: ['has', 'have', 'are', 'were'],
    correctAnswer: 'has',
    explanation: 'Rule: "Many a" takes a singular noun and singular verb ("has").',
    hint: '"Many a" takes singular verb.'
  },
  {
    id: 'c8-sva-1',
    classLevel: '8',
    topic: 'Subject-Verb Agreement',
    questionText: 'Fill in the blank: "Neither of the plans ___ suitable for our school."',
    options: ['is', 'are', 'were', 'have'],
    correctAnswer: 'is',
    explanation: 'Rule: "Neither of..." takes a singular verb ("is").',
    hint: '"Neither" is singular.'
  },

  // --- Direct & Indirect Speech ---
  {
    id: 'c5-dis-1',
    classLevel: '5',
    topic: 'Direct & Indirect Speech',
    questionText: 'Change to Indirect Speech: She said, "I like ice cream."',
    options: [
      'She said that she liked ice cream.',
      'She said that I like ice cream.',
      'She said that she is liking ice cream.',
      'She told she likes ice cream.'
    ],
    correctAnswer: 'She said that she liked ice cream.',
    explanation: 'Rule: Present tense "like" changes to past tense "liked" in Indirect speech.',
    hint: '"I like" becomes "she liked".'
  },
  {
    id: 'c6-dis-1',
    classLevel: '6',
    topic: 'Direct & Indirect Speech',
    questionText: 'Reported speech of: He said, "I am going home."',
    options: [
      'He said that he was going home.',
      'He said that I am going home.',
      'He told he is going home.',
      'He said that he had gone home.'
    ],
    correctAnswer: 'He said that he was going home.',
    explanation: 'Rule: "am going" changes to "was going" in indirect speech.',
    hint: 'Present Continuous -> Past Continuous.'
  },
  {
    id: 'c7-dis-1',
    classLevel: '7',
    topic: 'Direct & Indirect Speech',
    questionText: 'Convert: Father said, "The earth revolves around the sun."',
    options: [
      'Father said that the earth revolved around the sun.',
      'Father said that the earth revolves around the sun.',
      'Father told that earth had revolved around sun.',
      'Father said earth is revolving.'
    ],
    correctAnswer: 'Father said that the earth revolves around the sun.',
    explanation: 'Rule: Tense does NOT change in reported speech for universal scientific facts.',
    hint: 'Universal fact tense stays present!'
  },
  {
    id: 'c8-dis-1',
    classLevel: '8',
    topic: 'Direct & Indirect Speech',
    questionText: 'Convert to Indirect: "May you succeed in life!" said the teacher to me.',
    options: [
      'The teacher wished that I might succeed in life.',
      'The teacher said that I may succeed in life.',
      'The teacher told me to succeed in life.',
      'The teacher prayed I will succeed.'
    ],
    correctAnswer: 'The teacher wished that I might succeed in life.',
    explanation: 'Rule: Optative sentences with "May" report as "wished/prayed that + subject + might".',
    hint: '"May" becomes "might" with reporting verb "wished".'
  },

  // --- Active & Passive Voice ---
  {
    id: 'c5-apv-1',
    classLevel: '5',
    topic: 'Active & Passive Voice',
    questionText: 'Convert to Passive: "Ravi wrote a letter."',
    options: [
      'A letter was written by Ravi.',
      'A letter is written by Ravi.',
      'A letter was write by Ravi.',
      'Ravi was written by a letter.'
    ],
    correctAnswer: 'A letter was written by Ravi.',
    explanation: 'Rule: Simple past "wrote" becomes "was written" in Passive Voice.',
    hint: 'Object "A letter" + was written.'
  },
  {
    id: 'c6-apv-1',
    classLevel: '6',
    topic: 'Active & Passive Voice',
    questionText: 'Convert to Active: "The cake was baked by Mother."',
    options: [
      'Mother baked the cake.',
      'Mother bakes the cake.',
      'Mother is baking the cake.',
      'Mother has baked the cake.'
    ],
    correctAnswer: 'Mother baked the cake.',
    explanation: 'Rule: Passive "was baked" corresponds to Active Simple Past "baked".',
    hint: 'Subject "Mother" + past verb "baked".'
  },
  {
    id: 'c7-apv-1',
    classLevel: '7',
    topic: 'Active & Passive Voice',
    questionText: 'Convert to Passive: "They have painted the wall."',
    options: [
      'The wall has been painted by them.',
      'The wall was painted by them.',
      'The wall is being painted by them.',
      'The wall had painted by them.'
    ],
    correctAnswer: 'The wall has been painted by them.',
    explanation: 'Rule: Present Perfect "have painted" becomes "has been painted" in Passive Voice.',
    hint: '"have painted" -> "has been painted".'
  },
  {
    id: 'c8-apv-1',
    classLevel: '8',
    topic: 'Active & Passive Voice',
    questionText: 'Convert to Passive: "Open the door."',
    options: [
      'Let the door be opened.',
      'The door should open.',
      'You are requested to open door.',
      'Let door opened.'
    ],
    correctAnswer: 'Let the door be opened.',
    explanation: 'Rule: Imperative command sentences change to "Let + Object + be + V3".',
    hint: 'Imperative command formula: "Let + object + be + V3".'
  },

  // --- Sentence Correction & Punctuation ---
  {
    id: 'c5-scp-1',
    classLevel: '5',
    topic: 'Sentence Correction & Punctuation',
    questionText: 'Which punctuation mark is missing? "Hurrah we won the match"',
    options: ['Exclamation mark (!)', 'Question mark (?)', 'Comma (,)', 'Period (.)'],
    correctAnswer: 'Exclamation mark (!)',
    explanation: 'Rule: Interjections showing excitement like "Hurrah!" require an Exclamation mark.',
    hint: 'Mark used after sudden joyful exclamation.'
  },
  {
    id: 'c6-scp-1',
    classLevel: '6',
    topic: 'Sentence Correction & Punctuation',
    questionText: 'Correct the sentence: "She don\'t like apples."',
    options: [
      'She doesn\'t like apples.',
      'She not like apples.',
      'She didn\'t liked apples.',
      'She does not likes apples.'
    ],
    correctAnswer: 'She doesn\'t like apples.',
    explanation: 'Rule: Singular subject "She" requires "doesn\'t" (does not), not "don\'t".',
    hint: 'Singular pronoun "She" takes "doesn\'t".'
  },
  {
    id: 'c7-scp-1',
    classLevel: '7',
    topic: 'Sentence Correction & Punctuation',
    questionText: 'Identify the correctly punctuated sentence:',
    options: [
      'Its a beautiful day, isn\'t it?',
      'It\'s a beautiful day, isn\'t it?',
      'Its a beautiful day, isnt it?',
      'It\'s a beautiful day, isnt it?'
    ],
    correctAnswer: 'It\'s a beautiful day, isn\'t it?',
    explanation: 'Rule: "It\'s" stands for "It is" (with apostrophe). "isn\'t" stands for "is not".',
    hint: 'Check apostrophes for "It is" and "is not".'
  },
  {
    id: 'c8-scp-1',
    classLevel: '8',
    topic: 'Sentence Correction & Punctuation',
    questionText: 'Find the grammatical error: "One of my friend is visiting me today."',
    options: ['One of', 'my friend', 'is visiting', 'me today'],
    correctAnswer: 'my friend',
    explanation: 'Rule: The phrase "One of my..." must be followed by a PLURAL noun ("my friends").',
    hint: '"One of my..." requires plural noun ("friends").',
    difficulty: 'Hard'
  },

  // ==================== DEDICATED EASY, MEDIUM & HARD QUESTION BANK ====================
  // EASY LEVEL QUESTIONS
  {
    id: 'easy-c5-1',
    classLevel: '5',
    topic: 'Articles (A, An, The)',
    difficulty: 'Easy',
    questionText: 'Choose the correct article: "I saw ___ owl sitting on the branch."',
    options: ['a', 'an', 'the', 'no article'],
    correctAnswer: 'an',
    explanation: 'Rule: "Owl" starts with a vowel sound /aʊ/, so we use "an".',
    hint: 'Owl starts with vowel sound O.'
  },
  {
    id: 'easy-c5-2',
    classLevel: '5',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Identify the noun: "The red ball rolled down the hill."',
    options: ['red', 'rolled', 'ball', 'down'],
    correctAnswer: 'ball',
    explanation: 'Rule: A noun is a naming word for a person, place, or thing ("ball").',
    hint: 'Name of the object.'
  },
  {
    id: 'easy-c6-1',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    questionText: 'Complete the sentence: "She ___ to school every morning."',
    options: ['goes', 'go', 'going', 'went'],
    correctAnswer: 'goes',
    explanation: 'Rule: Singular subject "She" takes singular present verb "goes" for daily habits.',
    hint: 'Daily routine for "She".'
  },
  {
    id: 'easy-c7-1',
    classLevel: '7',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Easy',
    questionText: 'Identify the adjective: "He lives in a peaceful village."',
    options: ['lives', 'peaceful', 'village', 'he'],
    correctAnswer: 'peaceful',
    explanation: 'Rule: An adjective describes or gives more information about a noun ("village").',
    hint: 'Describes what kind of village.'
  },
  {
    id: 'easy-c8-1',
    classLevel: '8',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Easy',
    questionText: 'Fill in the blank: "The book is ___ the table."',
    options: ['on', 'in', 'at', 'into'],
    correctAnswer: 'on',
    explanation: 'Rule: "On" is used to show surface position.',
    hint: 'Position on top of a surface.'
  },

  // MEDIUM LEVEL QUESTIONS
  {
    id: 'med-c5-1',
    classLevel: '5',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Medium',
    questionText: 'Choose the correct verb: "Neither the captain nor the players ___ ready."',
    options: ['is', 'are', 'was', 'has'],
    correctAnswer: 'are',
    explanation: 'Rule: In "Neither...nor" structures, the verb agrees with the subject closer to it ("players" is plural).',
    hint: 'Look at the plural subject "players" near the verb.'
  },
  {
    id: 'med-c6-1',
    classLevel: '6',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Medium',
    questionText: 'Reported speech: Rohan said, "I am doing my homework."',
    options: [
      'Rohan said that he was doing his homework.',
      'Rohan said that I am doing my homework.',
      'Rohan said that he is doing his homework.',
      'Rohan told he was doing homework.'
    ],
    correctAnswer: 'Rohan said that he was doing his homework.',
    explanation: 'Rule: Present continuous "am doing" changes to past continuous "was doing".',
    hint: 'Present continuous -> Past continuous.'
  },
  {
    id: 'med-c7-1',
    classLevel: '7',
    topic: 'Active & Passive Voice',
    difficulty: 'Medium',
    questionText: 'Passive form of: "The chef cooked a delicious meal."',
    options: [
      'A delicious meal was cooked by the chef.',
      'A delicious meal is cooked by the chef.',
      'A delicious meal has been cooked by chef.',
      'The chef was cooking a meal.'
    ],
    correctAnswer: 'A delicious meal was cooked by the chef.',
    explanation: 'Rule: Simple past "cooked" changes to "was cooked" in passive voice.',
    hint: 'Past tense passive form: was + V3.'
  },
  {
    id: 'med-c8-1',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    questionText: 'Fill in the blank: "If it rains, we ___ the picnic."',
    options: ['will cancel', 'would cancel', 'cancelled', 'have cancelled'],
    correctAnswer: 'will cancel',
    explanation: 'Rule: First conditional uses simple present ("rains") in the if-clause and "will + base verb" in the main clause.',
    hint: 'First conditional formula: if + present, main clause will + verb.'
  },

  // HARD LEVEL QUESTIONS
  {
    id: 'hard-c5-1',
    classLevel: '5',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Hard',
    questionText: 'Spot the error: "He don\'t know the correct answer to this question."',
    options: ['He', 'don\'t know', 'correct answer', 'this question'],
    correctAnswer: 'don\'t know',
    explanation: 'Rule: Third person singular subject "He" takes "doesn\'t know", not "don\'t know".',
    hint: '"He" requires "doesn\'t".'
  },
  {
    id: 'hard-c6-1',
    classLevel: '6',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Hard',
    questionText: 'Fill in the blank: "She preferred tea ___ coffee during the winter morning."',
    options: ['than', 'to', 'over', 'against'],
    correctAnswer: 'to',
    explanation: 'Rule: The verb "prefer" is always followed by the preposition "to" (prefer X to Y), not "than".',
    hint: '"Prefer" takes "to", not "than".'
  },
  {
    id: 'hard-c7-1',
    classLevel: '7',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Hard',
    questionText: 'Choose the correct option: "The committee ___ divided in their opinions."',
    options: ['is', 'are', 'was', 'has'],
    correctAnswer: 'are',
    explanation: 'Rule: When members of a collective noun act individually or disagree ("divided in their opinions"), use a plural verb ("are").',
    hint: 'Notice individual divided opinions (plural sense).'
  },
  {
    id: 'hard-c8-1',
    classLevel: '8',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Hard',
    questionText: 'Change to Indirect Speech: The teacher said to us, "Where are you going?"',
    options: [
      'The teacher asked us where we were going.',
      'The teacher asked us where were we going.',
      'The teacher told us where we are going.',
      'The teacher asked where are we going.'
    ],
    correctAnswer: 'The teacher asked us where we were going.',
    explanation: 'Rule: In reported WH-questions, the word order becomes assertive (where + subject + verb: "where we were going").',
    hint: 'Word order changes from question to statement form (where + we + were).'
  },
  {
    id: 'hard-c8-2',
    classLevel: '8',
    topic: 'Active & Passive Voice',
    difficulty: 'Hard',
    questionText: 'Convert to Passive Voice: "Who wrote the famous play Hamlet?"',
    options: [
      'By whom was the famous play Hamlet written?',
      'Who was written the famous play Hamlet?',
      'By who was Hamlet written?',
      'Who wrote Hamlet by whom?'
    ],
    correctAnswer: 'By whom was the famous play Hamlet written?',
    explanation: 'Rule: Questions starting with "Who" in active voice change to "By whom + auxiliary + subject + V3?" in passive voice.',
    hint: '"Who" becomes "By whom" in passive question format.'
  },

  // ==================== DEDICATED TENSES MASTER QUESTION BANK ====================
  // CLASS 5 TENSES
  {
    id: 'tense-c5-1',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Identify Tense',
    questionText: 'Identify the Tense: "The birds fly gracefully in the sky every morning."',
    options: ['Simple Present Tense', 'Present Continuous Tense', 'Simple Past Tense', 'Future Tense'],
    correctAnswer: 'Simple Present Tense',
    explanation: 'Rule: Daily habits and universal truths use Simple Present Tense (base verb "fly").',
    hint: 'Describes a daily routine habit.'
  },
  {
    id: 'tense-c5-2',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Fill Verb Form',
    questionText: 'Fill in the blank with correct tense: "My mother ___ (cook) delicious pasta yesterday."',
    options: ['cooked', 'cooks', 'is cooking', 'will cook'],
    correctAnswer: 'cooked',
    explanation: 'Rule: The word "yesterday" signals Simple Past Tense (V2 form "cooked").',
    hint: 'Action completed in past (yesterday).'
  },
  {
    id: 'tense-c5-3',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Identify Tense',
    questionText: 'Which Tense is used here? "I am writing a letter to my cousin right now."',
    options: ['Simple Present Tense', 'Present Continuous Tense', 'Present Perfect Tense', 'Past Continuous Tense'],
    correctAnswer: 'Present Continuous Tense',
    explanation: 'Rule: "am/is/are + verb(-ing)" expresses an action happening right now (Present Continuous).',
    hint: 'Look at "am + writing" for action in progress right now.'
  },
  {
    id: 'tense-c5-4',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Fill Verb Form',
    questionText: 'Complete the sentence: "We ___ (go) to the water park next Sunday."',
    options: ['will go', 'went', 'have gone', 'were going'],
    correctAnswer: 'will go',
    explanation: 'Rule: "Next Sunday" refers to future time, requiring Simple Future Tense ("will + go").',
    hint: '"Next Sunday" indicates future time.'
  },
  {
    id: 'tense-c5-5',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Tense Conversion',
    questionText: 'Convert into Simple Past Tense: "She sings a melodious song."',
    options: ['She sang a melodious song.', 'She is singing a melodious song.', 'She will sing a melodious song.', 'She has sung a melodious song.'],
    correctAnswer: 'She sang a melodious song.',
    explanation: 'Rule: Past form of "sing" is "sang". Simple Past formula: Subject + V2.',
    hint: 'Change "sings" to V2 form "sang".'
  },
  {
    id: 'tense-c5-6',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Error Spotting',
    questionText: 'Find the tense error: "Rohan is drink two glasses of milk every morning."',
    options: ['is drink', 'two glasses', 'of milk', 'every morning'],
    correctAnswer: 'is drink',
    explanation: 'Rule: For daily routines, use Simple Present "drinks" (or for present action "is drinking"). "is drink" is incorrect.',
    hint: '"is" cannot be followed by root verb "drink".'
  },
  {
    id: 'tense-c5-7',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Fill Verb Form',
    questionText: 'Fill in the blank: "The baby ___ (cry) loudly when the toy broke."',
    options: ['cried', 'was crying', 'will cry', 'has cried'],
    correctAnswer: 'was crying',
    explanation: 'Rule: Action continuing in the past when another event happened uses Past Continuous Tense (was/were + verb-ing).',
    hint: 'Action was in progress in the past.'
  },
  {
    id: 'tense-c5-8',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Identify Tense',
    questionText: 'Identify the Tense: "They have already finished their lunch."',
    options: ['Simple Past Tense', 'Present Perfect Tense', 'Past Perfect Tense', 'Present Continuous Tense'],
    correctAnswer: 'Present Perfect Tense',
    explanation: 'Rule: "have/has + V3" forms Present Perfect Tense, indicating a recently completed action.',
    hint: 'Look at "have + finished".'
  },

  // CLASS 6 TENSES
  {
    id: 'tense-c6-1',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Identify Tense',
    questionText: 'Identify the Tense: "By 5 PM, she had completed her science assignment."',
    options: ['Past Perfect Tense', 'Simple Past Tense', 'Present Perfect Tense', 'Future Perfect Tense'],
    correctAnswer: 'Past Perfect Tense',
    explanation: 'Rule: "had + V3" forms Past Perfect Tense, indicating an action completed before a specific past point.',
    hint: 'Formed by "had + past participle".'
  },
  {
    id: 'tense-c6-2',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Fill Verb Form',
    questionText: 'Fill in the correct tense: "While I was studying, my brother ___ (watch) television."',
    options: ['was watching', 'watched', 'is watching', 'had watched'],
    correctAnswer: 'was watching',
    explanation: 'Rule: Two simultaneous past continuous actions joined by "while" both use Past Continuous Tense.',
    hint: 'Simultaneous past action while studying.'
  },
  {
    id: 'tense-c6-3',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Tense Conversion',
    questionText: 'Convert to Future Continuous Tense: "They play cricket in the park."',
    options: ['They will be playing cricket in the park.', 'They will play cricket in the park.', 'They have played cricket in the park.', 'They were playing cricket in the park.'],
    correctAnswer: 'They will be playing cricket in the park.',
    explanation: 'Rule: Future Continuous formula: Subject + will be + Verb(-ing).',
    hint: 'Future Continuous requires "will be + V-ing".'
  },
  {
    id: 'tense-c6-4',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Error Spotting',
    questionText: 'Identify the incorrect part: "I have saw that new animation movie last week."',
    options: ['have saw', 'that new', 'animation movie', 'last week'],
    correctAnswer: 'have saw',
    explanation: 'Rule: Specific past time ("last week") requires Simple Past ("saw"), NOT Present Perfect ("have saw"). Also V3 of see is "seen".',
    hint: 'Do not mix "have" with simple past time markers like "last week".'
  },
  {
    id: 'tense-c6-5',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Fill Verb Form',
    questionText: 'Fill in the blank: "The train ___ (leave) before we reached the platform."',
    options: ['had left', 'left', 'has left', 'was leaving'],
    correctAnswer: 'had left',
    explanation: 'Rule: The earlier of two past actions uses Past Perfect Tense ("had left").',
    hint: 'Action completed BEFORE reaching the platform.'
  },
  {
    id: 'tense-c6-6',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Identify Tense',
    questionText: 'Which Tense is this? "The farmer has been ploughing the field since morning."',
    options: ['Present Perfect Continuous Tense', 'Present Continuous Tense', 'Past Perfect Continuous Tense', 'Present Perfect Tense'],
    correctAnswer: 'Present Perfect Continuous Tense',
    explanation: 'Rule: "has/have + been + verb(-ing)" with "since/for" forms Present Perfect Continuous Tense.',
    hint: 'Notice "has been + ploughing + since morning".'
  },
  {
    id: 'tense-c6-7',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Tense Conversion',
    questionText: 'Change into Present Perfect Tense: "She wrote an interesting story."',
    options: ['She has written an interesting story.', 'She was writing an interesting story.', 'She had written an interesting story.', 'She is writing an interesting story.'],
    correctAnswer: 'She has written an interesting story.',
    explanation: 'Rule: Present Perfect formula: Subject + has/have + V3 ("has written").',
    hint: 'Subject "She" + has + V3 (written).'
  },
  {
    id: 'tense-c6-8',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    tenseType: 'Fill Verb Form',
    questionText: 'Complete the sentence: "Listen! Somebody ___ (knock) at the front door."',
    options: ['is knocking', 'knocks', 'knocked', 'was knocking'],
    correctAnswer: 'is knocking',
    explanation: 'Rule: Exclamations like "Listen!" indicate an action taking place right now (Present Continuous: is knocking).',
    hint: '"Listen!" signals immediate ongoing action.'
  },

  // CLASS 7 TENSES
  {
    id: 'tense-c7-1',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Identify Tense',
    questionText: 'Identify the Tense: "Had he submitted all documents before the deadline?"',
    options: ['Past Perfect Tense', 'Simple Past Tense', 'Present Perfect Tense', 'Past Continuous Tense'],
    correctAnswer: 'Past Perfect Tense',
    explanation: 'Rule: Interrogative Past Perfect formula: Had + Subject + V3...?',
    hint: 'Starts with "Had" + Subject + V3.'
  },
  {
    id: 'tense-c7-2',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Fill Verb Form',
    questionText: 'Choose the correct verb form: "She ___ (teach) in this school for five years before she moved to Mumbai."',
    options: ['had been teaching', 'has been teaching', 'was teaching', 'is teaching'],
    correctAnswer: 'had been teaching',
    explanation: 'Rule: An action that continued in the past up to another past point uses Past Perfect Continuous Tense (had been teaching).',
    hint: 'Ongoing past action before moving.'
  },
  {
    id: 'tense-c7-3',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Tense Conversion',
    questionText: 'Convert to Past Perfect Continuous Tense: "He worked in the steel plant since 2015."',
    options: ['He had been working in the steel plant since 2015.', 'He has been working in the steel plant since 2015.', 'He was working in the steel plant since 2015.', 'He is working in the steel plant since 2015.'],
    correctAnswer: 'He had been working in the steel plant since 2015.',
    explanation: 'Rule: Past Perfect Continuous uses "had been + V-ing".',
    hint: 'Requires "had been + working".'
  },
  {
    id: 'tense-c7-4',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Error Spotting',
    questionText: 'Spot the tense error: "If you will study hard, you will clear the competitive exam."',
    options: ['will study hard', 'you will clear', 'the competitive exam', 'No error'],
    correctAnswer: 'will study hard',
    explanation: 'Rule: In first conditional sentences, the if-clause uses Simple Present ("If you study hard"), NOT "will study".',
    hint: 'If-clause should be Simple Present tense.'
  },
  {
    id: 'tense-c7-5',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Fill Verb Form',
    questionText: 'Fill in the blank: "By this time next year, my sister ___ (graduate) from college."',
    options: ['will have graduated', 'will graduate', 'graduates', 'has graduated'],
    correctAnswer: 'will have graduated',
    explanation: 'Rule: Time expressions like "By this time next year" require Future Perfect Tense (will have + V3).',
    hint: 'Action that will be completed by a future deadline.'
  },
  {
    id: 'tense-c7-6',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Identify Tense',
    questionText: 'Which Tense is this? "By December, we will have been living in this city for a decade."',
    options: ['Future Perfect Continuous Tense', 'Future Perfect Tense', 'Present Perfect Continuous Tense', 'Future Continuous Tense'],
    correctAnswer: 'Future Perfect Continuous Tense',
    explanation: 'Rule: "will have been + V-ing" with future time marker and duration (for a decade) forms Future Perfect Continuous Tense.',
    hint: 'Look for "will have been + living".'
  },
  {
    id: 'tense-c7-7',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Tense Conversion',
    questionText: 'Change into Present Perfect Continuous Tense: "They construct a new bridge over the river."',
    options: [
      'They have been constructing a new bridge over the river.',
      'They were constructing a new bridge over the river.',
      'They had constructed a new bridge over the river.',
      'They will be constructing a new bridge over the river.'
    ],
    correctAnswer: 'They have been constructing a new bridge over the river.',
    explanation: 'Rule: Present Perfect Continuous: Subject + have/has + been + V(-ing).',
    hint: 'Plural subject "They" takes "have been constructing".'
  },

  // CLASS 8 TENSES
  {
    id: 'tense-c8-1',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Fill Verb Form',
    questionText: 'Fill in the correct conditional verb form: "If he ___ (study) diligently, he would have topped the examination."',
    options: ['had studied', 'studied', 'studies', 'has studied'],
    correctAnswer: 'had studied',
    explanation: 'Rule: Third conditional clause formula: If + Subject + had + V3, Subject + would have + V3.',
    hint: 'Paired with "would have topped".'
  },
  {
    id: 'tense-c8-2',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Fill Verb Form',
    questionText: 'Complete the sentence: "Hardly had the chief guest started his speech when the electricity ___ (go) off."',
    options: ['went', 'had gone', 'was going', 'goes'],
    correctAnswer: 'went',
    explanation: 'Rule: "Hardly had... when..." structure pairs Past Perfect in the first clause with Simple Past (V2 "went") in the second clause.',
    hint: 'Second clause after "when" takes Simple Past.'
  },
  {
    id: 'tense-c8-3',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Tense Conversion',
    questionText: 'Convert "He works hard day and night" into Future Perfect Tense:',
    options: [
      'He will have worked hard day and night.',
      'He will be working hard day and night.',
      'He would work hard day and night.',
      'He has worked hard day and night.'
    ],
    correctAnswer: 'He will have worked hard day and night.',
    explanation: 'Rule: Future Perfect formula: Subject + will have + V3 ("will have worked").',
    hint: 'Subject + will have + past participle.'
  },
  {
    id: 'tense-c8-4',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Error Spotting',
    questionText: 'Identify the tense error: "Since three hours, heavy rain is falling continuously in the city."',
    options: ['Since three hours', 'is falling', 'continuously', 'in the city'],
    correctAnswer: 'Since three hours',
    explanation: 'Rule: Use "For" (not "since") for a period or duration of time ("For three hours"), and use Present Perfect Continuous ("has been falling").',
    hint: 'Duration of time requires "For", not "Since".'
  },
  {
    id: 'tense-c8-5',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Fill Verb Form',
    questionText: 'Fill in the correct subjunctive tense: "It is high time we ___ (start) revising our syllabus for the annual exams."',
    options: ['started', 'start', 'should start', 'have started'],
    correctAnswer: 'started',
    explanation: 'Rule: The idiom "It is high time..." is followed by a subject and a verb in the Simple Past Tense ("started").',
    hint: '"It is high time..." takes Simple Past V2 verb.'
  },
  {
    id: 'tense-c8-6',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    tenseType: 'Identify Tense',
    questionText: 'Identify the Tense: "By the time the fire brigade arrived, the neighbors had extinguished the fire."',
    options: ['Past Perfect Tense', 'Simple Past Tense', 'Past Continuous Tense', 'Present Perfect Tense'],
    correctAnswer: 'Past Perfect Tense',
    explanation: 'Rule: The main action completed earlier ("had extinguished") is in Past Perfect Tense.',
    hint: 'Focus on "had extinguished".'
  },
  {
    id: 'tense-c8-7',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Error Spotting',
    questionText: 'Find the tense error: "I am knowing Mr. Sharma for more than ten years."',
    options: ['am knowing', 'Mr. Sharma', 'for more than', 'ten years'],
    correctAnswer: 'am knowing',
    explanation: 'Rule: Stative verbs like "know" cannot be used in continuous tenses. Use Present Perfect: "have known".',
    hint: 'Stative verb "know" cannot be in "-ing" continuous form.'
  },
  {
    id: 'tense-c8-8',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    tenseType: 'Fill Verb Form',
    questionText: 'Choose the correct form: "He talks as if he ___ (be) the ruler of the entire kingdom."',
    options: ['were', 'was', 'is', 'would be'],
    correctAnswer: 'were',
    explanation: 'Rule: Hypothetical condition after "as if" uses subjunctive "were" regardless of the singular subject.',
    hint: 'Subjunctive imaginary condition uses "were".'
  },

  // ==================== ALL CLASSES MULTI-TOPIC EXPANDED BANK ====================
  // Format: English Text \n Hinglish Phonetic \n Hindi Meaning

  // ---------- CLASS 4 & 5 TOPICS ----------
  {
    id: 'exp-c4-1',
    classLevel: '4',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Identify the proper noun in this sentence:\nRohan is playing in the park.\nरोहन इज प्लेइंग इन द पार्क।\nरोहन पार्क में खेल रहा है।',
    options: ['Rohan', 'playing', 'park', 'in'],
    correctAnswer: 'Rohan',
    explanation: 'Rohan is a specific name of a person.\nरोहन इज ए स्पेसिफिक नेम ऑफ ए पर्सन।\nरोहन एक व्यक्ति का विशेष नाम है।',
    hint: 'Look for the capitalized person name.\nलुक फॉर द कैपिटलाइज्ड पर्सन नेम।\nव्यक्ति का खास नाम देखें।'
  },
  {
    id: 'exp-c4-2',
    classLevel: '4',
    topic: 'Articles (A, An, The)',
    difficulty: 'Easy',
    questionText: 'Choose the correct article:\nShe saw ___ owl sitting on the branch.\nशी सॉ ___ आउल सिटिंग ऑन द ब्रांच।\nउसने पेड़ की शाखा पर एक उल्लू बैठा देखा।',
    options: ['an', 'a', 'the', 'no article'],
    correctAnswer: 'an',
    explanation: 'Use "an" before vowel sound "O".\nयूज "एन" बिफोर वोवेल साउंड "ओ"।\nस्वर ध्वनि वाले शब्द "Owl" से पहले "an" का प्रयोग होता है।',
    hint: 'Owl starts with a vowel sound.\nआउल स्टार्ट्स विद ए वोवेल साउंड।\nOwl का पहला अक्षर स्वर ध्वनि वाला है।'
  },
  {
    id: 'exp-c4-3',
    classLevel: '4',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    questionText: 'Fill in the correct verb form:\nThe sun ___ in the east every morning.\nद सन ___ इन द ईस्ट एवरी मॉर्निंग।\nसूरज हर सुबह पूर्व में उगता है।',
    options: ['rises', 'rose', 'rising', 'is rise'],
    correctAnswer: 'rises',
    explanation: 'Universal facts use Simple Present Tense.\nयूनिवर्सल फैक्ट्स यूज सिंपल प्रेजेंट टेंस।\nसदा सत्य रहने वाली बातों के लिए Simple Present (rises) आता है।',
    hint: 'Singular subject "sun" takes "rises".\nसिंगुलर सब्जेक्ट "सन" टेक्स "राइसेस"।\nएकवचन कर्ता sun के साथ rises आएगा।'
  },
  {
    id: 'exp-c4-4',
    classLevel: '4',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Easy',
    questionText: 'Identify the adjective:\nThe smart student solved the puzzle quickly.\nद स्मार्ट स्टूडेंट सॉल्व्ड द पजल क्विकली।\nचतुर छात्र ने पहेली को जल्दी सुलझाया।',
    options: ['smart', 'solved', 'puzzle', 'quickly'],
    correctAnswer: 'smart',
    explanation: 'Smart describes the noun "student".\nस्मार्ट डिस्क्राइब्स द नाउन "स्टूडेंट"।\n"Smart" (चतुर) शब्द छात्र की विशेषता बता रहा है।',
    hint: 'Find the word describing the student.\nफाइंड द वर्ड डिस्क्राइबिंग द स्टूडेंट।\nछात्र की विशेषता बताने वाला शब्द खोजें।'
  },
  {
    id: 'exp-c4-5',
    classLevel: '4',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Easy',
    questionText: 'Choose the correct preposition:\nThe book is kept ___ the table.\nद बुक इज केप्ट ___ द टेबल।\nकिताब मेज पर रखी हुई है।',
    options: ['on', 'in', 'under', 'between'],
    correctAnswer: 'on',
    explanation: 'Use "on" for surface contact.\nयूज "ऑन" फॉर सरफेस कांटेक्ट।\nसतह के ऊपर स्पर्श के लिए "on" का प्रयोग होता है।',
    hint: 'On indicates resting on top.\nऑन इंडिकेट्स रेस्टिंग ऑन टॉप।\nमेज की ऊपरी सतह के लिए "on" सही है।'
  },

  {
    id: 'exp-c5-1',
    classLevel: '5',
    topic: 'Nouns & Pronouns',
    difficulty: 'Medium',
    questionText: 'Replace the underline with a pronoun:\nPriya lost Priya\'s water bottle.\nप्रिया लॉस्ट प्रियाज वॉटर बॉटल।\nप्रिया ने अपनी पानी की बोतल खो दी।',
    options: ['her', 'his', 'its', 'she'],
    correctAnswer: 'her',
    explanation: 'Priya is female, possessive pronoun is "her".\nप्रिया इज फीमेल, पजेसिव प्रोनाउन इज "हर"।\nस्त्रीलिंग के लिए अधिकार सूचक सर्वनाम "her" होता है।',
    hint: 'Use female possessive pronoun.\nयूज फीमेल पजेसिव प्रोनाउन।\nमहिला के अधिकार के लिए her लगाएं।'
  },
  {
    id: 'exp-c5-2',
    classLevel: '5',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Medium',
    questionText: 'Choose the correct verb:\nNeither of the boys ___ present yesterday.\nनाइदर ऑफ द बॉयज ___ प्रेजेंट यस्टरडे।\nकल लड़कों में से कोई भी उपस्थित नहीं था।',
    options: ['was', 'were', 'are', 'have'],
    correctAnswer: 'was',
    explanation: '"Neither of" takes a singular verb.\n"नाइदर ऑफ" टेक्स ए सिंगुलर वर्ब।\n"Neither of" के साथ हमेशा एकवचन (was) प्रयोग होता है।',
    hint: 'Neither of is followed by singular verb.\nनाइदर ऑफ इज फॉलोड बाय सिंगुलर वर्ब।\nनाइदर ऑफ के बाद singular verb लगाएं।'
  },
  {
    id: 'exp-c5-3',
    classLevel: '5',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Medium',
    questionText: 'Convert to indirect speech:\nHe said, "I am happy today."\nही सैड, "आई एम हैप्पी टुडे।"\nउसने कहा, "मैं आज खुश हूं।"',
    options: [
      'He said that he was happy that day.',
      'He said that I am happy today.',
      'He says he is happy today.',
      'He told that he is happy today.'
    ],
    correctAnswer: 'He said that he was happy that day.',
    explanation: 'Present changes to Past (was), "today" changes to "that day".\nप्रेजेंट चेंजेज टू पास्ट (वॉज़), "टुडे" चेंजेज टू "दैट डे"।\nPresent Tense बदलकर Past में और today "that day" बन जाता है।',
    hint: 'Today changes to that day.\nटुडे चेंजेज टू दैट डे।\nToday को that day में बदलें।'
  },
  {
    id: 'exp-c5-4',
    classLevel: '5',
    topic: 'Active & Passive Voice',
    difficulty: 'Medium',
    questionText: 'Convert to passive voice:\nThe boy kicked the ball.\nद बॉय किक्ड द बॉल।\nलड़के ने गेंद को लात मारी।',
    options: [
      'The ball was kicked by the boy.',
      'The ball is kicked by the boy.',
      'The ball had kicked by the boy.',
      'The ball was kick by the boy.'
    ],
    correctAnswer: 'The ball was kicked by the boy.',
    explanation: 'Simple Past Passive formula: Object + was/were + V3.\nसिंपल पास्ट पैसिव फॉर्मूला: ऑब्जेक्ट + वॉज़/वर + V3।\nSimple Past में Object + was + V3 + by + Subject लगता है।',
    hint: 'Use was + kicked.\nयूज वॉज़ + किक्ड।\nwas + V3 (kicked) का प्रयोग करें।'
  },

  // ---------- CLASS 6 & 7 TOPICS ----------
  {
    id: 'exp-c6-1',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    questionText: 'Choose the correct form:\nThey ___ English for two hours.\nदे ___ इंग्लिश फॉर टू आवर्स।\nवे दो घंटे से अंग्रेजी सीख रहे हैं।',
    options: [
      'have been learning',
      'are learning',
      'learnt',
      'will learn'
    ],
    correctAnswer: 'have been learning',
    explanation: 'Action starting in past and continuing till now uses Present Perfect Continuous.\nएक्शन स्टार्टिंग इन पास्ट एंड कंटीन्यूइंग टिल नाऊ यूजेज प्रेजेंट परफेक्ट कंटीन्यूअस।\nसमय की अवधि के साथ Present Perfect Continuous (have been learning) आता है।',
    hint: '"For two hours" indicates continuous action from past.\n"फॉर टू आवर्स" इंडिकेट्स कंटीन्यूअस एक्शन फ्रॉम पास्ट।\nसमय अवधि (For two hours) के लिए Present Perfect Continuous लगाएं।'
  },
  {
    id: 'exp-c6-2',
    classLevel: '6',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Medium',
    questionText: 'Fill in the blank:\nDivide the sweets ___ the two sisters.\nडिवाइड द स्वीट्स ___ द टू सिस्टर्स।\nमिठाइयों को दोनों बहनों के बीच बांट दो।',
    options: ['between', 'among', 'with', 'into'],
    correctAnswer: 'between',
    explanation: 'Use "between" for two people, "among" for more than two.\nयूज "बिटवीन" फॉर टू पीपल, "अमंग" फॉर मोर देन टू।\nदो लोगों के लिए "between" और दो से अधिक के लिए "among" का प्रयोग होता है।',
    hint: 'Two sisters require between.\nटू सिस्टर्स रिक्वायर बिटवीन।\nदो बहनों के बीच के लिए between चुनें।'
  },
  {
    id: 'exp-c6-3',
    classLevel: '6',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Easy',
    questionText: 'Identify the sentence with correct punctuation:\nWhere are you going?\nव्हेयर आर यू गोइंग?\nआप कहां जा रहे हैं?',
    options: [
      'Where are you going?',
      'where are you going.',
      'Where are you going.',
      'Where, are you going!'
    ],
    correctAnswer: 'Where are you going?',
    explanation: 'Interrogative sentences start with capital letter and end with question mark.\nइंटेरोगेटिव सेंटेंसेस स्टार्ट विद कैपिटल लेटर एंड एंड विद क्वेश्चन मार्क।\nप्रश्नवाचक वाक्य बड़े अक्षर से शुरू होकर प्रश्नचिह्न (?) पर समाप्त होते हैं।',
    hint: 'Questions end with a question mark (?).\nक्वेश्चंस एंड विद ए क्वेश्चन मार्क (?)|।\nप्रश्नवाचक वाक्य के अंत में ? आता है।'
  },
  {
    id: 'exp-c6-4',
    classLevel: '6',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Medium',
    questionText: 'Choose the correct option:\nBread and butter ___ my favorite breakfast.\nब्रेड एंड बटर ___ माय फेवरेट ब्रेकफास्ट।\nब्रेड और मक्खन मेरा पसंदीदा नाश्ता है।',
    options: ['is', 'are', 'were', 'have'],
    correctAnswer: 'is',
    explanation: 'When two singular nouns express a single unit/idea, use singular verb "is".\nव्हेन टू सिंगुलर नाउन्स एक्सप्रेस ए सिंगल यूनिट/आइडिया, यूज सिंगुलर वर्ब "इज"।\nजब दो शब्द मिलकर एक ही नाश्ते/विचार को दर्शाते हैं तो एकवचन क्रिया (is) आती है।',
    hint: 'Bread and butter acts as a single food item.\nब्रेड एंड बटर एक्ट्स एज ए सिंगल फूड आइटम।\nयह एक ही भोजन का रूप है, इसलिए is आएगा।'
  },

  {
    id: 'exp-c7-1',
    classLevel: '7',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Hard',
    questionText: 'Convert into indirect speech:\nShe said, "Where do you live?"\nशी सैड, "व्हेयर डू यू लिव?"\nउसने कहा, "तुम कहां रहते हो?"',
    options: [
      'She asked where I lived.',
      'She asked that where I live.',
      'She said where do I live.',
      'She asked where did I lived.'
    ],
    correctAnswer: 'She asked where I lived.',
    explanation: 'Wh-questions keep the wh-word, remove "do", and convert Simple Present to Simple Past.\nडब्ल्यूएच-क्वेश्चंस कीप द डब्ल्यूएच-वर्ड, रिमूव "डू", एंड कंवर्ट सिंपल प्रेजेंट टू सिंपल पास्ट।\nWh-प्रश्न में that नहीं लगता, do हट जाता है और Past Tense (lived) बन जाता है।',
    hint: 'Do not use "that" in wh-questions.\nडू नॉट यूज "दैट" इन डब्ल्यूएच-क्वेश्चंस।\nWh-वाले सवाल में that का प्रयोग न करें।'
  },
  {
    id: 'exp-c7-2',
    classLevel: '7',
    topic: 'Active & Passive Voice',
    difficulty: 'Medium',
    questionText: 'Convert to passive voice:\nWho wrote this letter?\nहू रोट दिस लेटर?\nयह पत्र किसने लिखा?',
    options: [
      'By whom was this letter written?',
      'Who was written this letter?',
      'By whom this letter was written?',
      'By who was this letter write?'
    ],
    correctAnswer: 'By whom was this letter written?',
    explanation: '"Who" changes to "By whom" in passive questions.\n"हू" चेंजेज टू "बाय व्हूम" इन पैसिव क्वेश्चंस।\n"Who" वाले प्रश्नों को पैसिव में "By whom" से शुरू किया जाता है।',
    hint: 'Who changes to By whom.\nहू चेंजेज टू बाय व्हूम।\nWho को By whom में बदलें।'
  },
  {
    id: 'exp-c7-3',
    classLevel: '7',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Hard',
    questionText: 'Choose the correct degree of adjective:\nMount Everest is the ___ peak in the world.\nमाउंट एवरेस्ट इज द ___ पीक इन द वर्ल्ड।\nमाउंट एवरेस्ट दुनिया की सबसे ऊंची चोटी है।',
    options: ['highest', 'higher', 'high', 'more high'],
    correctAnswer: 'highest',
    explanation: 'Use superlative degree "highest" after article "the".\nयूज सुपरलेटिव डिग्री "हाईएस्ट" आफ्टर आर्टिकल "द"।\n"The" के बाद हमेशा Superlative degree (highest) का प्रयोग होता है।',
    hint: 'The is followed by superlative degree -est.\nद इज फॉलोड बाय सुपरलेटिव डिग्री -ईएसटी।\nThe के बाद superlative degree (-est) लगाएं।'
  },

  // ---------- CLASS 8 & 9 TOPICS ----------
  {
    id: 'exp-c8-1',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    questionText: 'Choose the correct tense:\nIf I ___ rich, I would help the poor.\nइफ आई ___ रिच, आई वुड हेल्प द पुअर।\nअगर मैं अमीर होता, तो गरीबों की मदद करता।',
    options: ['were', 'was', 'am', 'had been'],
    correctAnswer: 'were',
    explanation: 'Subjunctive conditional statement uses "were" for imaginary conditions.\nसबजंक्टिव कंडीशनल स्टेटमेंट यूजेज "वर" फॉर इमेजिनरी कंडीशंस।\nकाल्पनिक शर्त (Imaginary Condition) दर्शाने के लिए I के साथ भी "were" लगता है।',
    hint: 'Imaginary conditions use "were".\nइमेजिनरी कंडीशंस यूज "वर"।\nकाल्पनिक वाक्य में were का उपयोग करें।'
  },
  {
    id: 'exp-c8-2',
    classLevel: '8',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Medium',
    questionText: 'Fill in the suitable modal:\nYou ___ respect your elders and teachers.\nयू ___ रिस्पेक्ट योर एल्डर्स एंड टीचर्स।\nआपको अपने बड़ों और शिक्षकों का सम्मान करना चाहिए।',
    options: ['ought to', 'can', 'may', 'could'],
    correctAnswer: 'ought to',
    explanation: '"Ought to" conveys moral obligation.\n"ऑट टू" कन्वेज मॉरल ऑब्लिगेशन।\nनैतिक कर्तव्य (Moral duty) जताने के लिए "ought to" सही है।',
    hint: 'Moral duty requires ought to.\nमॉरल ड्यूटी रिक्वायर्स ऑट टू।\nनैतिक कर्तव्य के लिए ought to चुनें।'
  },
  {
    id: 'exp-c8-3',
    classLevel: '8',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Hard',
    questionText: 'Choose the correct option:\nFive hundred rupees ___ not a big sum today.\nफाइव हंड्रेड रुपीज ___ नॉट ए बिग सम टुडे।\nपाँच सौ रुपये आज कोई बड़ी रकम नहीं है।',
    options: ['is', 'are', 'were', 'have'],
    correctAnswer: 'is',
    explanation: 'A specific amount of money takes a singular verb "is".\nए स्पेसिफिक अमाउंट ऑफ मनी टेक्स ए सिंगुलर वर्ब "इज"।\nनिश्चित धनराशि (Amount of money) को एक इकाई मानकर एकवचन (is) का प्रयोग होता है।',
    hint: 'A total sum takes singular verb.\nए टोटल सम टेक्स सिंगुलर वर्ब।\nकुल राशि एकवचन मानी जाती है।'
  },

  {
    id: 'exp-c9-1',
    classLevel: '9',
    topic: 'Editing & Omission',
    difficulty: 'Hard',
    questionText: 'Spot the error in the sentence:\nOne of my friend is going to Canada.\nवन ऑफ माय फ्रेंड इज गोइंग टू कनाडा।\nमेरा एक दोस्त कनाडा जा रहा है।',
    options: ['friend (should be friends)', 'is (should be are)', 'going', 'Canada'],
    correctAnswer: 'friend (should be friends)',
    explanation: '"One of" is always followed by a plural noun ("friends").\n"वन ऑफ" इज ऑलवेज फॉलोड बाय ए प्लुरल नाउन ("फ्रेंड्स")।\n"One of" के बाद हमेशा बहुवचन संज्ञा (friends) का प्रयोग किया जाता है।',
    hint: 'One of + Plural Noun.\nवन ऑफ + प्लुरल नाउन।\nOne of के बाद बहुवचन शब्द आता है।'
  },
  {
    id: 'exp-c9-2',
    classLevel: '9',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Hard',
    questionText: 'Convert into indirect speech:\nThe teacher said, "Water boils at 100°C."\nद टीचर सैड, "वॉटर बॉइल्स एट 100°C।"\nशिक्षक ने कहा, "पानी 100°C पर उबलता है।"',
    options: [
      'The teacher said that water boils at 100°C.',
      'The teacher said that water boiled at 100°C.',
      'The teacher told that water is boiling at 100°C.',
      'The teacher says water boils at 100°C.'
    ],
    correctAnswer: 'The teacher said that water boils at 100°C.',
    explanation: 'Universal scientific facts do NOT change their tense in indirect speech.\nयूनिवर्सल साइंटिफिक फैक्ट्स डू नॉट चेंज देयर टेंस इन इनडायरेक्ट स्पीच।\nवैज्ञानिक और सार्वभौमिक सत्य (Universal Truth) का Tense कभी नहीं बदलता।',
    hint: 'Scientific fact tense remains unchanged.\nसाइंटिफिक फैक्ट टेंस रिमेंस अनचेंज्ड।\nवैज्ञानिक तथ्य का काल (Tense) न बदलें।'
  },
  {
    id: 'exp-c9-3',
    classLevel: '9',
    topic: 'Active & Passive Voice',
    difficulty: 'Hard',
    questionText: 'Convert to passive voice:\nOpen the window.\nओपन द विंडो।\nखिड़की खोलो।',
    options: [
      'Let the window be opened.',
      'The window should open.',
      'You are requested to open window.',
      'Let window open.'
    ],
    correctAnswer: 'Let the window be opened.',
    explanation: 'Imperative command passive formula: Let + Object + be + V3.\nइम्पेरेटिव कमांड पैसिव फॉर्मूला: लेट + ऑब्जेक्ट + बी + V3।\nआज्ञावाचक वाक्य (Command) में Let + Object + be + V3 का प्रयोग करें।',
    hint: 'Commands start with Let in passive.\nकमांड्स स्टार्ट विद लेट इन पैसिव।\nआज्ञावाचक वाक्य का Passive Let से बनता है।'
  },

  // ---------- CLASS 10, 11 & 12 TOPICS ----------
  {
    id: 'exp-c10-1',
    classLevel: '10',
    topic: 'Editing & Omission',
    difficulty: 'Hard',
    questionText: 'Identify the error in this clause:\nNo sooner did the bell rang than the students ran out.\nनो सूनर डिड द बेल रेंग देन द स्टूडेंट्स रैन आउट।\nजैसे ही घंटी बजी, छात्र बाहर भाग गए।',
    options: ['rang (should be ring)', 'did', 'than', 'ran'],
    correctAnswer: 'rang (should be ring)',
    explanation: 'Auxiliary verb "did" is always followed by base form V1 ("ring").\nऑक्सिलरी वर्ब "डिड" इज ऑलवेज फॉलोड बाय बेस फॉर्म V1 ("रिंग")।\n"Did" के बाद हमेशा क्रिया का पहला रूप (V1 - ring) प्रयोग होता है।',
    hint: 'Did is followed by first form V1.\nडिड इज फॉलोड बाय फर्स्ट फॉर्म V1।\nDid के साथ क्रिया का प्रथम रूप आता है।'
  },
  {
    id: 'exp-c10-2',
    classLevel: '10',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Hard',
    questionText: 'Choose the correct option:\nThe magistrate and collector ___ present at the meeting.\nद मजिस्ट्रेट एंड कलेक्टर ___ प्रेजेंट एट द मीटिंग।\nमजिस्ट्रेट और कलेक्टर बैठक में मौजूद थे।',
    options: ['was', 'were', 'have', 'are being'],
    correctAnswer: 'was',
    explanation: 'Single article "The" before first noun means both designation belong to one person.\nसिंगल आर्टिकल "द" बिफोर फर्स्ट नाउन मीन्स बोथ डेजिग्नेशन बिलॉन्ग टू वन पर्सन।\nएक ही व्यक्ति के दो पद होने पर (एक ही "The") एकवचन क्रिया (was) का प्रयोग होता है।',
    hint: 'Only one "The" indicates a single officer.\nओनली वन "द" इंडिकेट्स ए सिंगल ऑफिसर।\nकेवल एक बार "The" आने से एक ही व्यक्ति का बोध होता है।'
  },

  {
    id: 'exp-c11-1',
    classLevel: '11',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Hard',
    questionText: 'Choose the grammatically correct sentence:\nScarcely had I reached the station when the train left.\nस्केयर्सली हैड आई रीच्ड द स्टेशन व्हेन द ट्रेन लेफ्ट।\nमैं स्टेशन पहुँचा ही था कि ट्रेन छूट गई।',
    options: [
      'Scarcely had I reached the station when the train left.',
      'Scarcely had I reached the station than the train left.',
      'Scarcely I reached the station then train left.',
      'Scarcely did I reached station when train left.'
    ],
    correctAnswer: 'Scarcely had I reached the station when the train left.',
    explanation: '"Scarcely... when" is the correct pair, followed by inverted auxiliary "had".\n"स्केयर्सली... व्हेन" इज द करेक्ट पेयर, फॉलोड बाय इनवर्टेड ऑक्सिलरी "हैड"।\nScarcely के साथ जोड में "when" का ही प्रयोग होता है।',
    hint: 'Scarcely pairs with when (not than).\nस्केयर्सली पेयर्स विद व्हेन (नॉट देन)।\nScarcely के साथ "when" का प्रयोग होता है।'
  },
  {
    id: 'exp-c11-2',
    classLevel: '11',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    questionText: 'Fill in the correct option:\nBy next year, she ___ her doctorate degree in Physics.\nबाय नेक्स्ट ईयर, शी ___ हर डॉक्टरेट डिग्री इन फिजिक्स।\nअगले साल तक वह भौतिकी में अपनी डॉक्टरेट की डिग्री पूरी कर चुकी होगी।',
    options: [
      'will have completed',
      'will complete',
      'has completed',
      'would complete'
    ],
    correctAnswer: 'will have completed',
    explanation: '"By next year" denotes a time deadline in future, requiring Future Perfect Tense.\n"बाय नेक्स्ट ईयर" डिनोट्स ए टाइम डेडलाइन इन फ्यूचर, रिक्वायरिंग फ्यूचर परफेक्ट टेंस।\nभविष्य की समय-सीमा (By next year) के लिए Future Perfect (will have completed) का प्रयोग होता है।',
    hint: '"By + Future Time" requires Future Perfect.\n"बाय + फ्यूचर टाइम" रिक्वायर्स फ्यूचर परफेक्ट।\nBy + Future time होने पर Future Perfect Tense प्रयोग करें।'
  },

  {
    id: 'exp-c12-1',
    classLevel: '12',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Hard',
    questionText: 'Convert into indirect speech:\nHe said to me, "May you succeed in all your endeavors!"\nही सैड टू मी, "मे यू सक्सीड इन ऑल योर एंडेवर्स!"\nउसने मुझसे कहा, "ईश्वर करे आप अपने सभी प्रयासों में सफल हों!"',
    options: [
      'He prayed that I might succeed in all my endeavors.',
      'He told me that I may succeed in all my endeavors.',
      'He wished that you might succeed in all your endeavors.',
      'He ordered me to succeed in all my endeavors.'
    ],
    correctAnswer: 'He prayed that I might succeed in all my endeavors.',
    explanation: 'Optative wish sentence uses "prayed/wished", and "may" changes to "might".\nऑप्टेटिव विश सेंटेंस यूजेज "प्रेय्ड/विश्ड", एंड "मे" चेंजेज टू "माइट"।\nइच्छावाचक/प्रार्थना वाले वाक्य में prayed/wished और may बदलकर might हो जाता है।',
    hint: 'Optative sentences turn "may" into "might".\nऑप्टेटिव सेंटेंसेस टर्न "मे" इनटू "माइट"।\nMay को बदलकर might में लिखें।'
  },
  {
    id: 'exp-c12-2',
    classLevel: '12',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Hard',
    questionText: 'Choose the appropriate option:\nLest you ___ fail in the examination, work hard day and night.\nलेस्ट यू ___ फेल इन द एग्जामिनेशन, वर्क हार्ड डे एंड नाइट।\nकहीं ऐसा न हो कि तुम परीक्षा में असफल हो जाओ, दिन-रात मेहनत करो।',
    options: ['should', 'must', 'would', 'may'],
    correctAnswer: 'should',
    explanation: 'The conjunction "lest" is always paired with the modal "should".\nद कंजंक्शन "लेस्ट" इज ऑलवेज पेयर्ड विद द मॉडल "शुड"।\nसंयोजक "lest" (कहीं ऐसा न हो कि) के साथ हमेशा "should" का जोड़ा बनता है।',
    hint: '"Lest" is always followed by "should".\n"लेस्ट" इज ऑलवेज फॉलोड बाय "शुड"।\nLest के साथ सदैव should का ही प्रयोग होता है।'
  },

  // -------------------------------------------------------------
  // BATCH 3: NEW UNIQUE QUESTIONS FOR ALL CLASSES (3-12) & TOPICS
  // -------------------------------------------------------------
  {
    id: 'add2-c3-1',
    classLevel: '3',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Select the proper noun in the sentence:\nDelhi is a very big city.\nदिल्ली इज ए वेरी बिग सिटी।\nदिल्ली एक बहुत बड़ा शहर है।',
    options: ['Delhi', 'city', 'very', 'big'],
    correctAnswer: 'Delhi',
    explanation: 'Delhi is the specific name of a place, so it is a Proper Noun.\nदिल्ली इज द स्पेसिफिक नेम ऑफ ए प्लेस, सो इट इज ए प्रॉपर नाउन।\nदिल्ली एक विशेष शहर का नाम है, इसलिए यह Proper Noun है।',
    hint: 'Look for the specific name starting with capital letter D.\nलुक्स फॉर द स्पेसिफिक नेम स्टार्टिंग विद कैपिटल लेटर D।\nराजधानी शहर का विशेष नाम चुनें।'
  },
  {
    id: 'add2-c3-2',
    classLevel: '3',
    topic: 'Articles (A, An, The)',
    difficulty: 'Easy',
    questionText: 'Fill in the blank:\nThis is ___ umbrella.\nदिस इज ___ अम्ब्रेला।\nयह एक छाता है।',
    options: ['an', 'a', 'the', 'no article'],
    correctAnswer: 'an',
    explanation: 'Umbrella starts with a vowel sound "u", so we use "an".\nअम्ब्रेला स्टार्ट्स विद ए वॉवेल साउंड "u", सो वी यूज "an"।\nUmbrella स्वर ध्वनि (स्वर स्वर) से शुरू होता है, इसलिए "an" का प्रयोग होगा।',
    hint: 'Vowel sound words take "an".\nवॉवेल साउंड वर्ड्स टेक "an"।\nस्वर ध्वनि के आगे an आता है।'
  },
  {
    id: 'add2-c3-3',
    classLevel: '3',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    questionText: 'Choose the action verb:\nThe birds fly in the sky.\nद बर्ड्स फ्लाई इन द स्काई।\nपक्षी आसमान में उड़ते हैं।',
    options: ['fly', 'birds', 'sky', 'in'],
    correctAnswer: 'fly',
    explanation: '"fly" shows the action done by the birds.\n"फ्लाई" शोज़ द एक्शन डन बाय द बर्ड्स।\n"fly" (उड़ना) पक्षियों द्वारा की जाने वाली क्रिया है।',
    hint: 'Find the word that shows doing work.\nफाइंड द वर्ड दैट शोज़ डूइंग वर्क।\nकाम बताने वाला शब्द ढूंढें।'
  },
  {
    id: 'add2-c3-4',
    classLevel: '3',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Easy',
    questionText: 'Find the adjective:\nShe has a red ball.\nशी हैज ए रेड बॉल।\nउसके पास एक लाल गेंद है।',
    options: ['red', 'ball', 'has', 'she'],
    correctAnswer: 'red',
    explanation: '"red" describes the color of the ball, so it is an adjective.\n"रेड" डिस्क्राइब्स द कलर ऑफ द बॉल, सो इट इज एन एडजेक्टिव।\n"red" गेंद का रंग बता रहा है, इसलिए यह विशेषण (Adjective) है।',
    hint: 'Which word tells the color of the ball?\nव्हिच वर्ड टेल्स द कलर ऑफ द बॉल?\nगेंद के रंग को कौन सा शब्द बता रहा है?'
  },
  {
    id: 'add2-c3-5',
    classLevel: '3',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Easy',
    questionText: 'Fill in the blank:\nThe cat is sitting ___ the table.\nद कैट इज सिटिंग ___ द टेबल।\nबिल्ली मेज के नीचे बैठी है।',
    options: ['under', 'over', 'between', 'into'],
    correctAnswer: 'under',
    explanation: '"under" shows position beneath the table.\n"अंडर" शोज़ पोजीशन बिनीथ द टेबल।\n"under" (नीचे) मेज के नीचे होने की स्थिति दर्शाता है।',
    hint: 'Meaning of below/beneath.\nमीनिंग ऑफ बिलो/बिनीथ।\nनीचे का अर्थ देने वाला शब्द चुनें।'
  },
  {
    id: 'add2-c3-6',
    classLevel: '3',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Choose the pronoun to replace "Rohan":\nRohan is playing cricket. ___ is a good boy.\nरोहन इज प्लेइंग क्रिकेट। ___ इज ए गुड बॉय।\nरोहन क्रिकेट खेल रहा है। वह एक अच्छा लड़का है।',
    options: ['He', 'She', 'It', 'They'],
    correctAnswer: 'He',
    explanation: 'For a singular boy "Rohan", pronoun "He" is used.\nफॉर ए सिंगुलर बॉय "रोहन", प्रोनाउन "ही" इज यूज्ड।\nएकवचन लड़के (रोहन) के लिए "He" सर्वनाम का प्रयोग होता है।',
    hint: 'Pronoun for a boy.\nप्रोनाउन फॉर ए बॉय।\nलड़के के लिए वह (He) आता है।'
  },
  {
    id: 'add2-c3-7',
    classLevel: '3',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    questionText: 'Fill in the correct verb form:\nYesterday, I ___ a sweet mango.\nयस्टरडे, आई ___ ए स्वीट मैंगो।\nकल मैंने एक मीठा आम खाया।',
    options: ['ate', 'eat', 'eats', 'eating'],
    correctAnswer: 'ate',
    explanation: 'Yesterday indicates Past Tense, so 2nd form "ate" is used.\nयस्टरडे इंडिकेट्स पास्ट टेंस, सो 2nd फॉर्म "एट" इज यूज्ड।\nYesterday (बीता हुआ कल) भूतकाल दर्शाता है, इसलिए ate आएगा।',
    hint: 'Use 2nd form of eat for yesterday.\nयूज 2nd फॉर्म ऑफ ईट फॉर यस्टरडे।\neat का Past tense रुप chunen.'
  },
  {
    id: 'add2-c3-8',
    classLevel: '3',
    topic: 'Articles (A, An, The)',
    difficulty: 'Easy',
    questionText: 'Choose the correct article:\n___ Sun shines brightly.\n___ सन शाइन्स ब्राइटली।\nसूरज तेज़ी से चमकता है।',
    options: ['The', 'A', 'An', 'No article'],
    correctAnswer: 'The',
    explanation: 'Universal unique objects like the Sun take "The".\nयूनिवर्सल यूनिक ऑब्जेक्ट्स लाइक द सन टेक "द"।\nसूर्य जैसे अनूठे आकाशीय पिण्ड के आगे "The" आता है।',
    hint: 'Unique natural objects use "The".\nयूनिक नेचुरल ऑब्जेक्ट्स यूज "द"।\nसूर्य के आगे The लगाएं।'
  },
  {
    id: 'add2-c3-9',
    classLevel: '3',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Easy',
    questionText: 'Identify the opposite adjective for "cold":\nIce is cold, but fire is ___.\nआइस इज कोल्ड, बट फायर इज ___।\nबर्फ ठंडी होती है, लेकिन आग गर्म होती है।',
    options: ['hot', 'soft', 'wet', 'tall'],
    correctAnswer: 'hot',
    explanation: 'The opposite of "cold" is "hot".\nद अपोजिट ऑफ "कोल्ड" इज "हॉट"।\n"cold" (ठंडा) का विलोम "hot" (गर्म) है।',
    hint: 'What is the temperature of fire?\nव्हाट इज द टेम्परेचर ऑफ फायर?\nआग कैसी होती है?'
  },
  {
    id: 'add2-c3-10',
    classLevel: '3',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Easy',
    questionText: 'Choose the joining word (conjunction):\nI like tea ___ coffee.\nआई लाइक टी ___ कॉफी।\nमुझे चाय और कॉफी पसंद है।',
    options: ['and', 'in', 'on', 'at'],
    correctAnswer: 'and',
    explanation: '"and" joins two similar items (tea & coffee).\n"एंड" जॉइन्स टू सिमिलर आइटम्स (टी एंड कॉफी)।\n"and" दो चीज़ों को जोड़ने का काम करता है।',
    hint: 'Word used for "और".\nवर्ड यूज्ड फॉर "और"।\n"और" का अंग्रेजी शब्द।'
  },
  {
    id: 'add2-c4-1',
    classLevel: '4',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Identify the Collective Noun:\nA ___ of cows was grazing in the field.\nए ___ ऑफ काउज़ वाज ग्रेजिंग इन द फील्ड।\nगायों का एक झुंड खेत में चर रहा था।',
    options: ['herd', 'flock', 'bunch', 'pack'],
    correctAnswer: 'herd',
    explanation: 'A group of cattle/cows is called a "herd".\nए ग्रुप ऑफ कैटल/काउज़ इज कॉल्ड ए "हर्ड"।\nगायों या मवेशियों के समूह को "herd" (झुंड) कहते हैं।',
    hint: 'Group name for cattle or cows.\nग्रुप नेम फॉर कैटल ओर काउज़।\nमवेशियों के समूह को क्या कहते हैं?'
  },
  {
    id: 'add2-c4-2',
    classLevel: '4',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Easy',
    questionText: 'Fill in the blank:\nMy mother ___ delicious food every day.\nमाय मदर ___ डिलीशियस फूड एवरी डे।\nमेरी माँ रोज स्वादिष्ट खाना बनाती हैं।',
    options: ['cooks', 'cook', 'cooking', 'cooked'],
    correctAnswer: 'cooks',
    explanation: 'Singular subject "My mother" takes singular verb "cooks" in Simple Present.\nसिंगुलर सब्जेक्ट "माय मदर" टेक सिंगुलर वर्ब "कुक्स" इन सिंपल प्रेजेंट।\nएकवचन कर्ता (My mother) के साथ s/es वाला क्रिया रूप (cooks) आता है।',
    hint: 'Present habit with singular subject.\nप्रेजेंट हैबिट विद सिंगुलर सब्जेक्ट।\nMother एकवचन है।'
  },
  {
    id: 'add2-c4-3',
    classLevel: '4',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    questionText: 'Select the Present Continuous form:\nThey ___ football right now.\nदे ___ फुटबॉल राइट नाउ।\nवे अभी फुटबॉल खेल रहे हैं।',
    options: ['are playing', 'played', 'play', 'will play'],
    correctAnswer: 'are playing',
    explanation: '"right now" shows action in progress, so Present Continuous (are playing) is correct.\n"राइट नाउ" शोज़ एक्शन इन प्रोग्रेस, सो प्रेजेंट कंटीन्यूअस (आर प्लेइंग) इज करेक्ट।\n"right now" काम का जारी रहना बताता है (are playing)।',
    hint: 'Action happening right now.\nएक्शन हैपनिंग राइट नाउ।\nरहा है/रहे हैं वाला tense.'
  },
  {
    id: 'add2-c4-4',
    classLevel: '4',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Easy',
    questionText: 'Find the adverb in the sentence:\nThe turtle walked slowly.\nद टर्टल वॉक्ड स्लोली।\nकछुआ धीरे-धीरे चला।',
    options: ['slowly', 'turtle', 'walked', 'the'],
    correctAnswer: 'slowly',
    explanation: '"slowly" describes how the turtle walked, making it an adverb of manner.\n"स्लोली" डिस्क्राइब्स हाउ द टर्टल वॉक्ड, मेकिंग इट एन एडवर्ब ऑफ मैनर।\n"slowly" चलने की विशेषता बता रहा है, अतः यह Adverb है।',
    hint: 'Word ending in -ly that tells how it walked.\nवर्ड एंडिंग इन -ly दैट टेल्स हाउ इट वॉक्ड।\nचलने का तरीका बताने वाला शब्द।'
  },
  {
    id: 'add2-c4-5',
    classLevel: '4',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Easy',
    questionText: 'Choose the correct preposition:\nPut the books ___ your bag.\nपुट द बुक्स ___ योर बैग।\nकिताबों को अपने बैग में रखो।',
    options: ['inside', 'under', 'across', 'over'],
    correctAnswer: 'inside',
    explanation: 'To place something within an enclosed container/bag, we use "inside" or "into".\nटू प्लेस समथिंग विदइन एन एनक्लोज्ड कंटेनर/बैग, वी यूज "इनसाइड"।\nबैग के भीतर रखने के लिए inside का प्रयोग होता है।',
    hint: 'Inside the bag.\nइनसाइड द बैग।\nअंदर की स्थिति के लिए।'
  },
  {
    id: 'add2-c4-6',
    classLevel: '4',
    topic: 'Active & Passive Voice',
    difficulty: 'Easy',
    questionText: 'Identify the Passive Voice sentence:\nRahul ate an apple. vs An apple was eaten by Rahul.\nराहुल एट एन एप्पल। वर्सेज एन एप्पल वाज ईटन बाय राहुल।\nराहुल ने सेब खाया या राहुल द्वारा सेब खाया गया।',
    options: ['An apple was eaten by Rahul.', 'Rahul ate an apple.', 'Rahul is eating an apple.', 'An apple eats Rahul.'],
    correctAnswer: 'An apple was eaten by Rahul.',
    explanation: 'In Passive Voice, object (An apple) comes first and verb is "was eaten by".\nइन पैसिव वॉइस, ऑब्जेक्ट (एन एप्पल) कम्स फर्स्ट एंड वर्ब इज "वाज ईटन बाय"।\nकर्म (Apple) को प्रधानता देने वाला वाक्य Passive Voice है।',
    hint: 'Look for "was eaten by".\nलुक्स फॉर "वाज ईटन बाय"।\nby वाला वाक्य पैसिव होता है।'
  },
  {
    id: 'add2-c4-7',
    classLevel: '4',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Easy',
    questionText: 'Choose the sentence with correct punctuation:\nwhere do you live\nवेयर डू यू लिव\nतुम कहाँ रहते हो?',
    options: ['Where do you live?', 'where do you live.', 'Where do you live!', 'where do you live?'],
    correctAnswer: 'Where do you live?',
    explanation: 'Questions must start with a Capital letter and end with a Question Mark (?)\nक्वेश्चंस मस्ट स्टार्ट विद ए कैपिटल लेटर एंड एंड विद ए क्वेश्चन मार्क (?)\nप्रश्नवाचक वाक्य की शुरुआत Capital letter से और अंत Question Mark (?) से होता है।',
    hint: 'Question starts with capital W and ends with ?\nक्वेश्चन स्टार्ट्स विद कैपिटल W एंड एंड्स विद ?।\nप्रश्नवाचक चिह्न देखें।'
  },
  {
    id: 'add2-c4-8',
    classLevel: '4',
    topic: 'Articles (A, An, The)',
    difficulty: 'Easy',
    questionText: 'Fill in the blank:\nHonesty is ___ best policy.\nऑनेस्टी इज ___ बेस्ट पॉलिसी।\nईमानदारी सबसे अच्छी नीति है।',
    options: ['the', 'a', 'an', 'no article'],
    correctAnswer: 'the',
    explanation: 'Superlative degree "best" always takes the article "the".\nसुपरलेटिव डिग्री "बेस्ट" ऑलवेज टेक द आर्टिकल "द"।\nSuperlative degree (best) के पहले सदैव "the" का प्रयोग होता है।',
    hint: 'Superlative word "best" uses which article?\nसुपरलेटिव वर्ड "बेस्ट" यूज व्हिच आर्टिकल?\nBest के पहले The लगाएं।'
  },
  {
    id: 'add2-c4-9',
    classLevel: '4',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Easy',
    questionText: 'Change to indirect speech:\nRia said, "I am happy."\nरिया सैड, "आई एम हैप्पी।"\nरिया ने कहा, "मैं खुश हूं।"',
    options: ['Ria said that she was happy.', 'Ria said that I am happy.', 'Ria told that she is happy.', 'Ria said she happy.'],
    correctAnswer: 'Ria said that she was happy.',
    explanation: '"I" changes to "she" and "am" changes to "was" in past indirect reporting.\n"आई" चेंजेज टू "शी" एंड "एम" चेंजेज टू "वाज" इन पास्ट इनडायरेक्ट रिपोर्टिंग।\nI बदलकर she और am बदलकर was हो जाएगा।',
    hint: 'Present "am" changes to past "was".\nप्रेजेंट "एम" चेंजेज टू पास्ट "वाज"।\nam को was में बदलें।'
  },
  {
    id: 'add2-c4-10',
    classLevel: '4',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Easy',
    questionText: 'Fill in the modal verb for permission:\n___ I come in, Teacher?\n___ आई कम इन, टीचर?\nक्या मैं अंदर आ सकता हूं, टीचर?',
    options: ['May', 'Must', 'Should', 'Would'],
    correctAnswer: 'May',
    explanation: 'Formal polite permission for entering class uses "May".\nफॉर्मल पोलाइट परमिशन फॉर एंटरिंग क्लास यूजेज "मे"।\nकक्षा में विनम्र अनुमति मांगने के लिए "May" का प्रयोग होता है।',
    hint: 'Standard classroom permission modal.\nस्टैंडर्ड क्लासरूम परमिशन मॉडल।\nअनुमति मांगने वाला शब्द May.'
  },
  {
    id: 'add2-c5-1',
    classLevel: '5',
    topic: 'Nouns & Pronouns',
    difficulty: 'Easy',
    questionText: 'Find the Abstract Noun:\nHis courage saved the drowning boy.\nहिज करेज सेव्ड द ड्राउनिंग बॉय।\nउसके साहस ने डूबते हुए लड़के को बचा लिया।',
    options: ['courage', 'boy', 'saved', 'his'],
    correctAnswer: 'courage',
    explanation: 'Abstract Noun refers to quality/feeling (courage) that cannot be touched physically.\nएब्स्ट्रेक्ट नाउन रिफर्स टू क्वालिटी/फीलिंग (करेज) दैट कैननॉट बी टच्ड फिजिकली।\n"courage" (साहस) एक भाव/गुण है जिसे केवल महसूस किया जा सकता है।',
    hint: 'Quality or feeling noun.\nक्वालिटी ओर फीलिंग नाउन।\nसाहस वाला शब्द चुनें।'
  },
  {
    id: 'add2-c5-2',
    classLevel: '5',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Easy',
    questionText: 'Choose the correct option:\nEither Amit or his brothers ___ attending the function.\nआइदर अमित ओर हिज ब्रदर्स ___ अटेंडिंग द फंक्शन।\nया तो अमित या उसके भाई समारोह में शामिल हो रहे हैं।',
    options: ['are', 'is', 'was', 'has'],
    correctAnswer: 'are',
    explanation: 'When subjects are joined by "Either... or", verb agrees with the nearest subject ("his brothers" - plural -> are).\nव्हेन सब्जेक्ट्स आर जॉइन्ड बाय "आइदर... ओर", वर्ब एग्रीज विद द नीयरेस्ट सब्जेक्ट ("हिज ब्रदर्स" -> आर)।\n"Either...or" में क्रिया पास वाले कर्ता (his brothers - बहुवचन) के अनुसार "are" होगी।',
    hint: 'Verb agrees with "his brothers".\nवर्ब एग्रीज विद "हिज ब्रदर्स"।\nBrothers बहुवचन है।'
  },
  {
    id: 'add2-c5-3',
    classLevel: '5',
    topic: 'Verbs & Tenses',
    difficulty: 'Easy',
    questionText: 'Identify the Past Perfect Tense sentence:\nThe train had left before we arrived.\nद ट्रेन हैड लेफ्ट बिफोर वी अराइव्ड।\nहमारे पहुँचने से पहले ट्रेन छूट चुकी थी।',
    options: ['The train had left before we arrived.', 'The train left when we arrived.', 'The train has left.', 'The train will leave soon.'],
    correctAnswer: 'The train had left before we arrived.',
    explanation: 'Past Perfect formula: Subject + had + 3rd form of verb (had left).\nपास्ट परफेक्ट फार्मूला: सब्जेक्ट + हैड + 3rd फॉर्म ऑफ वर्ब।\nhad + 3rd form (had left) Past Perfect Tense दर्शाता है।',
    hint: 'Look for "had left".\nलुक्स फॉर "हैड लेफ्ट"।\nhad + 3rd form वाला विकल्प चुनें।'
  },
  {
    id: 'add2-c5-4',
    classLevel: '5',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Easy',
    questionText: 'Select the comparative degree of "bad":\nHis writing is ___ than mine.\nहिज राइटिंग इज ___ देन माइन।\nउसकी लिखाई मेरी लिखाई से ज्यादा बुरी है।',
    options: ['worse', 'badder', 'worst', 'more bad'],
    correctAnswer: 'worse',
    explanation: 'Degrees of bad: Bad (Positive) -> Worse (Comparative) -> Worst (Superlative).\nडिग्रीज ऑफ बैड: बैड -> वर्स -> वर्स्ट।\nBad की Comparative degree "worse" होती है।',
    hint: 'Comparative form of bad.\nकंपरेटिव फॉर्म ऑफ बैड।\nBad की 2nd degree "worse" है।'
  },
  {
    id: 'add2-c5-5',
    classLevel: '5',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Easy',
    questionText: 'Fill in the correct preposition:\nDivide these candies ___ the two children.\nडिवाइड दीज कैंडीज ___ द टू चिल्ड्रन।\nइन टॉफियों को दो बच्चों के बीच बाँट दो।',
    options: ['between', 'among', 'in', 'with'],
    correctAnswer: 'between',
    explanation: '"between" is used for distribution between exactly two people/things.\n"बिटवीन" इज यूज्ड फॉर डिस्ट्रीब्यूशन बिटवीन एग्जैक्टली टू पीपल/थिंग्स।\nदो व्यक्तियों/चीज़ों के बीच के लिए "between" आता है।',
    hint: 'Used for strictly TWO persons.\nयूज्ड फॉर स्ट्रिक्टली टू पर्सन्स।\nदो के लिए Between आता है।'
  },
  {
    id: 'add2-c5-6',
    classLevel: '5',
    topic: 'Active & Passive Voice',
    difficulty: 'Easy',
    questionText: 'Change to Passive Voice:\nShe wrote a beautiful poem.\nशी रोते ए ब्यूटीफुल पोयम।\nउसने एक सुंदर कविता लिखी।',
    options: ['A beautiful poem was written by her.', 'A beautiful poem is written by her.', 'A beautiful poem was wrote by her.', 'She was written a poem.'],
    correctAnswer: 'A beautiful poem was written by her.',
    explanation: 'Past Simple passive: Object + was/were + 3rd form (was written) + by + Subject.\nपास्ट सिंपल पैसिव: ऑब्जेक्ट + वाज/वर + 3rd फॉर्म + बाय + सब्जेक्ट।\nPast Tense में was written by का प्रयोग होगा।',
    hint: '3rd form of write is "written" with "was".\n3rd फॉर्म ऑफ राइट इज "रिटन" विद "वाज"।\nwas written by her.'
  },
  {
    id: 'add2-c5-7',
    classLevel: '5',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Easy',
    questionText: 'Convert to Indirect Speech:\nThe teacher said, "The earth revolves around the sun."\nद टीचर सैड, "द अर्थ रिवॉल्व्स अराउंड द सन।"\nशिक्षक ने कहा, "पृथ्वी सूर्य के चारों ओर घूमती है।"',
    options: [
      'The teacher said that the earth revolves around the sun.',
      'The teacher said that the earth revolved around the sun.',
      'The teacher told that earth will revolve around sun.',
      'The teacher asked if earth revolves around sun.'
    ],
    correctAnswer: 'The teacher said that the earth revolves around the sun.',
    explanation: 'Universal truths (earth revolves around sun) DO NOT change their tense in indirect speech.\nयूनिवर्सल ट्रुथ्स डू नॉट चेंज देयर टेंस इन इनडायरेक्ट स्पीच।\nसदा सत्य रहने वाली बातों (Universal Truth) का Tense नहीं बदलता।',
    hint: 'Universal truth tense remains unchanged.\nयूनिवर्सल ट्रुथ टेंस रिमेन्स अनचेंज्ड।\nRevolves वैसा ही रहेगा।'
  },
  {
    id: 'add2-c5-8',
    classLevel: '5',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Easy',
    questionText: 'Fill in the blank for strong obligation:\nStudents ___ obey the school rules.\nस्टूडेंट्स ___ ओबे द स्कूल रूल्स।\nछात्रों को स्कूल के नियमों का पालन अवश्य करना चाहिए।',
    options: ['must', 'may', 'could', 'might'],
    correctAnswer: 'must',
    explanation: '"must" indicates compulsion, strong duty, and strict necessity.\n"मस्ट" इंडिकेट्स कंपल्शन, स्ट्रॉन्ग ड्यूटी, एंड स्ट्रिक्ट नेसेसिटी।\nअनिवार्य नियम या कर्तव्य के लिए "must" का प्रयोग होता है।',
    hint: 'Compulsory rule modal.\nकंपल्सरी रूल मॉडल।\nजरूरी नियम के लिए Must.'
  },
  {
    id: 'add2-c5-9',
    classLevel: '5',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Easy',
    questionText: 'Identify the error in sentence:\nHe don\'t know the answer.\nही डोंट नो द आंसर।\nवह उत्तर नहीं जानता है।',
    options: ['Change don\'t to doesn\'t', 'Change know to knew', 'Change answer to question', 'No error'],
    correctAnswer: 'Change don\'t to doesn\'t',
    explanation: 'He is singular third-person, so it takes "doesn\'t", not "don\'t".\nही इज सिंगुलर थर्ड-पर्सन, सो इट टेक "डजंट", नॉट "डोंट"।\nHe (एकवचन) के साथ doesn\'t का प्रयोग होता है।',
    hint: 'He uses doesn\'t (not don\'t).\nही यूजेज डजंट (नॉट डोंट)।\nHe के साथ doesn\'t आएग।'
  },
  {
    id: 'add2-c5-10',
    classLevel: '5',
    topic: 'Editing & Omission',
    difficulty: 'Easy',
    questionText: 'Find the missing word:\nShe is fond ___ classical music.\nशी इज फॉन्ड ___ क्लासिकल म्यूजिक।\nवह शास्त्रीय संगीत की शौकीन है।',
    options: ['of', 'off', 'with', 'for'],
    correctAnswer: 'of',
    explanation: 'The adjective "fond" is strictly followed by preposition "of" (fond of).\nद एडजेक्टिव "फॉन्ड" इज स्ट्रिक्टली फॉलोड बाय प्रीपोजिशन "ऑफ"।\nFond के साथ हमेशा preposition "of" (fond of) आता है।',
    hint: 'Fixed preposition phrase: fond of.\nफिक्स्ड प्रीपोजिशन फ्रेज: फॉन्ड ऑफ।\nFond के बाद of लगाएं।'
  },
  {
    id: 'add2-c6-1',
    classLevel: '6',
    topic: 'Nouns & Pronouns',
    difficulty: 'Medium',
    questionText: 'Choose the reflexive pronoun:\nHe solved the entire paper ___.\nही सॉल्व्ड द एंटायर पेपर ___।\nउसने पूरा पेपर खुद हल किया।',
    options: ['himself', 'him', 'his', 'he'],
    correctAnswer: 'himself',
    explanation: 'Reflexive pronoun for subject "He" is "himself".\nरिफ्लेक्सिव प्रोनाउन फॉर सब्जेक्ट "ही" इज "हिमसेल्फ"।\nHe के लिए निजवाचक सर्वनाम (Reflexive Pronoun) "himself" है।',
    hint: 'Self form of He.\nसेल्फ फॉर्म ऑफ ही।\nSelf वाला रूप चुनें।'
  },
  {
    id: 'add2-c6-2',
    classLevel: '6',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    questionText: 'Choose the correct Future Continuous Tense:\nThis time tomorrow, we ___ on a beach in Goa.\nदिस टाइम टुमारो, वी ___ ऑन ए बीच इन गोवा।\nकल इस समय, हम गोवा के समुद्र तट पर आराम कर रहे होंगे।',
    options: ['will be relaxing', 'will relax', 'are relaxing', 'relaxed'],
    correctAnswer: 'will be relaxing',
    explanation: 'Future Continuous formula: Subject + will be + verb-ing (will be relaxing).\nफ्यूचर कंटीन्यूअस फार्मूला: सब्जेक्ट + विल बी + वर्ब-ing।\nभविष्य में जारी क्रिया के लिए will be + ing रूप का प्रयोग होता है।',
    hint: 'Look for "will be -ing".\nलुक्स फॉर "विल बी -ing"।\nwill be relaxing.'
  },
  {
    id: 'add2-c6-3',
    classLevel: '6',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Medium',
    questionText: 'Fill in the correct conjunction:\nHe worked hard ___ he failed in the test.\nही वर्कड हार्ड ___ ही फेल्ड इन द टेस्ट।\nउसने कठिन परिश्रम किया फिर भी वह परीक्षा में असफल हो गया।',
    options: ['yet', 'because', 'so', 'and'],
    correctAnswer: 'yet',
    explanation: '"yet" expresses contrast between hard work and failure.\n"येट" एक्सप्रेसिज कंट्रास्ट बिटवीन हार्ड वर्क एंड फेलियर।\nविरोधाभास दर्शाने के लिए "yet" (फिर भी/तथापि) का प्रयोग होता है।',
    hint: 'Conjunction showing unexpected contrast.\nकंजंक्शन शोइंग अनएक्सपेक्टेड कंट्रास्ट।\nफिर भी का अर्थ।'
  },
  {
    id: 'add2-c6-4',
    classLevel: '6',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Medium',
    questionText: 'Select the grammatically correct sentence:\nNeither of the two candidates is suitable.\nनीदर ऑफ द टू कैंडिडेट्स इज सूटेबल।\nदोनों में से कोई भी उम्मीदवार उपयुक्त नहीं है।',
    options: [
      'Neither of the two candidates is suitable.',
      'Neither of the two candidates are suitable.',
      'Neither of candidate were suitable.',
      'Neither candidate have been suitable.'
    ],
    correctAnswer: 'Neither of the two candidates is suitable.',
    explanation: '"Neither of + Plural Noun" takes a SINGULAR verb (is).\n"नीदर ऑफ" टेक ए सिंगुलर वर्ब (इज)।\n"Neither of" के बाद Noun बहुवचन होता है परंतु क्रिया एकवचन (is) आती है।',
    hint: '"Neither of" uses singular verb "is".\n"नीदर ऑफ" यूजेज सिंगुलर वर्ब "इज"।\nNeither of के बाद is आएगा।'
  },
  {
    id: 'add2-c6-5',
    classLevel: '6',
    topic: 'Active & Passive Voice',
    difficulty: 'Medium',
    questionText: 'Change into Passive Voice:\nWho broke this glass vase?\nहू ब्रोक दिस ग्लास वाज?\nयह कांच का फूलदान किसने तोड़ा?',
    options: [
      'By whom was this glass vase broken?',
      'Who was this glass vase broken by?',
      'By whom this glass vase was broken?',
      'Whom broke this glass vase?'
    ],
    correctAnswer: 'By whom was this glass vase broken?',
    explanation: 'Interrogative passive starting with "Who" becomes "By whom + aux verb + object + 3rd form".\nइंटरोगेटिव पैसिव स्टार्टिंग विद "हू" बिकम्स "बाय व्हूम"।\nWho से शुरू होने वाले प्रश्न का Passive "By whom" से बनता है।',
    hint: 'Passive of Who starts with "By whom".\nपैसिव ऑफ हू स्टार्ट्स विद "बाय व्हूम"।\nBy whom वाला वाक्य चुनें।'
  },
  {
    id: 'add2-c6-6',
    classLevel: '6',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Medium',
    questionText: 'Convert to Indirect Speech:\nFather said to son, "Work hard for your exams."\nफादर सैड टू सन, "वर्क हार्ड फॉर योर एग्जाम्स।"\nपिता ने बेटे से कहा, "अपनी परीक्षाओं के लिए मेहनत करो।"',
    options: [
      'Father advised his son to work hard for his exams.',
      'Father told his son that work hard for exams.',
      'Father ordered son that he must work hard.',
      'Father asked son if he worked hard.'
    ],
    correctAnswer: 'Father advised his son to work hard for his exams.',
    explanation: 'Imperative sentence with advice uses reporting verb "advised + object + to + verb".\nइम्परेटिव सेंटेंस विद एडवाइस यूजेज "एडवाइज्ड + टू + वर्ब"।\nसलाह वाले वाक्यों में "advised" और "to + verb" का प्रयोग होता है।',
    hint: 'Advice sentence uses "advised... to work".\nएडवाइस सेंटेंस यूजेज "एडवाइज्ड... टू वर्क"।\nAdvised + to work hard.'
  },
  {
    id: 'add2-c6-7',
    classLevel: '6',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Medium',
    questionText: 'Identify the degree of comparison:\nNo other metal is as heavy as lead.\nनो अदर मेटल इज एज हैवी एज लेड।\nकोई भी अन्य धातु सीसे जितनी भारी नहीं है।',
    options: ['Positive Degree', 'Comparative Degree', 'Superlative Degree', 'None'],
    correctAnswer: 'Positive Degree',
    explanation: 'Structure "as + adjective + as" (as heavy as) is Positive Degree.\nस्ट्रक्चर "एज + एडजेक्टिव + एज" इज पॉजिटिव डिग्री।\n"as...as" वाली बनावट Positive Degree होती है।',
    hint: 'Structure with "as...as".\nस्ट्रक्चर विद "एज...एज"।\nPositive degree.'
  },
  {
    id: 'add2-c6-8',
    classLevel: '6',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Medium',
    questionText: 'Fill in the modal for past ability:\nWhen I was five years old, I ___ swim easily.\nव्हेन आई वाज फाइव इयर्स ओल्ड, आई ___ स्विम ईज़िली।\nजब मैं पाँच साल का था, तब मैं आसानी से तैर सकता था।',
    options: ['could', 'can', 'should', 'might'],
    correctAnswer: 'could',
    explanation: 'Past ability or past capability is expressed using modal "could".\nपास्ट एबिलिटी ओर पास्ट कैपेबिलिटी इज एक्सप्रेसड यूजिंग मॉडल "कुड"।\nभूतकाल की योग्यता/क्षमता (Past ability) बताने के लिए "could" का प्रयोग होता है।',
    hint: 'Past form of "can".\nपास्ट फॉर्म ऑफ "कैन"।\nCan का Past रूप Could है।'
  },
  {
    id: 'add2-c6-9',
    classLevel: '6',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Medium',
    questionText: 'Correct the order of words:\nalways / truth / speaks / the / Rohan\nऑलवेज / ट्रुथ / स्पीक्स / द / रोहन\nरोहन हमेशा सच बोलता है।',
    options: [
      'Rohan always speaks the truth.',
      'Rohan speaks always the truth.',
      'The truth Rohan always speaks.',
      'Speaks the truth Rohan always.'
    ],
    correctAnswer: 'Rohan always speaks the truth.',
    explanation: 'Standard word order: Subject (Rohan) + Adverb of frequency (always) + Verb (speaks) + Object (the truth).\nसब्जेक्ट + एडवर्ब + वर्ब + ऑब्जेक्ट।\nसही वाक्य रचना: Rohan always speaks the truth.',
    hint: 'Proper English S-V-O order.\nप्रॉपर इंग्लिश S-V-O ऑर्डर।\nSubject + frequency adverb + verb.'
  },
  {
    id: 'add2-c6-10',
    classLevel: '6',
    topic: 'Editing & Omission',
    difficulty: 'Medium',
    questionText: 'Find the incorrect preposition in sentence:\nHe has been suffering with fever since Monday.\nही हैज बीन सफरिंग विद फीवर सिंस मंडे।\nवह सोमवार से बुखार से पीड़ित है।',
    options: ['Change "with" to "from"', 'Change "since" to "for"', 'Change "has" to "have"', 'No error'],
    correctAnswer: 'Change "with" to "from"',
    explanation: 'We say "suffering FROM fever", not "suffering with fever".\nवी से "सफरिंग फ्रॉम फीवर"।\nSuffering के साथ सदैव "from" preposition आता है।',
    hint: 'Fixed phrase: suffering FROM disease.\nफिक्स्ड फ्रेज: सफरिंग फ्रॉम डिजीज।\nWith की जगह from करें।'
  },
  {
    id: 'add2-c7-1',
    classLevel: '7',
    topic: 'Nouns & Pronouns',
    difficulty: 'Medium',
    questionText: 'Identify the Relative Pronoun:\nThe boy who won the race is my cousin.\nद बॉय हू वोन द रेस इज माय कज़िन।\nजिस लड़के ने दौड़ जीती, वह मेरा चचेरा भाई है।',
    options: ['who', 'boy', 'my', 'the'],
    correctAnswer: 'who',
    explanation: '"who" connects the relative clause "who won the race" to the noun "boy".\n"हू" कनेक्ट्स द रिलेटिव क्लॉज टू द नाउन।\n"who" यहाँ संज्ञा (boy) से संबंध बताने वाला संबंधवाचक सर्वनाम (Relative Pronoun) है।',
    hint: 'Pronoun joining relative clause.\nप्रोनाउन जॉइनिंग रिलेटिव क्लॉज।\nसम्बन्ध जोड़ने वाला सर्वनाम Who.'
  },
  {
    id: 'add2-c7-2',
    classLevel: '7',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    questionText: 'Identify the tense:\nBy 10 PM tonight, I will have finished my homework.\nबाय 10 PM टोनाइट, आई विल हैव फिनिश्ड माय होमवर्क।\nआज रात 10 बजे तक, मैं अपना गृहकार्य पूरा कर चुका हूँगा।',
    options: ['Future Perfect Tense', 'Future Continuous Tense', 'Present Perfect Tense', 'Past Perfect Tense'],
    correctAnswer: 'Future Perfect Tense',
    explanation: 'Structure "will have + 3rd form" (will have finished) is Future Perfect Tense.\nस्ट्रक्चर "विल हैव + 3rd फॉर्म" इज फ्यूचर परफेक्ट टेंस।\nwill have + 3rd form Future Perfect Tense दर्शाता है।',
    hint: 'will have + 3rd form.\nविल हैव + 3rd फॉर्म।\nFuture Perfect tense.'
  },
  {
    id: 'add2-c7-3',
    classLevel: '7',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Medium',
    questionText: 'Fill in the blank:\nBread and butter ___ his favorite breakfast.\nब्रेड एंड बटर ___ हिज फेवरेट ब्रेकफास्ट।\nब्रेड और मक्खन उसका पसंदीदा नाश्ता है।',
    options: ['is', 'are', 'were', 'have'],
    correctAnswer: 'is',
    explanation: 'When two nouns express a single combined idea/dish (Bread and butter), singular verb "is" is used.\nव्हेन टू नावन्स एक्सप्रेस ए सिंगल कंबाइंड आईडिया, सिंगुलर वर्ब इज यूज्ड।\nजब दो शब्द मिलकर एक ही नाश्ता/विचार व्यक्त करें तो क्रिया एकवचन (is) आती है।',
    hint: 'Single unit meal uses singular verb.\nसिंगल यूनिट मील यूजेज सिंगुलर वर्ब।\nब्रेड-मक्खन एक भोजन है।'
  },
  {
    id: 'add2-c7-4',
    classLevel: '7',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Medium',
    questionText: 'Fill in the correct preposition:\nShe excels ___ playing the piano.\nशी एक्सेल्स ___ प्लेइंग द पियानो।\nवह पियानो बजाने में उत्कृष्ट है।',
    options: ['in', 'at', 'on', 'with'],
    correctAnswer: 'in',
    explanation: 'The verb "excel" takes preposition "in" (excel in something).\nद वर्ब "एक्सेल" टेक प्रीपोजिशन "इन"।\nExcel के साथ Preposition "in" (excel in) आता है।',
    hint: 'Fixed preposition with excel: excel in.\nफिक्स्ड प्रीपोजिशन विद एक्सेल: एक्सेल इन।\nExcel in something.'
  },
  {
    id: 'add2-c7-5',
    classLevel: '7',
    topic: 'Active & Passive Voice',
    difficulty: 'Medium',
    questionText: 'Convert to Passive Voice:\nThey are constructing a new bridge over the river.\nदे आर कंस्ट्रक्टिंग ए न्यू ब्रिज ओवर द रिवर।\nवे नदी पर एक नया पुल बना रहे हैं।',
    options: [
      'A new bridge is being constructed over the river.',
      'A new bridge was constructed over the river.',
      'A new bridge is constructed by them.',
      'A river is being constructed over the bridge.'
    ],
    correctAnswer: 'A new bridge is being constructed over the river.',
    explanation: 'Present Continuous passive: Object + is/am/are + being + 3rd form (is being constructed).\nप्रेजेंट कंटीन्यूअस पैसिव: ऑब्जेक्ट + इज + बीइंग + 3rd फॉर्म।\nis being + 3rd form का प्रयोग होता है।',
    hint: 'Look for "is being constructed".\nलुक्स फॉर "इज बीइंग कंस्ट्रक्टेड"।\nis being + 3rd form.'
  },
  {
    id: 'add2-c7-6',
    classLevel: '7',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Medium',
    questionText: 'Convert to Indirect Speech:\nShe said, "Alas! I have lost my diamond ring."\nशी सैड, "अलास! आई हैव लॉस्ट माय डायमंड रिंग।"\nउसने कहा, "हाय! मेरी हीरे की अंगूठी खो गई है।"',
    options: [
      'She exclaimed with sorrow that she had lost her diamond ring.',
      'She said with happy that she lost her ring.',
      'She cried that she loses her diamond ring.',
      'She exclaimed that I have lost diamond ring.'
    ],
    correctAnswer: 'She exclaimed with sorrow that she had lost her diamond ring.',
    explanation: 'Exclamatory sentence starting with "Alas!" becomes "exclaimed with sorrow that + Past Perfect".\nअलास! चेंजेज टू एक्स्क्लेम्ड विद सोरो।\n"Alas!" वाले दुखी विस्मयादिबोधक वाक्य में "exclaimed with sorrow" का प्रयोग होता है।',
    hint: 'Alas! turns into "exclaimed with sorrow".\nअलास! टर्न्स इनटू "एक्स्क्लेम्ड विद सोरो"।\nExclaimed with sorrow.'
  },
  {
    id: 'add2-c7-7',
    classLevel: '7',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Medium',
    questionText: 'Fill in the correct modal for moral duty:\nWe ___ respect our elders and teachers.\nवी ___ रिस्पेक्ट आवर एल्डर्स एंड टीचर्स।\nहमें अपने बड़ों और शिक्षकों का आदर करना चाहिए।',
    options: ['ought to', 'may', 'could', 'might'],
    correctAnswer: 'ought to',
    explanation: 'Moral duty or moral obligation is expressed using "ought to" or "should".\nमोरल ड्यूटी इज एक्सप्रेसड यूजिंग "ऑट टू"।\nनैतिक कर्तव्य (Moral duty) के लिए "ought to" का प्रयोग होता है।',
    hint: 'Moral duty modal.\nमोरल ड्यूटी मॉडल।\nनैतिक कर्तव्य के लिए ought to.'
  },
  {
    id: 'add2-c7-8',
    classLevel: '7',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Medium',
    questionText: 'Identify the adverb of frequency:\nHe seldom visits the crowded market.\nही सेल्डम विजिट्स द क्राउडेड मार्केट।\nवह भीड़भाड़ वाले बाजार में शायद ही कभी जाता है।',
    options: ['seldom', 'visits', 'crowded', 'market'],
    correctAnswer: 'seldom',
    explanation: '"seldom" means rarely/almost never, indicating frequency of action.\n"सेल्डम" इंडिकेट्स फ्रीक्वेंसी ऑफ एक्शन।\n"seldom" (कदाचित/शायद ही कभी) क्रिया की आवृत्ति बताता है।',
    hint: 'Word meaning rarely/hardly ever.\nवर्ड मीनिंग रेयरली।\nSeldom मतलब कभी-कभार।'
  },
  {
    id: 'add2-c7-9',
    classLevel: '7',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Medium',
    questionText: 'Find the correct sentence:\nScarcely had he left than it started raining.\nस्केयर्सली हैड ही लेफ्ट देन इट स्टार्टेड रेनिंग।\nवह निकला ही था कि बारिश शुरू हो गई।',
    options: [
      'Scarcely had he left when it started raining.',
      'Scarcely had he left than it started raining.',
      'Scarcely he left when it started raining.',
      'Scarcely did he left then it started raining.'
    ],
    correctAnswer: 'Scarcely had he left when it started raining.',
    explanation: 'Correlative conjunction "Scarcely" is paired with "when" (not "than").\nस्केयर्सली इज पेयर्ड विद व्हेन।\nScarcely के साथ जोड़े में "when" आता है, "than" नहीं।',
    hint: 'Scarcely pairs with WHEN.\nस्केयर्सली पेयर्स विद व्हेन।\nScarcely... when.'
  },
  {
    id: 'add2-c7-10',
    classLevel: '7',
    topic: 'Editing & Omission',
    difficulty: 'Medium',
    questionText: 'Choose the correct word to fill in:\nThe sun rises in the east and ___ in the west.\nद सन राइजेज इन द ईस्ट एंड ___ इन द वेस्ट।\nसूरज पूर्व में उगता है और पश्चिम में डूबता है।',
    options: ['sets', 'setting', 'set', 'is setting'],
    correctAnswer: 'sets',
    explanation: 'Parallel simple present verbs for universal facts: rises... and sets.\nपैरेलल सिंपल प्रेजेंट वर्ब्स: राइजेज... एंड सेट्स।\nरिवर्सल यूनिवर्सल फैक्ट के लिए Parallel simple present "sets" आएगा।',
    hint: 'Parallel verb for rises.\nपैरेलल वर्ब फॉर राइजेज।\nrises... and sets.'
  },
  {
    id: 'add2-c8-1',
    classLevel: '8',
    topic: 'Nouns & Pronouns',
    difficulty: 'Medium',
    questionText: 'Identify the Indefinite Pronoun:\nSomebody left their umbrella in the library.\nसमबडी लेफ्ट देयर अम्ब्रेला इन द लाइब्रेरी।\nकोई अपना छाता पुस्तकालय में छोड़ गया।',
    options: ['Somebody', 'umbrella', 'library', 'left'],
    correctAnswer: 'Somebody',
    explanation: '"Somebody" refers to an unspecified/unknown person, making it an Indefinite Pronoun.\n"समबडी" रिफर्स टू एन अनस्पेसिफाइड पर्सन।\n"Somebody" (कोई/अज्ञात व्यक्ति) अनिश्चयवाचक सर्वनाम है।',
    hint: 'Pronoun for unknown person.\nप्रोनाउन फॉर अननोन पर्सन।\nअनिश्चित सर्वनाम चुनें।'
  },
  {
    id: 'add2-c8-2',
    classLevel: '8',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Medium',
    questionText: 'Choose the correct option:\nThe news ___ true, not fake.\nद न्यूज़ ___ ट्रू, नॉट फेक।\nखबर सच है, फर्जी नहीं।',
    options: ['is', 'are', 'were', 'have'],
    correctAnswer: 'is',
    explanation: 'Uncountable noun "News" is always singular in meaning and takes a singular verb "is".\nअनकाउंटेबल नाउन "न्यूज़" इज ऑलवेज सिंगुलर।\n"News" देखने में plural लगता है पर अर्थ में एकवचन है, अतः "is" आएगा।',
    hint: 'News takes singular verb.\nन्यूज़ टेक सिंगुलर वर्ब।\nNews के साथ is आता है।'
  },
  {
    id: 'add2-c8-3',
    classLevel: '8',
    topic: 'Active & Passive Voice',
    difficulty: 'Medium',
    questionText: 'Convert to Passive Voice:\nPlease open the window.\nप्लीज ओपन द विंडो।\nकृपया खिड़की खोल दीजिए।',
    options: [
      'You are requested to open the window.',
      'Let the window be opened by please.',
      'Window should be opened please.',
      'The window was opened by you.'
    ],
    correctAnswer: 'You are requested to open the window.',
    explanation: 'Imperative sentence with "Please" becomes "You are requested to + original verb".\nइम्परेटिव सेंटेंस विद प्लीज बिकम्स "यू आर रिक्वेस्टेड टू"।\n"Please" वाले प्रार्थना वाक्य का Passive "You are requested to" से बनता है।',
    hint: 'Request sentences start with "You are requested to".\nरिक्वेस्ट सेंटेंसेस स्टार्ट विद "यू आर रिक्वेस्टेड टू"।\nYou are requested to.'
  },
  {
    id: 'add2-c8-4',
    classLevel: '8',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Medium',
    questionText: 'Convert to Indirect Speech:\nTeacher said to students, "Why are you making a noise?"\nटीचर सैड टू स्टूडेंट्स, "व्हाई आर यू मेकिंग ए नॉइज़?"\nशिक्षक ने छात्रों से कहा, "तुम लोग शोर क्यों मचा रहे हो?"',
    options: [
      'Teacher asked the students why they were making a noise.',
      'Teacher asked students that why are you making noise.',
      'Teacher told students why were they making a noise.',
      'Teacher ordered students why they are making noise.'
    ],
    correctAnswer: 'Teacher asked the students why they were making a noise.',
    explanation: 'Wh- question indirect: Reporting verb "asked" + wh-word "why" + assertive order "they were making".\nआस्क्ड + व्हाई + सब्जेक्ट + वर्ब।\nInterrogative Indirect: asked + why + subject (they) + past verb (were making).',
    hint: 'Use "asked... why they were making".\nयूज "आस्क्ड... व्हाई दे वर मेकिंग"।\nAsked + why they were.'
  },
  {
    id: 'add2-c8-5',
    classLevel: '8',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Medium',
    questionText: 'Fill in the correct preposition:\nHe is addicted ___ playing online video games.\nही इज एडिक्टेड ___ प्लेइंग ऑनलाइन वीडियो गेम्स।\nउसे ऑनलाइन वीडियो गेम खेलने की लत लग गई है।',
    options: ['to', 'with', 'for', 'in'],
    correctAnswer: 'to',
    explanation: 'Adjective "addicted" is always followed by preposition "to" (addicted to + gerund/noun).\nएडिक्टेड इज ऑलवेज फॉलोड बाय प्रीपोजिशन "टू"।\nAddicted के साथ सदैव "to" (addicted to) प्रयोग होता है।',
    hint: 'Fixed preposition phrase: addicted to.\nफिक्स्ड प्रीपोजिशन फ्रेज: एडिक्टेड टू।\nAddicted to.'
  },
  {
    id: 'add2-c8-6',
    classLevel: '8',
    topic: 'Verbs & Tenses',
    difficulty: 'Medium',
    questionText: 'Identify the sentence with Past Perfect Continuous Tense:\nHe had been waiting for two hours before the bus arrived.\nही हैड बीन वेटिंग फॉर टू आवर्स बिफोर द बस अराइव्ड।\nबस आने से पहले वह दो घंटे से इंतजार कर रहा था।',
    options: [
      'He had been waiting for two hours before the bus arrived.',
      'He was waiting for two hours before bus arrived.',
      'He has been waiting for two hours.',
      'He had waited for two hours.'
    ],
    correctAnswer: 'He had been waiting for two hours before the bus arrived.',
    explanation: 'Past Perfect Continuous formula: Subject + had been + verb-ing + for/since.\nपास्ट परफेक्ट कंटीन्यूअस फार्मूला: हैड बीन + वर्ब-ing।\nhad been + ing + for/since पास्ट परफेक्ट कंटीन्यूअस है।',
    hint: 'Look for "had been waiting for".\nलुक्स फॉर "हैड बीन वेटिंग फॉर"।\nhad been + ing.'
  },
  {
    id: 'add2-c8-7',
    classLevel: '8',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Medium',
    questionText: 'Choose the correct modal for impossibility in past:\nHe ___ have committed the crime as he was in hospital that day.\nही ___ हैव कमिटेड द क्राइम एज ही वाज इन हॉस्पिटल दैट डे।\nवह अपराध नहीं कर सकता था क्योंकि उस दिन वह अस्पताल में था।',
    options: ['couldn\'t', 'mustn\'t', 'shouldn\'t', 'needn\'t'],
    correctAnswer: 'couldn\'t',
    explanation: 'Impossibility in past is expressed using "couldn\'t have + 3rd form".\nइम्पॉसिबिलिटी इन पास्ट इज एक्सप्रेसड यूजिंग "कुडंट हैव"।\nभूतकाल में किसी कार्य की असंभवता के लिए couldn\'t have का प्रयोग होता है।',
    hint: 'Modal for "could not have done".\nमॉडल फॉर "कुड नॉट हैव डन"।\nCouldn\'t have.'
  },
  {
    id: 'add2-c8-8',
    classLevel: '8',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Medium',
    questionText: 'Identify the adverb in sentence:\nShe spoke very softly at the meeting.\nशी स्पोक वेरी सॉफ्टली एट द मीटिंग।\nउसने बैठक में बहुत प्यार/धीमे से बात की।',
    options: ['very & softly', 'spoke', 'meeting', 'she'],
    correctAnswer: 'very & softly',
    explanation: '"softly" is adverb of manner, and "very" is adverb of degree modifying softly.\n"सॉफ्टली" एंड "वेरी" बोथ आर एडवर्ब्स।\nसॉफ्टली (Adverb) की तीव्रता बहुत (very) बता रहा है, अतः दोनों Adverb हैं।',
    hint: 'Find both modifying words.\nफाइंड बोथ मॉडिफाइंग वर्ड्स।\nVery and softly.'
  },
  {
    id: 'add2-c8-9',
    classLevel: '8',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Medium',
    questionText: 'Correct the error in sentence:\nOne of my friend is going to USA.\nवन ऑफ माय फ्रेंड इज गोइंग टू यूएसए।\nमेरे दोस्तों में से एक यूएसए जा रहा है।',
    options: [
      'Change friend to friends (One of my friends is)',
      'Change is to are',
      'Change going to went',
      'No error'
    ],
    correctAnswer: 'Change friend to friends (One of my friends is)',
    explanation: 'Formula: "One of + Plural Noun + Singular Verb" -> One of my FRIENDS is.\nवन ऑफ के बाद नाउन बहुवचन (friends) आता है।\n"One of my" के बाद Noun बहुवचन (friends) होना चाहिए।',
    hint: 'One of my + PLURAL noun.\nवन ऑफ माय + प्लुरल नाउन।\nFriends plural होना चाहिए।'
  },
  {
    id: 'add2-c8-10',
    classLevel: '8',
    topic: 'Editing & Omission',
    difficulty: 'Medium',
    questionText: 'Find the missing connector:\nWork hard ___ you will fail.\nवर्क हार्ड ___ यू विल फेल।\nकठिन परिश्रम करो अन्यथा तुम असफल हो जाओगे।',
    options: ['otherwise / or', 'and', 'because', 'so'],
    correctAnswer: 'otherwise / or',
    explanation: 'Adversative connector indicating warning/alternative condition: otherwise or "or".\nअदरवाइज/ओर इंडिकेट्स वार्निंग कंडीशन।\nचेतावनी/विकल्प दर्शाने के लिए "otherwise" या "or" आता है।',
    hint: 'Word meaning "अन्यथा".\nवर्ड मीनिंग "अन्यथा"।\nOtherwise.'
  },
  {
    id: 'add2-c9-1',
    classLevel: '9',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Hard',
    questionText: 'Choose the correct verb form:\nNeither the teacher nor the students ___ present in the hall.\nनीदर द टीचर नॉर द स्टूडेंट्स ___ प्रेजेंट इन द हॉल।\nन तो शिक्षक और न ही छात्र हॉल में मौजूद थे।',
    options: ['were', 'was', 'is', 'has been'],
    correctAnswer: 'were',
    explanation: 'In "Neither... nor", verb agrees with nearest subject ("the students" - plural -> were).\nनीदर... नॉर में वर्ब पास वाले सब्जेक्ट (students) के अनुसार Plural (were) होगी।\nपास का कर्ता students (बहुवचन) होने से were आएगा।',
    hint: 'Verb agrees with plural "students".\nवर्ब एग्रीज विद प्लुरल "स्टूडेंट्स"।\nStudents बहुवचन है।'
  },
  {
    id: 'add2-c9-2',
    classLevel: '9',
    topic: 'Active & Passive Voice',
    difficulty: 'Hard',
    questionText: 'Convert to Passive Voice:\nOne should keep one\'s promises.\nवन शुड कीप वंस प्रॉमिसेज।\nव्यक्ति को अपने वादे पूरे करने चाहिए।',
    options: [
      'Promises should be kept.',
      'One\'s promises should be kept by one.',
      'Promises must keep by one.',
      'One should be kept promises.'
    ],
    correctAnswer: 'Promises should be kept.',
    explanation: 'Indefinite subject "one/someone" is omitted in standard passive: Promises should be kept.\nइंडेफिनेट सब्जेक्ट वन इज ओमिटेड इन स्टैंडर्ड पैसिव।\nअनिश्चित कर्ता "one" को Passive में हटा दिया जाता है।',
    hint: 'Omit "one" in passive.\nओमिट "वन" इन पैसिव।\nPromises should be kept.'
  },
  {
    id: 'add2-c9-3',
    classLevel: '9',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Hard',
    questionText: 'Convert to Indirect Speech:\n"Don\'t touch this wire," the electrician warned us.\n"डोंट टच दिस वायर," द इलेक्ट्रिशियन वॉर्न्ड अस।\n"इस तार को मत छुओ," बिजली मिस्त्री ने हमें चेतावनी दी।',
    options: [
      'The electrician warned us not to touch that wire.',
      'The electrician warned us that don\'t touch this wire.',
      'The electrician told us to not touch wire.',
      'The electrician warned us that we should not touch wire.'
    ],
    correctAnswer: 'The electrician warned us not to touch that wire.',
    explanation: 'Negative imperative indirect: warned + us + NOT TO + verb + that (this changes to that).\nवार्न्ड अस नॉट टू टच दैट वायर।\nNegative imperative का Indirect "not to + verb" और this का that बनता है。',
    hint: 'Use "warned us not to touch that wire".\nयूज "वार्न्ड अस नॉट टू टच दैट वायर"।\nnot to touch that.'
  },
  {
    id: 'add2-c9-4',
    classLevel: '9',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    questionText: 'Fill in the correct conditional tense:\nIf I had known your address, I ___ visited you.\nइफ आई हैड नोन योर एड्रेस, आई ___ विजिटेड यू।\nयदि मुझे आपका पता मालूम होता, तो मैं आपसे मिलने आता।',
    options: ['would have', 'will have', 'would', 'could'],
    correctAnswer: 'would have',
    explanation: '3rd Conditional structure: If + Past Perfect (had known) ... would have + 3rd form (would have visited).\n3rd कंडीशनल: इफ + हैड + 3rd फॉर्म... वुड हैव + 3rd फॉर्म।\nIf + Past Perfect के मुख्य उपवाक्य में "would have + 3rd form" आता है।',
    hint: 'If + had known pairs with "would have".\nइफ + हैड नोन पेयर्स विद "वुड हैव"।\nwould have visited.'
  },
  {
    id: 'add2-c9-5',
    classLevel: '9',
    topic: 'Editing & Omission',
    difficulty: 'Hard',
    questionText: 'Identify the error in sentence:\nEach of the girls have performed brilliantly.\nईच ऑफ द गर्ल्स हैव परफॉर्म्ड ब्रिलियंटली।\nलड़कियों में से प्रत्येक ने शानदार प्रदर्शन किया है।',
    options: [
      'Change "have" to "has"',
      'Change "girls" to "girl"',
      'Change "performed" to "perform"',
      'No error'
    ],
    correctAnswer: 'Change "have" to "has"',
    explanation: '"Each of + Plural Noun" takes a SINGULAR verb (has).\nईच ऑफ के बाद वर्ब सिंगुलर (has) होती है।\n"Each of" के बाद Noun plural पर verb एकवचन (has) होती है।',
    hint: 'Each of uses singular verb "has".\nईच ऑफ यूजेज सिंगुलर वर्ब "हैज"।\nhas performed.'
  },
  {
    id: 'add2-c9-6',
    classLevel: '9',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Hard',
    questionText: 'Choose the correct inversion sentence:\nNo sooner did the bell ring ___ the students ran out.\nनो सूनर डिड द बेल रिंग ___ द स्टूडेंट्स रैन आउट।\nघंटी बजी ही नहीं कि छात्र बाहर भाग खड़े हुए।',
    options: ['than', 'when', 'then', 'before'],
    correctAnswer: 'than',
    explanation: 'Correlative conjunction "No sooner" MUST be paired with "than" (No sooner... than).\nनो सूनर इज ऑलवेज पेयर्ड विद देन।\n"No sooner" के साथ जोड़े में हमेशा "than" आता है।',
    hint: 'No sooner pairs with THAN.\nनो सूनर पेयर्स विद देन।\nNo sooner... than.'
  },
  {
    id: 'add2-c9-7',
    classLevel: '9',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Hard',
    questionText: 'Fill in the correct modal:\nYou ___ not worry about the arrangements; everything is taken care of.\nयू ___ नॉट वरी अबाउट द अरेंजमेंट्स; एवरीथिंग इज टेकन केयर ऑफ।\nआपको व्यवस्थाओं के बारे में चिंता करने की आवश्यकता नहीं है; सब कुछ संभाल लिया गया है।',
    options: ['need', 'must', 'should', 'could'],
    correctAnswer: 'need',
    explanation: '"need not" expresses absence of obligation or unnecessary action.\n"नीड नॉट" एक्सप्रेसिज एब्सेंस ऑफ ऑब्लिगेशन।\nज़रूरत न होने की स्थिति के लिए "need not" (need) का प्रयोग होता है।',
    hint: 'Modal for "need not".\nमॉडल फॉर "नीड नॉट"।\nNeed not worry.'
  },
  {
    id: 'add2-c9-8',
    classLevel: '9',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Hard',
    questionText: 'Fill in the appropriate preposition:\nHe was acquitted ___ all charges by the High Court.\nही वाज एक्विटेड ___ ऑल चार्जेज बाय द हाई कोर्ट।\nउसे उच्च न्यायालय द्वारा सभी आरोपों से बरी कर दिया गया।',
    options: ['of', 'from', 'with', 'by'],
    correctAnswer: 'of',
    explanation: 'The verb "acquitted" takes preposition "of" (acquitted of charges).\nएक्विटेड इज फॉलोड बाय प्रीपोजिशन "ऑफ"।\nAcquitted के बाद हमेशा preposition "of" (acquitted of) आता है।',
    hint: 'Fixed preposition: acquitted of.\nफिक्स्ड प्रीपोजिशन: एक्विटेड ऑफ।\nAcquitted of.'
  },
  {
    id: 'add2-c9-9',
    classLevel: '9',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Hard',
    questionText: 'Choose the correct order of adjectives:\nShe bought a ___ silk dress.\nशी बॉट ए ___ सिल्क ड्रेस।\nउसने एक सुंदर छोटी लाल रेशमी पोशाक खरीदी।',
    options: [
      'beautiful small red',
      'small red beautiful',
      'red small beautiful',
      'beautiful red small'
    ],
    correctAnswer: 'beautiful small red',
    explanation: 'Adjective Order rule (OSASCOMP): Opinion (beautiful) -> Size (small) -> Color (red).\nओपिनियन -> साइज -> कलर।\nसही क्रम: Opinion (beautiful) -> Size (small) -> Color (red)।',
    hint: 'Opinion -> Size -> Color.\nओपिनियन -> साइज -> कलर।\nBeautiful small red.'
  },
  {
    id: 'add2-c9-10',
    classLevel: '9',
    topic: 'Nouns & Pronouns',
    difficulty: 'Hard',
    questionText: 'Identify the grammatically correct sentence:\nIt is I who am responsible for this mistake.\nइट इज आई हू एम रिस्पॉन्सिबल फॉर दिस मिस्टेक।\nवह मैं ही हूँ जो इस गलती के लिए जिम्मेदार हूँ।',
    options: [
      'It is I who am responsible for this mistake.',
      'It is me who is responsible for this mistake.',
      'It is I who is responsible for this mistake.',
      'It is me who am responsible for this mistake.'
    ],
    correctAnswer: 'It is I who am responsible for this mistake.',
    explanation: 'Formal subject pronoun "I" takes relative verb matching its antecedent ("I who am").\nफॉर्मल सब्जेक्ट प्रोनाउन आई के अनुसार रिलेटिव वर्ब एम होगी।\n"It is I" के बाद relative pronoun "who" का verb "I" के अनुसार "am" होगा।',
    hint: 'Formal grammar uses "It is I who am".\nफॉर्मल व्याकरण यूजेज "इट इज आई हू एम"।\nIt is I who am.'
  },
  {
    id: 'add2-c10-1',
    classLevel: '10',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Hard',
    questionText: 'Choose the correct option:\nThe Prime Minister, along with his cabinet ministers, ___ arrived at the airport.\nद प्राइम मिनिस्टर, अलोंग विद हिज कैबिनेट मिनिस्टर्स, ___ अराइव्ड एट द एयरपोर्ट।\nप्रधानमंत्री, अपने कैबिनेट मंत्रियों के साथ, हवाई अड्डे पर पहुँच चुके हैं।',
    options: ['has', 'have', 'are', 'were'],
    correctAnswer: 'has',
    explanation: 'When main subject is connected with "along with", verb agrees ONLY with first subject (The Prime Minister - singular -> has).\nअलोंग विद से जुड़े वाक्य में वर्ब पहले सब्जेक्ट (Prime Minister) के अनुसार singular (has) होगी।',
    hint: 'Verb agrees with "The Prime Minister".\nवर्ब एग्रीज विद "द प्राइम मिनिस्टर"।\nPrime Minister एकवचन है।'
  },
  {
    id: 'add2-c10-2',
    classLevel: '10',
    topic: 'Active & Passive Voice',
    difficulty: 'Hard',
    questionText: 'Convert to Passive Voice:\nThey say that honesty is the best policy.\nदे से दैट ऑनेस्टी इज द बेस्ट पॉलिसी।\nवे कहते हैं कि ईमानदारी सबसे अच्छी नीति है।',
    options: [
      'It is said that honesty is the best policy.',
      'Honesty is said to be best policy by them.',
      'That honesty is best policy is said.',
      'Honesty was said by them as best policy.'
    ],
    correctAnswer: 'It is said that honesty is the best policy.',
    explanation: 'Impersonal passive for reporting facts: "It is said that + clause".\nइम्पपर्सनल पैसिव: इट इज सैड दैट...।\n"They say that..." का मानक Passive "It is said that..." होता है।',
    hint: 'Start passive with "It is said that".\nस्टार्ट पैसिव विद "इट इज सैड दैट"।\nIt is said that.'
  },
  {
    id: 'add2-c10-3',
    classLevel: '10',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Hard',
    questionText: 'Convert into Indirect Speech:\nThe commander said to the soldiers, "Halt! Do not move forward."\nद कमांडर सैड टू द सोल्जर्स, "हाल्ट! डू नॉट मूव फॉरवर्ड।"\nकमांडर ने सैनिकों से कहा, "रुको! आगे मत बढ़ो।"',
    options: [
      'The commander commanded the soldiers to halt and not to move forward.',
      'The commander told soldiers that halt and do not move.',
      'The commander ordered soldiers that they should halt.',
      'The commander asked soldiers to halt and not moving.'
    ],
    correctAnswer: 'The commander commanded the soldiers to halt and not to move forward.',
    explanation: 'Military command indirect: commanded + object + to halt and not to move forward.\nकमांडेड + टू हाल्ट एंड नॉट टू मूव फॉरवर्ड।\nसैन्य आदेश के लिए commanded... to halt and not to move का प्रयोग होता है।',
    hint: 'Command sentence uses "commanded... to halt".\nकमांड सेंटेंस यूजेज "कमांडेड... टू हाल्ट"।\nCommanded to halt and not to move.'
  },
  {
    id: 'add2-c10-4',
    classLevel: '10',
    topic: 'Editing & Omission',
    difficulty: 'Hard',
    questionText: 'Identify the error in sentence:\nHe is senior than me in service.\nही इज सीनियर देन मी इन सर्विस।\nवह सेवा में मुझसे वरिष्ठ है।',
    options: [
      'Change "than" to "to"',
      'Change "senior" to "more senior"',
      'Change "me" to "I"',
      'No error'
    ],
    correctAnswer: 'Change "than" to "to"',
    explanation: 'Latin comparative adjectives (senior, junior, superior, inferior) take preposition "to", NOT "than".\nसीनियर, जूनियर के साथ "to" आता है, "than" नहीं।\nSenior, Junior आदि शब्दों के बाद "than" के स्थान पर "to" का प्रयोग होता है।',
    hint: 'Senior takes preposition "to".\nसीनियर टेक प्रीपोजिशन "टू"।\nSenior to me.'
  },
  {
    id: 'add2-c10-5',
    classLevel: '10',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Hard',
    questionText: 'Fill in the correct modal:\nYou ___ have informed us earlier; we could have avoided this chaos.\nयू ___ हैव इन्फॉर्म्ड अस अर्लियर; वी कुड हैव अवॉयडेड दिस केऑस।\nआपको हमें पहले सूचित कर देना चाहिए था; हम इस अव्यवस्था से बच सकते थे।',
    options: ['should', 'would', 'could', 'must'],
    correctAnswer: 'should',
    explanation: 'Past unfulfilled criticism or regret: "should have + 3rd form" (should have informed).\nपास्ट अनफुलफिल्ड रिग्रेट: शुड हैव + 3rd फॉर्म।\nबीते समय के सलाह/कर्तव्य न निभाने के लिए "should have + 3rd form" आता है।',
    hint: 'Modal for "should have done".\nमॉडल फॉर "शुड हैव डन"।\nShould have informed.'
  },
  {
    id: 'add2-c10-6',
    classLevel: '10',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    questionText: 'Choose the correct form:\nHardly had the thief seen the police when he ___ away.\nहार्डली हैड द थीफ सीन द पुलिस व्हेन ही ___ अवे।\nचोर ने पुलिस को देखा ही था कि वह भाग गया।',
    options: ['ran', 'run', 'had run', 'was running'],
    correctAnswer: 'ran',
    explanation: 'Structure: Hardly + had + subject + 3rd form ... WHEN + subject + 2nd form (ran).\nहार्डली हैड... व्हेन + 2nd फॉर्म (ran)।\nHardly had... when वाले उपवाक्य में मुख्य क्रिया 2nd form (ran) होती है।',
    hint: 'Use 2nd form "ran" after when clause.\nयूज 2nd फॉर्म "रैन" आफ्टर व्हेन क्लॉज।\nran away.'
  },
  {
    id: 'add2-c10-7',
    classLevel: '10',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Hard',
    questionText: 'Fill in the correct preposition:\nIn accordance ___ the new CBSE circular, internal marks are mandatory.\nइन एकॉर्डेंस ___ द न्यू सीबीएसई सर्कुलर, इंटरनल मार्क्स आर मैंडेटरी।\nनए सीबीएसई परिपत्र के अनुसार, आंतरिक अंक अनिवार्य हैं।',
    options: ['with', 'to', 'of', 'for'],
    correctAnswer: 'with',
    explanation: 'Fixed preposition phrase: "In accordance WITH" (according to).\nइन एकॉर्डेंस विद इज द फिक्स्ड फ्रेज।\n"In accordance" के साथ हमेशा "with" का जोड़ा बनता है (In accordance with)।',
    hint: 'Fixed phrase: In accordance with.\nफिक्स्ड फ्रेज: इन एकॉर्डेंस विद।\nIn accordance with.'
  },
  {
    id: 'add2-c10-8',
    classLevel: '10',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Hard',
    questionText: 'Choose the grammatically correct sentence:\nNeither of the answers provided by the student are correct.\nनीदर ऑफ द आंसर्स प्रोवाइडेड बाय द स्टूडेंट आर करेक्ट।\nछात्र द्वारा दिया गया कोई भी उत्तर सही नहीं है।',
    options: [
      'Neither of the answers provided by the student is correct.',
      'Neither of the answers provided by the student are correct.',
      'Neither of answer provided by student were correct.',
      'Neither answers provided by student is correct.'
    ],
    correctAnswer: 'Neither of the answers provided by the student is correct.',
    explanation: '"Neither of + Plural Noun" takes singular verb "is".\nनीदर ऑफ के बाद वर्ब सिंगुलर (is) होती है।\n"Neither of" के बाद Noun plural होने पर भी verb एकवचन (is) आएगी।',
    hint: 'Neither of uses singular verb "is".\nनीदर ऑफ यूजेज सिंगुलर वर्ब "इज"।\nis correct.'
  },
  {
    id: 'add2-c10-9',
    classLevel: '10',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Hard',
    questionText: 'Identify the sentence with correct adverb position:\nShe barely has enough money to pay her school fees.\nशी बेयरली हैज एनफ मनी टू पे हर स्कूल फीस।\nउसके पास स्कूल की फीस देने के लिए बमुश्किल ही पैसे हैं।',
    options: [
      'She barely has enough money to pay her school fees.',
      'She has barely money enough to pay her school fees.',
      'Barely she enough money has to pay fees.',
      'She has money enough barely to pay fees.'
    ],
    correctAnswer: 'She barely has enough money to pay her school fees.',
    explanation: 'Adverb of degree "barely" precedes main verb/auxiliary: "barely has".\nबेयरली वर्ब के पहले आता है: बेयरली हैज।\nAdverb "barely" क्रिया के ठीक पहले आता है (barely has)।',
    hint: 'Place barely before verb "has".\nप्लेस बेयरली बिफोर वर्ब "हैज"।\nbarely has.'
  },
  {
    id: 'add2-c10-10',
    classLevel: '10',
    topic: 'Nouns & Pronouns',
    difficulty: 'Hard',
    questionText: 'Choose the correct relative pronoun:\nThe company ___ board of directors resigned yesterday was audited.\nद कंपनी ___ बोर्ड ऑफ डायरेक्टर्स रिजाइन्ड यस्टरडे वाज ऑडिटेड।\nजिस कंपनी के निदेशक मंडल ने कल इस्तीफा दे दिया था, उसका ऑडिट किया गया था।',
    options: ['whose', 'which', 'that', 'whom'],
    correctAnswer: 'whose',
    explanation: 'Possessive relative pronoun "whose" shows possession for non-living/company (whose board of directors).\nहुज शोज़ पजेसिव रिलेशन फॉर कंपनी।\nस्वामित्व/संबंध (जिस कंपनी के) दर्शाने के लिए "whose" का प्रयोग होता है।',
    hint: 'Possessive pronoun "whose".\nपजेसिव प्रोनाउन "हुज"।\nwhose board of directors.'
  },
  {
    id: 'add2-c11-1',
    classLevel: '11',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    questionText: 'Fill in the correct subjunctive mood verb:\nIf I ___ the Principal of the school, I would abolish all weekend homework.\nइफ आई ___ द प्रिंसिपल ऑफ द स्कूल, आई वुड एबोलिश ऑल वीकेंड होमवर्क।\nयदि मैं स्कूल का प्रधानाचार्य होता, तो मैं सप्ताहांत के सभी गृहकार्य समाप्त कर देता।',
    options: ['were', 'was', 'am', 'had been'],
    correctAnswer: 'were',
    explanation: 'Unreal/Hypothetical wish in Subjunctive Mood takes "were" for all subjects (If I were).\nइमेजिनरी विश में सब्जेक्ट कोई भी हो, "were" का प्रयोग होता है।\nकाल्पनिक/अवास्तविक स्थिति (If I were) में सभी कर्ताओं के साथ "were" आता है।',
    hint: 'Subjunctive mood wish uses "were".\nसबजंक्शन मोड विश यूजेज "वर"।\nIf I were.'
  },
  {
    id: 'add2-c11-2',
    classLevel: '11',
    topic: 'Editing & Omission',
    difficulty: 'Hard',
    questionText: 'Identify the error in sentence:\nAlthough he was tired, but he finished his work.\nऑलदो ही वाज टायर्ड, बट ही फिनिश्ड हिज वर्क।\nयद्यपि वह थका हुआ था, फिर भी उसने अपना काम पूरा किया।',
    options: [
      'Remove "but" (Although... comma)',
      'Change "Although" to "Because"',
      'Change "finished" to "finishes"',
      'No error'
    ],
    correctAnswer: 'Remove "but" (Although... comma)',
    explanation: '"Although" is NEVER paired with "but". Use a comma or "yet" instead.\nऑलदो के साथ बट का प्रयोग नहीं होता।\n"Although" के साथ "but" नहीं आता, केवल कॉमा (,) या "yet" आता है।',
    hint: 'Do not use "but" with "Although".\nडू नॉट यूज "बट" विद "ऑलदो"।\nbut को हटा दें।'
  },
  {
    id: 'add2-c11-3',
    classLevel: '11',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Hard',
    questionText: 'Convert into Indirect Speech:\nHe said, "Let us drop the subject and move forward."\nही सैड, "लेट अस ड्रॉप द सब्जेक्ट एंड मूव फॉरवर्ड।"\nउसने कहा, "आइए हम इस विषय को छोड़ें और आगे बढ़ें।";',
    options: [
      'He suggested that they should drop the subject and move forward.',
      'He said that let us drop the subject.',
      'He ordered them to drop the subject.',
      'He told that we drop the subject.'
    ],
    correctAnswer: 'He suggested that they should drop the subject and move forward.',
    explanation: 'Proposal starting with "Let us" turns into "suggested/proposed that they should + verb".\nलेट अस टर्न्स इनटू "सजेस्टेड दैट दे शुड"।\n"Let us" वाले प्रस्ताव का Indirect "suggested that they should..." बनता है।',
    hint: 'Proposal uses "suggested that they should".\nप्रपोजल यूजेज "सजेस्टेड दैट दे शुड"।\nsuggested that they should.'
  },
  {
    id: 'add2-c11-4',
    classLevel: '11',
    topic: 'Active & Passive Voice',
    difficulty: 'Hard',
    questionText: 'Convert to Passive Voice:\nIt is time to close the shop.\nइट इज टाइम टू क्लोज द शॉप।\nदुकान बंद करने का समय हो गया है।',
    options: [
      'It is time for the shop to be closed.',
      'The shop is time to be closed.',
      'It is time the shop closed.',
      'Shop should be closed in time.'
    ],
    correctAnswer: 'It is time for the shop to be closed.',
    explanation: 'Structure: "It is time + for + object + to be + 3rd form" -> It is time for the shop to be closed.\nइट इज टाइम फॉर + ऑब्जेक्ट + टू बी + 3rd फॉर्म।\n"It is time..." का Passive "It is time for [object] to be [3rd form]" बनता है।',
    hint: 'Use "It is time for the shop to be closed".\nयूज "इट इज टाइम फॉर द शॉप टू बी क्लोज्ड"।\nIt is time for... to be closed.'
  },
  {
    id: 'add2-c11-5',
    classLevel: '11',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Hard',
    questionText: 'Choose the correct option:\nThree-fourths of the city ___ flooded due to heavy rains.\nथ्री-फोर्थ्स ऑफ द सिटी ___ फ्लडेड ड्यू टू हैवी रेन्स।\nभारी बारिश के कारण शहर का तीन-चौथाई हिस्सा जलमग्न हो गया है।',
    options: ['was', 'were', 'have been', 'are'],
    correctAnswer: 'was',
    explanation: 'Fraction of singular uncountable/singular noun ("the city") takes singular verb "was".\nफ्रैक्शन ऑफ सिंगुलर नाउन (the city) टेक सिंगुलर वर्ब (was)।\nएकवचन स्थान (city) के अंश के लिए क्रिया एकवचन (was) आएगी।',
    hint: 'City is singular, so fraction takes singular verb.\nसिटी इज सिंगुलर, सो फ्रैक्शन टेक सिंगुलर वर्ब।\nwas flooded.'
  },
  {
    id: 'add2-c11-6',
    classLevel: '11',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Hard',
    questionText: 'Fill in the correct preposition:\nHe was disguised as a monk to prevent himself ___ being recognized.\nही वाज डिस्गाइज्ड एज ए मोंक टू प्रिवेंट हिमसेल्फ ___ बीइंग रिकॉग्नाइज्ड।\nपहचाने जाने से बचने के लिए उसने साधु का वेश बना रखा था।',
    options: ['from', 'to', 'with', 'against'],
    correctAnswer: 'from',
    explanation: 'The verb "prevent" is always followed by preposition "from" + gerund (prevent from being).\nप्रिवेंट के बाद प्रीपोजिशन "from" आता है।\nPrevent के बाद सदैव "from" preposition का प्रयोग होता है।',
    hint: 'Fixed preposition: prevent FROM.\nफिक्स्ड प्रीपोजिशन: प्रिवेंट फ्रॉम।\nprevent from being.'
  },
  {
    id: 'add2-c11-7',
    classLevel: '11',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Hard',
    questionText: 'Choose the correct modal:\n___ you be so kind as to lend me your pen for a moment?\n___ यू बी सो काइंड एज टू लैंड मी योर पेन फॉर ए मोमेंट?\nक्या आप मुझे कुछ देर के लिए अपनी कलम देने की कृपा करेंगे?',
    options: ['Would', 'Must', 'Should', 'Might'],
    correctAnswer: 'Would',
    explanation: 'Polite formal request in English uses "Would you be so kind as to...".\nपोलाइट फॉर्मल रिक्वेस्ट यूजेज "वुड यू बी सो काइंड"।\nअत्यंत विनम्र निवेदन (Polite Request) के लिए "Would" का प्रयोग होता है।',
    hint: 'Polite request uses "Would you be...".\nपोलाइट रिक्वेस्ट यूजेज "वुड यू बी..."।\nWould you be.'
  },
  {
    id: 'add2-c11-8',
    classLevel: '11',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Hard',
    questionText: 'Identify the sentence with correct adverb usage:\nHe spoke so fastly that nobody could understand him.\nही स्पोक सो फास्टली दैट नोबडी कुड अंडरस्टैंड हिम।\nवह इतनी तेजी से बोला कि कोई उसे समझ नहीं सका।',
    options: [
      'Change "fastly" to "fast" (fastly is incorrect)',
      'Change "could" to "can"',
      'Change "understand" to "understood"',
      'No error'
    ],
    correctAnswer: 'Change "fastly" to "fast" (fastly is incorrect)',
    explanation: 'The word "fastly" DOES NOT exist in standard English. "fast" functions as both adjective and adverb.\nफास्टली शब्द अंग्रेजी में नहीं होता, केवल "fast" होता है।\nअंग्रेजी में "fastly" कोई शब्द नहीं है, Adverb रूप भी "fast" ही होता है।',
    hint: '"fastly" is wrong; use "fast".\n"फास्टली" इज रॉन्ग; यूज "फास्ट"।\nfastly की जगह fast करें।'
  },
  {
    id: 'add2-c11-9',
    classLevel: '11',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Hard',
    questionText: 'Choose the correct inverted conditional sentence:\nHad I been informed earlier, I ___ attended the conference.\nहैड आई बीन इन्फॉर्म्ड अर्लियर, आई ___ अटेंडेड द कॉन्फ्रेंस।\nअगर मुझे पहले सूचित कर दिया गया होता, तो मैं सम्मेलन में भाग लेता।',
    options: ['would have', 'will have', 'would', 'could'],
    correctAnswer: 'would have',
    explanation: 'Inverted Past Perfect conditional: "Had I been... I WOULD HAVE + 3rd form".\nहैड आई बीन... आई वुड हैव + 3rd फॉर्म।\nInverted Conditional (Had I...) में परिणामी उपवाक्य में "would have + 3rd form" आता है।',
    hint: 'Had I been... pairs with "would have".\nहैड आई बीन... पेयर्स विद "वुड हैव"।\nwould have attended.'
  },
  {
    id: 'add2-c11-10',
    classLevel: '11',
    topic: 'Nouns & Pronouns',
    difficulty: 'Hard',
    questionText: 'Identify the error in pronoun case:\nBetween you and I, he is a liar.\nबिटवीन यू एंड आई, ही इज ए लायर।\nआपके और मेरे बीच की बात है, वह झूठा है।',
    options: [
      'Change "I" to "me" (Between you and me)',
      'Change "he" to "him"',
      'Change "liar" to "lying"',
      'No error'
    ],
    correctAnswer: 'Change "I" to "me" (Between you and me)',
    explanation: 'Prepositions (between) take OBJECTIVE pronoun case: "Between you and ME".\nप्रीपोजिशन बिटवीन के बाद ऑब्जेक्टिव केस (me) आता है।\nPreposition "between" के बाद Pronoun objective case (me) होना चाहिए।',
    hint: 'Use objective pronoun "me" after between.\nयूज ऑब्जेक्टिव प्रोनाउन "मी" आफ्टर बिटवीन।\nBetween you and me.'
  },
  {
    id: 'add2-c12-1',
    classLevel: '12',
    topic: 'Direct & Indirect Speech',
    difficulty: 'Hard',
    questionText: 'Convert to Indirect Speech:\n"If I were you, I would accept the job offer," said Rohan.\n"इफ आई वर यू, आई वुड एक्सेप्ट द जॉब ऑफर," सैड रोहन।\n"अगर मैं तुम्हारी जगह होता, तो मैं नौकरी का प्रस्ताव स्वीकार कर लेता," रोहन ने कहा।',
    options: [
      'Rohan advised me to accept the job offer.',
      'Rohan said that if he was me he would accept job.',
      'Rohan told that if he were you he will accept job.',
      'Rohan ordered me accepting the job offer.'
    ],
    correctAnswer: 'Rohan advised me to accept the job offer.',
    explanation: 'Advice given using "If I were you..." is best rendered in indirect speech as "advised [someone] to [verb]".\nएडवाइस गिवन यूजिंग "इफ आई वर यू" इज रेंडर्ड एज "एडवाइज्ड टू एक्सेप्ट"।\n"If I were you..." का Indirect रूप "advised me to accept..." होता है।',
    hint: 'Advice sentence becomes "advised me to accept".\nएडवाइस सेंटेंस बिकम्स "एडवाइज्ड मी टू एक्सेप्ट"।\nAdvised me to accept.'
  },
  {
    id: 'add2-c12-2',
    classLevel: '12',
    topic: 'Active & Passive Voice',
    difficulty: 'Hard',
    questionText: 'Convert to Passive Voice:\nThe doctor urged the patient to quit smoking.\nद डॉक्टर अर्ज्ड द पेशेंट टू क्विट स्मोकिंग।\nडॉक्टर ने मरीज से धूम्रपान छोड़ने का आग्रह किया।',
    options: [
      'The patient was urged by the doctor to quit smoking.',
      'The patient is urged by doctor to quit smoking.',
      'Smoking was urged to quit by the patient.',
      'Doctor urged smoking to be quit by patient.'
    ],
    correctAnswer: 'The patient was urged by the doctor to quit smoking.',
    explanation: 'Past Simple passive with infinitive complement: Object + was/were + 3rd form (was urged) + by subject + to quit smoking.\nऑब्जेक्ट + वाज/वर + 3rd फॉर्म (was urged)।\nThe patient was urged by the doctor to quit smoking.',
    hint: 'Look for "The patient was urged by the doctor".\nलुक्स फॉर "द पेशेंट वाज अर्ज्ड बाय द डॉक्टर"।\nwas urged by.'
  },
  {
    id: 'add2-c12-3',
    classLevel: '12',
    topic: 'Subject-Verb Agreement',
    difficulty: 'Hard',
    questionText: 'Choose the correct option:\nNot only the coach but also the players ___ excited about the final match.\nनॉट ओनली द कोच बट अल्सो द प्लेयर्स ___ एक्साइटेड अबाउट द फाइनल मैच।\nन केवल कोच बल्कि खिलाड़ी भी फाइनल मैच को लेकर उत्साहित थे।',
    options: ['were', 'was', 'is', 'has been'],
    correctAnswer: 'were',
    explanation: 'In "Not only... but also", verb agrees with nearest subject ("the players" - plural -> were).\nनॉट ओनली... बट अल्सो में वर्ब पास वाले सब्जेक्ट (players) के अनुसार Plural (were) होगी।\nपास का कर्ता "the players" (बहुवचन) होने से "were" आएगा।',
    hint: 'Verb agrees with plural "the players".\nवर्ब एग्रीज विद प्लुरल "द प्लेयर्स"।\nPlayers के अनुसार were.'
  },
  {
    id: 'add2-c12-4',
    classLevel: '12',
    topic: 'Editing & Omission',
    difficulty: 'Hard',
    questionText: 'Identify the error in sentence:\nNo sooner did I enter the room when the lights went off.\nनो सूनर डिड आई एंटर द रूम व्हेन द लाइट्स वेंट ऑफ।\nकमरे में प्रवेश करते ही बत्तियां गुल हो गईं।',
    options: [
      'Change "when" to "than" (No sooner... than)',
      'Change "enter" to "entered"',
      'Change "went" to "go"',
      'No error'
    ],
    correctAnswer: 'Change "when" to "than" (No sooner... than)',
    explanation: '"No sooner" requires correlative conjunction "than", NOT "when".\nनो सूनर के साथ "than" का जोड़ा बनता है, "when" नहीं।\n"No sooner" के बाद सदैव "than" का प्रयोग होता है।',
    hint: 'No sooner is paired with THAN.\nनो सूनर इज पेयर्ड विद देन।\nwhen की जगह than करें।'
  },
  {
    id: 'add2-c12-5',
    classLevel: '12',
    topic: 'Verbs & Tenses',
    difficulty: 'Hard',
    questionText: 'Choose the correct tense:\nBy the end of this month, our team ___ working on this project for six months.\nबाय द एंड ऑफ दिस मंथ, आवर टीम ___ वर्किंग ऑन दिस प्रोजेक्ट फॉर सिक्स मंथ्स।\nइस महीने के अंत तक हमारी टीम छह महीने से इस प्रोजेक्ट पर काम कर रही होगी।',
    options: ['will have been', 'will be', 'has been', 'had been'],
    correctAnswer: 'will have been',
    explanation: 'Future Perfect Continuous formula: "will have been + verb-ing" for action continuing up to a future point.\nफ्यूचर परफेक्ट कंटीन्यूअस: विल हैव बीन + वर्ब-ing।\nभविष्य की समय सीमा (By the end of this month) के लिए "will have been + ing" आता है।',
    hint: 'Future Perfect Continuous: "will have been working".\nफ्यूचर परफेक्ट कंटीन्यूअस: "विल हैव बीन वर्किंग"।\nwill have been working.'
  },
  {
    id: 'add2-c12-6',
    classLevel: '12',
    topic: 'Prepositions & Conjunctions',
    difficulty: 'Hard',
    questionText: 'Fill in the correct preposition:\nHe was unaware of the new rule, so he was exempt ___ paying the late fee.\nही वाज अनअवेयर ऑफ द न्यू रूल, सो ही वाज एग्जेंप्ट ___ पेइंग द लेट फीस।\nवह नए नियम से अनजान था, इसलिए उसे विलंब शुल्क भुगतान करने से छूट दी गई थी।',
    options: ['from', 'of', 'with', 'for'],
    correctAnswer: 'from',
    explanation: 'The adjective/verb "exempt" takes preposition "from" (exempt from paying).\nएग्जेंप्ट के बाद प्रीपोजिशन "from" आता है।\nExempt के साथ हमेशा preposition "from" (exempt from) आता है।',
    hint: 'Fixed preposition: exempt FROM.\nफिक्स्ड प्रीपोजिशन: एग्जेंप्ट फ्रॉम।\nexempt from.'
  },
  {
    id: 'add2-c12-7',
    classLevel: '12',
    topic: 'Modals & Auxiliaries',
    difficulty: 'Hard',
    questionText: 'Choose the appropriate modal:\nHow ___ you talk to my father in such a rude manner!\nहाउ ___ यू टॉक्स टू माय फादर इन सच ए रूड मैनर!\nआपकी मेरे पिता से इस प्रकार अभद्रता से बात करने की हिम्मत कैसे हुई!',
    options: ['dare', 'need', 'might', 'could'],
    correctAnswer: 'dare',
    explanation: 'Expressing indignation/courage in challenging manner uses "How dare you...".\nहाउ डेयर यू एक्सप्रेसिज इंडिग्नेशन।\nसाहस/गुस्ताखी दर्शाने वाले प्रश्न के लिए "How dare you" का प्रयोग होता है।',
    hint: 'Modal phrase: How dare you.\nमॉडल फ्रेज: हाउ डेयर यू।\nHow dare you.'
  },
  {
    id: 'add2-c12-8',
    classLevel: '12',
    topic: 'Sentence Correction & Punctuation',
    difficulty: 'Hard',
    questionText: 'Choose the grammatically correct sentence:\nUnless you do not apologize, you will not be pardoned.\nअनलेस यू डू नॉट एपोलोजाइज, यू विल नॉट बी पार्डनड।\nजब तक तुम क्षमा नहीं मांगोगे, तुम्हें माफ नहीं किया जाएगा।',
    options: [
      'Unless you apologize, you will not be pardoned.',
      'Unless you do not apologize, you will not be pardoned.',
      'Unless you will apologize, you will not be pardoned.',
      'Unless you apologize not, you will not be pardoned.'
    ],
    correctAnswer: 'Unless you apologize, you will not be pardoned.',
    explanation: '"Unless" itself carries negative meaning ("if not"), so double negative "do not" is INCORRECT.\nअनलेस खुद नकारात्मक है, इसलिए इसके साथ "do not" नहीं आता।\n"Unless" में "नकारात्मक अर्थ" पहले से शामिल है, अतः do not लगाना गलत है।',
    hint: 'Do not use "not" in "unless" clause.\nडू नॉट यूज "नॉट" इन "अनलेस" क्लॉज।\nUnless you apologize.'
  },
  {
    id: 'add2-c12-9',
    classLevel: '12',
    topic: 'Adjectives & Adverbs',
    difficulty: 'Hard',
    questionText: 'Identify the sentence with correct comparative usage:\nThis book is preferable than that one.\nदिस बुक इज प्रेफरेबल देन दैट वन।\nयह पुस्तक उस पुस्तक की तुलना में अधिक उत्तम है।',
    options: [
      'Change "than" to "to" (preferable to)',
      'Change "preferable" to "more preferable"',
      'Change "that" to "those"',
      'No error'
    ],
    correctAnswer: 'Change "than" to "to" (preferable to)',
    explanation: 'Adjective "preferable" takes preposition "to", NOT "than" (preferable to that one).\nप्रेफरेबल के बाद "to" आता है, "than" नहीं।\n"Preferable" के बाद हमेशा preposition "to" (preferable to) आता है।',
    hint: 'Preferable is followed by "to".\nप्रेफरेबल इज फॉलोड बाय "टू"।\nPreferable to.'
  },
  {
    id: 'add2-c12-10',
    classLevel: '12',
    topic: 'Nouns & Pronouns',
    difficulty: 'Hard',
    questionText: 'Choose the correct option:\nThe jury ___ divided in their opinions regarding the verdict.\nद जूरी ___ डिवाइडेड इन देयर ओपिनियंस रिगार्डिंग द वर्डिक्ट।\nफैसले के संबंध में जूरी की राय बंटी हुई थी।',
    options: ['were', 'was', 'is', 'has been'],
    correctAnswer: 'were',
    explanation: 'When members of a collective noun (jury) are divided/acting individually, plural verb "were" is used.\nजूरी के सदस्य विभाजित होने पर वर्ब Plural (were) होगी।\nसामूहिक संज्ञा (Jury) जब आपस में बंटी/विभाजित हो तो क्रिया बहुवचन (were) आती है।',
    hint: 'Jury members divided -> use plural verb "were".\nजूरी मेंबर्स डिवाइडेड -> यूज प्लुरल वर्ब "वर"।\nwere divided.'
  },
  {
    id: "add3-c3-1",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the Proper Noun:\nDelhi is the capital of India.\nदिल्ली इज द कैपिटल ऑफ इंडिया।\nदिल्ली भारत की राजधानी है।",
    options: ["Delhi","capital","city","state"],
    correctAnswer: "Delhi",
    explanation: "\"Delhi\" is a specific name of a city, so it is a Proper Noun.\nदिल्ली एक विशेष शहर का नाम है, इसलिए यह Proper Noun है।\n\"Delhi\" किसी विशेष स्थान का नाम है, अतः यह Proper Noun (व्यक्तिवाचक संज्ञा) है।",
    hint: "Special name of a city.\nविशेष शहर का नाम।"
  },
  {
    id: "add3-c3-2",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Choose the correct Pronoun for a boy:\nRohan is sleeping because ___ is tired.\nरोहन इज स्लीपिंग बिकॉज़ ___ इज टायर्ड।\nरोहन सो रहा है क्योंकि वह थका हुआ है।",
    options: ["he","she","it","they"],
    correctAnswer: "he",
    explanation: "\"Rohan\" is a male singular noun, so we use the pronoun \"he\".\nरोहन लड़का है, इसलिए सर्वनाम \"he\" आएगा।\nपुल्लिंग एकवचन के लिए सर्वनाम \"he\" का प्रयोग होता है।",
    hint: "Pronoun used for male person.\nलड़के के लिए हे (he) प्रयोग करें।"
  },
  {
    id: "add3-c3-3",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Choose the Plural form of \"child\":\nThree ___ are playing in the garden.\nथ्री ___ आर प्लेइंग इन द गार्डन।\nतीन बच्चे बगीचे में खेल रहे हैं।",
    options: ["children","childs","childrens","childes"],
    correctAnswer: "children",
    explanation: "The plural of child is \"children\" (irregular plural).\nchild का बहुवचन children होता है।\nChild का बहुवचन (Plural) \"children\" है।",
    hint: "Irregular plural of child.\nchild का बहुवचन children."
  },
  {
    id: "add3-c3-4",
    classLevel: "3",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Fill in the blank with correct article:\nI saw ___ elephant in the zoo.\nआई सॉ ___ एलिफेंट इन द जू।\nमैंने चिड़ियाघर में एक हाथी देखा।",
    options: ["an","a","the","no article"],
    correctAnswer: "an",
    explanation: "\"elephant\" begins with vowel sound 'e', so we use \"an\".\nएलिफेंट वॉवेल साउंड 'e' से शुरू होता है, इसलिए \"an\" लगेगा।\n\"Elephant\" शब्द स्वर (Vowel) ध्वनि से शुरू होता है, इसलिए \"an\" आएगा।",
    hint: "Use \"an\" before vowel sounds.\nस्वर ध्वनि के आगे an लगाएं।"
  },
  {
    id: "add3-c3-5",
    classLevel: "3",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Fill in the correct article:\n___ sun rises in the east.\n___ सन राइजेस इन द ईस्ट।\nसूर्य पूर्व में उगता है।",
    options: ["The","A","An","No article"],
    correctAnswer: "The",
    explanation: "We use \"The\" before unique natural objects like Sun, Moon, Earth.\nसूरज जैसे एक अनोखी वस्तु के आगे \"The\" लगता है।\n\"Sun\" एक अद्वितीय खगोलीय पिंड है, इसलिए इसके पूर्व \"The\" लगेगा।",
    hint: "Article for unique heavenly bodies.\nसूरज के आगे The आएगा।"
  },
  {
    id: "add3-c3-6",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Identify the Verb (action word):\nThe bird sings sweetly.\nद बर्ड सिंग्स स्वीटली।\nपक्षी मीठा गाता है।",
    options: ["sings","bird","sweetly","the"],
    correctAnswer: "sings",
    explanation: "\"sings\" shows the action done by bird, so it is a verb.\nसिंग्स पक्षी के काम को दिखाता है, यह क्रिया है।\n\"sings\" (गाता है) कार्य को दर्शाने वाली क्रिया (Verb) है।",
    hint: "Word that tells action.\nकाम बताने वाला शब्द।"
  },
  {
    id: "add3-c3-7",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Choose the Past Simple tense:\nYesterday I ___ a new storybook.\nयस्टरडे आई ___ ए न्यू स्टोरीबुक।\nकल मैंने एक नई कहानी की किताब पढ़ी।",
    options: ["read","reading","reads","will read"],
    correctAnswer: "read",
    explanation: "\"Yesterday\" indicates past time, so past tense of read (read) is used.\nयस्टरडे भूतकाल दिखाता है, इसलिए past form (read) आएगा।\n\"Yesterday\" भूतकाल का सूचक है, अतः V2 \"read\" का प्रयोग होगा।",
    hint: "Past time word yesterday takes past verb.\nYesterday के लिए read (V2)."
  },
  {
    id: "add3-c3-8",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Fill in the Present Continuous Tense:\nThey ___ football right now.\nदे ___ फुटबॉल राइट नाउ।\nवे अभी फुटबॉल खेल रहे हैं।",
    options: ["are playing","played","will play","plays"],
    correctAnswer: "are playing",
    explanation: "\"right now\" shows action happening now -> Present Continuous (are playing).\nराइट नाउ वर्तमान में काम जारी होने को दिखाता है।\nवर्तमान में जारी कार्य के लिए \"are playing\" (Present Continuous) आएगा।",
    hint: "Action happening right now takes is/am/are + V-ing.\nare playing."
  },
  {
    id: "add3-c3-9",
    classLevel: "3",
    topic: "Subject-Verb Agreement",
    difficulty: "Easy",
    questionText: "Choose the correct verb:\nShe ___ milk every morning.\nशी ___ मिल्क एवरी मॉर्निंग।\nवह हर सुबह दूध पीती है।",
    options: ["drinks","drink","drinking","drank"],
    correctAnswer: "drinks",
    explanation: "Singular subject \"She\" takes singular verb ending in -s (drinks).\nएकवचन कर्ता She के साथ verb में -s (drinks) आता है।\nएकवचन कर्ता \"She\" के साथ क्रिया \"drinks\" आएगी।",
    hint: "Add -s to verb for singular \"She\".\nShe drinks."
  },
  {
    id: "add3-c3-10",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Identify the Adjective (describing word):\nIt is a red apple.\nइट इज ए रेड एप्पल।\nयह एक लाल सेब है।",
    options: ["red","apple","is","it"],
    correctAnswer: "red",
    explanation: "\"red\" describes the color of apple, so it is an Adjective.\nरेड सेब के रंग का वर्णन करता है, यह Adjective है।\n\"red\" सेब की विशेषता बता रहा है, अतः यह विशेषण (Adjective) है।",
    hint: "Describing word for apple.\nसेब का रंग बताने वाला शब्द।"
  },
  {
    id: "add3-c3-11",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Identify the Adverb:\nThe rabbit runs quickly.\nद रैबिट रन्स क्विकली।\nखरगोश तेजी से दौड़ता है।",
    options: ["quickly","runs","rabbit","the"],
    correctAnswer: "quickly",
    explanation: "\"quickly\" describes how rabbit runs, so it is an Adverb.\nक्विकली दौड़ने के तरीके को बताता है, यह Adverb है।\n\"quickly\" (तेजी से) दौड़ने की क्रिया की विशेषता बता रहा है।",
    hint: "Word ending in -ly telling how action is done.\nक्रिया का ढंग बताने वाला -ly शब्द।"
  },
  {
    id: "add3-c3-12",
    classLevel: "3",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Choose the correct preposition:\nThe cat is sitting ___ the table.\nद कैट इज सिटिंग ___ द टेबल।\nबिल्ली मेज के नीचे बैठी है।",
    options: ["under","in","at","into"],
    correctAnswer: "under",
    explanation: "\"under\" shows location below the table surface.\nअंडर का अर्थ नीचे होता है।\n\"under\" (नीचे) स्थान को दर्शाने वाला सही Preposition है।",
    hint: "Preposition meaning below surface.\nनीचे की स्थिति के लिए under."
  },
  {
    id: "add3-c3-13",
    classLevel: "3",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Choose the correct conjunction:\nI like apples ___ oranges.\nआई लाइक एप्पल्स ___ ऑरेंजेज।\nमुझे सेब और संतरे पसंद हैं।",
    options: ["and","but","because","or"],
    correctAnswer: "and",
    explanation: "\"and\" joins two similar things (apples, oranges).\nएंड दो समान चीजों को जोड़ता है।\n\"and\" (और) दो समान वस्तुओं को जोड़ने के लिए आता है।",
    hint: "Conjunction for adding two things.\nऔर (and) का प्रयोग करें।"
  },
  {
    id: "add3-c3-14",
    classLevel: "3",
    topic: "Active & Passive Voice",
    difficulty: "Easy",
    questionText: "Identify who performs the action in:\nThe glass was broken by Rahul.\nद ग्लास वाज ब्रोकन बाय राहुल।\nकांच राहुल द्वारा तोड़ा गया था।",
    options: ["Rahul","glass","broken","was"],
    correctAnswer: "Rahul",
    explanation: "\"Rahul\" is the doer of action (agent after by).\nराहुल काम करने वाला व्यक्ति है।\n\"Rahul\" कार्य करने वाला कर्ता (doer) है।",
    hint: "Person after \"by\" who did the action.\nby के बाद वाला व्यक्ति।"
  },
  {
    id: "add3-c3-15",
    classLevel: "3",
    topic: "Direct & Indirect Speech",
    difficulty: "Easy",
    questionText: "Find the spoken words (Direct Speech):\nTina said, \"I am happy.\"\nटीना सैड, \"आई एम हैप्पी।\"\nटीना ने कहा, \"मैं खुश हूँ।\";",
    options: ["I am happy","Tina said","said","Tina"],
    correctAnswer: "I am happy",
    explanation: "The exact words inside quotation marks \"I am happy\" are Direct Speech.\nइन्वर्टेड कॉमा के अंदर वाले शब्द Direct Speech हैं।\nउद्धरण चिन्ह (\" \") के अंदर के शब्द प्रत्यक्ष कथन (Direct Speech) हैं।",
    hint: "Words inside inverted commas \" \".\nइन्वर्टेड कॉमा \" \" के अंदर।"
  },
  {
    id: "add3-c3-16",
    classLevel: "3",
    topic: "Modals & Auxiliaries",
    difficulty: "Easy",
    questionText: "Fill in the modal for polite permission:\n___ I come in, teacher?\n___ आई कम इन, टीचर?\nक्या मैं अंदर आ सकता हूँ, शिक्षक?",
    options: ["May","Must","Should","Will"],
    correctAnswer: "May",
    explanation: "\"May\" is used for polite formal permission.\nअनुमति मांगने के लिए विनम्र शब्द \"May\" आता है।\nविनम्र अनुमति माँगने के लिए \"May\" का प्रयोग होता है।",
    hint: "Polite permission modal for teacher.\nशिक्षक से अनुमति हेतु May."
  },
  {
    id: "add3-c3-17",
    classLevel: "3",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Which symbol ends a question sentence?\nWhere are you going___\nवेयर आर यू गोइंग___\nआप कहाँ जा रहे हैं___",
    options: ["?",".","!",","],
    correctAnswer: "?",
    explanation: "Interrogative questions end with a question mark (?).\nप्रश्नवाचक वाक्य question mark (?) पर समाप्त होते हैं।\nप्रश्नवाचक वाक्यों के अंत में प्रश्नवाचक चिन्ह (?) लगता है।",
    hint: "Mark at the end of a question.\nप्रश्न सूचक चिन्ह ?"
  },
  {
    id: "add3-c3-18",
    classLevel: "3",
    topic: "Editing & Omission",
    difficulty: "Easy",
    questionText: "Correct the capitalization error:\nmy name is Amit.\nमाय नेम इज अमित।\nमेरा नाम अमित है।",
    options: ["My name is Amit.","my Name is Amit.","my name is amit.","My name Is amit."],
    correctAnswer: "My name is Amit.",
    explanation: "First letter of a sentence must always be Capital (\"My\").\nवाक्य का पहला अक्षर हमेशा बड़ा (Capital) होता है।\nवाक्य का प्रथम अक्षर सदैव Capital (\"My\") होना चाहिए।",
    hint: "Start sentence with capital letter M.\nपहला अक्षर बड़ा M बनाएं।"
  },
  {
    id: "add3-c3-19",
    classLevel: "3",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Select the Exclamatory Sentence:\nWhat a beautiful flower!\nव्हाट ए ब्यूटीफुल फ्लावर!\nकितना सुंदर फूल है!",
    options: ["What a beautiful flower!","This is a flower.","Is this a flower?","Pick the flower."],
    correctAnswer: "What a beautiful flower!",
    explanation: "Sentence expressing sudden wonder ending in ! is Exclamatory.\nआश्चर्य प्रकट करने वाला और ! पर खत्म होने वाला वाक्य Exclamatory है।\nविस्मय सूचक चिन्ह (!) वाला वाक्य Exclamatory कहलाता है।",
    hint: "Sentence ending with exclamation mark (!).\nविस्मय सूचक चिन्ह (!) वाला वाक्य।"
  },
  {
    id: "add3-c3-20",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Fill in the Future Tense:\nTomorrow we ___ to the park.\nटुमारो वी ___ टू द पार्क।\nकल हम पार्क जाएंगे।",
    options: ["will go","went","go","going"],
    correctAnswer: "will go",
    explanation: "\"Tomorrow\" indicates future time, so we use \"will go\".\nटुमारो भविष्यकाल दिखाता है, इसलिए \"will go\" आएगा।\n\"Tomorrow\" भविष्यकाल दर्शाता है, अतः \"will go\" आएगा।",
    hint: "Future word tomorrow takes \"will + V1\".\nwill go."
  },
  {
    id: "add3-c4-1",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the Abstract Noun:\nHonesty is the best policy.\nऑनेस्टी इज द बेस्ट पॉलिसी।\nईमानदारी सबसे अच्छी नीति है।",
    options: ["Honesty","policy","best","is"],
    correctAnswer: "Honesty",
    explanation: "\"Honesty\" is a quality/feeling that cannot be touched, so it is an Abstract Noun.\nऑनेस्टी गुण का नाम है जिसे छू नहीं सकते, यह Abstract Noun है।\n\"Honesty\" (ईमानदारी) गुण का भाव है, अतः Abstract Noun है।",
    hint: "Quality noun that cannot be touched.\nगुण या भाव का नाम।"
  },
  {
    id: "add3-c4-2",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Choose the correct Possessive Pronoun:\nThis pencil belongs to me. It is ___.\nदिस पेंसिल बिलोंग्स टू मी। इट इज ___।\nयह पेंसिल मेरी है। यह मेरी है।",
    options: ["mine","my","me","myself"],
    correctAnswer: "mine",
    explanation: "\"mine\" shows ownership independently without noun following it.\nस्वामित्व दिखाने के लिए अंत में \"mine\" का प्रयोग होता है।\nस्वत्व दर्शाने वाला स्वतंत्र Pronoun \"mine\" है।",
    hint: "Possessive pronoun ending sentence.\nमेरी है = mine."
  },
  {
    id: "add3-c4-3",
    classLevel: "4",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Fill in the correct article:\nShe wants to buy ___ umbrella.\nशी वांट्स टू बाय ___ अम्ब्रेला।\nवह एक छाता खरीदना चाहती है।",
    options: ["an","a","the","no article"],
    correctAnswer: "an",
    explanation: "\"umbrella\" starts with vowel sound 'u' (अ), so we use \"an\".\nअम्ब्रेला स्वर ध्वनि से शुरू होता है, इसलिए \"an\" आएगा।\n\"Umbrella\" अ ध्वनि (Vowel sound) से शुरू होता है, अतः \"an\" लगेगा।",
    hint: "Vowel sound word umbrella takes \"an\".\nan umbrella."
  },
  {
    id: "add3-c4-4",
    classLevel: "4",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Fill in the article before superlative:\nMount Everest is ___ highest peak in the world.\nमाउण्ट एवरेस्ट इज ___ हाइएस्ट पीक इन द वर्ल्ड।\nमाउंट एवरेस्ट दुनिया की सबसे ऊंची चोटी है।",
    options: ["the","a","an","no article"],
    correctAnswer: "the",
    explanation: "Superlative degrees (highest) always take article \"the\".\nसुपरलेटिव डिग्री के आगे \"the\" का प्रयोग होता है।\nSuperlative degree (highest) के पहले सदैव \"the\" आता है।",
    hint: "Article before superlative -est word.\nthe highest."
  },
  {
    id: "add3-c4-5",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Identify the Past Continuous Tense:\nIt ___ heavily when we left home.\nइट ___ हैविली व्हेन वी लेफ्ट होम।\nजब हम घर से निकले तब तेज बारिश हो रही थी।",
    options: ["was raining","rained","is raining","will rain"],
    correctAnswer: "was raining",
    explanation: "Past Continuous format: was/were + V-ing (was raining).\nवाज + वर्ब-ing पास्ट कंटीन्यूअस टेंस है।\n\"was raining\" भूतकाल में जारी कार्य को दर्शाता है।",
    hint: "Look for \"was + V-ing\".\nwas raining."
  },
  {
    id: "add3-c4-6",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Choose the Present Perfect Tense:\nI ___ my homework already.\nआई ___ माय होमवर्क ऑलरेडी।\nमैं अपना गृहकार्य पहले ही पूरा कर चुका हूँ।",
    options: ["have finished","finished","am finishing","will finish"],
    correctAnswer: "have finished",
    explanation: "Present Perfect format: have/has + V3 (have finished).\nहैव + 3rd फॉर्म प्रेजेंट परफेक्ट दिखाता है।\n\"have finished\" हाल ही में पूर्ण हुए कार्य को दर्शाता है।",
    hint: "have + 3rd form of verb.\nhave finished."
  },
  {
    id: "add3-c4-7",
    classLevel: "4",
    topic: "Subject-Verb Agreement",
    difficulty: "Easy",
    questionText: "Fill in the correct verb:\nEither Rahul or Rohan ___ present.\nइदर राहुल और रोहन ___ प्रेजेंट।\nया तो राहुल या रोहन उपस्थित है।",
    options: ["is","are","were","have"],
    correctAnswer: "is",
    explanation: "Singular subjects joined by \"Either...or\" take singular verb \"is\".\nइदर...ऑर से जुड़े एकवचन कर्ताओं के साथ \"is\" आता है।\n\"Either...or\" के साथ एकवचन क्रिया (is) का प्रयोग होता है।",
    hint: "Singular choice uses singular verb \"is\".\nis present."
  },
  {
    id: "add3-c4-8",
    classLevel: "4",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Choose the Comparative Degree of \"fast\":\nA train is ___ than a bicycle.\nए ट्रेन इज ___ देन ए बाइसिकल।\nट्रेन साइकिल से तेज होती है।",
    options: ["faster","fastest","fast","more fast"],
    correctAnswer: "faster",
    explanation: "Comparative degree used with \"than\" is \"faster\".\nदेन के साथ तुलना के लिए comparative degree (faster) आता है।\n\"than\" के साथ तुलनात्मक रूप \"faster\" का प्रयोग होता है।",
    hint: "Comparison word ending in -er.\nfaster."
  },
  {
    id: "add3-c4-9",
    classLevel: "4",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Identify the Adverb of Place:\nThe kids are playing outside.\nद किड्स आर प्लेइंग आउटसाइड।\nबच्चे बाहर खेल रहे हैं।",
    options: ["outside","playing","kids","are"],
    correctAnswer: "outside",
    explanation: "\"outside\" tells where the kids are playing (place).\nआउटसाइड खेलने का स्थान बताता है, यह Adverb of Place है।\n\"outside\" (बाहर) क्रिया का स्थान बता रहा है।",
    hint: "Word telling WHERE the action happens.\nस्थान बताने वाला शब्द outside."
  },
  {
    id: "add3-c4-10",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Fill in the correct preposition of time:\nWe wake up early ___ the morning.\nवी वेक अप अर्ली ___ द मॉर्निंग।\nहम सुबह जल्दी उठते हैं।",
    options: ["in","on","at","by"],
    correctAnswer: "in",
    explanation: "Parts of the day like \"the morning\" take preposition \"in\".\nद मॉर्निंग के आगे \"in\" का प्रयोग होता है।\n\"in the morning\" समय के लिए सही प्रयोग है।",
    hint: "Preposition used with \"the morning\".\nin the morning."
  },
  {
    id: "add3-c4-11",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Choose the correct conjunction of reason:\nHe stayed home ___ he was sick.\nही स्टैड होम ___ ही वाज सिक।\nवह घर पर ही रहा क्योंकि वह बीमार था।",
    options: ["because","but","or","so"],
    correctAnswer: "because",
    explanation: "\"because\" gives the reason for staying home.\nबिकॉज़ कारण बताने के लिए आता है।\n\"because\" (क्योंकि) कारण दर्शाने वाला संयोजक है।",
    hint: "Conjunction meaning \"क्योंकि\".\nbecause."
  },
  {
    id: "add3-c4-12",
    classLevel: "4",
    topic: "Active & Passive Voice",
    difficulty: "Easy",
    questionText: "Convert to Passive Voice:\nShe feeds the dog.\nशी फीड्स द डॉग।\nवह कुत्ते को खाना खिलाती है।",
    options: ["The dog is fed by her.","The dog was fed by her.","The dog is feeding by her.","She was fed the dog."],
    correctAnswer: "The dog is fed by her.",
    explanation: "Simple Present Passive: Object + is + V3 (fed) + by + her.\nसिंपल प्रेजेंट पैसिव: इज फैड बाय हर।\nObject (The dog) + is + V3 (fed) + by + her.",
    hint: "Present passive structure: is fed by her.\nThe dog is fed by her."
  },
  {
    id: "add3-c4-13",
    classLevel: "4",
    topic: "Direct & Indirect Speech",
    difficulty: "Easy",
    questionText: "Convert to Indirect Speech:\nHe said, \"I like ice cream.\"\nही सैड, \"आई लाइक आइस क्रीम।\"\nउसने कहा, \"मुझे आइसक्रीम पसंद है।\";",
    options: ["He said that he liked ice cream.","He said that I like ice cream.","He tells that he likes ice cream.","He said he like ice cream."],
    correctAnswer: "He said that he liked ice cream.",
    explanation: "Present simple \"like\" changes to Past simple \"liked\" in indirect speech.\nप्रेजेंट टेंस इनडायरेक्ट स्पीच में पास्ट (liked) बन जाता है।\nDirect से Indirect बनाते समय Tense भूतकाल (liked) में बदलता है।",
    hint: "Change \"like\" to past tense \"liked\".\nthat he liked ice cream."
  },
  {
    id: "add3-c4-14",
    classLevel: "4",
    topic: "Modals & Auxiliaries",
    difficulty: "Easy",
    questionText: "Fill in the modal for ability:\nShe ___ speak three languages fluently.\nशी ___ स्पीक थ्री लैंग्वेजिज फ्लूएंटली।\nवह धाराप्रवाह तीन भाषाएं बोल सकती है।",
    options: ["can","must","should","may"],
    correctAnswer: "can",
    explanation: "\"can\" shows present physical or mental ability.\nक्षमता (ability) दिखाने के लिए \"can\" का प्रयोग होता है।\nयोग्यता दर्शाने के लिए \"can\" (सकना) आता है।",
    hint: "Modal indicating ability: can.\ncan speak."
  },
  {
    id: "add3-c4-15",
    classLevel: "4",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Choose the correctly punctuated sentence:\nWhere is my school bag\nवेयर इज माय स्कूल बैग\nमेरा स्कूल बैग कहां है",
    options: ["Where is my school bag?","Where is my school bag.","where is my school bag!","Where is, my school bag."],
    correctAnswer: "Where is my school bag?",
    explanation: "Question sentences must start with capital letter and end with ?.\nप्रश्नवाचक वाक्य बड़े अक्षर से शुरू होकर ? पर समाप्त होते हैं।\nप्रश्नवाचक वाक्य Capital W से शुरू होकर ? चिन्ह पर समाप्त होता है।",
    hint: "Question starting with capital W ending with question mark.\nWhere is my school bag?"
  },
  {
    id: "add3-c4-16",
    classLevel: "4",
    topic: "Editing & Omission",
    difficulty: "Easy",
    questionText: "Identify the incorrect word in sentence:\nHe run fast yesterday to catch the bus.\nही रन फास्ट यस्टरडे टू कैच द बस।\nवह बस पकड़ने के लिए कल तेज भागा।",
    options: ["Change \"run\" to \"ran\"","Change \"fast\" to \"fastly\"","Change \"catch\" to \"caught\"","No error"],
    correctAnswer: "Change \"run\" to \"ran\"",
    explanation: "\"Yesterday\" requires past simple verb form \"ran\" instead of \"run\".\nयस्टरडे के कारण भूतकाल क्रिया \"ran\" आएगी।\n\"Yesterday\" के साथ Past Tense (ran) का प्रयोग होना चाहिए।",
    hint: "Use past tense \"ran\" for yesterday.\nran fast."
  },
  {
    id: "add3-c4-17",
    classLevel: "4",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Identify the Imperative Sentence:\nPlease pass me the salt.\nप्लीज पास मी द साल्ट।\nकृपया मुझे नमक बढ़ा दें।",
    options: ["Please pass me the salt.","The salt is white.","Do you have salt?","What a salty soup!"],
    correctAnswer: "Please pass me the salt.",
    explanation: "Sentence making a request starting with \"Please\" is Imperative.\nअनुरोध (request) करने वाला वाक्य Imperative होता है।\nप्रार्थना या अनुरोध करने वाला वाक्य Imperative Sentence है।",
    hint: "Request sentence with Please.\nPlease pass me..."
  },
  {
    id: "add3-c4-18",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the Reflexive Pronoun:\nHe hurt himself while playing.\nही हर्ट हिमसेल्फ व्हाइल प्लेइंग।\nखेलते समय उसने खुद को चोट पहुंचा ली।",
    options: ["himself","he","playing","hurt"],
    correctAnswer: "himself",
    explanation: "\"himself\" reflects the action back to subject \"he\", making it a Reflexive Pronoun.\nहिमसेल्फ क्रिया का प्रभाव कर्ता पर वापस दिखाता है।\n\"himself\" कर्ता पर प्रभाव वापस दर्शाता Reflexive Pronoun है।",
    hint: "Self-word for male subject: himself.\nhimself."
  },
  {
    id: "add3-c4-19",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Choose the correct form of \"go\":\nShe ___ to school every day.\nशी ___ टू स्कूल एवरी डे।\nवह रोज स्कूल जाती है।",
    options: ["goes","go","going","went"],
    correctAnswer: "goes",
    explanation: "Routine action (\"every day\") with singular subject \"She\" takes verb \"goes\".\nरोज की आदत के लिए singular verb \"goes\" आता है।\nदैनिक कार्य के लिए \"goes\" (Present Simple) का प्रयोग होता है।",
    hint: "Verb for daily routine with She.\nShe goes."
  },
  {
    id: "add3-c4-20",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Fill in the correct preposition:\nThe ball rolled ___ the bed.\nद बॉल रोल्ड ___ द बैड।\nगेंद बिस्तर के नीचे चली गई।",
    options: ["under","above","on","at"],
    correctAnswer: "under",
    explanation: "\"under\" indicates position below the bed.\nअंडर का अर्थ बिस्तर के नीचे है।\n\"under\" (नीचे) सही स्थिति दर्शाता है।",
    hint: "Preposition meaning beneath: under.\nunder the bed."
  },
  {
    id: "add3-c5-1",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the Uncountable Noun:\nDrink a glass of milk before sleeping.\nड्रिंक ए गिलास ऑफ मिल्क बिफोर स्लीपिंग।\nसोने से पहले एक गिलास दूध पिएं।",
    options: ["milk","glass","sleeping","drink"],
    correctAnswer: "milk",
    explanation: "\"milk\" cannot be counted individually, so it is an Uncountable Noun.\nमिल्क को गिना नहीं जा सकता, इसलिए यह Uncountable Noun है।\n\"milk\" (दूध) की गिनती नहीं की जा सकती, अतः यह Uncountable Noun है।",
    hint: "Word that cannot be counted in numbers.\nजिसकी गिनती न हो सके।"
  },
  {
    id: "add3-c5-2",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Choose the Collective Noun:\nHe lost his ___ of keys at the station.\nही लॉस्ट हिज ___ ऑफ कीज एट द स्टेशन।\nस्टेशन पर उसकी चाबियों का गुच्छा खो गया।",
    options: ["bunch","flock","herd","pack"],
    correctAnswer: "bunch",
    explanation: "A collection of keys is called a \"bunch\".\nचाबियों के समूह को \"bunch\" कहते हैं।\nचाबियों के गुच्छे को \"bunch\" कहा जाता है।",
    hint: "Group name for keys.\nचाबियों का गुच्छा।"
  },
  {
    id: "add3-c5-3",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the Demonstrative Pronoun:\n___ are my favorite shoes.\n___ आर माय फेवरेट शूज़।\nये मेरे पसंदीदा जूते हैं।",
    options: ["These","He","They","My"],
    correctAnswer: "These",
    explanation: "\"These\" points directly to nearby plural objects, making it a Demonstrative Pronoun.\n\"दीज\" पॉइंट्स टू ऑब्जेक्ट्स।\n\"These\" (ये) वस्तुओं की ओर संकेत करता है, अतः यह Demonstrative Pronoun है।",
    hint: "Pointing pronoun for nearby plural items.\nसंकेतवाचक सर्वनाम These."
  },
  {
    id: "add3-c5-4",
    classLevel: "5",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Fill in the correct article:\nMr. Sharma is ___ honest teacher.\nमिस्टर शर्मा इज ___ ऑनेस्ट टीचर।\nमिस्टर शर्मा एक ईमानदार शिक्षक हैं।",
    options: ["an","a","the","no article"],
    correctAnswer: "an",
    explanation: "\"honest\" starts with a silent \"h\" and vowel sound \"o\", taking \"an\".\nऑनेस्ट स्टार्ट्स विद वॉवेल साउंड, सो वी यूज \"an\"।\nHonest में h silent होता है और स्वर ध्वनि आती है, इसलिए \"an\" लगेगा।",
    hint: "Silent H word taking vowel sound takes \"an\".\nHonest के आगे an आएगा।"
  },
  {
    id: "add3-c5-5",
    classLevel: "5",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Identify the Past Continuous Tense:\nThe baby ___ when the phone rang.\nद बेबी ___ व्हेन द फोन रंग।\nजब फोन बजा तब बच्चा सो रहा था।",
    options: ["was sleeping","slept","is sleeping","will sleep"],
    correctAnswer: "was sleeping",
    explanation: "Past Continuous formula: Subject + was/were + verb-ing (was sleeping).\nपास्ट कंटीन्यूअस: वाज + वर्ब-ing।\nwas sleeping Past Continuous Tense दर्शाता है।",
    hint: "Look for \"was + verb-ing\".\nwas sleeping."
  },
  {
    id: "add3-c5-6",
    classLevel: "5",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Choose the Future Simple Tense:\nWe ___ the zoo next Sunday.\nवी ___ द जू नेक्स्ट संडे।\nहम अगले रविवार को चिड़ियाघर जाएंगे।",
    options: ["will visit","visited","are visiting","have visited"],
    correctAnswer: "will visit",
    explanation: "\"next Sunday\" indicates Future Simple Tense (will visit).\n\"नेक्स्ट संडे\" इंडिकेट्स फ्यूचर सिंपल।\n\"will visit\" भविष्य काल की क्रिया को दर्शाता है।",
    hint: "Future action with \"next Sunday\" uses \"will + V1\".\nwill visit."
  },
  {
    id: "add3-c5-7",
    classLevel: "5",
    topic: "Subject-Verb Agreement",
    difficulty: "Easy",
    questionText: "Fill in the correct verb:\nOne of the boys ___ absent today.\nवन ऑफ द बॉयज ___ एब्सेंट टुडे।\nलड़कों में से एक आज अनुपस्थित है।",
    options: ["is","are","were","have"],
    correctAnswer: "is",
    explanation: "\"One of the + plural noun\" takes a SINGULAR verb (is).\n\"वन ऑफ द\" टेक ए सिंगुलर वर्ब (इज)।\n\"One of\" के बाद Noun बहुवचन होता है पर क्रिया एकवचन (is) आती है।",
    hint: "Subject is \"One\", so use singular verb \"is\".\nOne मुख्य कर्ता है, is लगाएं।"
  },
  {
    id: "add3-c5-8",
    classLevel: "5",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Select the Superlative Degree of \"tall\":\nRohan is the ___ boy in our class.\nरोहन इज द ___ बॉय इन अवर क्लास।\nरोहन हमारी कक्षा में सबसे लंबा लड़का है।",
    options: ["tallest","taller","tall","more tall"],
    correctAnswer: "tallest",
    explanation: "Superlative degree used after \"the\" is \"tallest\".\nसुपरलेटिव डिग्री आफ्टर \"द\" इज \"टॉलेस्ट\"।\n\"the\" के बाद Superlative Form \"tallest\" का प्रयोग होता है।",
    hint: "Superlative degree ending in -est.\ntallest."
  },
  {
    id: "add3-c5-9",
    classLevel: "5",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Find the Adverb of Manner:\nThe dancer moved gracefully across the stage.\nद डांसर मूव्ड ग्रेसफुली एक्रॉस द स्टेज।\nनर्तकी मंच पर शालीनता से चली।",
    options: ["gracefully","dancer","stage","moved"],
    correctAnswer: "gracefully",
    explanation: "\"gracefully\" describes how the dancer moved, so it is an Adverb of Manner.\n\"ग्रेसफुली\" शोज़ हाउ द एक्शन वाज डन।\n\"gracefully\" (शालीनता से) नृत्य का तरीका बताता है, अतः Adverb है।",
    hint: "Word ending in -fully that tells manner.\ngracefully."
  },
  {
    id: "add3-c5-10",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Fill in the blank showing movement:\nThe frog jumped ___ the pond.\nद फ्रॉग जम्पड ___ द पॉण्ड।\nमेंढक तालाब में कूद गया।",
    options: ["into","in","on","under"],
    correctAnswer: "into",
    explanation: "Movement from outside to inside a body of water requires \"into\".\nमूवमेंट फ्रॉम आउटसाइड टू इनसाइड रिक्वायर्स \"इनटू\"।\nबाहर से अंदर गति दर्शाने के लिए \"into\" का प्रयोग होता है।",
    hint: "Movement inside water: into.\nगति के साथ अंदर जाने के लिए into."
  },
  {
    id: "add3-c5-11",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Choose the correct conjunction:\n___ he was unwell, he attended the meeting.\n___ ही वाज अनवेल, ही अटेंडेड द मीटिंग।\nयद्यपि वह अस्वस्थ था, फिर भी वह बैठक में शामिल हुआ।",
    options: ["Although","Because","So","Or"],
    correctAnswer: "Although",
    explanation: "\"Although\" expresses contrast between illness and attending the meeting.\n\"ऑलदो\" एक्सप्रेसिज कंट्रास्ट।\n\"Although\" (यद्यपि/हालांकि) विरोधाभास दर्शाने के लिए आता है।",
    hint: "Word meaning \"यद्यपि/हालांकि\".\nAlthough."
  },
  {
    id: "add3-c5-12",
    classLevel: "5",
    topic: "Active & Passive Voice",
    difficulty: "Easy",
    questionText: "Convert to Passive Voice:\nMother baked a tasty cake.\nमदर बेक्ड ए टेस्टी केक।\nमाँ ने एक स्वादिष्ट केक बनाया।",
    options: ["A tasty cake was baked by Mother.","A tasty cake is baked by Mother.","Mother was baked a tasty cake.","A tasty cake baked Mother."],
    correctAnswer: "A tasty cake was baked by Mother.",
    explanation: "Past Simple passive: Object + was + 3rd form (was baked) + by + Subject.\nपास्ट सिंपल पैसिव: वाज बेक्ड बाय।\nwas baked by Mother.",
    hint: undefined
  },
  {
    id: "add3-c5-13",
    classLevel: "5",
    topic: "Direct & Indirect Speech",
    difficulty: "Easy",
    questionText: "Choose the correct Indirect Speech:\nThe teacher said, \"The sun rises in the east.\"\nद टीचर सैड, \"द सन राइजेस इन द ईस्ट।\"\nशिक्षक ने कहा, \"सूर्य पूर्व में उगता है।\"",
    options: ["The teacher said that the sun rises in the east.","The teacher said that the sun rose in the east.","The teacher said that sun will rise in east.","The teacher told sun is rising in east."],
    correctAnswer: "The teacher said that the sun rises in the east.",
    explanation: "Universal facts (sun rises in east) do NOT change tense in indirect speech.\nयूनिवर्सल ट्रुथ का टेंस नहीं बदलता।\nसदा सत्य रहने वाली बात का Tense अपरिवर्तित रहता है।",
    hint: "Universal fact tense stays unchanged.\nrises वैसा ही रहेगा।"
  },
  {
    id: "add3-c5-14",
    classLevel: "5",
    topic: "Modals & Auxiliaries",
    difficulty: "Easy",
    questionText: "Fill in the modal for advice/duty:\nWe ___ respect our elders.\nवी ___ रिस्पेक्ट अवर एल्डर्स।\nहमें अपने बड़ों का सम्मान करना चाहिए।",
    options: ["should","may","could","might"],
    correctAnswer: "should",
    explanation: "\"should\" is used to express duty or moral recommendation.\n\"शुड\" इज यूज्ड फॉर ड्यूटी/एडवाइस।\nकर्तव्य या सलाह के लिए \"should\" (चाहिए) आता है।",
    hint: "Modal meaning \"चाहिए\".\nShould."
  },
  {
    id: "add3-c5-15",
    classLevel: "5",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Choose the sentence with correct possessive punctuation:\nThis is Rohans bicycle.\nदिस इज रोहन्स बाइसिकल।\nयह रोहन की साइकिल है।",
    options: ["This is Rohan's bicycle.","This is Rohans' bicycle.","This is Rohans bicycle.","This is Rohan bicycle."],
    correctAnswer: "This is Rohan's bicycle.",
    explanation: "Possession for a singular name (Rohan) takes apostrophe + s (Rohan's).\nसिंगुलर नाम के बाद एपोस्ट्रॉफी s आता है।\nRohan के बाद apostrophe s ('s) लगेगा।",
    hint: "Use apostrophe s ('s) for Rohan.\nRohan's."
  },
  {
    id: "add3-c5-16",
    classLevel: "5",
    topic: "Editing & Omission",
    difficulty: "Easy",
    questionText: "Spot the error in the sentence:\nHe is senior than me in college.\nही इज सीनियर देन मी इन कॉलेज।\nवह कॉलेज में मुझसे वरिष्ठ है।",
    options: ["Change \"than\" to \"to\"","Change \"senior\" to \"more senior\"","Change \"me\" to \"I\"","No error"],
    correctAnswer: "Change \"than\" to \"to\"",
    explanation: "Adjectives like senior, junior, superior are followed by \"to\", NOT \"than\".\nसीनियर के बाद \"to\" आता है, \"than\" नहीं।\nSenior के बाद preposition \"to\" आता है।",
    hint: "Senior takes \"to\" instead of \"than\".\nsenior to me."
  },
  {
    id: "add3-c5-17",
    classLevel: "5",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Identify the type of sentence:\nClose the door immediately!\nक्लोज़ द डोर इमीडिएट्ली!\nतुरंत दरवाजा बंद करो!",
    options: ["Imperative Sentence","Assertive Sentence","Interrogative Sentence","Exclamatory Sentence"],
    correctAnswer: "Imperative Sentence",
    explanation: "A sentence giving a direct command or request is an Imperative Sentence.\nकमांड या आदेश देने वाला वाक्य इम्परेटिव होता है।\nआदेश देने वाला वाक्य Imperative Sentence कहलाता है।",
    hint: "Command sentence type.\nImperative."
  },
  {
    id: "add3-c5-18",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the Indefinite Pronoun:\n___ left a coat in the hallway.\n___ लेफ्ट ए कोट इन द हॉलवे।\nकिसी ने गलियारे में कोट छोड़ दिया।",
    options: ["Someone","He","She","They"],
    correctAnswer: "Someone",
    explanation: "\"Someone\" refers to an unspecified person, so it is an Indefinite Pronoun.\n\"समवन\" अनिश्चित व्यक्ति को दर्शाता है।\n\"Someone\" अनिश्चित व्यक्ति का बोध कराता है।",
    hint: "Unspecified person pronoun: Someone.\nSomeone."
  },
  {
    id: "add3-c5-19",
    classLevel: "5",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Choose the Past Simple form of \"bring\":\nHe ___ a new toy yesterday.\nही ___ ए न्यू खिलौना यस्टरडे।\nवह कल एक नया खिलौना लाया।",
    options: ["brought","bringed","brang","bringing"],
    correctAnswer: "brought",
    explanation: "The past form (V2) of \"bring\" is \"brought\".\nद पास्ट फॉर्म ऑफ ब्रिंग इज \"ब्रॉट\"।\nBring की भूतकाल क्रिया \"brought\" होती है।",
    hint: "V2 of bring: brought.\nbrought."
  },
  {
    id: "add3-c5-20",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Fill in the correct preposition of time:\nThe train will arrive ___ 5 o'clock.\nद ट्रेन विल अराइव ___ 5 ओ क्लॉक।\nट्रेन 5 बजे पहुंचेगी।",
    options: ["at","in","on","by"],
    correctAnswer: "at",
    explanation: "Specific points of time (5 o'clock) take preposition \"at\".\nनिश्चित समय के आगे \"at\" लगता है।\nसटीक समय बताने के लिए \"at\" का प्रयोग होता है।",
    hint: "Exact clock time uses \"at\".\nat 5 o'clock."
  },
  {
    id: "add3-c6-1",
    classLevel: "6",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the Material Noun:\nGold is a precious yellow metal.\nगोल्ड इज ए प्रेशियस येलो मेटल।\nसोना एक कीमती पीली धातु है।",
    options: ["Gold","metal","precious","yellow"],
    correctAnswer: "Gold",
    explanation: "\"Gold\" is a material substance from which things are made, so it is a Material Noun.\nगोल्ड इज ए मटेरियल सब्सटेंस।\n\"Gold\" एक धातु/पदार्थ का नाम है, इसलिए यह Material Noun है।",
    hint: "Substance noun: Gold.\nधातु का नाम Gold."
  },
  {
    id: "add3-c6-2",
    classLevel: "6",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the Emphatic Pronoun:\nI myself finished the entire project.\nआई मायसेल्फ फिनिश्ड द एंटायर प्रोजेक्ट।\nमैंने खुद पूरा प्रोजेक्ट खत्म किया।",
    options: ["myself","I","project","finished"],
    correctAnswer: "myself",
    explanation: "\"myself\" placed right after subject \"I\" to add emphasis is an Emphatic Pronoun.\nमायसेल्फ सब्जेक्ट पर जोर देने के लिए प्रयोग हुआ है।\nकर्ता के तुरंत बाद जोर देने के लिए प्रयुक्त \"myself\" Emphatic Pronoun है।",
    hint: "Self pronoun used for emphasis.\nmyself."
  },
  {
    id: "add3-c6-3",
    classLevel: "6",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Fill in the correct article:\n___ Pacific Ocean is the largest ocean on Earth.\n___ पैसिफिक ओशिन इज द लार्जेस्ट ओशिन ऑन अर्थ।\nप्रशांत महासागर पृथ्वी का सबसे बड़ा महासागर है।",
    options: ["The","A","An","No article"],
    correctAnswer: "The",
    explanation: "Names of oceans (Pacific Ocean) always take article \"The\".\nमहासागरों के नाम के आगे \"The\" आता है।\nमहासागरों के नाम के पहले सदैव \"The\" का प्रयोग होता है।",
    hint: "Ocean names require \"The\".\nThe Pacific Ocean."
  },
  {
    id: "add3-c6-4",
    classLevel: "6",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Choose the Present Perfect Tense:\nShe ___ her homework just now.\nशी ___ हर होमवर्क जस्ट नाउ।\nउसने अभी-अभी अपना गृहकार्य पूरा किया है।",
    options: ["has completed","completed","is completing","will complete"],
    correctAnswer: "has completed",
    explanation: "Present Perfect formula: Subject + has/have + V3 (has completed).\nप्रेजेंट परफेक्ट: हैज + 3rd फॉर्म।\nhas completed Present Perfect Tense है।",
    hint: "has + V3 for recent past completion.\nhas completed."
  },
  {
    id: "add3-c6-5",
    classLevel: "6",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the Past Perfect verb form:\nThe bus ___ before I reached the stand.\nद बस ___ बिफोर आई रीच्ड द स्टैंड।\nमेरे स्टैंड पहुंचने से पहले बस जा चुकी थी।",
    options: ["had left","left","has left","was leaving"],
    correctAnswer: "had left",
    explanation: "An action completed before another past action takes Past Perfect (had left).\nपहले पूरा हुआ कार्य Past Perfect (had left) में रहता है।\nhad left भूतकाल में पहले हुए कार्य को दर्शाता है।",
    hint: "Earlier past action uses \"had + V3\".\nhad left."
  },
  {
    id: "add3-c6-6",
    classLevel: "6",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct verb form:\nNeither Rohan nor his friends ___ coming.\nनीदर रोहन नोर हिज फ्रेंड्स ___ कमिंग।\nन तो रोहन और न ही उसके दोस्त आ रहे हैं।",
    options: ["are","is","was","has"],
    correctAnswer: "are",
    explanation: "With \"Neither... nor\", verb agrees with nearest subject (\"his friends\" - plural -> are).\nपास वाले सब्जेक्ट (his friends) के अनुसार verb plural \"are\" होगी।\n\"Neither...nor\" में क्रिया पास वाले कर्ता (his friends) के अनुसार \"are\" होगी।",
    hint: "Verb agrees with plural \"his friends\".\nare coming."
  },
  {
    id: "add3-c6-7",
    classLevel: "6",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Choose the comparative adjective:\nMy health is ___ today than it was yesterday.\nमाय हेल्थ इज ___ टुडे देन इट वाज यस्टरडे।\nमेरा स्वास्थ्य कल की तुलना में आज बेहतर है।",
    options: ["better","good","best","more good"],
    correctAnswer: "better",
    explanation: "Comparative degree of \"good\" before \"than\" is \"better\".\nगुड का कंपरेटिव रूप \"better\" होता है।\nGood का Comparative Degree \"better\" है।",
    hint: "Comparative form of good.\nbetter."
  },
  {
    id: "add3-c6-8",
    classLevel: "6",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the Adverb of Frequency:\nHe always speaks the truth.\nही ऑलवेज स्पीक्स द ट्रुथ।\nवह हमेशा सच बोलता है।",
    options: ["always","speaks","truth","he"],
    correctAnswer: "always",
    explanation: "\"always\" shows how frequently an action happens, so it is an Adverb of Frequency.\nऑलवेज कार्य की आवृत्ति दर्शाता है।\n\"always\" (हमेशा) कार्य की बारंबारता बताता है, अतः Adverb of Frequency है।",
    hint: "Frequency word meaning \"हमेशा\".\nalways."
  },
  {
    id: "add3-c6-9",
    classLevel: "6",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank:\nShe sat ___ me in the library.\nशी सैट ___ मी इन द लाइब्रेरी।\nवह पुस्तकालय में मेरे बगल में बैठी।",
    options: ["beside","besides","between","among"],
    correctAnswer: "beside",
    explanation: "\"beside\" means by the side of, whereas \"besides\" means in addition to.\nबिसाइड का अर्थ \"बगल में\" होता है।\n\"beside\" का अर्थ \"बगल में\" है।",
    hint: "Preposition meaning \"by the side of\": beside.\nbeside me."
  },
  {
    id: "add3-c6-10",
    classLevel: "6",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the correlative conjunction:\nNot only was he intelligent ___ also very humble.\nनॉट ओनली वाज ही इंटेलिजेंट ___ ऑल्सो वेरी हम्बल।\nवह न केवल बुद्धिमान था बल्कि बहुत नम्र भी था।",
    options: ["but","and","yet","so"],
    correctAnswer: "but",
    explanation: "The pair for \"Not only\" is \"but also\".\nनॉट ओनली का जोड़ा \"but also\" है।\n\"Not only\" के साथ \"but also\" का जोड़ा बनता है।",
    hint: "Pairing word for Not only: but.\nbut also."
  },
  {
    id: "add3-c6-11",
    classLevel: "6",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Passive Voice:\nI write an email.\nआई राइट एन ईमेल।\nमैं एक ईमेल लिखता हूँ।",
    options: ["An email is written by me.","An email was written by me.","An email is wrote by me.","I am written an email."],
    correctAnswer: "An email is written by me.",
    explanation: "Simple Present Passive: Object + is + V3 (is written) + by + me.\nसिंपल प्रेजेंट पैसिव: इज रिटन बाय मी।\nis written by me.",
    hint: undefined
  },
  {
    id: "add3-c6-12",
    classLevel: "6",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert to Indirect Speech:\nHe said to me, \"Please help me.\"\nही सैड टू मी, \"प्लीज हेल्प मी।\"\nउसने मुझसे कहा, \"कृपया मेरी मदद करो।\"",
    options: ["He requested me to help him.","He ordered me to help him.","He said me that please help.","He asked me if I helped him."],
    correctAnswer: "He requested me to help him.",
    explanation: "\"Please\" in imperative speech changes to reporting verb \"requested + object + to + V1\".\nप्लीज के लिए \"requested\" का प्रयोग होता है।\n\"Please\" वाले प्रार्थना सूचक वाक्य में \"requested... to help\" आता है।",
    hint: "\"Please\" converts to \"requested\".\nHe requested me to help him."
  },
  {
    id: "add3-c6-13",
    classLevel: "6",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the modal for strict obligation:\nYou ___ follow the safety rules.\nयू ___ फॉलो द सेफ्टी रूल्स।\nआपको सुरक्षा नियमों का पालन अवश्य करना चाहिए।",
    options: ["must","may","could","might"],
    correctAnswer: "must",
    explanation: "\"must\" indicates absolute compulsion and official safety rules.\nसुरक्षा नियमों की अनिवार्यता के लिए must आता है।\nअनिवार्य नियम के लिए \"must\" का प्रयोग होता है।",
    hint: "Modal for mandatory safety rule: must.\nmust follow."
  },
  {
    id: "add3-c6-14",
    classLevel: "6",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Choose the correct sentence:\nThe list of items are long.\nद लिस्ट ऑफ आइटम्स आर लॉन्ग।\nसामानों की सूची लंबी है।",
    options: ["The list of items is long.","The list of items are long.","The lists of item were long.","The list of items have long."],
    correctAnswer: "The list of items is long.",
    explanation: "The subject is singular \"list\", so the verb must be singular \"is\".\nसब्जेक्ट \"list\" एकवचन है, इसलिए verb \"is\" होगी।\nमुख्य कर्ता \"list\" एकवचन है, अतः \"is\" आएगा।",
    hint: "Main subject is \"list\" (singular).\nThe list of items is long."
  },
  {
    id: "add3-c6-15",
    classLevel: "6",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Find the missing preposition:\nPlease listen ___ what the teacher says.\nप्लीज लिसन ___ व्हाट द टीचर सेज़।\nकृपया शिक्षक की बात सुनो।",
    options: ["to","at","on","with"],
    correctAnswer: "to",
    explanation: "Verb \"listen\" is followed by preposition \"to\" (listen to someone).\nलिसन के बाद \"to\" का प्रयोग होता है।\n\"Listen\" के बाद हमेशा Preposition \"to\" आता है।",
    hint: "Listen takes preposition \"to\".\nlisten to."
  },
  {
    id: "add3-c6-16",
    classLevel: "6",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Transform into Interrogative:\nHe is a great singer.\nही इज ए ग्रेट सिंगर।\nवह एक महान गायक है।",
    options: ["Is he a great singer?","He is not a great singer?","Does he a great singer?","Was he a great singer?"],
    correctAnswer: "Is he a great singer?",
    explanation: "Bring auxiliary verb \"Is\" to the front for interrogative sentence.\nहेल्पिंग वर्ब Is को आगे लाकर प्रश्न बनाएं।\nसहायक क्रिया \"Is\" को आगे रखकर प्रश्नवाचक वाक्य बनता है।",
    hint: "Start question with helping verb \"Is\".\nIs he a great singer?"
  },
  {
    id: "add3-c6-17",
    classLevel: "6",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the Transitive Verb in sentence:\nShe baked a delicious chocolate cake.\nशी बेक्ड ए डिलीशियस चॉकलेट केक।\nउसने एक स्वादिष्ट चॉकलेट केक बनाया।",
    options: ["baked","cake","delicious","she"],
    correctAnswer: "baked",
    explanation: "\"baked\" takes a direct object \"cake\", so it is a Transitive Verb.\nबेक्ड का कर्म \"cake\" है, अतः यह सकर्मक क्रिया है।\n\"baked\" का कर्म (object) cake है, इसलिए यह Transitive Verb है।",
    hint: "Verb taking direct object \"cake\": baked.\nbaked."
  },
  {
    id: "add3-c6-18",
    classLevel: "6",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the Adverb of Degree:\nIt is extremely cold outside today.\nइट इज एक्सट्रीमली कोल्ड आउटसाइड टुडे।\nआज बाहर अत्यधिक ठंड है।",
    options: ["extremely","cold","outside","today"],
    correctAnswer: "extremely",
    explanation: "\"extremely\" shows the intensity or degree of coldness.\nएक्सट्रीमली ठंड की तीव्रता बता रहा है।\n\"extremely\" (अत्यधिक) ठंड की तीव्रता बता रहा है, अतः Adverb of Degree है।",
    hint: "Word telling how cold it is: extremely.\nextremely."
  },
  {
    id: "add3-c6-19",
    classLevel: "6",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank:\nWe have lived in Delhi ___ 2015.\nवी हैव लिव्ड इन दिल्ली ___ 2015।\nहम 2015 से दिल्ली में रह रहे हैं।",
    options: ["since","for","from","by"],
    correctAnswer: "since",
    explanation: "Specific starting point of time (2015) takes \"since\".\nनिश्चित वर्ष के पहले \"since\" आता है।\nनिश्चित समय बिन्दु (2015) के लिए \"since\" का प्रयोग होता है।",
    hint: "Exact starting year uses \"since\".\nsince 2015."
  },
  {
    id: "add3-c6-20",
    classLevel: "6",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the correct punctuation:\nI bought apples bananas grapes and oranges.\nआई बॉट एप्पल्स बनानाज़ ग्रेप्स एंड ऑरेंजेज।\nमैंने सेब, केले, अंगूर और संतरे खरीदे।",
    options: ["I bought apples, bananas, grapes, and oranges.","I bought apples bananas grapes and oranges.","I bought apples; bananas; grapes and oranges.","I bought apples! bananas! grapes! and oranges."],
    correctAnswer: "I bought apples, bananas, grapes, and oranges.",
    explanation: "Items in a list are separated by commas.\nलिस्ट की वस्तुओं को कॉमा से अलग किया जाता है।\nसूची के शब्दों को अल्पविराम (Comma) से अलग किया जाता है।",
    hint: "Use commas between list items.\nUse commas."
  },
  {
    id: "add3-c7-1",
    classLevel: "7",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Choose the correct Relative Pronoun:\nThis is the doctor ___ treated my uncle.\nदिस इज द डॉक्टर ___ ट्रीटेड माय अंकल।\nयह वह डॉक्टर है जिसने मेरे चाचा का इलाज किया।",
    options: ["who","which","whom","whose"],
    correctAnswer: "who",
    explanation: "\"who\" is the relative pronoun used for person/doctor acting as subject.\nव्यक्तियों के लिए Relative Pronoun \"who\" आता है।\nव्यक्ति (Doctor) के लिए सम्बन्धवाचक सर्वनाम \"who\" आता है।",
    hint: "Relative pronoun for people: who.\nwho."
  },
  {
    id: "add3-c7-2",
    classLevel: "7",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Select the Present Perfect Continuous tense:\nShe ___ for three hours.\nशी ___ फॉर थ्री आवर्स।\nवह तीन घंटे से पढ़ाई कर रही है।",
    options: ["has been studying","is studying","studied","had studied"],
    correctAnswer: "has been studying",
    explanation: "Structure: Subject + has been + verb-ing + for (has been studying).\nहैज बीन + ing प्रेजेंट परफेक्ट कंटीन्यूअस है।\nhas been studying समय अवधि के साथ जारी कार्य बताता है।",
    hint: "has been + V-ing + for 3 hours.\nhas been studying."
  },
  {
    id: "add3-c7-3",
    classLevel: "7",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct verb:\nMathematics ___ my favorite subject.\nमैथमेटिक्स ___ माय फेवरेट सब्जेक्ट।\nगणित मेरा पसंदीदा विषय है।",
    options: ["is","are","were","have"],
    correctAnswer: "is",
    explanation: "Subject names ending in \"s\" (Mathematics) take singular verb \"is\".\nगणित विषय का नाम एकवचन है, verb \"is\" होगी।\nविषयों के नाम (Mathematics) एकवचन होते हैं, अतः \"is\" आएगा।",
    hint: "Subject name is singular -> use \"is\".\nMathematics is."
  },
  {
    id: "add3-c7-4",
    classLevel: "7",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Choose the correct order of adjectives:\nHe bought a ___ table.\nही बॉट ए ___ टेबल।\nउसने एक छोटी गोल लकड़ी की मेज खरीदी।",
    options: ["small round wooden","wooden round small","round small wooden","small wooden round"],
    correctAnswer: "small round wooden",
    explanation: "Adjective order: Size (small) + Shape (round) + Material (wooden).\nविशेषण का क्रम: आकार + आकृति + पदार्थ।\nविशेषण का सही क्रम: Size -> Shape -> Material.",
    hint: "Size (small) -> Shape (round) -> Material (wooden).\nsmall round wooden."
  },
  {
    id: "add3-c7-5",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the correct preposition:\nThey congratulated him ___ passing the exam.\nदे कांग्रेचुलेटेड हिम ___ पासिंग द एग्जाम।\nउन्होंने उसे परीक्षा पास करने पर बधाई दी।",
    options: ["on","for","at","with"],
    correctAnswer: "on",
    explanation: "Verb \"congratulate\" takes preposition \"on\" (congratulate on).\nकांग्रेचुलेट के बाद \"on\" आता है।\n\"Congratulate\" के साथ Preposition \"on\" आता है।",
    hint: "Congratulate is followed by \"on\".\ncongratulated on."
  },
  {
    id: "add3-c7-6",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the correct conjunction:\n___ you work hard, you cannot clear the cutoff.\n___ यू वर्क हार्ड, यू कैननॉट क्लियर द कटऑफ।\nजब तक आप कड़ी मेहनत नहीं करेंगे, आप कटऑफ पास नहीं कर सकते।",
    options: ["Unless","If","Because","While"],
    correctAnswer: "Unless",
    explanation: "\"Unless\" means \"if not\", expressing negative condition.\nअनलेस का अर्थ \"यदि नहीं\" होता है।\n\"Unless\" (जब तक कि... नहीं) नकारात्मक शर्त दर्शाता है।",
    hint: "Negative conditional conjunction: Unless.\nUnless."
  },
  {
    id: "add3-c7-7",
    classLevel: "7",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert modal sentence to Passive Voice:\nYou can solve this puzzle.\nयू कैन सॉल्व दिस पजल।\nआप इस पहेली को हल कर सकते हैं।",
    options: ["This puzzle can be solved by you.","This puzzle can solved by you.","This puzzle is solved by you.","This puzzle could be solved by you."],
    correctAnswer: "This puzzle can be solved by you.",
    explanation: "Passive of modal \"can\": Object + can be + V3 (can be solved) + by + Subject.\nकैन का पैसिव \"can be + V3\" होता है।\ncan + be + 3rd form (can be solved).",
    hint: undefined
  },
  {
    id: "add3-c7-8",
    classLevel: "7",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert question to Indirect Speech:\nHe asked, \"Do you know the answer?\"\nही आस्क्ड, \"डू यू नो द आंसर?\"\nउसने पूछा, \"क्या तुम उत्तर जानते हो?\"",
    options: ["He asked if I knew the answer.","He asked that did I know the answer.","He asked if I know the answer.","He told whether I knew the answer."],
    correctAnswer: "He asked if I knew the answer.",
    explanation: "Yes/No questions in indirect speech use \"if/whether\" + assertive structure (I knew).\nप्रश्नवाचक वाक्यों में connector \"if\" आता है और tense change होता है।\n\"if\" लगाकर वाक्य को साधारण भूतकाल में बदलें।",
    hint: "Use \"if\" and change present to past.\nif I knew."
  },
  {
    id: "add3-c7-9",
    classLevel: "7",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the modal for moral obligation:\nWe ___ help the poor and needy.\nवी ___ हेल्प द पूर एंड नीडी।\nहमें गरीबों और जरूरतमंदों की मदद करनी चाहिए।",
    options: ["ought to","may","could","might"],
    correctAnswer: "ought to",
    explanation: "\"ought to\" expresses moral duty or social obligation.\nनैतिक कर्तव्य के लिए \"ought to\" का प्रयोग होता है।\nनैतिक कर्तव्य (Moral Duty) दर्शाने के लिए \"ought to\" आता है।",
    hint: "Moral duty modal ending in \"to\": ought to.\nought to."
  },
  {
    id: "add3-c7-10",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Correct the grammatical error:\nNeither of the boys were present.\nनीदर ऑफ द बॉयज वर प्रेजेंट।\nदोनों लड़कों में से कोई भी मौजूद नहीं था।",
    options: ["Change \"were\" to \"was\"","Change \"boys\" to \"boy\"","Change \"Neither\" to \"Either\"","No error"],
    correctAnswer: "Change \"were\" to \"was\"",
    explanation: "\"Neither of\" strictly takes a SINGULAR verb (was).\nनीदर ऑफ के बाद क्रिया एकवचन (was) होती है।\n\"Neither of\" के बाद Singular Verb (was) का प्रयोग होता है।",
    hint: "Neither of uses singular verb \"was\".\nwas present."
  },
  {
    id: "add3-c7-11",
    classLevel: "7",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Complete the sentence structure:\nHardly had I arrived at the station ___ the train started.\nहार्डली हैड आई अराइव्ड एट द स्टेशन ___ द ट्रेन स्टार्टेड।\nमैं स्टेशन पहुँचा ही था कि ट्रेन चल दी।",
    options: ["when","than","then","before"],
    correctAnswer: "when",
    explanation: "Adverb \"Hardly\" is paired with conjunction \"when\".\nहार्डली के साथ कंजंक्शन \"when\" का जोड़ा बनता है।\n\"Hardly\" के साथ हमेशा \"when\" का जोड़ा बनता है।",
    hint: "Hardly pairs with \"when\".\nHardly had... when."
  },
  {
    id: "add3-c7-12",
    classLevel: "7",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the Gerund in the sentence:\nSwimming is a healthy physical exercise.\nस्विमिंग इज ए हेल्दी फिजिकल एक्सरसाइज।\nतैराकी एक स्वस्थ शारीरिक व्यायाम है।",
    options: ["Swimming","exercise","healthy","physical"],
    correctAnswer: "Swimming",
    explanation: "\"Swimming\" is a verb + ing functioning as a Noun subject, so it is a Gerund.\nवर्ब + ing जो नाउन का कार्य करे उसे Gerund कहते हैं।\n\"Swimming\" यहाँ संज्ञा के रूप में प्रयुक्त Gerund है।",
    hint: "Verb + ing acting as noun subject: Swimming.\nSwimming."
  },
  {
    id: "add3-c7-13",
    classLevel: "7",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the Infinitive:\nHe decided to purchase a new laptop.\nही डिसाइडेड टू परचेस ए न्यू लैपटॉप।\nउसने एक नया लैपटॉप खरीदने का फैसला किया।",
    options: ["to purchase","decided","laptop","new"],
    correctAnswer: "to purchase",
    explanation: "\"to + V1\" (to purchase) functions as an Infinitive.\n\"to + V1\" को Infinitive कहते हैं।\n\"to + V1\" (to purchase) Infinitive है।",
    hint: "to + base verb form: to purchase.\nto purchase."
  },
  {
    id: "add3-c7-14",
    classLevel: "7",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the underlined clause type:\nHe passed the exam <because he studied hard>.\nही पास्ड द एग्जाम बिकॉज ही स्टडीड हार्ड।\nवह परीक्षा में पास हो गया क्योंकि उसने कड़ी पढ़ाई की थी।",
    options: ["Adverb Clause of Reason","Noun Clause","Adjective Clause","Relative Clause"],
    correctAnswer: "Adverb Clause of Reason",
    explanation: "Clause starting with \"because\" giving reason is an Adverb Clause of Reason.\nकारण बताने वाला क्लॉज Adverb Clause of Reason है।\n\"because\" से शुरू होकर कारण बताने वाला वाक्य Adverb Clause of Reason है।",
    hint: "Clause giving reason starting with because.\nAdverb Clause of Reason."
  },
  {
    id: "add3-c7-15",
    classLevel: "7",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Choose the correct article usage:\n___ gold of South Africa is famous worldwide.\n___ गोल्ड ऑफ साउथ अफ्रीका इज फेमस वर्ल्डवाइड।\nदक्षिण अफ्रीका का सोना दुनिया भर में प्रसिद्ध है।",
    options: ["The","A","An","No article"],
    correctAnswer: "The",
    explanation: "Specific gold (gold of South Africa) takes article \"The\".\nविशेष स्थान के सोने (Gold of South Africa) के आगे \"The\" आता है।\nविशिष्टीकृत Material Noun के पहले \"The\" का प्रयोग होता है।",
    hint: "Specific gold from South Africa takes \"The\".\nThe gold of..."
  },
  {
    id: "add3-c7-16",
    classLevel: "7",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Complete the First Conditional sentence:\nIf it rains tomorrow, we ___ at home.\nइफ इट रेन्स टुमारो, वी ___ एट होम।\nअगर कल बारिश होगी, तो हम घर पर रहेंगे।",
    options: ["will stay","stayed","would stay","have stayed"],
    correctAnswer: "will stay",
    explanation: "First Conditional structure: If + Simple Present (rains), Main clause uses Simple Future (will stay).\nइफ वाले क्लॉज में Present तो मुख्य में Future होगा।\nIf-clause में Present Tense होने पर Main Clause में \"will + V1\" आता है।",
    hint: "If + Present Simple -> Main clause uses \"will + V1\".\nwill stay."
  },
  {
    id: "add3-c7-17",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Choose the correct phrasal verb meaning \"to take care of\":\nShe will ___ her younger brother while mother is away.\nशी विल ___ हर यंगर ब्रदर व्हाइल मदर इज अवे।\nमां के बाहर रहने पर वह अपने छोटे भाई की देखरेख करेगी।",
    options: ["look after","look for","look into","look at"],
    correctAnswer: "look after",
    explanation: "\"look after\" means to care for someone.\nदेखभाल करने के लिए \"look after\" आता है।\n\"look after\" का अर्थ देखभाल करना होता है।",
    hint: "Phrasal verb for caring: look after.\nlook after."
  },
  {
    id: "add3-c7-18",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the correct preposition:\nI prefer milk ___ tea.\nआई प्रेफर मिल्क ___ टी।\nमैं चाय की तुलना में दूध अधिक पसंद करता हूँ।",
    options: ["to","than","over","from"],
    correctAnswer: "to",
    explanation: "Verb \"prefer\" takes preposition \"to\" for comparison.\nप्रेफर के साथ \"to\" आता है।\n\"Prefer\" के साथ तुलना के लिए सदैव \"to\" का प्रयोग होता है।",
    hint: "Prefer is followed by \"to\".\nprefer milk to tea."
  },
  {
    id: "add3-c7-19",
    classLevel: "7",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert imperative command to Passive:\nOpen the gate.\nओपन द गेट।\nदरवाजा खोलो।",
    options: ["Let the gate be opened.","The gate should open.","Let open the gate.","You are open the gate."],
    correctAnswer: "Let the gate be opened.",
    explanation: "Passive of imperative command: Let + Object + be + V3 (Let the gate be opened).\nइम्परेटिव पैसिव: लेट + ऑब्जेक्ट + बी + V3।\nLet + object + be + 3rd form.",
    hint: undefined
  },
  {
    id: "add3-c7-20",
    classLevel: "7",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert exclamatory sentence to Indirect:\nShe said, \"Hurrah! We won the trophy.\"\nशी सैड, \"हुर्रा! वी वोन द ट्रॉफी।\"\nउसने कहा, \"हुर्रे! हमने ट्रॉफी जीत ली।\"",
    options: ["She exclaimed with joy that they had won the trophy.","She said with joy that we won trophy.","She exclaimed that they win the trophy.","She told hurrah they had won trophy."],
    correctAnswer: "She exclaimed with joy that they had won the trophy.",
    explanation: "\"Hurrah!\" expresses happiness, so it changes to \"exclaimed with joy that + Past Perfect\".\nहुर्रा के लिए \"exclaimed with joy\" आता है।\n\"Hurrah!\" के स्थान पर \"exclaimed with joy\" का प्रयोग होता है।",
    hint: "Hurrah! turns into \"exclaimed with joy\".\nexclaimed with joy."
  },
  {
    id: "add3-c8-1",
    classLevel: "8",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Choose the Future Perfect Tense:\nBy this time tomorrow, I ___ my final report.\nबाय दिस टाइम टुमारो, आई ___ माय फाइनल रिपोर्ट।\nकल इस समय तक, मैं अपनी अंतिम रिपोर्ट पूरी कर चुका हूँगा।",
    options: ["will have completed","will complete","am completing","completed"],
    correctAnswer: "will have completed",
    explanation: "\"By this time tomorrow\" indicates Future Perfect (will have completed).\nविल हैव + 3rd फॉर्म का प्रयोग भविष्य में समय सीमा तक पूरा होने वाले कार्य के लिए होता है।\nwill have + V3 Future Perfect Tense दर्शाता है।",
    hint: "Look for \"will have + V3\".\nwill have completed."
  },
  {
    id: "add3-c8-2",
    classLevel: "8",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the correct verb form:\nEach of the participants ___ awarded a certificate.\nईच ऑफ द पार्टिसिपेंट्स ___ अवार्डेड ए सर्टिफिकेट।\nप्रत्येक प्रतिभागी को प्रमाण पत्र प्रदान किया गया।",
    options: ["was","were","have been","are"],
    correctAnswer: "was",
    explanation: "\"Each of + plural noun\" strictly takes a SINGULAR verb (was).\nईच ऑफ के बाद क्रिया एकवचन (was) आती है।\n\"Each of\" के साथ हमेशा एकवचन क्रिया (was) आती है।",
    hint: "Subject \"Each\" takes singular verb \"was\".\nwas awarded."
  },
  {
    id: "add3-c8-3",
    classLevel: "8",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the Participle in sentence:\nHearing the sudden siren, the thief ran away.\nहियरिंग द सडन सायरन, द थीफ रैन अवे।\nअचानक सायरन सुनकर चोर भाग गया।",
    options: ["Hearing","siren","thief","ran"],
    correctAnswer: "Hearing",
    explanation: "\"Hearing\" is a Present Participle functioning as a participial adjective/clause.\nहियरिंग यहाँ Participle (कृदंत) के रूप में प्रयुक्त हुआ है।\n\"Hearing\" कार्य की निरंतरता/संबद्धता दर्शाने वाला Present Participle है।",
    hint: "V-ing acting as participle: Hearing.\nHearing."
  },
  {
    id: "add3-c8-4",
    classLevel: "8",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the correct preposition:\nHe died ___ malaria after a brief illness.\nही डाइड ___ मलेरिया आफ्टर ए ब्रीफ इलनेस।\nसंक्षिप्त बीमारी के बाद मलेरिया से उसकी मृत्यु हो गई।",
    options: ["of","from","with","by"],
    correctAnswer: "of",
    explanation: "Dying of a specific disease takes preposition \"of\" (die of disease).\nबीमारी से मृत्यु होने पर \"die of\" का प्रयोग होता है।\nकिसी बीमारी से मृत्यु होने पर \"die of\" आता है।",
    hint: "Dying from disease takes \"of\".\ndied of malaria."
  },
  {
    id: "add3-c8-5",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Transform using \"too... to\":\nHe is so weak that he cannot lift the bag.\nही इज सो वीक दैट ही कैननॉट लिफ्ट द बैग।\nवह इतना कमजोर है कि वह बैग नहीं उठा सकता।",
    options: ["He is too weak to lift the bag.","He is weak too to lift the bag.","He is too weak that lift bag.","He is so weak to lift bag."],
    correctAnswer: "He is too weak to lift the bag.",
    explanation: "Transformation structure: \"so... that cannot\" changes to \"too... to\".\nसो...दैट कैननॉट बदलकर too... to हो जाता है।\n\"so...that...cannot\" का परिवर्तन \"too...to\" में होता है।",
    hint: "Structure: Subject + is + too + adj + to + V1.\ntoo weak to lift."
  },
  {
    id: "add3-c8-6",
    classLevel: "8",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert double object sentence to Passive Voice:\nHe gave me a valuable gold watch.\nही गेव मी ए वैल्यूएबल गोल्ड वॉच।\nउसने मुझे एक कीमती सोने की घड़ी दी।",
    options: ["I was given a valuable gold watch by him.","A valuable gold watch gave me by him.","I was gave a valuable watch by him.","He was given a watch by me."],
    correctAnswer: "I was given a valuable gold watch by him.",
    explanation: "Passive with indirect object \"me\": I + was + V3 (was given) + direct object + by + him.\nइनडायरेक्ट ऑब्जेक्ट I को कर्ता बनाकर \"was given\" लगाएं।\n\"I was given a...\" सही संरचना है।",
    hint: "Start with indirect object \"I\": I was given...\nI was given."
  },
  {
    id: "add3-c8-7",
    classLevel: "8",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert command to Indirect Speech:\nThe doctor said to the patient, \"Take this medicine twice daily.\"\nद डॉक्टर सैड टू द पेशेंट, \"टेक दिस मेडिसिन ट्वाइस डेली।\"\nडॉक्टर ने मरीज से कहा, \"यह दवा दिन में दो बार लें।\";",
    options: ["The doctor advised the patient to take that medicine twice daily.","The doctor ordered the patient that take medicine twice daily.","The doctor told the patient to take this medicine.","The doctor asked patient taking medicine twice."],
    correctAnswer: "The doctor advised the patient to take that medicine twice daily.",
    explanation: "Doctor's advice uses reporting verb \"advised + object + to + V1\" and \"this\" changes to \"that\".\nडॉक्टर की सलाह के लिए \"advised\" और \"this\" -> \"that\" होता है।\nMedical advice के लिए advised और this का बदलकर that होना अनिवार्य है।",
    hint: "Doctor advice uses \"advised\" and \"this\" turns to \"that\".\nadvised... to take that medicine."
  },
  {
    id: "add3-c8-8",
    classLevel: "8",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the modal for preference:\nI ___ stay at home than go out in the rain.\nआई ___ स्टे एट होम देन गो आउट इन द रेन।\nमैं बारिश में बाहर जाने के बजाय घर पर रहना पसंद करूँगा।",
    options: ["would rather","should","could","must"],
    correctAnswer: "would rather",
    explanation: "\"would rather\" expresses strong personal preference over an alternative.\nपसंद/प्राथमिकता के लिए \"would rather\" का प्रयोग होता है।\nतुलनात्मक प्राथमिकता दर्शाने के लिए \"would rather\" आता है।",
    hint: "Expression for preference before \"than\": would rather.\nwould rather."
  },
  {
    id: "add3-c8-9",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Identify the error in tense sequence:\nHe told me that he will come tomorrow.\nही टोल्ड मी दैट ही विल कम टुमारो।\nउसने मुझसे कहा कि वह कल आएगा।",
    options: ["Change \"will\" to \"would\"","Change \"told\" to \"tells\"","Change \"come\" to \"came\"","No error"],
    correctAnswer: "Change \"will\" to \"would\"",
    explanation: "Past reporting verb \"told\" requires future-in-past modal \"would\", NOT \"will\".\nपास्ट रिपोर्टिंग वर्ब टोल्ड के साथ \"will\" बदलकर \"would\" होता है।\nभूतकाल रिपोर्टिंग वर्ब (told) के बाद \"will\" के स्थान पर \"would\" आता है।",
    hint: "Past reporting verb requires \"would\".\nhe would come."
  },
  {
    id: "add3-c8-10",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the Noun Clause in the sentence:\nI know <that he is an honest officer>.\nआई नो दैट ही इज एन ऑनेस्ट ऑफिसर।\nमैं जानता हूँ कि वह एक ईमानदार अधिकारी है।",
    options: ["that he is an honest officer","I know that","he is honest","an honest officer"],
    correctAnswer: "that he is an honest officer",
    explanation: "Clause acting as the direct object of verb \"know\" is a Noun Clause.\nऑब्जेक्ट का कार्य करने वाला क्लॉज Noun Clause कहलाता है।\n\"know\" का कर्म (object) बनने वाला क्लॉज Noun Clause है।",
    hint: "Clause acting as object of \"know\".\nthat he is an honest officer."
  },
  {
    id: "add3-c8-11",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Choose the correct Second Conditional form:\nIf I ___ rich, I would build a hospital.\nइफ आई ___ रिच, आई वुड बिल्ड ए हॉस्पिटल।\nयदि मैं अमीर होता, तो मैं एक अस्पताल बनवाता।",
    options: ["were","was","am","had been"],
    correctAnswer: "were",
    explanation: "Hypothetical imaginary condition (Second Conditional) uses subjunctive \"were\" for all subjects.\nकाल्पनिक परिस्थिति में कर्ता कुछ भी हो, \"were\" का प्रयोग होता है।\nअवास्तविक/काल्पनिक स्थिति के लिए \"If I were\" का प्रयोग होता है।",
    hint: "Unreal past condition uses \"were\".\nIf I were rich."
  },
  {
    id: "add3-c8-12",
    classLevel: "8",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Choose the correct determiner:\nHe has ___ friends in the city, so he feels lonely.\nही हैज ___ फ्रेंड्स इन द सिटी, सो ही फील्स लोनली।\nशहर में उसके न के बराबर दोस्त हैं, इसलिए वह अकेला महसूस करता है।",
    options: ["few","a few","the few","many"],
    correctAnswer: "few",
    explanation: "\"few\" means almost none (negative sense), which explains why he feels lonely.\nफ्यू का अर्थ न के बराबर (नकारात्मक) होता है।\n\"few\" (न के बराबर) नकारात्मक अर्थ देता है जिससे उसके अकेलेपन का कारण स्पष्ट होता है।",
    hint: "Determiner meaning \"almost none\" (negative): few.\nfew friends."
  },
  {
    id: "add3-c8-13",
    classLevel: "8",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Choose the correct determiner:\nThere is ___ milk left in the jug for tea.\nदेयर इज ___ मिल्क लेफ्ट इन द जग फॉर टी।\nचाय के लिए जग में थोड़ा दूध बचा है।",
    options: ["a little","little","the little","few"],
    correctAnswer: "a little",
    explanation: "\"a little\" means some amount (positive sense) for uncountable noun \"milk\".\nअ लिटल का अर्थ थोड़ा (सकारात्मक मात्रा) होता है।\n\"a little\" (थोड़ी मात्रा) का प्रयोग Uncountable Noun (milk) के लिए होता है।",
    hint: "Positive small quantity for uncountable noun: a little.\na little milk."
  },
  {
    id: "add3-c8-14",
    classLevel: "8",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Choose the Passive form of Present Continuous:\nThey are renovating the old building.\nदे आर रेनोवैटिंग द ओल्ड बिल्डिंग।\nवे पुरानी इमारत का नवीनीकरण कर रहे हैं।",
    options: ["The old building is being renovated.","The old building was renovated.","The old building is renovated.","The old building will be renovated."],
    correctAnswer: "The old building is being renovated.",
    explanation: "Present Continuous Passive: Object + is + being + V3 (is being renovated).\nis being + V3 निरंतर चल रहे कार्य का पैसिव है।\nis + being + 3rd form (is being renovated).",
    hint: undefined
  },
  {
    id: "add3-c8-15",
    classLevel: "8",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert optative sentence to Indirect Speech:\nMother said to me, \"May God bless you!\"\nमदर सैड टू मी, \"मे गॉड ब्लेस यू!\"\nमां ने मुझसे कहा, \"भगवान तुम्हारा भला करे!\"",
    options: ["Mother prayed that God might bless me.","Mother told me God may bless me.","Mother said that God blessed me.","Mother wished me that God will bless me."],
    correctAnswer: "Mother prayed that God might bless me.",
    explanation: "Prayer/blessing uses reporting verb \"prayed that + subject + might + V1\".\nप्रार्थना के लिए \"prayed that... might\" का प्रयोग होता है।\n\"May God...\" का Indirect रूप \"prayed that God might...\" होता है।",
    hint: "Optative blessing changes \"may\" to \"might\" with \"prayed\".\nprayed that God might."
  },
  {
    id: "add3-c8-16",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the punctuation used to join closely related independent clauses:\nShe works hard___ her brother is lazy.\nशी वर्क्स हार्ड___ हर ब्रदर इज लेजी।\nवह मेहनत करती है; उसका भाई आलसी है।",
    options: ["; (Semicolon)",": (Colon)",", (Comma)","- (Hyphen)"],
    correctAnswer: "; (Semicolon)",
    explanation: "A semicolon (;) connects two independent clauses without a conjunction.\nसेमीकोलन (;) दो स्वतंत्र वाक्यों को बिना कंजंक्शन के जोड़ता है।\nSemicolon (;) दो स्वतंत्र वाक्यों को जोड़ने का काम करता है।",
    hint: "Mark with dot over comma: semicolon (;).\nSemicolon (;)."
  },
  {
    id: "add3-c8-17",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Identify the correct preposition:\nThe police accused him ___ theft.\nद पुलिस एक्यूज्ड हिम ___ थेफ्ट।\nपुलिस ने उस पर चोरी का आरोप लगाया।",
    options: ["of","for","with","on"],
    correctAnswer: "of",
    explanation: "Verb \"accuse\" takes fixed preposition \"of\" (accuse of something).\nएक्यूज के साथ Preposition \"of\" आता है।\n\"Accuse\" के साथ निश्चित Preposition \"of\" (accused of) आता है।",
    hint: "Accuse is followed by \"of\".\naccused him of theft."
  },
  {
    id: "add3-c8-18",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Select the complex sentence transformation of:\nDespite his poverty, he is honest.\nडिसपाइट हिज पॉवर्टी, ही इज ऑनेस्ट।\nअपनी गरीबी के बावजूद, वह ईमानदार है।",
    options: ["Though he is poor, he is honest.","He is poor and he is honest.","He is poor but honest.","Because he is poor, he is honest."],
    correctAnswer: "Though he is poor, he is honest.",
    explanation: "Complex sentence uses subordinating conjunction \"Though\" (Though he is poor, he is honest).\nसबऑर्डिनेट कंजंक्शन Though से बनने वाला वाक्य Complex Sentence है।\n\"Though\" का प्रयोग करके Complex Sentence बनता है।",
    hint: "Complex sentence starting with \"Though\".\nThough he is poor..."
  },
  {
    id: "add3-c8-19",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Fill in the correct inverted structure:\nScarcely had the bell rung ___ the students ran out.\nस्कार्स्ली हैड द बेल रंग ___ द स्टूडेंट्स रैन आउट।\nघंटी बजी ही थी कि छात्र बाहर भागे।",
    options: ["when","than","then","before"],
    correctAnswer: "when",
    explanation: "Negative adverbs like \"Scarcely\" and \"Hardly\" take conjunction \"when\".\nस्कार्स्ली के साथ कंजंक्शन \"when\" का प्रयोग होता है।\n\"Scarcely\" के साथ हमेशा \"when\" का जोड़ा बनता है।",
    hint: "Scarcely had... when.\nwhen."
  },
  {
    id: "add3-c8-20",
    classLevel: "8",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct option:\nA number of students ___ present in the assembly hall.\nए नंबर ऑफ स्टूडेंट्स ___ प्रेजेंट इन द असेंबली हॉल।\nसभागार में अनेक छात्र उपस्थित हैं।",
    options: ["are","is","was","has been"],
    correctAnswer: "are",
    explanation: "\"A number of + plural noun\" takes a PLURAL verb (are).\n\"ए नंबर ऑफ\" के साथ क्रिया बहुवचन (are) होती है।\n\"A number of\" के बाद बहुवचन क्रिया (are) आती है।",
    hint: "\"A number of\" takes plural verb \"are\".\nare present."
  },
  {
    id: "add3-c9-1",
    classLevel: "9",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct tense:\nThey ___ in this city for ten years before they shifted to Mumbai.\nदे ___ इन दिस सिटी फॉर टेन इयर्स बिफोर दे शिफ्टेड टू मुंबई।\nमुंबई जाने से पहले वे इस शहर में दस साल से रह रहे थे।",
    options: ["had been living","have lived","were living","are living"],
    correctAnswer: "had been living",
    explanation: "Action continuing up to a past point before another past event takes Past Perfect Continuous (had been living).\nभूतकाल में किसी समय से जारी कार्य के लिए Past Perfect Continuous (had been living) आता है।\nhad been living भूतकाल में लम्बे समय तक जारी कार्य बताता है।",
    hint: "Past continuous duration before another past event: had been living.\nhad been living."
  },
  {
    id: "add3-c9-2",
    classLevel: "9",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct verb:\nThe teacher as well as the students ___ present at the exhibition.\nद टीचर एज वेल एज द स्टूडेंट्स ___ प्रेजेंट एट द एग्जीबिशन।\nशिक्षक के साथ-साथ छात्र भी प्रदर्शनी में उपस्थित थे।",
    options: ["was","were","are","have been"],
    correctAnswer: "was",
    explanation: "When subjects are joined by \"as well as\", the verb agrees with the FIRST subject (\"The teacher\" - singular -> was).\n\"as well as\" से जुड़े होने पर क्रिया प्रथम कर्ता (The teacher) के अनुसार singular (was) होगी।\n\"as well as\" में verb पहले कर्ता (teacher) के अनुसार \"was\" होगी।",
    hint: "Verb agrees with first subject \"The teacher\".\nwas present."
  },
  {
    id: "add3-c9-3",
    classLevel: "9",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert time expression in Indirect Speech:\nHe said, \"I will publish the article today.\"\nही सैड, \"आई विल पब्लिश द आर्टिकल टुडे।\"\nउसने कहा, \"मैं आज लेख प्रकाशित करूँगा।\";",
    options: ["He said that he would publish the article that day.","He said that he will publish the article today.","He said that I would publish article today.","He told he will publish article that day."],
    correctAnswer: "He said that he would publish the article that day.",
    explanation: "Indirect changes: \"will\" -> \"would\" and \"today\" -> \"that day\".\nविल बदलकर would और today बदलकर that day हो जाता है।\nwill का would और today का that day परिवर्तन अनिवार्य है।",
    hint: "will -> would and today -> that day.\nwould publish... that day."
  },
  {
    id: "add3-c9-4",
    classLevel: "9",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert prepositional verb sentence to Passive:\nThe children laughed at the poor beggar.\nद चिल्ड्रन लाफ्ड एट द पूर बेगर।\nबच्चे गरीब भिखारी पर हँसे।",
    options: ["The poor beggar was laughed at by the children.","The poor beggar was laughed by the children.","The poor beggar laughed at the children.","The children were laughed at by beggar."],
    correctAnswer: "The poor beggar was laughed at by the children.",
    explanation: "In prepositional verbs, preposition \"at\" stays attached to verb: \"was laughed at by\".\nप्रीपोजिशन \"at\" क्रिया के साथ ही रहता है: was laughed at by.\nPassive में भी preposition \"at\" क्रिया के तुरंत बाद रहेगा।",
    hint: "Keep preposition \"at\" with laughed.\nwas laughed at by."
  },
  {
    id: "add3-c9-5",
    classLevel: "9",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the correct modal:\nYou ___ bring your umbrella; it is not going to rain.\nयू ___ ब्रिंग योर अम्ब्रेला; इट इज नॉट गोइंग टू रेन।\nआपको अपना छाता लाने की आवश्यकता नहीं है; बारिश नहीं होने वाली है।",
    options: ["need not","must not","should not","could not"],
    correctAnswer: "need not",
    explanation: "\"need not\" expresses absence of necessity.\nआवश्यकता न होने के लिए \"need not\" का प्रयोग होता है।\nआवश्यकता की अनुपस्थिति दर्शाने के लिए \"need not\" आता है।",
    hint: "Lack of obligation/necessity modal: need not.\nneed not bring."
  },
  {
    id: "add3-c9-6",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the redundant word to remove:\nHe returned back to his hometown yesterday.\nही रिटर्न्ड बैक टू हिज होमटाउन यस्टरडे।\nवह कल अपने गृहनगर वापस लौट आया।",
    options: ["Remove \"back\"","Remove \"returned\"","Remove \"yesterday\"","No error"],
    correctAnswer: "Remove \"back\"",
    explanation: "\"return\" already means \"to come back\", so adding \"back\" is redundant.\n\"return\" में \"back\" का अर्थ शामिल है, अतः \"back\" हटा दें।\n\"Return\" के साथ \"back\" का प्रयोग पुनरुक्ति दोष (Redundancy) है।",
    hint: "Do not use \"back\" with \"return\".\nRemove back."
  },
  {
    id: "add3-c9-7",
    classLevel: "9",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Choose the correct determiner:\n___ seat in the auditorium was occupied.\n___ सीट इन द ऑडिटोरियम वाज ऑक्यूपाइड।\nसभागार की प्रत्येक सीट भरी हुई थी।",
    options: ["Every","All","Many","Few"],
    correctAnswer: "Every",
    explanation: "\"Every\" is used before singular countable noun \"seat\".\nसिंगुलर नाउन \"seat\" के पहले \"Every\" का प्रयोग होता है।\nएकवचन संज्ञा \"seat\" के पहले \"Every\" आता है।",
    hint: "Determiner for singular countable noun: Every.\nEvery seat."
  },
  {
    id: "add3-c9-8",
    classLevel: "9",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the Relative Clause:\nThe scientist <who discovered the vaccine> was honored.\nद साइंटिस्ट हू डिस्कवर्ड द वैक्सीन वाज ऑनर्ड।\nजिस वैज्ञानिक ने टीके की खोज की, उसे सम्मानित किया गया।",
    options: ["who discovered the vaccine","was honored","The scientist was honored","discovered the vaccine"],
    correctAnswer: "who discovered the vaccine",
    explanation: "Clause qualifying the noun \"scientist\" starting with \"who\" is a Relative (Adjective) Clause.\n\"who\" से शुरू होकर संज्ञा की विशेषता बताने वाला क्लॉज Relative Clause है।\n\"who discovered the vaccine\" संज्ञा की विशेषता बताने वाला Relative Clause है।",
    hint: "Clause starting with relative pronoun \"who\".\nwho discovered the vaccine."
  },
  {
    id: "add3-c9-9",
    classLevel: "9",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Complete the Third Conditional structure:\nIf he had studied hard, he ___ the exam.\nइफ ही हैड स्टडीड हार्ड, ही ___ द एग्जाम।\nयदि उसने मन लगाकर पढ़ाई की होती, तो वह परीक्षा पास कर लेता।",
    options: ["would have passed","will pass","would pass","had passed"],
    correctAnswer: "would have passed",
    explanation: "Third Conditional formula: If + Past Perfect (had studied), Main clause uses \"would have + V3\" (would have passed).\nइफ वाले क्लॉज में Past Perfect होने पर मुख्य क्लॉज में \"would have + V3\" आता है।\nIf + Past Perfect -> main clause uses \"would have + V3\".",
    hint: "If + had + V3 -> main clause uses \"would have + V3\".\nwould have passed."
  },
  {
    id: "add3-c9-10",
    classLevel: "9",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the correct fixed preposition:\nAll citizens must abide ___ the laws of the country.\nऑल सिटीजन्स मस्ट अबाइड ___ द लॉज़ ऑफ द कंट्री।\nसभी नागरिकों को देश के कानूनों का पालन करना चाहिए।",
    options: ["by","with","to","at"],
    correctAnswer: "by",
    explanation: "Verb \"abide\" takes fixed preposition \"by\" (abide by rules/laws).\nअबाइड के साथ Preposition \"by\" आता है।\n\"Abide\" के साथ हमेशा निश्चित Preposition \"by\" (abide by) आता है।",
    hint: "Abide is followed by \"by\".\nabide by laws."
  },
  {
    id: "add3-c9-11",
    classLevel: "9",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Identify the Bare Infinitive (infinitive without to):\nMy parents made me ___ the whole house.\nमाय पेरेंट्स मेड मी ___ द होल हाउस।\nमेरे माता-पिता ने मुझसे पूरा घर साफ करवाया।",
    options: ["clean","to clean","cleaned","cleaning"],
    correctAnswer: "clean",
    explanation: "Causative verb \"made\" takes a Bare Infinitive (clean) without \"to\".\nमेड के बाद बिना \"to\" वाला Infinitive (Bare Infinitive) आता है।\nCausative Verb \"make\" के बाद Bare Infinitive (clean) का प्रयोग होता है।",
    hint: "Made takes bare infinitive without \"to\".\nmade me clean."
  },
  {
    id: "add3-c9-12",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the incorrect preposition in sentence:\nWe will discuss about the matter tomorrow.\nवी विल डिस्कस अबाउट द मैटर टुमारो।\nहम कल इस मामले पर चर्चा करेंगे।",
    options: ["Remove \"about\"","Change \"discuss\" to \"discussion\"","Remove \"tomorrow\"","No error"],
    correctAnswer: "Remove \"about\"",
    explanation: "Verb \"discuss\" takes a direct object without preposition \"about\".\nडिस्कस के बाद \"about\" नहीं आता।\n\"Discuss\" के बाद Preposition \"about\" लगाना अशुद्ध है।",
    hint: "Do not use preposition \"about\" after verb discuss.\nRemove about."
  },
  {
    id: "add3-c9-13",
    classLevel: "9",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert Interrogative to Passive:\nWhy did you make such a mistake?\nवाई डिड यू मेक सच ए मिस्टेक?\nआपने ऐसी गलती क्यों की?",
    options: ["Why was such a mistake made by you?","Why such a mistake was made by you?","Why did such a mistake made by you?","Why is such a mistake made by you?"],
    correctAnswer: "Why was such a mistake made by you?",
    explanation: "Interrogative Passive format: Why + was + object (such a mistake) + V3 (made) + by + subject.\nवाई + वाज + ऑब्जेक्ट + V3 + बाय + सब्जेक्ट।\nWhy + was + object + 3rd form.",
    hint: "Auxiliary verb \"was\" comes before object in question passive.\nWhy was such a mistake made..."
  },
  {
    id: "add3-c9-14",
    classLevel: "9",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert question dialogue to Indirect:\nHe said to me, \"Where are you going for holidays?\"\nही सैड टू मी, \"वेयर आर यू गोइंग फॉर हॉलिडेज?\"\nउसने मुझसे कहा, \"तुम छुट्टियों में कहाँ जा रहे हो?\"",
    options: ["He asked me where I was going for holidays.","He asked me where was I going for holidays.","He inquired me that where I am going.","He asked where I am going for holidays."],
    correctAnswer: "He asked me where I was going for holidays.",
    explanation: "Wh-question indirect: Wh-word acts as connector, structure becomes assertive (I was going).\nWh-शब्द के बाद साधारण वाक्य की रचना होती है: where I was going.\nConnector के रूप में Wh-word के बाद Subject + Verb आता है।",
    hint: "Subject \"I\" comes before verb \"was\" after \"where\".\nwhere I was going."
  },
  {
    id: "add3-c9-15",
    classLevel: "9",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Fill in the correct paired conjunction:\nNo sooner had the thief seen the police ___ he fled.\nनो सूनर हैड द थीफ सीन द पुलिस ___ ही फ्लैड।\nचोर ने पुलिस को देखा ही नहीं कि वह भाग गया।",
    options: ["than","when","then","before"],
    correctAnswer: "than",
    explanation: "Conjunction \"No sooner\" is strictly paired with \"than\".\nनो सूनर के साथ कंजंक्शन \"than\" का जोड़ा बनता है।\n\"No sooner\" के साथ हमेशा \"than\" का जोड़ा बनता है।",
    hint: "No sooner is paired with \"than\".\nNo sooner... than."
  },
  {
    id: "add3-c9-16",
    classLevel: "9",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the correct fixed preposition:\nShe insisted ___ paying for her own meal.\nशी इंसिस्टेड ___ पेइंग फॉर हर ओन मील।\nउसने अपने भोजन का भुगतान खुद करने का आग्रह किया।",
    options: ["on","at","in","for"],
    correctAnswer: "on",
    explanation: "Verb \"insist\" takes preposition \"on\" followed by gerund (insist on doing).\nइंसिस्ट के साथ \"on\" का प्रयोग होता है।\n\"Insist\" के साथ Preposition \"on\" (insist on) आता है।",
    hint: "Insist is followed by preposition \"on\".\ninsisted on paying."
  },
  {
    id: "add3-c9-17",
    classLevel: "9",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct verb form:\nPhysics ___ a challenging subject for many students.\nफिजिक्स ___ ए चैलेंजिंग सब्जेक्ट फॉर मेनी स्टूडेंट्स।\nभौतिकी कई छात्रों के लिए एक चुनौतीपूर्ण विषय है।",
    options: ["is","are","were","have been"],
    correctAnswer: "is",
    explanation: "Nouns plural in form but singular in meaning (Physics) take singular verb \"is\".\nफिजिक्स एकवचन विषय है, इसलिए verb \"is\" होगी।\nरूप से बहुवचन दिखने वाले विषय (Physics) एकवचन क्रिया (is) लेते हैं।",
    hint: "Physics is a single subject -> use \"is\".\nPhysics is."
  },
  {
    id: "add3-c9-18",
    classLevel: "9",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert infinitive clause to Passive:\nIt is time to start the match.\nइट इज टाइम टू स्टार्ट द मैच।\nमैच शुरू करने का समय हो गया है।",
    options: ["It is time for the match to be started.","It is time to match be started.","The match is time to be started.","It was time for the match to start."],
    correctAnswer: "It is time for the match to be started.",
    explanation: "Passive structure for \"It is time + to V1 + Obj\": It is time + for + Obj + to be + V3.\nइन्फिनिटिव पैसिव: इट इज टाइम + फॉर + ऑब्जेक्ट + टू बी + V3।\nIt is time for + object + to be + 3rd form.",
    hint: "Structure: It is time for + object + to be + V3.\nIt is time for the match to be started."
  },
  {
    id: "add3-c9-19",
    classLevel: "9",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Choose the correct determiner:\n___ of the two plans was approved by the board.\n___ ऑफ द टू प्लान्स वाज एप्रूव्ड बाय द बोर्ड।\nदोनों में से कोई भी योजना बोर्ड द्वारा स्वीकृत नहीं की गई थी।",
    options: ["Neither","None","Any","No one"],
    correctAnswer: "Neither",
    explanation: "For a choice between exactly TWO items, we use \"Neither\".\nदो वस्तुओं में से कोई नहीं के लिए \"Neither\" का प्रयोग होता है।\nदो विकल्पों में से नकारात्मक चयन के लिए \"Neither\" आता है।",
    hint: "Negative choice between TWO items: Neither.\nNeither of the two."
  },
  {
    id: "add3-c9-20",
    classLevel: "9",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Transform Affirmative to Negative without changing sense:\nEvery student was present in the class.\nएवरी स्टूडेंट वाज प्रेजेंट इन द क्लास।\nकक्षा में प्रत्येक छात्र उपस्थित था।",
    options: ["No student was absent in the class.","Every student was not present.","No student was present in the class.","Students were not in the class."],
    correctAnswer: "No student was absent in the class.",
    explanation: "Changing affirmative to negative without altering meaning: Every present -> No absent.\nअर्थ बदले बिना नकरात्मक रूप: No student was absent.\nअर्थ को अपरिवर्तित रखते हुए \"No student was absent\" सही रूपांतरण है।",
    hint: "Negative transformation keeping original meaning.\nNo student was absent."
  },
  {
    id: "add3-c10-1",
    classLevel: "10",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct option for gap-filling:\nHe ___ in this factory since 2010.\nही ___ इन दिस फैक्ट्री सिंस 2010।\nवह 2010 से इस कारखाने में काम कर रहा है।",
    options: ["has been working","is working","worked","was working"],
    correctAnswer: "has been working",
    explanation: "Time duration with \"since 2010\" in present state requires Present Perfect Continuous (has been working).\nसिंस + समय के साथ Present Perfect Continuous का प्रयोग होता है।\n\"since 2010\" के साथ Present Perfect Continuous (has been working) आएगा।",
    hint: "Present action with \"since 2010\" uses has been + V-ing.\nhas been working."
  },
  {
    id: "add3-c10-2",
    classLevel: "10",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Select the grammatically correct sentence:\nMore than one candidate has cleared the entrance test.\nमोर देन वन कैंडिडेट हैज क्लियरड द एंट्रेंस टेस्ट।\nएक से अधिक उम्मीदवारों ने प्रवेश परीक्षा उत्तीर्ण की है।",
    options: ["More than one candidate has cleared the entrance test.","More than one candidate have cleared the entrance test.","More than one candidates has clear the entrance test.","More than one candidate are cleared the entrance test."],
    correctAnswer: "More than one candidate has cleared the entrance test.",
    explanation: "Phrase \"More than one + singular noun\" takes a SINGULAR verb (has cleared).\nमोर देन वन के साथ Noun और Verb दोनों एकवचन होते हैं।\n\"More than one candidate\" के साथ एकवचन क्रिया (has) आती है।",
    hint: "\"More than one candidate\" uses singular verb \"has\".\nhas cleared."
  },
  {
    id: "add3-c10-3",
    classLevel: "10",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert negative imperative command to Indirect:\nThe librarian said to us, \"Do not make a noise.\"\nद लाइब्रेरीयन सैड टू अस, \"डू नॉट मेक ए नॉइज।\"\nलाइब्रेरियन ने हमसे कहा, \"शोर मत मचाओ।\";",
    options: ["The librarian ordered us not to make a noise.","The librarian told us to not make a noise.","The librarian asked us that do not make noise.","The librarian forbade us not to make a noise."],
    correctAnswer: "The librarian ordered us not to make a noise.",
    explanation: "Negative command changes \"Do not + V1\" to \"not + to + V1\".\nडू नॉट बदलकर \"not to + V1\" हो जाता है।\n\"Do not\" का परिवर्तन \"not to\" में होता है।",
    hint: "Change \"Do not make\" to \"not to make\".\nordered us not to make a noise."
  },
  {
    id: "add3-c10-4",
    classLevel: "10",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Choose the correct option:\nHe ___ drive long distances when he was young.\nही ___ ड्राइव लॉन्ग डिस्टेंसिज व्हेन ही वाज यंग।\nजब वह युवा था तब लंबी दूरी तक गाड़ी चलाया करता था।",
    options: ["used to","is used to","would be","must"],
    correctAnswer: "used to",
    explanation: "\"used to\" denotes a discontinued past routine habit.\nभूतकाल की पुरानी आदत के लिए \"used to\" आता है।\nअतीत की आदत को व्यक्त करने के लिए \"used to\" का प्रयोग होता है।",
    hint: "Modal for past habit: used to.\nused to drive."
  },
  {
    id: "add3-c10-5",
    classLevel: "10",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert impersonal reporting to Passive:\nPeople believe that he is an honest leader.\nपीपल बिलीव दैट ही इज एन ऑनेस्ट लीडर।\nलोग मानते हैं कि वह एक ईमानदार नेता हैं।",
    options: ["It is believed that he is an honest leader.","He is believed is an honest leader.","People are believed he is honest.","It was believed that he is honest."],
    correctAnswer: "It is believed that he is an honest leader.",
    explanation: "Impersonal passive of \"People believe that...\" is \"It is believed that...\".\nइम्पपर्सनल पैसिव: It is believed that...\n\"People believe that\" का Passive \"It is believed that\" होता है।",
    hint: "Impersonal passive intro: It is believed that...\nIt is believed that..."
  },
  {
    id: "add3-c10-6",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the error in the sentence:\nOne of my friend is going to London.\nवन ऑफ माय फ्रेंड इज गोइंग टू लंदन।\nमेरा एक दोस्त लंदन जा रहा है।",
    options: ["Change \"friend\" to \"friends\"","Change \"is\" to \"are\"","Change \"going\" to \"go\"","No error"],
    correctAnswer: "Change \"friend\" to \"friends\"",
    explanation: "\"One of my\" must be followed by a PLURAL noun (\"friends\").\nवन ऑफ माय के बाद Noun Plural (friends) होना अनिवार्य है।\n\"One of my\" के बाद संज्ञा बहुवचन (friends) होती है।",
    hint: "One of my + PLURAL noun (friends).\nOne of my friends."
  },
  {
    id: "add3-c10-7",
    classLevel: "10",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Choose the correct conjunction of concession:\n___ it was raining heavily, he went out to play.\n___ इट वाज रेनिंग हैविली, ही वेंट आउट टू प्ले।\nयद्यपि भारी बारिश हो रही थी, फिर भी वह खेलने बाहर गया।",
    options: ["Even though","Because","Since","Unless"],
    correctAnswer: "Even though",
    explanation: "\"Even though\" shows strong concession/contrast between heavy rain and going out.\nइवेन दो विरोधाभास दर्शाता है।\n\"Even though\" (भले ही/यद्यपि) विरोधाभास दर्शाने वाला कंजंक्शन है।",
    hint: "Conjunction of concession: Even though.\nEven though."
  },
  {
    id: "add3-c10-8",
    classLevel: "10",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the Mixed Conditional form:\nIf I had taken that job years ago, I ___ a manager today.\nइफ आई हैड टेकन दैट जॉब इयर्स एगो, आई ___ ए मैनेजर टुडे।\nयदि मैंने वर्षों पहले वह नौकरी ली होती, तो आज मैं एक प्रबंधक होता।",
    options: ["would be","would have been","will be","had been"],
    correctAnswer: "would be",
    explanation: "Mixed Conditional (Past condition + Present result): If + Past Perfect, main clause uses \"would + V1\" (would be today).\nपास्ट कंडीशन और प्रेजेंट रिजल्ट के लिए \"would + V1\" आता है।\nभूतकाल की शर्त का वर्तमान परिणाम दर्शाने के लिए \"would + V1\" (would be) आता है।",
    hint: "Past condition with PRESENT result (\"today\") uses \"would + V1\".\nwould be today."
  },
  {
    id: "add3-c10-9",
    classLevel: "10",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Choose the correct determiner:\nThere isn't ___ water left in the bucket.\nदेयर इजंट ___ वाटर लेफ्ट इन द बकेट।\nबाल्टी में ज्यादा पानी नहीं बचा है।",
    options: ["much","many","few","several"],
    correctAnswer: "much",
    explanation: "\"much\" is used with uncountable noun \"water\" in negative sentences.\nअनकाउंटेबल नाउन के साथ \"much\" आता है।\nUncountable Noun (water) के साथ नकारात्मक वाक्य में \"much\" का प्रयोग होता है।",
    hint: "Determiner for uncountable noun water in negative: much.\nmuch water."
  },
  {
    id: "add3-c10-10",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Find the correct preposition:\nHe was exempted ___ paying the penalty fee.\nही वाज एक्सेप्टेड ___ पेइंग द पेनल्टी फी।\nउसे जुर्माना भरने से छूट दी गई थी।",
    options: ["from","of","with","for"],
    correctAnswer: "from",
    explanation: "Verb \"exempt\" is followed by fixed preposition \"from\" (exempted from).\nएक्सेप्ट के साथ Preposition \"from\" आता है।\n\"Exempt\" के साथ निश्चित Preposition \"from\" (exempted from) आता है।",
    hint: "Exempt takes preposition \"from\".\nexempted from paying."
  },
  {
    id: "add3-c10-11",
    classLevel: "10",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Choose the sentence with correct Negative Inversion:\nSeldom have I seen such a brilliant performance.\nसेलडम हैव आई सीन सच ए ब्रिलियंट परफॉरमेंस।\nमैंने शायद ही कभी इतना शानदार प्रदर्शन देखा है।",
    options: ["Seldom have I seen such a brilliant performance.","Seldom I have seen such a brilliant performance.","Seldom I had seen such a brilliant performance.","Seldom have seen I such performance."],
    correctAnswer: "Seldom have I seen such a brilliant performance.",
    explanation: "When negative adverb \"Seldom\" comes first, auxiliary verb precedes subject (Seldom + have + I + V3).\nनेगेटिव एडवर्ब से शुरू होने पर Inversion (auxiliary + subject) होता है।\n\"Seldom\" से वाक्य शुरू होने पर Inversion (have I seen) अनिवार्य है।",
    hint: "Inversion structure: Seldom + have + I + V3.\nSeldom have I seen..."
  },
  {
    id: "add3-c10-12",
    classLevel: "10",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Fill in the correct Question Tag:\nLet's go for a walk, ___?\nलेट्स गो फॉर ए वॉक, ___?\nचलो टहलने चलें, चलें न?",
    options: ["shall we","shan't we","will we","don't we"],
    correctAnswer: "shall we",
    explanation: "Imperative proposals starting with \"Let's\" take question tag \"shall we?\".\n\"Let's\" वाले प्रस्तावों का question tag \"shall we?\" होता है।\n\"Let's\" से शुरू होने वाले वाक्यों का Question Tag \"shall we?\" बनता है।",
    hint: "Question tag for \"Let's...\": shall we?\nshall we?"
  },
  {
    id: "add3-c10-13",
    classLevel: "10",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Fill in the correct Question Tag:\nI am right, ___?\nआई एम राइट, ___?\nमैं सही हूँ, है न?",
    options: ["aren't I","am not I","isn't I","don't I"],
    correctAnswer: "aren't I",
    explanation: "Standard question tag for affirmative statement \"I am...\" is \"aren't I?\".\n\"I am\" का नकारात्मक Question Tag \"aren't I?\" होता है।\n\"I am\" के लिए मानक Question Tag \"aren't I?\" बनता है।",
    hint: "Question tag for \"I am\": aren't I?\naren't I?"
  },
  {
    id: "add3-c10-14",
    classLevel: "10",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert reporting sentence to Passive:\nThey say that he is a secret agent.\nदे से दैट ही इज ए सीक्रेट एजेंट।\nवे कहते हैं कि वह एक गुप्त एजेंट है।",
    options: ["He is said to be a secret agent.","He was said to be a secret agent.","It is said he was secret agent.","They were said that he is agent."],
    correctAnswer: "He is said to be a secret agent.",
    explanation: "Passive structure: Subject + is/are + said + to be + complement (He is said to be...).\n\"He is said to be\" मानक पैसिव संरचना है।\n\"They say that he is...\" का Passive \"He is said to be...\" बनता है।",
    hint: "Structure: Subject + is said + to be...\nHe is said to be..."
  },
  {
    id: "add3-c10-15",
    classLevel: "10",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert habitual fact in Indirect Speech:\nHe said, \"I take a morning walk daily.\"\nही सैड, \"आई टेक ए मॉर्निंग वॉक डेली।\"\nउसने कहा, \"मैं रोज सुबह टहलता हूँ।\";",
    options: ["He said that he takes a morning walk daily.","He said that he took a morning walk daily.","He said that I take morning walk daily.","He told he will take morning walk."],
    correctAnswer: "He said that he takes a morning walk daily.",
    explanation: "Habitual actions (\"daily morning walk\") retain Present Tense in indirect speech.\nआदतन कार्य (Habitual action) का Tense अपरिवर्तित रहता है।\nनियमित आदत दर्शाने वाले वाक्यों का Tense परिवर्तित नहीं होता।",
    hint: "Habitual action tense stays present.\nhe takes a morning walk daily."
  },
  {
    id: "add3-c10-16",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Choose the sentence with correct parallel structure:\nHe succeeded not by force but by perseverance.\nही सक्सीडेड नॉट बाय फोर्स बट बाय पर्सिवियरेंस।\nवह बल से नहीं बल्कि लगन से सफल हुआ।",
    options: ["He succeeded not by force but by perseverance.","He succeeded not by force but perseverance.","He succeeded by not force but perseverance.","He not succeeded by force but by perseverance."],
    correctAnswer: "He succeeded not by force but by perseverance.",
    explanation: "Parallel structure requires preposition \"by\" after both \"not\" and \"but\" (not by... but by...).\nसमानांतर संरचना: not by... but by...\nदोनों विकल्पों के साथ समान Preposition \"by\" का प्रयोग होना चाहिए।",
    hint: "Balanced parallel structure: not by X but by Y.\nnot by force but by perseverance."
  },
  {
    id: "add3-c10-17",
    classLevel: "10",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the correct preposition:\nThe security guard prevented him ___ entering the building.\nद सिक्योरिटी गार्ड प्रिवेंटेड हिम ___ एंटरिंग द बिल्डिंग।\nसुरक्षा गार्ड ने उसे भवन में प्रवेश करने से रोक दिया।",
    options: ["from","to","at","with"],
    correctAnswer: "from",
    explanation: "Verb \"prevent\" takes fixed preposition \"from\" followed by gerund (prevented from doing).\nप्रिवेंट के साथ Preposition \"from\" आता है।\n\"Prevent\" के साथ निश्चित Preposition \"from\" (prevented from) आता है।",
    hint: "Prevent is followed by \"from\".\nprevented from entering."
  },
  {
    id: "add3-c10-18",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the sentence with correct participle modifier (avoiding dangling participle):\nWalking in the park, a snake bit him. vs While he was walking in the park, a snake bit him.\nवॉकिंग इन द पार्क... वर्सेज व्हाइल ही वाज वॉकिंग।\nपार्क में टहलते समय उसे एक सांप ने काट लिया।",
    options: ["While he was walking in the park, a snake bit him.","Walking in the park, a snake bit him.","Walking in park, snake was bit him.","A snake bit him walking in park."],
    correctAnswer: "While he was walking in the park, a snake bit him.",
    explanation: "To fix dangling participle where snake seems to walk, specify subject: \"While he was walking...\".\nDangling Participle दोष से बचने के लिए कर्ता \"he\" का स्पष्ट उल्लेख करें।\n\"While he was walking...\" सही एवं शुद्ध रूपांतरण है।",
    hint: "Add subject \"he\" to clarify who was walking.\nWhile he was walking..."
  },
  {
    id: "add3-c10-19",
    classLevel: "10",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Choose the correct Subjunctive Mood form:\nI wish I ___ a prince.\nआई विश आई ___ ए प्रिंस।\nकाश मैं एक राजकुमार होता।",
    options: ["were","was","am","had been"],
    correctAnswer: "were",
    explanation: "Unreal wish after \"I wish\" takes subjunctive verb \"were\".\nइच्छा प्रकट करने के लिए \"were\" का प्रयोग होता है।\n\"I wish\" के बाद अवास्तविक कल्पना के लिए \"were\" आता है।",
    hint: "Unreal wish uses subjunctive \"were\".\nI wish I were."
  },
  {
    id: "add3-c10-20",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the pronoun agreement error:\nEvery student must bring their own admit card.\nएवरी स्टूडेंट मस्ट ब्रिंग देयर ओन एडमिट कार्ड।\nप्रत्येक छात्र को अपना प्रवेश पत्र अवश्य लाना चाहिए।",
    options: ["Change \"their\" to \"his or her\"","Change \"must\" to \"should\"","Change \"student\" to \"students\"","No error"],
    correctAnswer: "Change \"their\" to \"his or her\"",
    explanation: "Singular antecedent \"Every student\" grammatically requires singular possessive \"his or her\".\nसिंगुलर ऐंटेसिडेंट \"Every student\" के लिए सिंगुलर प्रोनाउन \"his or her\" आएगा।\n\"Every student\" एकवचन है, अतः \"his or her\" का प्रयोग मानक व्याकरण में सही है।",
    hint: "Every student requires singular possessive: his or her.\nhis or her."
  },
  {
    id: "add3-c11-1",
    classLevel: "11",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct verb form:\nNot only the teacher but also the students ___ present at the ceremony.\nनॉट ओनली द टीचर बट ऑल्सो द स्टूडेंट्स ___ प्रेजेंट एट द सेरेमनी।\nन केवल शिक्षक बल्कि छात्र भी समारोह में उपस्थित थे।",
    options: ["were","was","is","has been"],
    correctAnswer: "were",
    explanation: "With \"Not only... but also\", verb agrees with the subject closest to it (\"the students\" - plural -> were).\nपास वाले सब्जेक्ट (the students) के अनुसार plural verb \"were\" आएगी।\n\"Not only...but also\" में क्रिया पास वाले कर्ता (students) के अनुसार \"were\" होगी।",
    hint: "Verb agrees with plural \"the students\".\nwere present."
  },
  {
    id: "add3-c11-2",
    classLevel: "11",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Select the Future Perfect Continuous Tense:\nBy next year, he ___ at this institute for twenty years.\nबाय नेक्स्ट ईयर, ही ___ एट दिस इंस्टीट्यूट फॉर ट्वेंटी इयर्स।\nअगले साल तक, वह इस संस्थान में बीस साल से पढ़ा रहा होगा।",
    options: ["will have been teaching","will be teaching","will teach","has been teaching"],
    correctAnswer: "will have been teaching",
    explanation: "Structure: Subject + will have been + V-ing + for (will have been teaching).\nविल हैव बीन + ing भविष्य की अवधि दर्शाता है।\nwill have been teaching Future Perfect Continuous Tense है।",
    hint: "Look for \"will have been + V-ing\".\nwill have been teaching."
  },
  {
    id: "add3-c11-3",
    classLevel: "11",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert complex narration to Indirect:\nThe traveler said, \"Can you tell me the way to the station?\"\nद ट्रेवलर सैड, \"कैन यू टेल मी द वे टू द स्टेशन?\"\nयात्री ने कहा, \"क्या आप मुझे स्टेशन का रास्ता बता सकते हैं?\"",
    options: ["The traveler inquired if I could tell him the way to the station.","The traveler asked that can I tell him the way.","The traveler told me if I can tell him the way.","The traveler said whether I could told him the way."],
    correctAnswer: "The traveler inquired if I could tell him the way to the station.",
    explanation: "Interrogative indirect uses reporting verb \"inquired if + subject + could + V1\".\nकैन का बदलकर could होना और connector \"if\" का प्रयोग होना अनिवार्य है।\n\"inquired if I could...\" सही इनडायरेक्ट रूप है।",
    hint: "Change \"can\" to \"could\" with connector \"if\".\ninquired if I could..."
  },
  {
    id: "add3-c11-4",
    classLevel: "11",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert sentence with prepositional phrasal verb to Passive:\nThe committee is looking into the fraud allegations.\nद कमेटी इज लुकिंग इनटू द फ्रॉड एलिगेशंस।\nसमिति धोखाधड़ी के आरोपों की जांच कर रही है।",
    options: ["The fraud allegations are being looked into by the committee.","The fraud allegations were looked into by the committee.","The committee was looking into allegations.","The fraud allegations are looked into."],
    correctAnswer: "The fraud allegations are being looked into by the committee.",
    explanation: "Continuous passive: Object + are + being + V3 (looked into) + by + committee.\nआर बीइंग लुक्ड इनटू बाय कमेटी।\nare being + V3 (looked into).",
    hint: undefined
  },
  {
    id: "add3-c11-5",
    classLevel: "11",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the modal perfect for unfulfilled past obligation:\nYou ___ informed me before leaving the venue.\nयू ___ इन्फॉर्म्ड मी बिफोर लीविंग द वेन्यू।\nआपको कार्यक्रम स्थल से निकलने से पहले मुझे सूचित कर देना चाहिए था।",
    options: ["should have","must have","might have","could have"],
    correctAnswer: "should have",
    explanation: "\"should have + V3\" expresses a past obligation that was NOT fulfilled.\nअतीत का अपूरित कर्तव्य दर्शाने के लिए \"should have\" का प्रयोग होता है।\n\"should have + V3\" (चाहिए था) अपूरित अतीत के कार्य को दर्शाता है।",
    hint: "Unfulfilled past duty modal: should have.\nshould have informed."
  },
  {
    id: "add3-c11-6",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Choose the sentence with correct Syntactic Inversion:\nNot only did he win the gold medal, but he also set a new record.\nनॉट ओनली डिड ही विन... बट ही ऑल्सो सेट ए न्यू रिकॉर्ड।\nउसने न केवल स्वर्ण पदक जीता, बल्कि एक नया रिकॉर्ड भी बनाया।",
    options: ["Not only did he win the gold medal, but he also set a new record.","Not only he won the gold medal, but he also set a new record.","Not only did he won the gold medal, but he also set new record.","Not only he did win gold medal, but set new record."],
    correctAnswer: "Not only did he win the gold medal, but he also set a new record.",
    explanation: "Fronted \"Not only\" requires inversion: auxiliary \"did\" + subject \"he\" + bare infinitive \"win\".\nनॉट ओनली से शुरू होने पर Inversion (did he win) अनिवार्य है।\n\"Not only did he win...\" सही Inversion संरचना है।",
    hint: "Inversion after Not only: Not only did he win...\nNot only did he win..."
  },
  {
    id: "add3-c11-7",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the Adjective Clause:\nThe car <which he bought last week> broke down.\nद कार व्हिच ही बॉट लास्ट वीक ब्रोक डाउन।\nजो कार उसने पिछले हफ्ते खरीदी थी वह खराब हो गई।",
    options: ["which he bought last week","broke down","The car broke down","bought last week"],
    correctAnswer: "which he bought last week",
    explanation: "Clause modifying the noun \"car\" starting with relative pronoun \"which\" is an Adjective Clause.\nसंज्ञा \"car\" की विशेषता बताने वाला क्लॉज Adjective Clause है।\n\"which he bought last week\" Adjective Clause है।",
    hint: "Clause starting with \"which\" modifying car.\nwhich he bought last week."
  },
  {
    id: "add3-c11-8",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Choose the correct prepositional phrase:\nThe project was completed ___ the government guidelines.\nद प्रोजेक्ट वाज कम्पलीटेड ___ द गवर्नमेंट गाइडलाइंस।\nयह परियोजना सरकारी दिशा-निर्देशों के अनुसार पूरी की गई थी।",
    options: ["in accordance with","in spite of","on behalf of","with reference to"],
    correctAnswer: "in accordance with",
    explanation: "\"in accordance with\" means conforming to rules or guidelines.\nनियमों के अनुसार के लिए \"in accordance with\" का प्रयोग होता है।\n\"in accordance with\" (के अनुसार) सही अभिव्यक्ति है।",
    hint: "Phrase meaning \"conforming to\": in accordance with.\nin accordance with."
  },
  {
    id: "add3-c11-9",
    classLevel: "11",
    topic: "Adjectives & Adverbs",
    difficulty: "Hard",
    questionText: "Transform Superlative to Comparative without changing sense:\nIron is the most useful metal.\nआयरन इज द मोस्ट यूजफुल मेटल।\nलोहा सबसे उपयोगी धातु है।",
    options: ["Iron is more useful than any other metal.","Iron is more useful than all metal.","No metal is more useful than iron.","Iron is most useful metal."],
    correctAnswer: "Iron is more useful than any other metal.",
    explanation: "Comparative transformation: Subject + is + comparative degree (more useful) + than any other + singular noun (metal).\nतुलनात्मक परिवर्तन: more useful than any other metal.\n\"more useful than any other metal\" सही रूपात्मक वाक्य है।",
    hint: "Structure: more useful than any other metal.\nmore useful than any other metal."
  },
  {
    id: "add3-c11-10",
    classLevel: "11",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Identify the Perfect Participle clause:\n<Having finished his assignment>, he went out to play.\nहैविंग फिनिश्ड हिज असाइनमेंट, ही वेंट आउट टू प्ले।\nअपना असाइनमेंट पूरा करने के बाद, वह खेलने चला गया।",
    options: ["Having finished his assignment","he went out","to play","finished his assignment"],
    correctAnswer: "Having finished his assignment",
    explanation: "\"Having + V3\" (Having finished) forms a Perfect Participle clause showing completed prior action.\nहैविंग + 3rd फॉर्म को Perfect Participle कहते हैं।\n\"Having finished...\" पूर्व संपन्न कार्य दर्शाने वाला Perfect Participle है।",
    hint: "Clause starting with \"Having + V3\".\nHaving finished his assignment."
  },
  {
    id: "add3-c11-11",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the grammatical error in literary text:\nNo sooner did the curtain rise when the applause erupted.\nनो सूनर डिड द कर्टेन राइज व्हेन द एप्लॉज़ इरप्टेड।\nपर्दा उठते ही तालियां गूंज उठीं।",
    options: ["Change \"when\" to \"than\"","Change \"did\" to \"had\"","Change \"rise\" to \"rose\"","No error"],
    correctAnswer: "Change \"when\" to \"than\"",
    explanation: "\"No sooner\" is paired with \"than\", NEVER with \"when\".\nनो सूनर के साथ सदैव \"than\" आता है, \"when\" नहीं।\n\"No sooner\" का जोड़ा \"than\" होता है।",
    hint: "No sooner takes \"than\" (not when).\nChange when to than."
  },
  {
    id: "add3-c11-12",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Choose the sentence demonstrating correct parallelism:\nThe candidate possesses excellent communication skills, high motivation, and great enthusiasm.\nद कैंडिडेट पजेसिज एक्सीलेंट कम्युनिकेशन स्किल्स...।\nउम्मीदवार के पास उत्कृष्ट संचार कौशल, उच्च प्रेरणा और बहुत उत्साह है।",
    options: ["The candidate possesses excellent communication skills, high motivation, and great enthusiasm.","The candidate possesses excellent communication skills, is highly motivated, and great enthusiasm.","The candidate possesses communicating skills, high motivation, and enthusiastic.","The candidate possesses skills of communication, motivated, and enthusiasm."],
    correctAnswer: "The candidate possesses excellent communication skills, high motivation, and great enthusiasm.",
    explanation: "Parallel structure requires all listed items to be noun phrases (skills, motivation, enthusiasm).\nसूची के सभी पद समान व्याकरणिक वर्ग (Noun Phrases) के होने चाहिए।\nNoun Phrases की समानांतरता बनाए रखें।",
    hint: "All items must be noun phrases: skills, motivation, enthusiasm.\nNoun phrase parallelism."
  },
  {
    id: "add3-c11-13",
    classLevel: "11",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct Subjunctive verb after \"It is high time\":\nIt is high time we ___ taking action on pollution.\nइट इज हाई टाइम वी ___ टेकिंग एक्शन ऑन पोल्यूशन।\nअब समय आ गया है कि हम प्रदूषण पर कार्रवाई शुरू करें।",
    options: ["started","start","have started","will start"],
    correctAnswer: "started",
    explanation: "Expression \"It is high time + subject\" takes Past Subjunctive (V2: started).\n\"It is high time\" के बाद 2nd form (started) का प्रयोग होता है।\n\"It is high time\" के बाद क्रिया का Past Form (V2) आता है।",
    hint: "It is high time + subject requires Past Simple (V2).\nstarted."
  },
  {
    id: "add3-c11-14",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the Inverted Conditional equivalent of \"If I had known...\":\n___ about the delay, I would have taken a taxi.\n___ अबाउट द डिले, आई वुड हैव टेकन ए टैक्सी।\nअगर मुझे देरी के बारे में पता होता, तो मैं टैक्सी ले लेता।",
    options: ["Had I known","Should I know","Were I known","If I knew"],
    correctAnswer: "Had I known",
    explanation: "Inverted Third Conditional replaces \"If I had known\" with \"Had I known\".\n\"If I had known\" का inverted रूप \"Had I known\" होता है।\n\"Had I known\" इनवर्टेड थर्ड कंडीशनल का सही रूप है।",
    hint: "Inverted structure for \"If I had known\": Had I known.\nHad I known."
  },
  {
    id: "add3-c11-15",
    classLevel: "11",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Choose the correct determiner meaning \"it doesn't matter which\":\nYou may choose ___ book from the library shelf.\nयू मे चूज ___ बुक फ्रॉम द लाइब्रेरी शेल्फ।\nआप पुस्तकालय की शेल्फ से कोई भी किताब चुन सकते हैं।",
    options: ["any","some","every","either"],
    correctAnswer: "any",
    explanation: "\"any\" in affirmative sentence means \"whichever one you like / it doesn't matter which\".\n\"any\" का प्रयोग सकारात्मक वाक्य में \"कोई भी\" के अर्थ में होता है।\n\"any\" (कोई भी) विकल्प की स्वतंत्रता दर्शाता है।",
    hint: "Determiner meaning \"no matter which one\": any.\nany book."
  },
  {
    id: "add3-c11-16",
    classLevel: "11",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert interrogative starting with \"Who\" to Passive:\nWho broken the ancient sculpture?\nहू ब्रोक द एंशिएंट स्कल्पचर?\nप्राचीन मूर्ति को किसने तोड़ा?",
    options: ["By whom was the ancient sculpture broken?","Who was the ancient sculpture broken by?","By whom the ancient sculpture was broken?","Whom broke the sculpture?"],
    correctAnswer: "By whom was the ancient sculpture broken?",
    explanation: "Passive of \"Who + V2\": By whom + was + object + V3 (broken)?\nबाय व्हूम + वाज + ऑब्जेक्ट + V3?\nBy whom + was + object + 3rd form.",
    hint: "Start passive with \"By whom was...\".\nBy whom was the ancient sculpture broken?"
  },
  {
    id: "add3-c11-17",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Fill in the fixed preposition:\nThe prisoners were deprived ___ basic fundamental rights.\nद प्रिजनर्स वर डिप्राइव्ड ___ बेसिक फंडामेंटल राइट्स।\nकैदियों को बुनियादी मौलिक अधिकारों से वंचित कर दिया गया था।",
    options: ["of","from","with","off"],
    correctAnswer: "of",
    explanation: "Verb \"deprive\" takes fixed preposition \"of\" (deprived of something).\nडिप्राइव के साथ Preposition \"of\" आता है।\n\"Deprive\" के साथ हमेशा निश्चित Preposition \"of\" (deprived of) आता है।",
    hint: "Deprived takes preposition \"of\".\ndeprived of basic rights."
  },
  {
    id: "add3-c11-18",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the punctuation used to insert parenthetical explanatory details:\nThree key subjects___Maths, Science, and English___are mandatory.\nथ्री की सब्जेक्ट्स___मैथ्स, साइंस, एंड इंग्लिश___आर मैंडेटरी।\nतीन प्रमुख विषय—गणित, विज्ञान और अंग्रेजी—अनिवार्य हैं।",
    options: ["— (Em dash)","; (Semicolon)",": (Colon)",", (Comma)"],
    correctAnswer: "— (Em dash)",
    explanation: "Em dashes (—) are used to set off parenthetical explanatory lists or strong interruptions.\nएम डैश (—) का प्रयोग अतिरिक्त व्याख्यात्मक विवरण देने के लिए होता है।\nEm dash (—) का प्रयोग मुख्य वाक्य में विवरण जोड़ने के लिए होता है।",
    hint: "Punctuation mark for strong parenthetical emphasis: Em dash (—).\nEm dash (—)."
  },
  {
    id: "add3-c11-19",
    classLevel: "11",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct verb form for collective majority:\nThe majority of the committee members ___ in favor of the proposal.\nद मेजॉरिटी ऑफ द कमेटी मेंबर्स ___ इन फेवर ऑफ द प्रपोजल।\nसमिति के अधिकांश सदस्य प्रस्ताव के पक्ष में हैं।",
    options: ["are","is","was","has been"],
    correctAnswer: "are",
    explanation: "\"The majority of + plural noun (members)\" takes a PLURAL verb (are).\nमेजॉरिटी ऑफ के बाद बहुवचन संज्ञा होने पर क्रिया बहुवचन (are) होती है।\n\"The majority of members\" के साथ बहुवचन क्रिया (are) आती है।",
    hint: "\"The majority of members\" uses plural verb \"are\".\nare in favor."
  },
  {
    id: "add3-c11-20",
    classLevel: "11",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the conjunction paired with \"lest\":\nWalk carefully lest you ___ trip over the stone.\nवॉक केयरफुली लेस्ट यू ___ ट्रिप ओवर द स्टोन।\nसंभलकर चलें कहीं ऐसा न हो कि आप पत्थर से टकराकर गिर जाएं।",
    options: ["should","would","may","might"],
    correctAnswer: "should",
    explanation: "The conjunction \"lest\" is strictly paired with modal verb \"should\".\nलेस्ट के साथ हमेशा \"should\" का जोड़ा बनता है।\n\"lest\" के साथ सदैव \"should\" का प्रयोग होता है।",
    hint: "Lest is always followed by modal \"should\".\nlest you should..."
  },
  {
    id: "add3-c12-1",
    classLevel: "12",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Synthesize into Compound Sentence using correlative conjunction:\nHe is intelligent. He is hardworking.\nही इज इंटेलिजेंट। ही इज हार्डवर्किंग।\nवह बुद्धिमान है। वह मेहनती है।",
    options: ["He is not only intelligent but also hardworking.","Though he is intelligent, he is hardworking.","Because he is intelligent, he is hardworking.","He is intelligent so he is hardworking."],
    correctAnswer: "He is not only intelligent but also hardworking.",
    explanation: "Correlative conjunction \"not only... but also\" synthesizes two equal traits into a Compound sentence.\nनॉट ओनली... बट ऑल्सो से Compound Sentence बनता है।\n\"not only...but also\" का प्रयोग करके दो वाक्यों को जोड़ा गया है।",
    hint: "Use \"not only... but also\".\nnot only intelligent but also hardworking."
  },
  {
    id: "add3-c12-2",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the aspectual shift error in sentence:\nBy the time the police arrived, the burglar escaped. vs ...had escaped.\nबाय द टाइम द पुलिस अराइव्ड...।\nजब तक पुलिस पहुंची, चोर भाग चुका था।",
    options: ["Change \"escaped\" to \"had escaped\"","Change \"arrived\" to \"had arrived\"","Change \"burglar\" to \"burglars\"","No error"],
    correctAnswer: "Change \"escaped\" to \"had escaped\"",
    explanation: "Earlier past event before \"arrived\" requires Past Perfect \"had escaped\".\nपहले घटे कार्य के लिए Past Perfect (had escaped) होना आवश्यक है।\nपुलिस के पहुँचने से पहले चोर का भागना Past Perfect (had escaped) में लिखा जाएगा।",
    hint: "Earlier past action requires \"had escaped\".\nhad escaped."
  },
  {
    id: "add3-c12-3",
    classLevel: "12",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Choose the sentence with correct Negative Inversion:\nNever before had she witnessed such magnificent scenery.\nनेवर बिफोर हैड शी विटनेस्ड...।\nउसने पहले कभी इतना शानदार दृश्य नहीं देखा था।",
    options: ["Never before had she witnessed such magnificent scenery.","Never before she had witnessed such magnificent scenery.","Never before she has witnessed such scenery.","Never before witnessed she such scenery."],
    correctAnswer: "Never before had she witnessed such magnificent scenery.",
    explanation: "Fronted negative adverb \"Never before\" triggers inversion: had + she + V3.\nनेगेटिव एडवर्ब से शुरू होने पर Inversion (had she witnessed) अनिवार्य है।\n\"Never before had she witnessed...\" शुद्ध Inversion वाक्य है।",
    hint: "Inversion: Never before + had + she + V3.\nNever before had she witnessed..."
  },
  {
    id: "add3-c12-4",
    classLevel: "12",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Select the Mandative Subjunctive form:\nThe director demanded that the actor ___ present at 8 AM.\nद डायरेक्टर डिमांडेड दैट द एक्टर ___ प्रेजेंट एट 8 AM।\nनिदेशक ने मांग की कि अभिनेता सुबह 8 बजे उपस्थित रहे।",
    options: ["be","is","was","should be"],
    correctAnswer: "be",
    explanation: "Mandative Subjunctive after verbs of command (demanded that) uses base verb \"be\" for all subjects.\nकमांड वर्ब के बाद Mandative Subjunctive \"be\" का प्रयोग होता है।\n\"demanded that\" के बाद Subjunctive Form \"be\" आता है।",
    hint: "Mandative Subjunctive base form: be.\ndemanded that he be present."
  },
  {
    id: "add3-c12-5",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Choose the correct prepositional idiom:\nMany rare species are currently on the ___ of extinction.\nमेनी रेयर स्पीशीज आर करेंटली ऑन द ___ ऑफ एक्सटिंंक्शन।\nकई दुर्लभ प्रजातियां वर्तमान में विलुप्त होने के कगार पर हैं।",
    options: ["brink","edge","border","side"],
    correctAnswer: "brink",
    explanation: "Fixed idiom \"on the brink of extinction\" means on the verge of disaster/extinction.\nविलुप्त होने की कगार के लिए \"on the brink of extinction\" मुहावरा है।\n\"on the brink of extinction\" निश्चित मुहावरा (Idiom) है।",
    hint: "Idiom for \"on the verge of\": brink.\non the brink of extinction."
  },
  {
    id: "add3-c12-6",
    classLevel: "12",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct verb for collective noun \"police\":\nThe police ___ investigating the cyber crime incident.\nद पुलिस ___ इन्वेस्टिगेटिंग द साइबर क्राइम इंसिडेंट।\nपुलिस साइबर अपराध की घटना की जांच कर रही है।",
    options: ["are","is","was","has been"],
    correctAnswer: "are",
    explanation: "The collective noun \"police\" strictly takes a PLURAL verb (are).\nपुलिस शब्द हमेशा प्लुरल वर्ब (are) लेता है।\n\"Police\" संज्ञा के साथ हमेशा बहुवचन क्रिया (are) आती है।",
    hint: "Noun \"police\" takes plural verb \"are\".\nPolice are investigating."
  },
  {
    id: "add3-c12-7",
    classLevel: "12",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert rhetorical question to Indirect Speech:\nHe said, \"Why waste time on silly arguments?\"\nही सैड, \"वाई वेस्ट टाइम ऑन सिली आर्गुमेंट्स?\"\nउसने कहा, \"मूर्खतापूर्ण तर्कों पर समय क्यों बर्बाद करें?\"",
    options: ["He questioned why they should waste time on silly arguments.","He asked that why waste time on silly arguments.","He told why to waste time on arguments.","He said why wasted time."],
    correctAnswer: "He questioned why they should waste time on silly arguments.",
    explanation: "Rhetorical questions express suggestion/futility using \"questioned why they should + V1\".\nअलंकारिक प्रश्न का रूपांतरण \"questioned why they should...\" होता है।\n\"why should waste time\" अर्थपूर्ण इनडायरेक्ट संरचना है।",
    hint: "Rhetorical question transforms with \"questioned why they should...\".\nquestioned why they should..."
  },
  {
    id: "add3-c12-8",
    classLevel: "12",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert phrasal verb sentence to Passive:\nOne should not look down upon the poor.\nवन शुड नॉट लुक डाउन अपॉन द पूर।\nकिसी को भी गरीबों को हीन दृष्टि से नहीं देखना चाहिए।",
    options: ["The poor should not be looked down upon.","The poor should not be looked down by one.","The poor are not looked down upon.","One should be not looked down upon."],
    correctAnswer: "The poor should not be looked down upon.",
    explanation: "Passive of phrasal verb retains prepositional particle: \"should not be looked down upon\".\nफ्रेजल वर्ब के कण (upon) पैसिव में बने रहते हैं।\n\"should not be looked down upon\" सही रूप है।",
    hint: "Retain \"upon\" at the end of verb phrase.\nshould not be looked down upon."
  },
  {
    id: "add3-c12-9",
    classLevel: "12",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the modal for strong past logical deduction:\nHe left two hours ago, so he ___ reached his destination by now.\nही लेफ्ट टू आवर्स एगो, सो ही ___ रीच्ड हिज डेस्टिनेशन बाय नाउ।\nवह दो घंटे पहले निकला था, इसलिए वह अब तक अपने गंतव्य पर पहुँच गया होगा।",
    options: ["must have","should have","could have","might have"],
    correctAnswer: "must have",
    explanation: "\"must have + V3\" expresses a near-certain logical conclusion about a past event.\nअतीत के कार्य के तार्किक निष्कर्ष के लिए \"must have\" का प्रयोग होता है।\n\"must have + V3\" मजबूत तार्किक अनुमान (Deduction) व्यक्त करता है।",
    hint: "Modal for strong logical past deduction: must have.\nmust have reached."
  },
  {
    id: "add3-c12-10",
    classLevel: "12",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Identify the Causative Verb construction:\nShe ___ her room painted last weekend.\nशी ___ हर रूम पेंटेड लास्ट वीकेंड।\nउसने पिछले सप्ताहांत अपने कमरे की पुताई करवाई।",
    options: ["had","gotten","made","did"],
    correctAnswer: "had",
    explanation: "Causative structure: Subject + had + object + V3 (had her room painted).\nकॉजेटिव स्ट्रक्चर: had + object + V3।\n\"had her room painted\" सही कॉजेटिव वाक्य रचना है।",
    hint: "Causative structure: Subject + had + object + V3.\nhad her room painted."
  },
  {
    id: "add3-c12-11",
    classLevel: "12",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Choose the correct determiner structure:\nIt was ___ a memorable experience that I will never forget it.\nइट वाज ___ ए मेमोरेबल एक्सपीरियंस दैट आई विल नेवर फॉरगेट इट।\nयह इतना यादगार अनुभव था कि मैं इसे कभी नहीं भूलूँगा।",
    options: ["such","so","too","very"],
    correctAnswer: "such",
    explanation: "\"such a + adjective + noun + that\" is the correct correlative structure.\n\"such a... that\" का प्रयोग संज्ञा वाक्यांश के साथ होता है।\n\"such a\" का प्रयोग noun phrase (memorable experience) के पहले होता है।",
    hint: "Use \"such\" before noun phrase with \"a\": such a memorable...\nsuch."
  },
  {
    id: "add3-c12-12",
    classLevel: "12",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Select the Inverted First Conditional structure:\n___ you need any further assistance, please feel free to call us.\n___ यू नीड एनी फर्दर असिस्टेंस, प्लीज फील फ्री टू कॉल अस।\nयदि आपको किसी और सहायता की आवश्यकता हो, तो कृपया बेझिझक हमें कॉल करें।",
    options: ["Should","If","Were","Had"],
    correctAnswer: "Should",
    explanation: "Formal inverted First Conditional uses \"Should + subject + V1\" instead of \"If you need\".\nऔपचारिक शर्तों के लिए \"Should you need\" का प्रयोग होता है।\n\"If you need\" का औपचारिक Inverted रूप \"Should you need\" है।",
    hint: "Formal conditional starting with modal: Should.\nShould you need..."
  },
  {
    id: "add3-c12-13",
    classLevel: "12",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Choose the sentence with correct structural parallelism:\nThe museum is renowned not only for its historical artifacts but also for its architectural design.\nद म्यूजियम इज रीनाउंड नॉट ओनली फॉर...।\nसंग्रहालय न केवल अपने ऐतिहासिक अवशेषों के लिए बल्कि अपनी वास्तुशिल्प डिजाइन के लिए भी प्रसिद्ध है।",
    options: ["The museum is renowned not only for its historical artifacts but also for its architectural design.","The museum is renowned for not only historical artifacts but also architectural design.","The museum is renowned not only for historical artifacts but also architectural design.","The museum is renowned for its artifacts not only but also its design."],
    correctAnswer: "The museum is renowned not only for its historical artifacts but also for its architectural design.",
    explanation: "Parallel structure balances \"not only for X but also for Y\".\n\"not only for... but also for...\" समानांतर बनावट है।\nदोनों खंडों में \"for\" का समानांतर प्रयोग शुद्ध है।",
    hint: "Balance preposition: not only for X but also for Y.\nnot only for... but also for..."
  },
  {
    id: "add3-c12-14",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Correct the misplaced modifier error:\nBarking loudly, the mailman was chased by the dog. vs Barking loudly, the dog chased the mailman.\nबार्किंग लाउडली...।\nज़ोर-ज़ोर से भौंकते हुए, कुत्ते ने डाकिया का पीछा किया।",
    options: ["Barking loudly, the dog chased the mailman.","Barking loudly, the mailman was chased by the dog.","The mailman chased the dog barking loudly.","Dog was chased mailman barking loudly."],
    correctAnswer: "Barking loudly, the dog chased the mailman.",
    explanation: "Modifier \"Barking loudly\" must immediately precede the noun it describes (\"the dog\").\nभौंकने वाला कुत्ता है, अतः \"Barking loudly\" के तुरंत बाद \"the dog\" आना चाहिए।\n\"Barking loudly, the dog chased...\" सही पदक्रम है।",
    hint: "The dog was barking, so \"the dog\" must follow the modifier.\nBarking loudly, the dog..."
  },
  {
    id: "add3-c12-15",
    classLevel: "12",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the correct fixed preposition:\nThis software application is fully compatible ___ Windows 11.\nदिस सॉफ्टवेयर एप्लीकेशन इज फुल्ली कम्पैटिबल ___ विंडोज 11।\nयह सॉफ्टवेयर एप्लिकेशन विंडोज 11 के साथ पूरी तरह से अनुकूल है।",
    options: ["with","to","for","at"],
    correctAnswer: "with",
    explanation: "Adjective \"compatible\" takes fixed preposition \"with\" (compatible with).\nकम्पैटिबल के साथ Preposition \"with\" आता है।\n\"Compatible\" के साथ हमेशा निश्चित Preposition \"with\" आता है।",
    hint: "Compatible is followed by preposition \"with\".\ncompatible with."
  },
  {
    id: "add3-c12-16",
    classLevel: "12",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct verb for fractional noun:\nHalf of the apples in the basket ___ rotten.\nहाफ ऑफ द एप्पल्स इन द बास्केट ___ रोटन।\nटोकरी में से आधे सेब सड़े हुए हैं।",
    options: ["are","is","was","has been"],
    correctAnswer: "are",
    explanation: "\"Half of + plural noun (apples)\" takes a PLURAL verb (are).\n\"Half of\" के बाद बहुवचन संज्ञा होने पर क्रिया बहुवचन (are) होगी।\n\"Half of apples\" के साथ बहुवचन क्रिया (are) आती है।",
    hint: "\"Half of\" with plural apples takes plural verb \"are\".\nare rotten."
  },
  {
    id: "add3-c12-17",
    classLevel: "12",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert impersonal duty sentence to Passive:\nOne should keep one's promises.\nवन शुड कीप वन्स प्रॉमिसेज।\nअपने वादों को निभाना चाहिए।",
    options: ["Promises should be kept.","One's promises should be kept by one.","Promises should keep by anyone.","Promises must be kept by one."],
    correctAnswer: "Promises should be kept.",
    explanation: "Universal passive omits redundant agent \"by one\": Promises should be kept.\nव्यापक वाक्य में \"by one\" को हटा दिया जाता है: Promises should be kept.\n\"Promises should be kept\" मानक निरपेक्ष पैसिव रूप है।",
    hint: "Omit \"by one\" in universal passive.\nPromises should be kept."
  },
  {
    id: "add3-c12-18",
    classLevel: "12",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert exclamatory sentence to Indirect:\nShe said, \"How beautiful the sunset is!\"\nशी सैड, \"हाउ ब्यूटीफुल द सूर्यास्त इज!\"\nउसने कहा, \"सूर्यास्त कितना सुंदर है!\"",
    options: ["She exclaimed with delight that the sunset was very beautiful.","She said that how beautiful was the sunset.","She told that sunset is very beautiful.","She exclaimed that sunset is beautiful."],
    correctAnswer: "She exclaimed with delight that the sunset was very beautiful.",
    explanation: "\"How beautiful!\" converts to \"exclaimed with delight that + subject + was very beautiful\".\nविस्मयादिबोधक वाक्य का रूपांतरण \"exclaimed with delight that...\" होता है।\n\"exclaimed with delight that the sunset was very beautiful\" सही रूप है।",
    hint: "Change \"How beautiful\" to \"exclaimed with delight that... was very beautiful\".\nexclaimed with delight that..."
  },
  {
    id: "add3-c12-19",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the sentence that avoids a Split Infinitive:\nHe decided to carefully read the contract. vs He decided to read the contract carefully.\nही डिसाइडेड टू केयरफुली रीड... वर्सेज ही डिसाइडेड टू रीड...।\nउसने अनुबंध को ध्यानपूर्वक पढ़ने का निर्णय लिया।",
    options: ["He decided to read the contract carefully.","He decided to carefully read the contract.","He decided carefully to read the contract.","He carefully decided to read contract."],
    correctAnswer: "He decided to read the contract carefully.",
    explanation: "Avoid splitting \"to read\" by placing adverb \"carefully\" after the noun phrase.\n\"to\" और verb के बीच adverb न रखकर उसे बाद में रखें।\n\"to read the contract carefully\" Split Infinitive दोष से मुक्त शुद्ध वाक्य है।",
    hint: "Do not split \"to\" and \"read\". Place \"carefully\" at the end.\nto read the contract carefully."
  },
  {
    id: "add3-c12-20",
    classLevel: "12",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Combine into a single Complex Sentence using relative pronoun:\nThis is the professor. His research paper won the international award.\nदिस इज द प्रोफेसर। हिज रिसर्च पेपर वोन...।\nयह वही प्रोफेसर हैं जिनके शोध पत्र ने अंतर्राष्ट्रीय पुरस्कार जीता है।",
    options: ["This is the professor whose research paper won the international award.","This is the professor who research paper won international award.","This is the professor and his paper won award.","This is professor that his paper won award."],
    correctAnswer: "This is the professor whose research paper won the international award.",
    explanation: "Possessive relative pronoun \"whose\" combines both sentences into a Complex sentence.\nसम्बन्ध दर्शाने के लिए Relative Pronoun \"whose\" का प्रयोग करें।\n\"whose\" का प्रयोग करके दोनों वाक्यों का संश्लेषण (Synthesis) किया गया है।",
    hint: "Use relative possessive pronoun \"whose\".\nwhose research paper won..."
  },,,
  // ==================== NEW BATCH 300 QUESTIONS (30 PER CLASS 3-12) ====================
  {
    id: "add4-c3-1",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Which word is a pronoun in: \"She has a yellow bicycle.\"",
    options: ["She","yellow","bicycle","has"],
    correctAnswer: "She",
    explanation: "Pronouns replace nouns. \"She\" refers to a girl or woman.",
    hint: "Find the word that replaces a person's name."
  },
  {
    id: "add4-c3-2",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the proper noun in: \"Rohan visits the zoo on Sunday.\"",
    options: ["zoo","Rohan","visits","Sunday"],
    correctAnswer: "Rohan",
    explanation: "Proper nouns are specific names of people, places, or days and start with a capital letter.",
    hint: "Look for the capitalized name of a person."
  },
  {
    id: "add4-c3-3",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Choose the correct plural noun for \"leaf\":",
    options: ["leafs","leaves","leafes","leafies"],
    correctAnswer: "leaves",
    explanation: "Nouns ending in \"f\" usually change \"f\" to \"ves\" in plural.",
    hint: "Change \"f\" to \"ves\"."
  },
  {
    id: "add4-c3-4",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the pronoun in: \"They are playing in the garden.\"",
    options: ["They","playing","garden","are"],
    correctAnswer: "They",
    explanation: "\"They\" replaces the names of multiple people.",
    hint: "Look for the word replacing people."
  },
  {
    id: "add4-c3-5",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Select the common noun in: \"My teacher lives in Mumbai.\"",
    options: ["teacher","Mumbai","My","lives"],
    correctAnswer: "teacher",
    explanation: "Common nouns refer to general names like teacher, doctor, city.",
    hint: "General name for a profession."
  },
  {
    id: "add4-c3-6",
    classLevel: "3",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Fill in the blank: \"My father bought ___ ice cream for me.\"",
    options: ["a","an","the","no article"],
    correctAnswer: "an",
    explanation: "\"Ice cream\" begins with a vowel sound /i/, so we use \"an\".",
    hint: "Look at the starting sound of \"ice cream\"."
  },
  {
    id: "add4-c3-7",
    classLevel: "3",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Choose the correct article: \"___ sun shines brightly in the sky.\"",
    options: ["A","An","The","No article"],
    correctAnswer: "The",
    explanation: "We use \"the\" before unique natural objects like sun, moon, and sky.",
    hint: "It is a unique object in nature."
  },
  {
    id: "add4-c3-8",
    classLevel: "3",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Riya has ___ red umbrella.\"",
    options: ["a","an","the","no article"],
    correctAnswer: "a",
    explanation: "Although umbrella starts with vowel, \"red\" comes before it, which starts with consonant sound /r/. So we use \"a\".",
    hint: "Check the sound of the word immediately after the blank."
  },
  {
    id: "add4-c3-9",
    classLevel: "3",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Fill in the blank: \"___ elephant is a very large animal.\"",
    options: ["An","A","The","No article"],
    correctAnswer: "An",
    explanation: "\"Elephant\" starts with vowel sound /e/, so use \"an\".",
    hint: "Vowel sound /e/."
  },
  {
    id: "add4-c3-10",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Identify the action verb: \"The little puppy barks loudly.\"",
    options: ["little","puppy","barks","loudly"],
    correctAnswer: "barks",
    explanation: "A verb is an action word. \"Barks\" shows what the puppy does.",
    hint: "What action is the puppy doing?"
  },
  {
    id: "add4-c3-11",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Choose the correct past tense form of \"fly\":",
    options: ["flyed","flew","flown","flying"],
    correctAnswer: "flew",
    explanation: "The past tense of the irregular verb \"fly\" is \"flew\".",
    hint: "It is an irregular past tense word."
  },
  {
    id: "add4-c3-12",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"They ___ playing football yesterday.\"",
    options: ["is","are","was","were"],
    correctAnswer: "were",
    explanation: "Use \"were\" with plural pronoun \"they\" in past continuous tense.",
    hint: "Plural pronoun + past tense verb."
  },
  {
    id: "add4-c3-13",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Choose the future tense form: \"Tomorrow I ___ visit my grandmother.\"",
    options: ["will","was","did","have"],
    correctAnswer: "will",
    explanation: "\"Will\" indicates future action.",
    hint: "Word used for future tense."
  },
  {
    id: "add4-c3-14",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Identify the adjective in: \"The giraffe has a long neck.\"",
    options: ["giraffe","has","long","neck"],
    correctAnswer: "long",
    explanation: "Adjectives describe nouns. \"Long\" describes the neck.",
    hint: "Which word tells how the neck looks?"
  },
  {
    id: "add4-c3-15",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Identify the adverb in: \"He writes neatly in his notebook.\"",
    options: ["writes","neatly","notebook","his"],
    correctAnswer: "neatly",
    explanation: "Adverbs tell how an action is done. \"Neatly\" describes how he writes.",
    hint: "Look for the word ending in -ly."
  },
  {
    id: "add4-c3-16",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Choose the correct comparative form: \"A cheetah is ___ than a rabbit.\"",
    options: ["fast","faster","fastest","more fast"],
    correctAnswer: "faster",
    explanation: "Use comparative degree (-er) when comparing two animals.",
    hint: "Compare two animals using -er."
  },
  {
    id: "add4-c3-17",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Identify the descriptive adjective in: \"She bought a sweet apple.\"",
    options: ["sweet","bought","apple","She"],
    correctAnswer: "sweet",
    explanation: "\"Sweet\" describes the taste of the apple (noun).",
    hint: "Word describing the apple."
  },
  {
    id: "add4-c3-18",
    classLevel: "3",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Choose the preposition: \"The bird flew ___ the tree.\"",
    options: ["over","flew","bird","tree"],
    correctAnswer: "over",
    explanation: "Prepositions show position. \"Over\" tells where the bird flew.",
    hint: "Where did the bird fly relative to the tree?"
  },
  {
    id: "add4-c3-19",
    classLevel: "3",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Choose the conjunction: \"I like apples ___ oranges.\"",
    options: ["and","in","on","with"],
    correctAnswer: "and",
    explanation: "\"And\" joins two similar words or ideas together.",
    hint: "Select the joining word."
  },
  {
    id: "add4-c3-20",
    classLevel: "3",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Put the toys ___ the box.\"",
    options: ["inside","under","between","off"],
    correctAnswer: "inside",
    explanation: "\"Inside\" shows position within a container.",
    hint: "Where do toys go in a box?"
  },
  {
    id: "add4-c3-21",
    classLevel: "3",
    topic: "Subject-Verb Agreement",
    difficulty: "Easy",
    questionText: "Choose the correct verb: \"The girl ___ sweet songs.\"",
    options: ["sing","sings","singing","sanger"],
    correctAnswer: "sings",
    explanation: "Singular subject \"The girl\" takes a singular verb ending in -s (\"sings\").",
    hint: "Singular subject takes verb + s."
  },
  {
    id: "add4-c3-22",
    classLevel: "3",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct verb: \"Cats ___ milk.\"",
    options: ["likes","like","liking","is like"],
    correctAnswer: "like",
    explanation: "Plural subject \"Cats\" takes plural verb \"like\" without -s.",
    hint: "Plural subject takes verb without -s."
  },
  {
    id: "add4-c3-23",
    classLevel: "3",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"My brother ___ a new school bag.\"",
    options: ["have","has","having","are"],
    correctAnswer: "has",
    explanation: "Singular third-person subject \"My brother\" takes \"has\".",
    hint: "Singular noun takes has."
  },
  {
    id: "add4-c3-24",
    classLevel: "3",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Choose the sentence with correct punctuation:",
    options: ["where is my pencil.","Where is my pencil?","Where is my pencil!","where is my pencil"],
    correctAnswer: "Where is my pencil?",
    explanation: "Question sentences start with a capital letter and end with a question mark.",
    hint: "Look for capital letter and question mark."
  },
  {
    id: "add4-c3-25",
    classLevel: "3",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Which word should begin with a capital letter?",
    options: ["monday","book","chair","house"],
    correctAnswer: "monday",
    explanation: "Days of the week are proper nouns and always start with a capital letter.",
    hint: "Day of the week needs capitalization."
  },
  {
    id: "add4-c3-26",
    classLevel: "3",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Find the correct sentence:",
    options: ["Me am happy today.","I am happy today.","I is happy today.","I are happy today."],
    correctAnswer: "I am happy today.",
    explanation: "Use pronoun \"I\" with auxiliary verb \"am\".",
    hint: "Which pronoun goes with \"am\"?"
  },
  {
    id: "add4-c3-27",
    classLevel: "3",
    topic: "Modals & Auxiliaries",
    difficulty: "Easy",
    questionText: "Fill in the blank for permission: \"___ I go to the washroom, please?\"",
    options: ["May","Must","Should","Would"],
    correctAnswer: "May",
    explanation: "\"May\" is used to ask for polite permission.",
    hint: "Polite permission word."
  },
  {
    id: "add4-c3-28",
    classLevel: "3",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Choose the correct modal for ability: \"Birds ___ fly in the sky.\"",
    options: ["can","must","should","may"],
    correctAnswer: "can",
    explanation: "\"Can\" expresses natural ability.",
    hint: "Word used for ability."
  },
  {
    id: "add4-c3-29",
    classLevel: "3",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"You ___ brush your teeth twice a day.\"",
    options: ["should","may","could","might"],
    correctAnswer: "should",
    explanation: "\"Should\" is used to give good advice or duty.",
    hint: "Word used for giving advice."
  },
  {
    id: "add4-c3-30",
    classLevel: "3",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Identify the full stop in a sentence. Where does it go?",
    options: ["At the beginning","In the middle","At the end","Nowhere"],
    correctAnswer: "At the end",
    explanation: "Statements end with a full stop (period).",
    hint: "End of sentence."
  },
  {
    id: "add4-c4-1",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the collective noun in: \"A herd of elephants crossed the river.\"",
    options: ["elephants","river","herd","crossed"],
    correctAnswer: "herd",
    explanation: "A collective noun names a group of animals or items (\"herd\").",
    hint: "Word for a group of animals."
  },
  {
    id: "add4-c4-2",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Choose the correct pronoun: \"Meenu and ___ went to the market.\"",
    options: ["me","I","myself","mine"],
    correctAnswer: "I",
    explanation: "Use subject pronoun \"I\" in compound subject \"Meenu and I\".",
    hint: "Subject pronoun needed here."
  },
  {
    id: "add4-c4-3",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Which word is an abstract noun?",
    options: ["honesty","table","boy","city"],
    correctAnswer: "honesty",
    explanation: "Abstract nouns refer to qualities, feelings, or ideas that cannot be touched.",
    hint: "Name of a quality."
  },
  {
    id: "add4-c4-4",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "What is the possessive form of \"dog\"?",
    options: ["dogs","dog's","dogs'","doges"],
    correctAnswer: "dog's",
    explanation: "Singular possessive noun adds 's.",
    hint: "Singular noun + 's."
  },
  {
    id: "add4-c4-5",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Choose the correct pronoun: \"The cat licked ___ paws.\"",
    options: ["its","it's","their","his"],
    correctAnswer: "its",
    explanation: "\"Its\" is the possessive pronoun for animals/things without an apostrophe.",
    hint: "Possessive pronoun for an animal."
  },
  {
    id: "add4-c4-6",
    classLevel: "4",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Fill in the blank: \"He is ___ honest shopkeeper.\"",
    options: ["a","an","the","no article"],
    correctAnswer: "an",
    explanation: "\"Honest\" begins with a silent 'h', producing a vowel sound /ɒnɪst/, so use \"an\".",
    hint: "Silent \"h\" produces a vowel sound."
  },
  {
    id: "add4-c4-7",
    classLevel: "4",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"___ Taj Mahal is located in Agra.\"",
    options: ["A","An","The","No article"],
    correctAnswer: "The",
    explanation: "Use \"the\" before famous historical monuments and unique buildings.",
    hint: "Used for famous monuments."
  },
  {
    id: "add4-c4-8",
    classLevel: "4",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Choose the sentence with correct article usage:",
    options: ["She gave me an gold ring.","She gave me a gold ring.","She gave me the gold ring.","She gave me gold ring."],
    correctAnswer: "She gave me a gold ring.",
    explanation: "\"Gold\" starts with consonant sound /ɡ/, so use \"a\".",
    hint: "Consonant sound gets \"a\"."
  },
  {
    id: "add4-c4-9",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Identify the verb tense: \"We will travel to Delhi tomorrow.\"",
    options: ["Present Tense","Past Tense","Future Tense","Past Continuous"],
    correctAnswer: "Future Tense",
    explanation: "\"Will travel\" indicates an action that will happen in the future.",
    hint: "Look for \"will\" + verb."
  },
  {
    id: "add4-c4-10",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Choose the correct continuous tense form: \"Look! The children ___ in the garden.\"",
    options: ["play","played","are playing","were playing"],
    correctAnswer: "are playing",
    explanation: "\"Look!\" signals an action happening right now (Present Continuous: \"are playing\").",
    hint: "Action happening at this moment."
  },
  {
    id: "add4-c4-11",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the past participle form of \"write\":",
    options: ["wrote","writing","written","writes"],
    correctAnswer: "written",
    explanation: "The three forms of write are: write (V1), wrote (V2), written (V3).",
    hint: "V3 form of write."
  },
  {
    id: "add4-c4-12",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Identify the past tense of \"think\":",
    options: ["thinked","thought","thoughted","thinking"],
    correctAnswer: "thought",
    explanation: "\"Thought\" is the irregular simple past tense of \"think\".",
    hint: "Irregular past tense of think."
  },
  {
    id: "add4-c4-13",
    classLevel: "4",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Identify the superlative degree adjective: \"Mount Everest is the ___ mountain in the world.\"",
    options: ["high","higher","highest","more high"],
    correctAnswer: "highest",
    explanation: "Use superlative degree (-est) when comparing more than two objects.",
    hint: "Superlative form ends in -est."
  },
  {
    id: "add4-c4-14",
    classLevel: "4",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the adverb of frequency in: \"She always completes her homework on time.\"",
    options: ["completes","always","homework","time"],
    correctAnswer: "always",
    explanation: "\"Always\" shows how frequently an action happens.",
    hint: "Word showing how often."
  },
  {
    id: "add4-c4-15",
    classLevel: "4",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Choose the correct form: \"This puzzle is ___ than the previous one.\"",
    options: ["difficult","more difficult","most difficult","difficulter"],
    correctAnswer: "more difficult",
    explanation: "Long adjectives form comparative degree using \"more\".",
    hint: "Use \"more\" for long adjectives."
  },
  {
    id: "add4-c4-16",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Fill in the blank: \"The dog jumped ___ the fence.\"",
    options: ["over","in","at","on"],
    correctAnswer: "over",
    explanation: "\"Over\" indicates movement from one side to another across a barrier.",
    hint: "Movement over an obstacle."
  },
  {
    id: "add4-c4-17",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Choose the correct conjunction: \"He ran fast, ___ he missed the bus.\"",
    options: ["so","because","but","or"],
    correctAnswer: "but",
    explanation: "\"But\" connects two contrasting clauses.",
    hint: "Shows contrast between fast running and missing the bus."
  },
  {
    id: "add4-c4-18",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Distribute these candies ___ the two brothers.\"",
    options: ["among","between","with","in"],
    correctAnswer: "between",
    explanation: "Use \"between\" when referring to two persons or items.",
    hint: "Used for exactly two people."
  },
  {
    id: "add4-c4-19",
    classLevel: "4",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the grammatically correct sentence (Subject-Verb Agreement - Class 4):",
    options: ["Neither of the boys were present.","Neither of the boys was present.","Neither of the boys are present.","Neither of the boys be present."],
    correctAnswer: "Neither of the boys was present.",
    explanation: "\"Neither\" is a singular indefinite pronoun and takes a singular verb (\"was\").",
    hint: "\"Neither\" takes a singular verb."
  },
  {
    id: "add4-c4-20",
    classLevel: "4",
    topic: "Subject-Verb Agreement",
    difficulty: "Easy",
    questionText: "Choose the correct verb: \"The stars ___ brightly at night.\"",
    options: ["shine","shines","shining","is shine"],
    correctAnswer: "shine",
    explanation: "Plural subject \"The stars\" takes plural verb \"shine\".",
    hint: "Plural subject takes plural verb."
  },
  {
    id: "add4-c4-21",
    classLevel: "4",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Bread and butter ___ my favorite breakfast.\"",
    options: ["is","are","were","have"],
    correctAnswer: "is",
    explanation: "When two words combine to express a single idea/dish, take singular verb \"is\".",
    hint: "Single dish/combination takes singular verb."
  },
  {
    id: "add4-c4-22",
    classLevel: "4",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Where should the comma be placed? \"I bought apples oranges and bananas.\"",
    options: ["after apples","after oranges","after apples and oranges","no comma needed"],
    correctAnswer: "after apples",
    explanation: "Use commas to separate items in a list: \"apples, oranges and bananas\".",
    hint: "Separate items in a list."
  },
  {
    id: "add4-c4-23",
    classLevel: "4",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the type of sentence: \"What a beautiful flower this is!\"",
    options: ["Assertive","Interrogative","Imperative","Exclamatory"],
    correctAnswer: "Exclamatory",
    explanation: "Sentences expressing strong feelings and ending with ! are Exclamatory.",
    hint: "Ends with exclamation mark."
  },
  {
    id: "add4-c4-24",
    classLevel: "4",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Correct the error: \"He don't like playing cricket.\"",
    options: ["He doesn't like playing cricket.","He not like playing cricket.","He don't likes playing cricket.","He hasn't like playing cricket."],
    correctAnswer: "He doesn't like playing cricket.",
    explanation: "Third-person singular pronoun \"He\" takes \"doesn't\", not \"don't\".",
    hint: "Use doesn't with He."
  },
  {
    id: "add4-c4-25",
    classLevel: "4",
    topic: "Modals & Auxiliaries",
    difficulty: "Easy",
    questionText: "Choose the modal for necessity: \"You ___ follow the traffic rules.\"",
    options: ["must","can","may","might"],
    correctAnswer: "must",
    explanation: "\"Must\" expresses strong obligation or legal necessity.",
    hint: "Expresses strict obligation."
  },
  {
    id: "add4-c4-26",
    classLevel: "4",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"It ___ rain this evening, as the sky is cloudy.\"",
    options: ["might","must","should","would"],
    correctAnswer: "might",
    explanation: "\"Might\" expresses possibility.",
    hint: "Expresses possibility."
  },
  {
    id: "add4-c4-27",
    classLevel: "4",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Choose the auxiliary verb: \"She ___ already finished her homework.\"",
    options: ["has","have","is","are"],
    correctAnswer: "has",
    explanation: "Singular subject \"She\" with past participle \"finished\" requires \"has\".",
    hint: "Auxiliary for present perfect."
  },
  {
    id: "add4-c4-28",
    classLevel: "4",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Change to indirect speech: Rohan said, \"I am tired.\"",
    options: ["Rohan said that he was tired.","Rohan said that I am tired.","Rohan told that he is tired.","Rohan says he was tired."],
    correctAnswer: "Rohan said that he was tired.",
    explanation: "Present tense \"am\" changes to past tense \"was\" in indirect speech.",
    hint: "Change \"I am\" to \"he was\"."
  },
  {
    id: "add4-c4-29",
    classLevel: "4",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Identify the reported clause in: The teacher said that Earth revolves round the Sun.",
    options: ["The teacher said","that Earth revolves round the Sun","revolves round","The teacher"],
    correctAnswer: "that Earth revolves round the Sun",
    explanation: "The reported clause follows the conjunction \"that\".",
    hint: "The clause that comes after \"that\"."
  },
  {
    id: "add4-c4-30",
    classLevel: "4",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Passive Voice: \"The chef cooked a delicious meal.\"",
    options: ["A delicious meal was cooked by the chef.","A delicious meal is cooked by the chef.","A delicious meal cooked the chef.","The chef was cooked by a delicious meal."],
    correctAnswer: "A delicious meal was cooked by the chef.",
    explanation: "Past simple passive: Object + was + past participle (cooked) + by + Subject.",
    hint: "Object + was + V3 + by + subject."
  },
  {
    id: "add4-c5-1",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the reflexive pronoun: \"The boy hurt himself while playing.\"",
    options: ["boy","hurt","himself","playing"],
    correctAnswer: "himself",
    explanation: "Reflexive pronouns end in -self or -selves and refer back to the subject.",
    hint: "Ends with -self."
  },
  {
    id: "add4-c5-2",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Which of the following is an uncountable noun?",
    options: ["water","book","pen","apple"],
    correctAnswer: "water",
    explanation: "Uncountable nouns cannot be counted individually with numbers.",
    hint: "Cannot be counted in numbers."
  },
  {
    id: "add4-c5-3",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Fill in the blank with suitable possessive pronoun: \"This bag belongs to me. It is ___.\"",
    options: ["my","mine","me","myself"],
    correctAnswer: "mine",
    explanation: "Possessive pronoun \"mine\" stands alone without a noun following it.",
    hint: "Possessive pronoun standing alone."
  },
  {
    id: "add4-c5-4",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the relative pronoun in: \"This is the boy who saved the puppy.\"",
    options: ["This","boy","who","puppy"],
    correctAnswer: "who",
    explanation: "Relative pronouns (who, which, that) connect clauses to nouns.",
    hint: "Connects clause to the boy."
  },
  {
    id: "add4-c5-5",
    classLevel: "5",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Choose correct articles: \"___ European tourist visited ___ Qutub Minar.\"",
    options: ["A, the","An, the","The, a","A, a"],
    correctAnswer: "A, the",
    explanation: "\"European\" starts with consonant sound /jʊər/, so use \"a\". Monument takes \"the\".",
    hint: "European has consonant sound /y/ + monument gets \"the\"."
  },
  {
    id: "add4-c5-6",
    classLevel: "5",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"He is ___ tallest boy in the class.\"",
    options: ["a","an","the","no article"],
    correctAnswer: "the",
    explanation: "Use \"the\" before superlative degree adjectives (\"tallest\").",
    hint: "Superlative degree takes \"the\"."
  },
  {
    id: "add4-c5-7",
    classLevel: "5",
    topic: "Articles (A, An, The)",
    difficulty: "Hard",
    questionText: "Which sentence leaves out articles correctly (zero article)?",
    options: ["Gold is a precious metal.","The gold is a precious metal.","A gold is a precious metal.","An gold is precious metal."],
    correctAnswer: "Gold is a precious metal.",
    explanation: "Uncountable/material nouns used in a general sense do not take articles.",
    hint: "Material nouns in general take no article."
  },
  {
    id: "add4-c5-8",
    classLevel: "5",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the perfect tense: \"She has completed her project.\"",
    options: ["Simple Present","Present Perfect","Past Perfect","Present Continuous"],
    correctAnswer: "Present Perfect",
    explanation: "\"Has\" + past participle (completed) forms Present Perfect Tense.",
    hint: "Has/Have + past participle."
  },
  {
    id: "add4-c5-9",
    classLevel: "5",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct form: \"By next month, we ___ our exams.\"",
    options: ["will finish","will have finished","finished","are finishing"],
    correctAnswer: "will have finished",
    explanation: "\"By next month\" signals Future Perfect Tense (will have + V3).",
    hint: "Action completed by a future point in time."
  },
  {
    id: "add4-c5-10",
    classLevel: "5",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"When the phone rang, I ___ dinner.\"",
    options: ["eat","am eating","was eating","had eaten"],
    correctAnswer: "was eating",
    explanation: "Past Continuous (\"was eating\") shows an ongoing past action interrupted by simple past (\"rang\").",
    hint: "Past continuous action interrupted."
  },
  {
    id: "add4-c5-11",
    classLevel: "5",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Select the past perfect form of \"leave\":",
    options: ["left","has left","had left","leaving"],
    correctAnswer: "had left",
    explanation: "Past perfect tense uses \"had\" + past participle (left).",
    hint: "Had + V3 form."
  },
  {
    id: "add4-c5-12",
    classLevel: "5",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the adverb of degree in: \"The weather is extremely cold today.\"",
    options: ["weather","extremely","cold","today"],
    correctAnswer: "extremely",
    explanation: "\"Extremely\" modifies the adjective \"cold\", showing degree/intensity.",
    hint: "Modifies how cold it is."
  },
  {
    id: "add4-c5-13",
    classLevel: "5",
    topic: "Adjectives & Adverbs",
    difficulty: "Hard",
    questionText: "Order of adjectives: Choose the correct sentence:",
    options: ["She wore a small red silk dress.","She wore a red silk small dress.","She wore a silk red small dress.","She wore a small silk red dress."],
    correctAnswer: "She wore a small red silk dress.",
    explanation: "Adjective order: Size (small) -> Color (red) -> Material (silk).",
    hint: "Size, Color, Material order."
  },
  {
    id: "add4-c5-14",
    classLevel: "5",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Form the adverb from the adjective \"happy\":",
    options: ["happily","happyly","happier","happiest"],
    correctAnswer: "happily",
    explanation: "Adjectives ending in consonant + y change \"y\" to \"i\" and add -ly.",
    hint: "Change y to i and add ly."
  },
  {
    id: "add4-c5-15",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"He has been living here ___ 2018.\"",
    options: ["for","since","from","in"],
    correctAnswer: "since",
    explanation: "Use \"since\" with a specific point in time (2018) in perfect tenses.",
    hint: "Point of time in the past."
  },
  {
    id: "add4-c5-16",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Choose the correct conjunction: \"Work hard ___ you will fail.\"",
    options: ["and","so","or","because"],
    correctAnswer: "or",
    explanation: "\"Or\" presents an alternative or warning/consequence.",
    hint: "Shows warning or alternative."
  },
  {
    id: "add4-c5-17",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"She divided the cake ___ her four children.\"",
    options: ["between","among","in","with"],
    correctAnswer: "among",
    explanation: "Use \"among\" when distributing or referring to more than two persons/things.",
    hint: "Used for more than two people."
  },
  {
    id: "add4-c5-18",
    classLevel: "5",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct verb: \"Each of the students ___ received a certificate.\"",
    options: ["has","have","are","were"],
    correctAnswer: "has",
    explanation: "\"Each\" is a singular distributive pronoun and takes singular verb \"has\".",
    hint: "\"Each\" takes a singular verb."
  },
  {
    id: "add4-c5-19",
    classLevel: "5",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Neither the teacher nor the students ___ present today.\"",
    options: ["was","were","is","has"],
    correctAnswer: "were",
    explanation: "When subjects are joined by \"neither... nor\", the verb agrees with the closer subject (\"students\" - plural).",
    hint: "Verb agrees with the nearer subject."
  },
  {
    id: "add4-c5-20",
    classLevel: "5",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct verb: \"Ten kilometers ___ a long distance to walk.\"",
    options: ["is","are","were","have"],
    correctAnswer: "is",
    explanation: "A specific quantity or distance taken as a single unit takes a singular verb \"is\".",
    hint: "Distance taken as one unit takes singular verb."
  },
  {
    id: "add4-c5-21",
    classLevel: "5",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Choose the sentence with correct apostrophe placement for possession:",
    options: ["The girls bags were kept in the locker.","The girls' bags were kept in the locker.","The girl's bags were kept in the locker for all girls.","The girlss bags were kept."],
    correctAnswer: "The girls' bags were kept in the locker.",
    explanation: "Plural nouns ending in -s take an apostrophe after the s (girls').",
    hint: "Apostrophe after plural s."
  },
  {
    id: "add4-c5-22",
    classLevel: "5",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the type of sentence: \"Please close the door quietly.\"",
    options: ["Assertive","Imperative","Interrogative","Exclamatory"],
    correctAnswer: "Imperative",
    explanation: "Sentences expressing requests, commands, or advice are Imperative.",
    hint: "Expresses a polite request."
  },
  {
    id: "add4-c5-23",
    classLevel: "5",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Correct the error: \"One of my friend is coming today.\"",
    options: ["One of my friends is coming today.","One of my friend are coming today.","One of my friends are coming today.","One of my friend coming today."],
    correctAnswer: "One of my friends is coming today.",
    explanation: "\"One of my\" is followed by a plural noun (\"friends\") and singular verb (\"is\").",
    hint: "One of + plural noun + singular verb."
  },
  {
    id: "add4-c5-24",
    classLevel: "5",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Choose the modal for recommendation: \"You ___ eat more fresh fruits.\"",
    options: ["ought to","can","may","might"],
    correctAnswer: "ought to",
    explanation: "\"Ought to\" expresses moral duty or healthy advice.",
    hint: "Used for moral advice/recommendation."
  },
  {
    id: "add4-c5-25",
    classLevel: "5",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"___ you lend me your pen for a moment?\"",
    options: ["Could","Must","Should","Might"],
    correctAnswer: "Could",
    explanation: "\"Could\" is used for polite requests.",
    hint: "Polite request modal."
  },
  {
    id: "add4-c5-26",
    classLevel: "5",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Identify the modal showing past habit: \"When I was young, I ___ swim across this river.\"",
    options: ["could","should","must","may"],
    correctAnswer: "could",
    explanation: "\"Could\" expresses past ability/habit.",
    hint: "Past ability modal."
  },
  {
    id: "add4-c5-27",
    classLevel: "5",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert to indirect speech: Mother said to me, \"Clean your room.\"",
    options: ["Mother told me to clean my room.","Mother said me to clean my room.","Mother told to me clean your room.","Mother ordered that clean room."],
    correctAnswer: "Mother told me to clean my room.",
    explanation: "Imperative sentences in indirect speech use \"told/ordered + object + to + infinitive\".",
    hint: "Told me + to + verb."
  },
  {
    id: "add4-c5-28",
    classLevel: "5",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech: He said, \"Are you coming to the party?\"",
    options: ["He asked if I was coming to the party.","He asked that am I coming to the party.","He asked whether I am coming to party.","He said if I was coming."],
    correctAnswer: "He asked if I was coming to the party.",
    explanation: "Yes/No questions change reporting verb to \"asked\" and use \"if/whether\".",
    hint: "Question -> asked + if + subject + past tense."
  },
  {
    id: "add4-c5-29",
    classLevel: "5",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Passive Voice: \"The gardener is watering the plants.\"",
    options: ["The plants are being watered by the gardener.","The plants were watered by the gardener.","The plants are watered by the gardener.","The plants have been watered by the gardener."],
    correctAnswer: "The plants are being watered by the gardener.",
    explanation: "Present Continuous Passive: Object + is/are + being + V3 + by + Subject.",
    hint: "Are + being + past participle."
  },
  {
    id: "add4-c5-30",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the possessive pronoun in: \"This paintbrush is hers.\"",
    options: ["paintbrush","is","hers","This"],
    correctAnswer: "hers",
    explanation: "Possessive pronoun \"hers\" indicates ownership without repeating the noun.",
    hint: "Word showing ownership."
  },
  {
    id: "add4-c6-1",
    classLevel: "6",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct verb: \"Neither the captain nor the players ___ ready for the match.\"",
    options: ["is","are","was","has"],
    correctAnswer: "are",
    explanation: "When subjects are connected by \"neither... nor\", the verb agrees with the subject closest to it (\"players\" - plural).",
    hint: "Verb agrees with the nearer subject \"players\"."
  },
  {
    id: "add4-c6-2",
    classLevel: "6",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"A list of new library books ___ been published.\"",
    options: ["has","have","are","were"],
    correctAnswer: "has",
    explanation: "The head noun of the subject is singular \"list\", so it takes singular verb \"has\".",
    hint: "Subject is \"A list\", which is singular."
  },
  {
    id: "add4-c6-3",
    classLevel: "6",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the grammatically correct sentence (Subject-Verb Agreement - Class 6):",
    options: ["Many a student have submitted their project.","Many a student has submitted his project.","Many students has submitted projects.","Many a student are submitting project."],
    correctAnswer: "Many a student has submitted his project.",
    explanation: "\"Many a\" takes a singular noun (\"student\") and singular verb (\"has\").",
    hint: "\"Many a\" is followed by a singular verb."
  },
  {
    id: "add4-c6-4",
    classLevel: "6",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the correct tense form: \"We ___ in this city since 2015.\"",
    options: ["are living","lived","have been living","were living"],
    correctAnswer: "have been living",
    explanation: "An action that started in the past and continues till present takes Present Perfect Continuous Tense (\"have been living\").",
    hint: "Action continuing from past to present with \"since\"."
  },
  {
    id: "add4-c6-5",
    classLevel: "6",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Before the police arrived, the burglar ___ away.\"",
    options: ["ran","had run","was running","has run"],
    correctAnswer: "had run",
    explanation: "When two past actions occur, the earlier completed action takes Past Perfect (\"had run\").",
    hint: "Earlier of two past events takes Past Perfect."
  },
  {
    id: "add4-c6-6",
    classLevel: "6",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct passive continuous form: \"The house ___ painted right now.\"",
    options: ["is","is being","was being","has been"],
    correctAnswer: "is being",
    explanation: "Present Continuous Passive uses \"is/are being + past participle\".",
    hint: "Present continuous passive verb pattern."
  },
  {
    id: "add4-c6-7",
    classLevel: "6",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"___ copper is a useful metal.\"",
    options: ["A","An","The","No article"],
    correctAnswer: "No article",
    explanation: "Names of metals/materials in general sense do not take articles.",
    hint: "Uncountable material nouns take zero article."
  },
  {
    id: "add4-c6-8",
    classLevel: "6",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Choose the correct article: \"He is ___ university professor.\"",
    options: ["a","an","the","no article"],
    correctAnswer: "a",
    explanation: "\"University\" begins with consonant sound /jʊːnɪvɜːsɪti/, so it takes \"a\".",
    hint: "Starts with consonant sound /y/."
  },
  {
    id: "add4-c6-9",
    classLevel: "6",
    topic: "Articles (A, An, The)",
    difficulty: "Hard",
    questionText: "Fill in the blanks: \"___ higher you go, ___ cooler it becomes.\"",
    options: ["A, a","The, the","An, the","The, a"],
    correctAnswer: "The, the",
    explanation: "Parallel comparative clauses take double \"the\" (\"The higher..., the cooler...\").",
    hint: "Double comparative idiom."
  },
  {
    id: "add4-c6-10",
    classLevel: "6",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the adverb of manner in: \"The soldier fought courageously.\"",
    options: ["soldier","fought","courageously","The"],
    correctAnswer: "courageously",
    explanation: "Adverbs of manner describe how an action is performed (\"courageously\").",
    hint: "How did the soldier fight?"
  },
  {
    id: "add4-c6-11",
    classLevel: "6",
    topic: "Adjectives & Adverbs",
    difficulty: "Hard",
    questionText: "Choose the correct degree: \"Prevention is ___ than cure.\"",
    options: ["good","better","best","more good"],
    correctAnswer: "better",
    explanation: "Comparative form of \"good\" is \"better\".",
    hint: "Comparative degree of good."
  },
  {
    id: "add4-c6-12",
    classLevel: "6",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"He works ___ enough to support his family.\"",
    options: ["hard","hardly","hardest","more hard"],
    correctAnswer: "hard",
    explanation: "\"Hard\" as an adverb means with great effort; \"hardly\" means scarcely.",
    hint: "Meaning with great effort."
  },
  {
    id: "add4-c6-13",
    classLevel: "6",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the possessive pronoun: \"These shoes are yours, not mine.\"",
    options: ["These","shoes","yours","not"],
    correctAnswer: "yours",
    explanation: "\"Yours\" is a possessive pronoun showing ownership without a following noun.",
    hint: "Possessive pronoun replacing noun."
  },
  {
    id: "add4-c6-14",
    classLevel: "6",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Which word is a demonstrative pronoun?",
    options: ["This","Who","Each","Myself"],
    correctAnswer: "This",
    explanation: "\"This\", \"That\", \"These\", and \"Those\" act as demonstrative pronouns when standing alone.",
    hint: "Points out specific items."
  },
  {
    id: "add4-c6-15",
    classLevel: "6",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Select the gender: \"The heroine played her role well.\"",
    options: ["Masculine","Feminine","Common","Neuter"],
    correctAnswer: "Feminine",
    explanation: "\"Heroine\" is the feminine gender form of \"hero\".",
    hint: "Female equivalent of hero."
  },
  {
    id: "add4-c6-16",
    classLevel: "6",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"The old man died ___ cholera.\"",
    options: ["of","from","with","by"],
    correctAnswer: "of",
    explanation: "Dying of a specific disease takes the preposition \"of\" (\"died of cholera\").",
    hint: "Die + of + disease."
  },
  {
    id: "add4-c6-17",
    classLevel: "6",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Choose the correct conjunction: \"She is not only intelligent ___ also hardworking.\"",
    options: ["and","but","so","or"],
    correctAnswer: "but",
    explanation: "Correlative conjunction pair is \"not only... but also\".",
    hint: "Pairs with \"not only\"."
  },
  {
    id: "add4-c6-18",
    classLevel: "6",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"He walked ___ the corridor into the hall.\"",
    options: ["through","along","across","into"],
    correctAnswer: "along",
    explanation: "\"Along\" means following the length of the corridor.",
    hint: "Following the path/length."
  },
  {
    id: "add4-c6-19",
    classLevel: "6",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the clause type: \"I know the place where he lives.\"",
    options: ["Noun Clause","Adjective Clause","Adverb Clause","Prepositional Clause"],
    correctAnswer: "Adjective Clause",
    explanation: "\"where he lives\" modifies the noun \"place\", making it an Adjective (Relative) Clause.",
    hint: "Modifies the noun \"place\"."
  },
  {
    id: "add4-c6-20",
    classLevel: "6",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Correct the punctuation: \"alass we lost the match\"",
    options: ["Alas! We lost the match.","Alas, we lost the match?","alas we lost the match!","Alas we lost match."],
    correctAnswer: "Alas! We lost the match.",
    explanation: "Interjections like \"Alas!\" take an exclamation mark and start sentence with capital.",
    hint: "Interjection + exclamation mark."
  },
  {
    id: "add4-c6-21",
    classLevel: "6",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Transform into Negative: \"He is always punctual.\"",
    options: ["He is never punctual.","He is never late.","He is not punctual.","He is always late."],
    correctAnswer: "He is never late.",
    explanation: "Affirmative to negative without changing meaning: \"always punctual\" -> \"never late\".",
    hint: "Keep same meaning using antonym."
  },
  {
    id: "add4-c6-22",
    classLevel: "6",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert to indirect speech: She said, \"I am going to market now.\"",
    options: ["She said that she was going to market then.","She said that I was going to market now.","She told that she is going to market then.","She said she goes to market."],
    correctAnswer: "She said that she was going to market then.",
    explanation: "Present continuous changes to past continuous, and \"now\" changes to \"then\".",
    hint: "Now -> then, am going -> was going."
  },
  {
    id: "add4-c6-23",
    classLevel: "6",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech: The teacher said, \"The Earth revolves around the Sun.\"",
    options: ["The teacher said that the Earth revolves around the Sun.","The teacher said that the Earth revolved around the Sun.","The teacher told the Earth revolves.","The teacher says Earth revolved."],
    correctAnswer: "The teacher said that the Earth revolves around the Sun.",
    explanation: "Universal truths remain in simple present tense in reported speech.",
    hint: "Universal truth tense does not change."
  },
  {
    id: "add4-c6-24",
    classLevel: "6",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Identify the correct reported question: Mother asked me, \"Have you finished your lunch?\"",
    options: ["Mother asked me if I had finished my lunch.","Mother asked me that had I finished my lunch.","Mother asked if have I finished lunch.","Mother asked had I finished lunch."],
    correctAnswer: "Mother asked me if I had finished my lunch.",
    explanation: "Present perfect \"have finished\" changes to past perfect \"had finished\" in reported question.",
    hint: "Have finished -> had finished."
  },
  {
    id: "add4-c6-25",
    classLevel: "6",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Passive Voice: \"They have built a new bridge over the river.\"",
    options: ["A new bridge has been built over the river by them.","A new bridge was built over the river.","A new bridge is built over the river.","A new bridge had been built."],
    correctAnswer: "A new bridge has been built over the river by them.",
    explanation: "Present Perfect Passive: Object + has/have + been + V3 + by + Subject.",
    hint: "Has + been + past participle."
  },
  {
    id: "add4-c6-26",
    classLevel: "6",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Active Voice: \"The window pane was broken by the children.\"",
    options: ["The children broke the window pane.","The children have broken the window pane.","The children break the window pane.","The children were breaking the window pane."],
    correctAnswer: "The children broke the window pane.",
    explanation: "Simple past passive (\"was broken\") converts to simple past active (\"broke\").",
    hint: "Was broken -> broke."
  },
  {
    id: "add4-c6-27",
    classLevel: "6",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Identify the passive sentence:",
    options: ["The teacher praised the boy.","The boy was praised by the teacher.","The boy thanked the teacher.","The teacher gave a reward."],
    correctAnswer: "The boy was praised by the teacher.",
    explanation: "Passive structure: Subject + was + past participle + by + Agent.",
    hint: "Subject receives the action."
  },
  {
    id: "add4-c6-28",
    classLevel: "6",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Candidates ___ answer all questions in Section A.\"",
    options: ["must","may","could","might"],
    correctAnswer: "must",
    explanation: "\"Must\" expresses compulsory rule or obligation.",
    hint: "Expresses compulsory instruction."
  },
  {
    id: "add4-c6-29",
    classLevel: "6",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Which modal expresses past unfulfilled possibility? \"He ___ have passed if he had studied.\"",
    options: ["could","should","would","might"],
    correctAnswer: "could",
    explanation: "\"Could have + V3\" indicates past possibility that did not happen.",
    hint: "Past possibility with have + V3."
  },
  {
    id: "add4-c6-30",
    classLevel: "6",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"___ God bless you with good health!\"",
    options: ["May","Can","Should","Must"],
    correctAnswer: "May",
    explanation: "\"May\" is used at the beginning of optative sentences expressing wishes or prayers.",
    hint: "Optative sentence for wishes/prayers."
  },
  {
    id: "add4-c7-1",
    classLevel: "7",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Passive Voice: \"The police arrested the thief yesterday.\"",
    options: ["The thief was arrested by the police yesterday.","The thief is arrested by the police.","The thief has been arrested by police.","The thief had arrested police."],
    correctAnswer: "The thief was arrested by the police yesterday.",
    explanation: "Simple past passive: Object + was + past participle (arrested) + by + Subject.",
    hint: "Simple past passive pattern."
  },
  {
    id: "add4-c7-2",
    classLevel: "7",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice: \"Shut the main door immediately.\"",
    options: ["Let the main door be shut immediately.","You should shut the main door.","The main door must shut immediately.","Let close the main door."],
    correctAnswer: "Let the main door be shut immediately.",
    explanation: "Imperative command passive: \"Let + Object + be + past participle\".",
    hint: "Let + Object + be + V3."
  },
  {
    id: "add4-c7-3",
    classLevel: "7",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Active Voice: \"Why were you punished by the master?\"",
    options: ["Why did the master punish you?","Why has the master punished you?","Why does master punish you?","Why was master punishing you?"],
    correctAnswer: "Why did the master punish you?",
    explanation: "Past simple passive question (\"were you punished\") converts to \"did + subject + base verb\".",
    hint: "Why did + subject + verb."
  },
  {
    id: "add4-c7-4",
    classLevel: "7",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert to indirect speech: He said, \"Alas! My dog is dead.\"",
    options: ["He exclaimed with sorrow that his dog was dead.","He said with sorrow that my dog was dead.","He exclaimed that his dog is dead.","He cried that dog died."],
    correctAnswer: "He exclaimed with sorrow that his dog was dead.",
    explanation: "Exclamatory sentence with \"Alas!\" changes to \"exclaimed with sorrow that...\".",
    hint: "Alas! -> exclaimed with sorrow."
  },
  {
    id: "add4-c7-5",
    classLevel: "7",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech: The stranger said to me, \"Where do you live?\"",
    options: ["The stranger asked me where I lived.","The stranger asked me where did I live.","The stranger told me where I live.","The stranger asked that where I lived."],
    correctAnswer: "The stranger asked me where I lived.",
    explanation: "Wh-question indirect speech: reporting verb -> asked, no \"that\", simple present \"do live\" -> simple past \"lived\".",
    hint: "Wh-word + subject + past verb."
  },
  {
    id: "add4-c7-6",
    classLevel: "7",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Change to direct speech: Rohan told me that he would join us later.",
    options: ["Rohan said to me, \"I will join you later.\"","Rohan said to me, \"I would join you later.\"","Rohan says, \"I join you later.\"","Rohan told, \"I will join them later.\""],
    correctAnswer: "Rohan said to me, \"I will join you later.\"",
    explanation: "Indirect \"would\" converts back to direct \"will\" and \"he\" -> \"I\".",
    hint: "Would -> will in direct speech."
  },
  {
    id: "add4-c7-7",
    classLevel: "7",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Every boy and every girl ___ given a prize.\"",
    options: ["was","were","are","have"],
    correctAnswer: "was",
    explanation: "When two singular nouns joined by \"and\" are preceded by \"every\", they take a singular verb (\"was\").",
    hint: "\"Every...\" takes singular verb."
  },
  {
    id: "add4-c7-8",
    classLevel: "7",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the grammatically correct sentence (Subject-Verb Agreement - Class 7):",
    options: ["The news are true.","The news is true.","The news were true.","The news have been true."],
    correctAnswer: "The news is true.",
    explanation: "\"News\" looks plural but is singular in meaning and takes singular verb \"is\".",
    hint: "Uncountable singular noun takes \"is\"."
  },
  {
    id: "add4-c7-9",
    classLevel: "7",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Fifty thousand rupees ___ a large sum of money.\"",
    options: ["is","are","were","have"],
    correctAnswer: "is",
    explanation: "A sum of money regarded as a single amount takes a singular verb (\"is\").",
    hint: "Single sum of money takes singular verb."
  },
  {
    id: "add4-c7-10",
    classLevel: "7",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Choose the correct continuous perfect form: \"By 5 o'clock, he ___ for three hours.\"",
    options: ["will read","will have been reading","has read","is reading"],
    correctAnswer: "will have been reading",
    explanation: "Future Perfect Continuous: \"will have been + verb-ing\" shows action continuing up to a future time.",
    hint: "Future perfect continuous structure."
  },
  {
    id: "add4-c7-11",
    classLevel: "7",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Identify the mood of the verb: \"If I were a bird, I would fly across the sea.\"",
    options: ["Indicative Mood","Subjunctive Mood","Imperative Mood","Infinitive Mood"],
    correctAnswer: "Subjunctive Mood",
    explanation: "Hypothetical or imaginary conditions (\"If I were...\") use the Subjunctive Mood.",
    hint: "Unreal condition uses Subjunctive."
  },
  {
    id: "add4-c7-12",
    classLevel: "7",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"He talks as if he ___ everything.\"",
    options: ["knows","knew","has known","is knowing"],
    correctAnswer: "knew",
    explanation: "\"As if\" expressing an imaginary present state takes simple past (\"knew\").",
    hint: "As if + past tense for imaginary present."
  },
  {
    id: "add4-c7-13",
    classLevel: "7",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the adjective of quantity in: \"There is little hope of his recovery.\"",
    options: ["little","hope","recovery","his"],
    correctAnswer: "little",
    explanation: "\"Little\" indicates quantity of uncountable noun \"hope\".",
    hint: "Adjective showing amount/quantity."
  },
  {
    id: "add4-c7-14",
    classLevel: "7",
    topic: "Adjectives & Adverbs",
    difficulty: "Hard",
    questionText: "Choose the grammatically correct sentence (Adjectives & Adverbs - Class 7):",
    options: ["He is elder than his brother.","He is older than his brother.","He is more elder than brother.","He is most old than brother."],
    correctAnswer: "He is older than his brother.",
    explanation: "\"Older\" is followed by \"than\", whereas \"elder\" is followed by \"to\" (without than).",
    hint: "Older takes \"than\"."
  },
  {
    id: "add4-c7-15",
    classLevel: "7",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Choose the correct adverb form: \"She sang ___ than her sister.\"",
    options: ["more sweetly","sweetlier","sweetly","most sweetly"],
    correctAnswer: "more sweetly",
    explanation: "Comparative form of multi-syllable adverbs uses \"more\".",
    hint: "Comparative degree of adverbs ending in -ly."
  },
  {
    id: "add4-c7-16",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"He was prevented ___ entering the exam hall.\"",
    options: ["from","to","by","of"],
    correctAnswer: "from",
    explanation: "The verb \"prevent\" takes the preposition \"from\" + gerund.",
    hint: "Prevent + from."
  },
  {
    id: "add4-c7-17",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Scarcely had he stepped out ___ it started raining heavily.\"",
    options: ["when","than","then","before"],
    correctAnswer: "when",
    explanation: "Correlative conjunction \"Scarcely... when\" is used for closely preceding events.",
    hint: "Scarcely is paired with \"when\"."
  },
  {
    id: "add4-c7-18",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Choose the preposition: \"The property was divided ___ the four heirs.\"",
    options: ["among","between","with","into"],
    correctAnswer: "among",
    explanation: "\"Among\" is used when dividing between more than two persons.",
    hint: "Divided among multiple people."
  },
  {
    id: "add4-c7-19",
    classLevel: "7",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Transform into Complex sentence: \"He worked hard to win the trophy.\"",
    options: ["He worked hard so that he could win the trophy.","He worked hard and won the trophy.","Working hard, he won trophy.","He worked hard for winning trophy."],
    correctAnswer: "He worked hard so that he could win the trophy.",
    explanation: "Complex sentence contains a main clause and a subordinate clause introduced by \"so that\".",
    hint: "Complex sentence with subordinate clause \"so that\"."
  },
  {
    id: "add4-c7-20",
    classLevel: "7",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the error in: \"Although he is poor, but he is honest.\"",
    options: ["Remove \"but\"","Remove \"Although\"","Change \"honest\" to \"poverty\"","No error"],
    correctAnswer: "Remove \"but\"",
    explanation: "\"Although\" and \"but\" cannot be used together in the same sentence.",
    hint: "Do not double contrast conjunctions."
  },
  {
    id: "add4-c7-21",
    classLevel: "7",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the participle in: \"Hearing the noise, the child woke up.\"",
    options: ["Hearing","noise","woke","child"],
    correctAnswer: "Hearing",
    explanation: "\"Hearing\" is a present participle modifying \"the child\".",
    hint: "Present participle ending in -ing."
  },
  {
    id: "add4-c7-22",
    classLevel: "7",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the indefinite pronoun: \"Somebody left an umbrella in the room.\"",
    options: ["Somebody","umbrella","room","left"],
    correctAnswer: "Somebody",
    explanation: "\"Somebody\", \"anyone\", \"everyone\" are indefinite pronouns.",
    hint: "Pronoun referring to an unspecified person."
  },
  {
    id: "add4-c7-23",
    classLevel: "7",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Which word is a distributive pronoun?",
    options: ["Each","They","This","Whom"],
    correctAnswer: "Each",
    explanation: "\"Each\", \"either\", \"neither\" are distributive pronouns.",
    hint: "Refers to members of a group individually."
  },
  {
    id: "add4-c7-24",
    classLevel: "7",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"___ Amazon is the largest river in South America.\"",
    options: ["A","An","The","No article"],
    correctAnswer: "The",
    explanation: "Names of rivers always take the definite article \"The\".",
    hint: "River names take \"The\"."
  },
  {
    id: "add4-c7-25",
    classLevel: "7",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the blank for past obligation: \"You ___ have informed the manager earlier.\"",
    options: ["should","may","can","must"],
    correctAnswer: "should",
    explanation: "\"Should have + V3\" expresses a past duty or advice that was neglected.",
    hint: "Past neglected duty modal."
  },
  {
    id: "add4-c7-26",
    classLevel: "7",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Dare he ___ such a risky statement?\"",
    options: ["make","makes","made","making"],
    correctAnswer: "make",
    explanation: "Semi-modal \"dare\" in questions takes a bare infinitive without \"to\".",
    hint: "Bare infinitive after dare."
  },
  {
    id: "add4-c7-27",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Spot the error: \"He is senior than me by two years.\"",
    options: ["Replace \"than\" with \"to\"","Replace \"senior\" with \"old\"","Replace \"me\" with \"I\"","No error"],
    correctAnswer: "Replace \"replace \"than\" with \"to\"",
    explanation: "Adjectives like senior, junior, superior take preposition \"to\", not \"than\".",
    hint: "Senior is followed by \"to\"."
  },
  {
    id: "add4-c7-28",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in: \"He has been working here since five months.\"",
    options: ["since -> for","working -> worked","here -> there","has -> have"],
    correctAnswer: "since -> for",
    explanation: "Use \"for\" with a duration of time (\"five months\"), not \"since\".",
    hint: "Duration of time takes \"for\"."
  },
  {
    id: "add4-c7-29",
    classLevel: "7",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert to indirect speech: The teacher said, \"Water boils at 100 degrees Celsius.\"",
    options: ["The teacher said that water boils at 100 degrees Celsius.","The teacher said that water boiled at 100 degrees Celsius.","The teacher said water is boiling.","The teacher told water boils."],
    correctAnswer: "The teacher said that water boils at 100 degrees Celsius.",
    explanation: "Scientific facts remain in simple present tense in indirect speech.",
    hint: "Scientific facts do not change tense."
  },
  {
    id: "add4-c7-30",
    classLevel: "7",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct form: \"By the time we reach the station, the train ___.\"",
    options: ["will have left","left","leaves","was leaving"],
    correctAnswer: "will have left",
    explanation: "Future perfect tense (\"will have left\") indicates an action that will be completed before another future action.",
    hint: "Action completed before a future time."
  },
  {
    id: "add4-c8-1",
    classLevel: "8",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert to indirect speech: The master said to the servant, \"Bring me a glass of water.\"",
    options: ["The master ordered the servant to bring him a glass of water.","The master asked the servant that bring a glass of water.","The master told servant bring water.","The master said servant to bring water."],
    correctAnswer: "The master ordered the servant to bring him a glass of water.",
    explanation: "Imperative command changes to: ordered + object + to + base verb + changed pronouns.",
    hint: "Command -> ordered + object + to + verb."
  },
  {
    id: "add4-c8-2",
    classLevel: "8",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech: She said, \"May God forgive his sins!\"",
    options: ["She prayed that God might forgive his sins.","She wished God may forgive his sins.","She said God might forgive sins.","She prayed God to forgive."],
    correctAnswer: "She prayed that God might forgive his sins.",
    explanation: "Optative sentences with \"May God...\" change reporting verb to \"prayed\" and \"may\" to \"might\".",
    hint: "May -> might, prayed that..."
  },
  {
    id: "add4-c8-3",
    classLevel: "8",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert to direct speech: He asked me if I knew the secret code.",
    options: ["He said to me, \"Do you know the secret code?\"","He said to me, \"Did you know secret code?\"","He asked, \"I know secret code?\"","He said, \"You knew secret code?\""],
    correctAnswer: "He said to me, \"Do you know the secret code?\"",
    explanation: "Indirect \"if I knew\" changes back to direct question \"Do you know?\".",
    hint: "Indirect past simple -> direct present simple question."
  },
  {
    id: "add4-c8-4",
    classLevel: "8",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Passive Voice: \"People speak English all over the world.\"",
    options: ["English is spoken all over the world.","English was spoken all over the world.","English has been spoken by people.","English is being spoken by world."],
    correctAnswer: "English is spoken all over the world.",
    explanation: "Simple present passive: Object + is + past participle (spoken). Indefinite agent (\"by people\") is omitted.",
    hint: "General agent \"by people\" is omitted."
  },
  {
    id: "add4-c8-5",
    classLevel: "8",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice: \"They expect us to finish the work by evening.\"",
    options: ["We are expected to finish the work by evening.","The work is expected by us to finish.","We were expected finishing work.","It expected us to finish work."],
    correctAnswer: "We are expected to finish the work by evening.",
    explanation: "Active \"They expect us to...\" converts to \"We are expected to...\".",
    hint: "We are expected + infinitive."
  },
  {
    id: "add4-c8-6",
    classLevel: "8",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Active Voice: \"The patient was examined by Dr. Sharma.\"",
    options: ["Dr. Sharma examined the patient.","Dr. Sharma has examined the patient.","Dr. Sharma examines the patient.","Dr. Sharma was examining the patient."],
    correctAnswer: "Dr. Sharma examined the patient.",
    explanation: "Simple past passive (\"was examined\") converts to active simple past (\"examined\").",
    hint: "Was examined -> examined."
  },
  {
    id: "add4-c8-7",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Transform into Compound sentence: \"In spite of his hard work, he failed.\"",
    options: ["He worked hard, yet he failed.","Though he worked hard, he failed.","Working hard, he failed.","He failed because he worked hard."],
    correctAnswer: "He worked hard, yet he failed.",
    explanation: "Compound sentence uses coordinating conjunction (\"yet\", \"but\") connecting independent clauses.",
    hint: "Compound sentence with coordinating conjunction \"yet\"."
  },
  {
    id: "add4-c8-8",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the non-finite verb form in: \"Swimming is good exercise for health.\"",
    options: ["Swimming","is","good","exercise"],
    correctAnswer: "Swimming",
    explanation: "\"Swimming\" acts as a gerund (verbal noun) functioning as subject.",
    hint: "Gerund acting as subject noun."
  },
  {
    id: "add4-c8-9",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Combine into a single simple sentence: \"He saw a snake. He ran away with fear.\"",
    options: ["Seeing a snake, he ran away with fear.","He saw a snake and ran away.","When he saw a snake, he ran away.","He ran away because he saw a snake."],
    correctAnswer: "Seeing a snake, he ran away with fear.",
    explanation: "Participial phrase (\"Seeing a snake\") combines two actions into a single Simple Sentence.",
    hint: "Use present participle phrase."
  },
  {
    id: "add4-c8-10",
    classLevel: "8",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct verb: \"The Mayor, along with his councilors, ___ attending the meeting.\"",
    options: ["is","are","were","have"],
    correctAnswer: "is",
    explanation: "When main subject is accompanied by phrases like \"along with\", verb agrees with the first subject (\"The Mayor\" - singular).",
    hint: "Verb agrees with the first subject before \"along with\"."
  },
  {
    id: "add4-c8-11",
    classLevel: "8",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Three-fourths of the wall ___ been painted.\"",
    options: ["has","have","are","were"],
    correctAnswer: "has",
    explanation: "Fractions of a singular uncountable noun (\"the wall\") take a singular verb (\"has\").",
    hint: "Fraction of a singular noun takes singular verb."
  },
  {
    id: "add4-c8-12",
    classLevel: "8",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the grammatically correct sentence (Subject-Verb Agreement - Class 8):",
    options: ["Physics are an interesting subject.","Physics is an interesting subject.","Physics were an interesting subject.","Physics have been interesting."],
    correctAnswer: "Physics is an interesting subject.",
    explanation: "Names of academic subjects ending in -s take singular verbs.",
    hint: "Academic subject name is singular."
  },
  {
    id: "add4-c8-13",
    classLevel: "8",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the tense: \"By this time tomorrow, I shall have reached London.\"",
    options: ["Future Simple","Future Perfect","Future Continuous","Present Perfect"],
    correctAnswer: "Future Perfect",
    explanation: "\"Shall have + past participle\" forms Future Perfect Tense.",
    hint: "Shall/will + have + V3."
  },
  {
    id: "add4-c8-14",
    classLevel: "8",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"It is high time we ___ for the railway station.\"",
    options: ["left","leave","should leave","had left"],
    correctAnswer: "left",
    explanation: "The phrase \"It is high time...\" is followed by Simple Past tense (\"left\").",
    hint: "It is high time + Simple Past tense."
  },
  {
    id: "add4-c8-15",
    classLevel: "8",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Choose the correct participle: \"The ___ dog barked at the stranger.\"",
    options: ["frightening","frightened","frighten","frightenedly"],
    correctAnswer: "frightened",
    explanation: "Past participle (\"frightened\") works as an adjective describing the dog.",
    hint: "Past participle acting as descriptive adjective."
  },
  {
    id: "add4-c8-16",
    classLevel: "8",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the adverb of condition in: \"Unless you work hard, you will not succeed.\"",
    options: ["Unless","hard","succeed","not"],
    correctAnswer: "Unless",
    explanation: "\"Unless\" introduces an adverbial clause of condition.",
    hint: "Word introducing conditional clause."
  },
  {
    id: "add4-c8-17",
    classLevel: "8",
    topic: "Adjectives & Adverbs",
    difficulty: "Hard",
    questionText: "Choose the grammatically correct sentence (Adjectives & Adverbs - Class 8):",
    options: ["He is the most cleverest boy.","He is the cleverest boy in the class.","He is more cleverer than others.","He is most clever boy."],
    correctAnswer: "He is the cleverest boy in the class.",
    explanation: "Avoid double superlatives (\"most cleverest\" is incorrect).",
    hint: "Never use double superlatives."
  },
  {
    id: "add4-c8-18",
    classLevel: "8",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"I have ___ friends in this city, so I feel lonely.\"",
    options: ["few","a few","the few","little"],
    correctAnswer: "few",
    explanation: "\"Few\" has a negative connotation meaning almost none, causing loneliness.",
    hint: "Negative meaning = almost none."
  },
  {
    id: "add4-c8-19",
    classLevel: "8",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"He is senior ___ all his colleagues in the department.\"",
    options: ["to","than","from","with"],
    correctAnswer: "to",
    explanation: "Adjectives ending in -ior (senior, junior, prior) take preposition \"to\".",
    hint: "Senior takes preposition \"to\"."
  },
  {
    id: "add4-c8-20",
    classLevel: "8",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"No sooner did the bell ring ___ the students ran out.\"",
    options: ["than","when","then","before"],
    correctAnswer: "than",
    explanation: "\"No sooner\" is strictly followed by \"than\".",
    hint: "No sooner is paired with \"than\"."
  },
  {
    id: "add4-c8-21",
    classLevel: "8",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Choose the preposition: \"He distributed his wealth ___ his three sons.\"",
    options: ["among","between","with","to"],
    correctAnswer: "among",
    explanation: "Use \"among\" for distribution between more than two recipients.",
    hint: "Used for 3 or more people."
  },
  {
    id: "add4-c8-22",
    classLevel: "8",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"___ sun sets in ___ west.\"",
    options: ["The, the","A, a","The, a","A, the"],
    correctAnswer: "The, the",
    explanation: "Both heavenly bodies (\"sun\") and cardinal directions (\"west\") take \"the\".",
    hint: "Unique objects and directions take \"The\"."
  },
  {
    id: "add4-c8-23",
    classLevel: "8",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Which pronoun is demonstrative? \"___ are the books I was looking for.\"",
    options: ["These","Which","They","Whose"],
    correctAnswer: "These",
    explanation: "\"These\" points out specific items directly.",
    hint: "Points out plural near items."
  },
  {
    id: "add4-c8-24",
    classLevel: "8",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"How ___ you open my private locker?\"",
    options: ["dare","need","ought","should"],
    correctAnswer: "dare",
    explanation: "\"Dare\" is used here to express challenge or outrage at boldness.",
    hint: "Expresses challenge/boldness."
  },
  {
    id: "add4-c8-25",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Spot the error: \"He told to me that he was busy.\"",
    options: ["Remove \"to\"","Remove \"that\"","Change \"was\" to \"is\"","No error"],
    correctAnswer: "Remove \"to\"",
    explanation: "Reporting verb \"told\" is transitive and takes object directly without \"to\".",
    hint: "Told takes direct object without \"to\"."
  },
  {
    id: "add4-c8-26",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the error: \"Each of the candidate were interviewed.\"",
    options: ["Replace \"were\" with \"was\"","Replace \"candidate\" with \"candidates\"","Replace both: \"candidates\" and \"was\"","No error"],
    correctAnswer: "Replace both: \"candidates\" and \"was\"",
    explanation: "\"Each of\" takes a plural noun (\"candidates\") and a singular verb (\"was\").",
    hint: "Each of + plural noun + singular verb."
  },
  {
    id: "add4-c8-27",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Correct the sentence: \"If I will go to Delhi, I will visit Red Fort.\"",
    options: ["If I go to Delhi, I will visit Red Fort.","If I went to Delhi, I will visit Red Fort.","If I had gone, I would visit Red Fort.","No change required."],
    correctAnswer: "If I go to Delhi, I will visit Red Fort.",
    explanation: "In conditional type 1, the \"if\" clause takes simple present (\"go\"), not future (\"will go\").",
    hint: "If clause takes simple present in type 1 conditional."
  },
  {
    id: "add4-c8-28",
    classLevel: "8",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice: \"The principal distributed the annual awards to the winners.\"",
    options: ["The annual awards were distributed to the winners by the principal.","The annual awards are distributed by principal.","The winners were distributing awards.","Principal was distributed by awards."],
    correctAnswer: "The annual awards were distributed to the winners by the principal.",
    explanation: "Simple past passive: Object + were + past participle (distributed) + by + Subject.",
    hint: "Object + were + V3."
  },
  {
    id: "add4-c8-29",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the type of sentence: \"Work hard so that you can achieve your goals.\"",
    options: ["Complex Sentence","Simple Sentence","Compound Sentence","Exclamatory Sentence"],
    correctAnswer: "Complex Sentence",
    explanation: "Contains a main clause and a subordinate clause introduced by \"so that\".",
    hint: "Contains subordinate clause introduced by \"so that\"."
  },
  {
    id: "add4-c8-30",
    classLevel: "8",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech: He said to me, \"Do not touch the hot iron.\"",
    options: ["He warned me not to touch the hot iron.","He said me to not touch hot iron.","He told that don't touch hot iron.","He asked me do not touch iron."],
    correctAnswer: "He warned me not to touch the hot iron.",
    explanation: "Negative imperatives in reported speech change to \"warned/told + object + not to + base verb\".",
    hint: "Negative command -> warned + not to + base verb."
  },
  {
    id: "add4-c9-1",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in the passage sentence:\n\"A huge crowd gathered outside the stadium to saw their favorite cricketer.\"\nएक बड़ी भीड़...।",
    options: ["to saw -> to see","gathered -> gather","outside -> inside","stadium -> arena"],
    correctAnswer: "to saw -> to see",
    explanation: "To-infinitive always takes the base form of the verb (V1: see), not past tense (saw).\n\"To\" के बाद हमेशा क्रिया की प्रथम अवस्था (Base form V1 - see) का प्रयोग होता है।",
    hint: "Infinitives use \"to + V1\"."
  },
  {
    id: "add4-c9-2",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the error in the sentence:\n\"Neither of the two applicants have submitted the required documents.\"\nदोनों आवेदकों में से किसी ने भी...",
    options: ["have -> has","applicants -> applicant","submitted -> submit","required -> require"],
    correctAnswer: "have -> has",
    explanation: "\"Neither of\" takes a singular verb (\"has\").\n\"Neither of\" के बाद बहुवचन संज्ञा लेकिन एकवचन क्रिया (has) का प्रयोग होता है।",
    hint: "Neither of takes a singular verb."
  },
  {
    id: "add4-c9-3",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Find the missing word in the sentence:\n\"She is senior ___ all her colleagues in experience.\"",
    options: ["to","than","from","above"],
    correctAnswer: "to",
    explanation: "Latin comparative adjectives like senior, junior, superior are followed by preposition \"to\", not \"than\".\nSenior/Junior के साथ \"to\" का प्रयोग किया जाता है।",
    hint: "Senior is followed by preposition \"to\"."
  },
  {
    id: "add4-c9-4",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Correct the error in sentence:\n\"The scenery of Kashmir are breathtaking.\"",
    options: ["are -> is","scenery -> sceneries","breathtaking -> breathe","of -> in"],
    correctAnswer: "are -> is",
    explanation: "\"Scenery\" is an uncountable singular noun and takes a singular verb (\"is\").\n\"Scenery\" हमेशा Uncountable Singular होता है, इसलिए verb \"is\" आएगा।",
    hint: "Scenery takes singular verb."
  },
  {
    id: "add4-c9-5",
    classLevel: "9",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Report the dialogue:\nTeacher: \"Why are you late today, Rahul?\"\nRahul: \"I missed my school bus, sir.\"",
    options: ["The teacher asked Rahul why he was late that day. Rahul replied respectfully that he had missed his school bus.","The teacher asked Rahul why was he late today. Rahul said he missed school bus.","The teacher told Rahul why he is late today. Rahul replied he misses bus.","The teacher asked Rahul why he late that day."],
    correctAnswer: "The teacher asked Rahul why he was late that day. Rahul replied respectfully that he had missed his school bus.",
    explanation: "Question converts to declarative word order (why he was late), \"today\" -> \"that day\", past simple -> past perfect (\"had missed\").",
    hint: "Wh-word + subject + past tense verb; today -> that day."
  },
  {
    id: "add4-c9-6",
    classLevel: "9",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech:\n\"Don't touch any unidentifiable object,\" warned the bomb squad officer.",
    options: ["The bomb squad officer warned people not to touch any unidentifiable object.","The bomb squad officer warned that don't touch unidentifiable object.","The bomb squad officer warned people to not touch unidentifiable object.","The bomb squad officer ordered no touch of objects."],
    correctAnswer: "The bomb squad officer warned people not to touch any unidentifiable object.",
    explanation: "Negative imperative converts to: warned/ordered + object + \"not to + base verb\".\nनकारात्मक आज्ञावाचक वाक्य \"not to + V1\" में परिवर्तित होते हैं।",
    hint: "Negative imperative -> not to + verb."
  },
  {
    id: "add4-c9-7",
    classLevel: "9",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Change to direct speech:\nThe librarian reminded me that I had to return the reference book by Friday.",
    options: ["The librarian said to me, \"You must return the reference book by Friday.\"","The librarian said, \"You had to return book by Friday.\"","The librarian asked me, \"Return the book by Friday.\"","The librarian told, \"Return reference book by Friday.\""],
    correctAnswer: "The librarian said to me, \"You must return the reference book by Friday.\"",
    explanation: "Indirect \"had to\" converts back to direct modal \"must\".",
    hint: "Had to -> must in direct speech."
  },
  {
    id: "add4-c9-8",
    classLevel: "9",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Report the question:\n\"Have you finished writing your essay?\" asked the invigilator.",
    options: ["The invigilator asked whether I had finished writing my essay.","The invigilator asked if I have finished writing my essay.","The invigilator asked that had I finished writing essay.","The invigilator asked whether had I finished my essay."],
    correctAnswer: "The invigilator asked whether I had finished writing my essay.",
    explanation: "Yes/no question takes \"if/whether\" + subject + past perfect (\"had finished\").",
    hint: "Use if/whether + subject + had + V3."
  },
  {
    id: "add4-c9-9",
    classLevel: "9",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Passive Voice:\n\"Who broke this beautiful antique vase?\"",
    options: ["By whom was this beautiful antique vase broken?","Who was this antique vase broken by?","By whom this antique vase was broken?","Whom broke this antique vase?"],
    correctAnswer: "By whom was this beautiful antique vase broken?",
    explanation: "Question starting with \"Who\" changes to \"By whom + aux + object + V3?\".",
    hint: "Who -> By whom + was + subject + V3?"
  },
  {
    id: "add4-c9-10",
    classLevel: "9",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice:\n\"One should keep one's promises.\"",
    options: ["Promises should be kept.","One's promises should kept by one.","Promises must keep by everyone.","Promises are to be kept."],
    correctAnswer: "Promises should be kept.",
    explanation: "When subject is indefinite (\"one\"), it is dropped in passive voice: \"Promises should be kept\".",
    hint: "Indefinite agent \"one\" is omitted."
  },
  {
    id: "add4-c9-11",
    classLevel: "9",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Active Voice:\n\"You are requested to maintain silence in the reading room.\"",
    options: ["Please maintain silence in the reading room.","You must maintain silence in reading room.","Maintain silence in reading room.","We request you maintaining silence."],
    correctAnswer: "Please maintain silence in the reading room.",
    explanation: "\"You are requested to...\" in passive voice converts to \"Please + V1\" in active voice.",
    hint: "You are requested to -> Please + base verb."
  },
  {
    id: "add4-c9-12",
    classLevel: "9",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"Bread and butter ___ his customary breakfast.\"",
    options: ["is","are","were","have been"],
    correctAnswer: "is",
    explanation: "When two nouns express a single combined idea/dish, singular verb \"is\" is used.",
    hint: "Single combined food item takes singular verb."
  },
  {
    id: "add4-c9-13",
    classLevel: "9",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct verb:\n\"A number of students ___ absent owing to the heavy downpour.\"",
    options: ["are","is","was","has been"],
    correctAnswer: "are",
    explanation: "\"A number of\" takes a plural noun and a plural verb (\"are\"), whereas \"The number of\" takes a singular verb.",
    hint: "\"A number of\" takes a plural verb."
  },
  {
    id: "add4-c9-14",
    classLevel: "9",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"Neither the teacher nor his students ___ present in the auditorium.\"",
    options: ["were","was","is","has"],
    correctAnswer: "were",
    explanation: "When subjects are joined by \"neither... nor\", verb agrees with closer subject (\"students\" - plural).",
    hint: "Agrees with nearer subject \"students\"."
  },
  {
    id: "add4-c9-15",
    classLevel: "9",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the correct form:\n\"I ___ for the results for over two hours before the website crashed.\"",
    options: ["had been waiting","have been waiting","was waiting"," waited"],
    correctAnswer: "had been waiting",
    explanation: "Past Perfect Continuous shows an action going on for a duration before another past event (\"crashed\").",
    hint: "Had been + verb-ing before another past event."
  },
  {
    id: "add4-c9-16",
    classLevel: "9",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct tense form:\n\"The train ___ before we reached the platform.\"",
    options: ["had departed","departed","has departed","was departing"],
    correctAnswer: "had departed",
    explanation: "Action completed first in past takes Past Perfect (\"had departed\"); later action takes Simple Past (\"reached\").",
    hint: "Earlier past action takes Past Perfect."
  },
  {
    id: "add4-c9-17",
    classLevel: "9",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"If it rains tomorrow, we ___ the sports event.\"",
    options: ["will cancel","would cancel","canceled","had canceled"],
    correctAnswer: "will cancel",
    explanation: "Type 1 Conditional: If + Simple Present (rains) -> Main clause + Future Simple (will cancel).",
    hint: "Type 1 conditional: If + present, will + verb."
  },
  {
    id: "add4-c9-18",
    classLevel: "9",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"You ___ not park your vehicle in front of the gate; it is prohibited.\"",
    options: ["must","might","could","would"],
    correctAnswer: "must",
    explanation: "\"Must not\" denotes strict prohibition.",
    hint: "Used for strict prohibition."
  },
  {
    id: "add4-c9-19",
    classLevel: "9",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Choose the correct modal for logical deduction:\n\"The lights are off and the door is locked; they ___ have gone out.\"",
    options: ["must","should","can","may"],
    correctAnswer: "must",
    explanation: "\"Must have + V3\" expresses strong logical deduction about a past event.",
    hint: "Strong logical certainty in the past."
  },
  {
    id: "add4-c9-20",
    classLevel: "9",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the blank for moral duty:\n\"We ___ respect our elders and teachers.\"",
    options: ["ought to","can","may","could"],
    correctAnswer: "ought to",
    explanation: "\"Ought to\" expresses moral obligation.",
    hint: "Expresses moral obligation."
  },
  {
    id: "add4-c9-21",
    classLevel: "9",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"The burglar entered the mansion ___ midnight.\"",
    options: ["at","on","in","during"],
    correctAnswer: "at",
    explanation: "Specific times of night/day like \"midnight\", \"noon\", \"dawn\" take preposition \"at\".",
    hint: "Use \"at\" before midnight."
  },
  {
    id: "add4-c9-22",
    classLevel: "9",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Choose the correct conjunction:\n\"No sooner did the bell ring ___ the pupils dashed out.\"",
    options: ["than","when","then","as"],
    correctAnswer: "than",
    explanation: "\"No sooner\" is followed strictly by \"than\".",
    hint: "No sooner takes \"than\"."
  },
  {
    id: "add4-c9-23",
    classLevel: "9",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"He is proficient ___ three languages.\"",
    options: ["in","at","with","on"],
    correctAnswer: "in",
    explanation: "The adjective \"proficient\" is followed by the preposition \"in\".",
    hint: "Proficient + in."
  },
  {
    id: "add4-c9-24",
    classLevel: "9",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Transform into a Complex sentence:\n\"He worked hard to secure first rank.\"",
    options: ["He worked hard so that he might secure first rank.","He worked hard and secured first rank.","Working hard, he secured first rank.","He worked hard for securing first rank."],
    correctAnswer: "He worked hard so that he might secure first rank.",
    explanation: "Complex sentence introduced by subordinate conjunction \"so that\".",
    hint: "Complex sentence with subordinate clause \"so that\"."
  },
  {
    id: "add4-c9-25",
    classLevel: "9",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the type of non-finite verb:\n\"Driven by hunger, the wolf attacked the sheep.\"",
    options: ["Past Participle","Present Participle","Gerund","Infinitive"],
    correctAnswer: "Past Participle",
    explanation: "\"Driven\" is a Past Participle modifying the noun \"the wolf\".",
    hint: "V3 functioning as a participial adjective."
  },
  {
    id: "add4-c9-26",
    classLevel: "9",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Punctuate correctly:\n\"what a remarkable achievement it is said the principal\"",
    options: ["\"What a remarkable achievement it is!\" said the principal.","What a remarkable achievement it is, said the principal.","\"What a remarkable achievement it is,\" said principal.","What a remarkable achievement it is! Said the principal."],
    correctAnswer: "\"What a remarkable achievement it is!\" said the principal.",
    explanation: "Exclamatory direct speech enclosed in quotation marks followed by reporting clause.",
    hint: "Quotation marks and exclamation mark inside direct quote."
  },
  {
    id: "add4-c9-27",
    classLevel: "9",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the relative pronoun in: \"The book which you gifted me is fascinating.\"",
    options: ["which","that","book","fascinating"],
    correctAnswer: "which",
    explanation: "\"Which\" is a relative pronoun referring to non-human noun \"book\".",
    hint: "Relative pronoun for inanimate object."
  },
  {
    id: "add4-c9-28",
    classLevel: "9",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Choose the correct form:\n\"This is the ___ of the two options available.\"",
    options: ["better","best","good","more good"],
    correctAnswer: "better",
    explanation: "When comparing strictly two items, use comparative degree \"better\" with \"the\".",
    hint: "Comparison of two items takes comparative degree."
  },
  {
    id: "add4-c9-29",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the error:\n\"Scarcely had I reached the station than the train left.\"",
    options: ["than -> when","had I -> I had","reached -> reach","left -> leaves"],
    correctAnswer: "than -> when",
    explanation: "\"Scarcely had...\" must be followed by \"when\", not \"than\".",
    hint: "Scarcely had... when structure."
  },
  {
    id: "add4-c9-30",
    classLevel: "9",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"The physics department ___ introducing a new honors course next term.\"",
    options: ["is","are","were","have been"],
    correctAnswer: "is",
    explanation: "The singular noun phrase \"The physics department\" takes a singular verb (\"is\").",
    hint: "Department acts as a singular entity."
  },
  {
    id: "add4-c10-1",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in the sentence:\n\"Each of the contestant were given a participation certificate.\"",
    options: ["were -> was","contestant -> contestants","were given -> was given","contestant were -> contestants was"],
    correctAnswer: "were -> was",
    explanation: "\"Each of\" takes a plural noun (\"contestants\") but a singular verb (\"was\").",
    hint: "Each of takes a singular verb."
  },
  {
    id: "add4-c10-2",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the error in the given text:\n\"The climate of Delhi is hotter than Shimla.\"",
    options: ["than Shimla -> than that of Shimla","is -> are","hotter -> hot","climate -> climates"],
    correctAnswer: "hotter than Shimla -> than that of Shimla",
    explanation: "Logical comparison rule: Compare climate to climate, not climate to a city name (\"than that of Shimla\").",
    hint: "Compare climate to climate using \"than that of\"."
  },
  {
    id: "add4-c10-3",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Find the error in: \"Supposing if it rains, what will we do?\"",
    options: ["Remove either \"Supposing\" or \"if\"","Change \"rains\" to \"rained\"","Change \"will\" to \"would\"","No error"],
    correctAnswer: "Remove either \"Supposing\" or \"if\"",
    explanation: "\"Supposing\" and \"if\" are redundant when used together.",
    hint: "Do not use Supposing and If together."
  },
  {
    id: "add4-c10-4",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Correct the error in:\n\"He has been suffering with fever since three days.\"",
    options: ["with -> from, since -> for","with -> from","since -> for","suffering -> suffered"],
    correctAnswer: "with -> from, since -> for",
    explanation: "\"Suffering\" takes preposition \"from\", and duration of time (\"three days\") takes \"for\".",
    hint: "Suffering + from; duration of time + for."
  },
  {
    id: "add4-c10-5",
    classLevel: "10",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech:\n\"What a magnificent view!\" exclaimed the tourist.",
    options: ["The tourist exclaimed with wonder that it was a very magnificent view.","The tourist exclaimed that what a magnificent view it is.","The tourist told that the view was magnificent.","The tourist exclaimed what a view it was."],
    correctAnswer: "The tourist exclaimed with wonder that it was a very magnificent view.",
    explanation: "Exclamatory sentence \"What a...\" changes to declarative with \"exclaimed with wonder that it was a very...\".",
    hint: "Exclaimed with wonder that it was very..."
  },
  {
    id: "add4-c10-6",
    classLevel: "10",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Report the sentence:\n\"Call the first witness,\" said the judge.",
    options: ["The judge commanded them to call the first witness.","The judge told to call the first witness.","The judge asked that call the first witness.","The judge said that call first witness."],
    correctAnswer: "The judge commanded them to call the first witness.",
    explanation: "Command from authority converts to: commanded + object + to + base verb.",
    hint: "Command -> commanded + to + verb."
  },
  {
    id: "add4-c10-7",
    classLevel: "10",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Report the dialogue:\nAnand: \"Will you help me carry these boxes?\"\nVijay: \"Sure, I will carry them right away.\"",
    options: ["Anand asked Vijay if he would help him carry those boxes. Vijay replied affirmatively that he would carry them right away.","Anand asked Vijay if will he help carry these boxes. Vijay said sure.","Anand asked Vijay that would he help him. Vijay said yes.","Anand told Vijay to help carry boxes."],
    correctAnswer: "Anand asked Vijay if he would help him carry those boxes. Vijay replied affirmatively that he would carry them right away.",
    explanation: "Yes/no question \"Will you\" -> \"if he would\", \"these\" -> \"those\".",
    hint: "Will -> would, these -> those."
  },
  {
    id: "add4-c10-8",
    classLevel: "10",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Change to direct speech:\nShe asked her brother why he had not informed her earlier.",
    options: ["She said to her brother, \"Why didn't you inform me earlier?\"","She said to her brother, \"Why you had not informed me earlier?\"","She asked, \"Why haven't you informed me earlier?\"","She said, \"Why did you not informed me?\""],
    correctAnswer: "She said to her brother, \"Why didn't you inform me earlier?\"",
    explanation: "Indirect past perfect \"had not informed\" converts back to direct simple past question \"Why didn't you inform me?\".",
    hint: "Had not informed -> didn't inform."
  },
  {
    id: "add4-c10-9",
    classLevel: "10",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct verb:\n\"Neither the manager nor the directors ___ present at the emergency briefing.\"",
    options: ["were","was","is","has been"],
    correctAnswer: "were",
    explanation: "Subject closer to the verb (\"directors\" - plural) determines plural verb (\"were\").",
    hint: "Agrees with nearer subject \"directors\"."
  },
  {
    id: "add4-c10-10",
    classLevel: "10",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"The quality of these manufactured goods ___ deteriorated in recent months.\"",
    options: ["has","have","are","were"],
    correctAnswer: "has",
    explanation: "The real subject is singular noun \"quality\", not plural \"goods\". Verb must be singular (\"has\").",
    hint: "Subject is \"The quality\", which is singular."
  },
  {
    id: "add4-c10-11",
    classLevel: "10",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct sentence:\n\"The committee has submitted its unanimous report.\"",
    options: ["The committee has submitted its unanimous report.","The committee have submitted its report.","The committee has submitted their report.","The committee are submitted its report."],
    correctAnswer: "The committee has submitted its unanimous report.",
    explanation: "Collective noun acting as a single unified body takes singular verb (\"has\") and singular pronoun (\"its\").",
    hint: "Unified collective noun takes singular verb."
  },
  {
    id: "add4-c10-12",
    classLevel: "10",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"More than one candidate ___ passed the preliminary screening test.\"",
    options: ["has","have","were","are"],
    correctAnswer: "has",
    explanation: "\"More than one\" is followed by singular noun and singular verb (\"has\").",
    hint: "\"More than one\" takes singular verb."
  },
  {
    id: "add4-c10-13",
    classLevel: "10",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Choose the modal for logical deduction:\n\"He has been working all day without a break; he ___ be exhausted.\"",
    options: ["must","should","can","would"],
    correctAnswer: "must",
    explanation: "\"Must\" expresses strong logical deduction or certainty.",
    hint: "Strong logical deduction."
  },
  {
    id: "add4-c10-14",
    classLevel: "10",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"How ___ you speak to your senior officer like that!\"",
    options: ["dare","need","must","could"],
    correctAnswer: "dare",
    explanation: "\"Dare\" is used to express indignation or challenge.",
    hint: "Expresses indignation at boldness."
  },
  {
    id: "add4-c10-15",
    classLevel: "10",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Choose the modal for past capability:\n\"She ___ speak fluent French when she lived in Paris.\"",
    options: ["could","might","should","would"],
    correctAnswer: "could",
    explanation: "\"Could\" denotes general past ability.",
    hint: "Past ability modal."
  },
  {
    id: "add4-c10-16",
    classLevel: "10",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"You ___ not bring your own food inside the theater; it is strictly banned.\"",
    options: ["must","need","ought","should"],
    correctAnswer: "must",
    explanation: "\"Must not\" denotes strict prohibition.",
    hint: "Strict prohibition."
  },
  {
    id: "add4-c10-17",
    classLevel: "10",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct tense:\n\"Had I known about the changes in schedule, I ___ you immediately.\"",
    options: ["would have informed","will inform","informed","would inform"],
    correctAnswer: "would have informed",
    explanation: "Type 3 Conditional: Had + past participle -> Main clause + would have + past participle.",
    hint: "Type 3 conditional: Had + V3 -> would have + V3."
  },
  {
    id: "add4-c10-18",
    classLevel: "10",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"By the end of this year, Dr. Roy ___ in this hospital for twenty years.\"",
    options: ["will have been working","will work","has worked","is working"],
    correctAnswer: "will have been working",
    explanation: "Future Perfect Continuous: \"will have been + verb-ing\" for action continuing up to a future milestone.",
    hint: "Action continuing up to future point."
  },
  {
    id: "add4-c10-19",
    classLevel: "10",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"It is high time we ___ effective measures against pollution.\"",
    options: ["took","take","should take","had taken"],
    correctAnswer: "took",
    explanation: "The construction \"It is high time\" requires simple past tense (\"took\").",
    hint: "It is high time + simple past."
  },
  {
    id: "add4-c10-20",
    classLevel: "10",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice:\n\"The board of directors is considering your application.\"",
    options: ["Your application is being considered by the board of directors.","Your application was considered by the board.","Your application has been considered by board.","Your application is considered by board."],
    correctAnswer: "Your application is being considered by the board of directors.",
    explanation: "Present Continuous Passive: Object + is + being + past participle (considered).",
    hint: "Is + being + V3."
  },
  {
    id: "add4-c10-21",
    classLevel: "10",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice:\n\"One must complete the assigned duties on time.\"",
    options: ["Assigned duties must be completed on time.","Assigned duties must completed by one.","Duties are to be completed by one.","One's assigned duties must completed."],
    correctAnswer: "Assigned duties must be completed on time.",
    explanation: "Modal passive: Modal + be + past participle. Indefinite pronoun \"one\" is omitted.",
    hint: "Modal + be + V3 (omit \"one\")."
  },
  {
    id: "add4-c10-22",
    classLevel: "10",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Active Voice:\n\"Let the lights be turned off before leaving.\"",
    options: ["Turn off the lights before leaving.","You should turn off lights before leaving.","Let turn off the lights before leaving.","Lights must be turned off."],
    correctAnswer: "Turn off the lights before leaving.",
    explanation: "Passive \"Let... be + V3\" converts to active imperative \"Turn off...\".",
    hint: "Imperative active command."
  },
  {
    id: "add4-c10-23",
    classLevel: "10",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"Hardly had the announcement been made ___ the audience began cheering.\"",
    options: ["when","than","then","as"],
    correctAnswer: "when",
    explanation: "\"Hardly had...\" is strictly followed by conjunction \"when\".",
    hint: "Hardly had... when."
  },
  {
    id: "add4-c10-24",
    classLevel: "10",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"He complied ___ all the regulations specified in the document.\"",
    options: ["with","by","to","for"],
    correctAnswer: "with",
    explanation: "The verb \"comply\" is followed by preposition \"with\".",
    hint: "Comply + with."
  },
  {
    id: "add4-c10-25",
    classLevel: "10",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"In accordance ___ the new policy, fees must be paid online.\"",
    options: ["with","to","by","of"],
    correctAnswer: "with",
    explanation: "Idiomatic phrase is \"in accordance with\".",
    hint: "In accordance + with."
  },
  {
    id: "add4-c10-26",
    classLevel: "10",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Transform into a Simple sentence:\n\"He finished his work and went out for a walk.\"",
    options: ["Having finished his work, he went out for a walk.","As he finished his work, he went out for a walk.","He went out for a walk because he finished work.","He finished his work so he went for a walk."],
    correctAnswer: "Having finished his work, he went out for a walk.",
    explanation: "Simple sentence using perfect participle phrase \"Having finished his work\".",
    hint: "Perfect participle phrase + main clause."
  },
  {
    id: "add4-c10-27",
    classLevel: "10",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the type of clause:\n\"The news that the principal resigned spread rapidly.\"",
    options: ["Noun Clause in apposition to noun","Adjective Clause","Adverb Clause of Reason","Relative Clause"],
    correctAnswer: "Noun Clause in apposition to noun",
    explanation: "\"that the principal resigned\" explains the content of the noun \"news\", so it is a Noun Clause in apposition.",
    hint: "Noun clause explaining content of \"news\"."
  },
  {
    id: "add4-c10-28",
    classLevel: "10",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Correct the punctuation:\n\"however hard he tried he could not succeed\"",
    options: ["However hard he tried, he could not succeed.","However, hard he tried he could not succeed.","However hard he tried; he could not succeed.","However hard he tried he could not succeed."],
    correctAnswer: "However hard he tried, he could not succeed.",
    explanation: "Adverbial clause at the beginning of a sentence is followed by a comma.",
    hint: "Comma after initial dependent clause."
  },
  {
    id: "add4-c10-29",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in: \"Neither the minister nor his advisers was able to resolve the crisis.\"",
    options: ["was -> were","advisers -> adviser","neither -> nor","resolve -> resolving"],
    correctAnswer: "was -> were",
    explanation: "In \"neither... nor\", the verb agrees with the closer subject (\"advisers\" - plural).",
    hint: "Verb agrees with plural advisers."
  },
  {
    id: "add4-c10-30",
    classLevel: "10",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice: \"They have postponed the international conference until November.\"",
    options: ["The international conference has been postponed until November.","The international conference was postponed until November.","The international conference is postponed until November.","The conference had postponed by them."],
    correctAnswer: "The international conference has been postponed until November.",
    explanation: "Present perfect passive: Object + has been + past participle (postponed).",
    hint: "Present perfect passive: has been + V3."
  },
  {
    id: "add4-c11-1",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Synthesize into a single Complex Sentence using Relative Pronoun:\n\"This is the scholar. Her paper was awarded the prestigious international fellowship.\"\nदिस इज द स्कॉलर...।",
    options: ["This is the scholar whose paper was awarded the prestigious international fellowship.","This is the scholar which paper was awarded fellowship.","This is the scholar and her paper was awarded fellowship.","This is the scholar who paper was awarded fellowship."],
    correctAnswer: "This is the scholar whose paper was awarded the prestigious international fellowship.",
    explanation: "Relative possessive pronoun \"whose\" synthesizes the two sentences into a single complex sentence.\nसम्बन्ध वाचक Relative Pronoun \"whose\" का प्रयोग करके दोनों वाक्यों को जोड़ा गया है।",
    hint: "Use possessive relative pronoun \"whose\"."
  },
  {
    id: "add4-c11-2",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Transform from Positive to Superlative degree:\n\"No other country in the world is as populous as India.\"\nनो अदर कंट्री...।",
    options: ["India is the most populous country in the world.","India is more populous than any other country.","India is very populous country in the world.","India is as most populous country in world."],
    correctAnswer: "India is the most populous country in the world.",
    explanation: "Positive degree with \"No other... as... as\" transforms into Superlative degree using \"the most populous\".\n\"No other... as\" संरचना Superlative में \"the most...\" बन जाती है।",
    hint: "Superlative degree uses \"the most populous\"."
  },
  {
    id: "add4-c11-3",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the inverted sentence structure:\n\"Seldom ___ such a breathtaking spectacle.\"",
    options: ["have I seen","I have seen","did I saw","I had seen"],
    correctAnswer: "have I seen",
    explanation: "Negative adverbs like \"seldom\", \"rarely\", \"never\" at the sentence start trigger inverted subject-verb order (\"have I seen\").\nनकारात्मक क्रियाविशेषण (Seldom) से शुरू होने वाले वाक्यों में Inversion (Auxiliary verb + Subject) होता है।",
    hint: "Inversion rule: Negative adverb + auxiliary + subject."
  },
  {
    id: "add4-c11-4",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Transform into Compound sentence:\n\"Besides being a renowned poet, he was a distinguished statesman.\"",
    options: ["He was not only a renowned poet but also a distinguished statesman.","Being a renowned poet, he was a distinguished statesman.","He was a poet and statesman.","Though he was a poet, he was a statesman."],
    correctAnswer: "He was not only a renowned poet but also a distinguished statesman.",
    explanation: "Prepositional phrase \"Besides being\" transforms into compound sentence using correlative conjunction \"not only... but also\".\n\"Besides being\" का Compound वाक्य \"not only... but also\" से बनता है।",
    hint: "Not only... but also structure."
  },
  {
    id: "add4-c11-5",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the grammatical error in the sentence:\n\"The majority of the committee members is in favor of the proposal.\"",
    options: ["is -> are","committee -> committees","in favor -> for favor","majority -> majorities"],
    correctAnswer: "is -> are",
    explanation: "When \"majority of\" refers to a plural noun (\"members\"), it takes a plural verb (\"are\").\n\"Majority of\" के बाद बहुवचन संज्ञा (members) होने पर क्रिया बहुवचन (are) आती है।",
    hint: "Majority of + plural noun takes plural verb."
  },
  {
    id: "add4-c11-6",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Find the error in:\n\"He insisted on me accompanying him to the railway station.\"",
    options: ["me -> my","accompanying -> to accompany","on -> at","station -> stop"],
    correctAnswer: "me -> my",
    explanation: "Gerunds (\"accompanying\") require possessive pronouns (\"my\"), not object pronouns (\"me\").\nGerund (V-ing) के पूर्व Possessive pronoun (my) का प्रयोग होता है।",
    hint: "Use possessive pronoun before gerund."
  },
  {
    id: "add4-c11-7",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the error in:\n\"Unless you do not apologize, you will not be excused.\"",
    options: ["Remove \"do not\"","Change \"Unless\" to \"If\"","Remove \"not\" in main clause","No error"],
    correctAnswer: "Remove \"do not\"",
    explanation: "\"Unless\" already contains a negative meaning (\"if not\"), so \"do not\" is redundant.\n\"Unless\" स्वयँ में नकारात्मक होता है, अतः इसके साथ \"not\" का प्रयोग वर्जित है।",
    hint: "Unless does not take negative words."
  },
  {
    id: "add4-c11-8",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Correct the error:\n\"I prefer coffee than tea during winters.\"",
    options: ["than -> to","coffee -> tea","during -> in","winters -> winter"],
    correctAnswer: "than -> to",
    explanation: "The verb \"prefer\" takes preposition \"to\", not \"than\".\nVerb \"prefer\" के साथ सदैव \"to\" preposition लगता है।",
    hint: "Prefer + to."
  },
  {
    id: "add4-c11-9",
    classLevel: "11",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Report the conditional dialogue:\n\"If I win the lottery, I will donate half the money to charity,\" said Mr. Verma.",
    options: ["Mr. Verma said that if he won the lottery, he would donate half the money to charity.","Mr. Verma said that if I win lottery, I will donate money.","Mr. Verma told if he wins lottery he will donate.","Mr. Verma announced if he had won lottery he would have donated."],
    correctAnswer: "Mr. Verma said that if he won the lottery, he would donate half the money to charity.",
    explanation: "Type 1 conditional changes to Type 2 in indirect speech: simple present (\"win\") -> simple past (\"won\"), \"will\" -> \"would\".",
    hint: "Win -> won, will -> would."
  },
  {
    id: "add4-c11-10",
    classLevel: "11",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech:\n\"Let us organize a tree plantation drive this weekend,\" suggested Priya.",
    options: ["Priya suggested that they should organize a tree plantation drive that weekend.","Priya suggested to organize tree plantation drive this weekend.","Priya proposed that let us organize tree plantation drive.","Priya asked that they organize tree drive."],
    correctAnswer: "Priya suggested that they should organize a tree plantation drive that weekend.",
    explanation: "\"Let us\" expressing proposal changes to: suggested that they should + base verb + \"this\" -> \"that\".",
    hint: "Suggested that they should...; this -> that."
  },
  {
    id: "add4-c11-11",
    classLevel: "11",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Report the sentence:\n\"Where can I submit my application form?\" asked the candidate.",
    options: ["The candidate inquired where he could submit his application form.","The candidate asked that where can he submit his form.","The candidate inquired where can I submit application.","The candidate asked where could he submit form."],
    correctAnswer: "The candidate inquired where he could submit his application form.",
    explanation: "Wh-question indirect speech: reporting verb -> inquired, wh-word + subject + past modal (\"could submit\").",
    hint: "Wh-word + subject + could + verb."
  },
  {
    id: "add4-c11-12",
    classLevel: "11",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Change to direct speech:\nShe exclaimed with delight that they had won the championship trophy.",
    options: ["She said, \"Hurrah! We have won the championship trophy!\"","She said, \"Alas! We won championship trophy!\"","She said, \"Oh! We will win championship!\"","She told, \"We had won championship!\""],
    correctAnswer: "She said, \"Hurrah! We have won the championship trophy!\"",
    explanation: "\"Exclaimed with delight\" converts back to interjection \"Hurrah!\", past perfect \"had won\" -> present perfect \"have won\".",
    hint: "Exclaimed with delight -> Hurrah!"
  },
  {
    id: "add4-c11-13",
    classLevel: "11",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice:\n\"The committee has decided to postpone the annual conference.\"",
    options: ["It has been decided by the committee to postpone the annual conference.","The annual conference was decided to postpone by committee.","To postpone annual conference is decided by committee.","The committee was decided to postpone conference."],
    correctAnswer: "It has been decided by the committee to postpone the annual conference.",
    explanation: "Infinitive phrase object converts using dummy subject \"It\": \"It has been decided by...\"",
    hint: "Dummy subject \"It has been decided by...\" structure."
  },
  {
    id: "add4-c11-14",
    classLevel: "11",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice:\n\"They say that truth always triumphs.\"",
    options: ["It is said that truth always triumphs.","Truth is said to triumph always by them.","Truth always triumphs is said by people.","It was said that truth triumphs."],
    correctAnswer: "It is said that truth always triumphs.",
    explanation: "Reporting clause \"They say that...\" converts to passive \"It is said that...\".",
    hint: "They say that -> It is said that..."
  },
  {
    id: "add4-c11-15",
    classLevel: "11",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert to Active Voice:\n\"Notice was taken of his remarkable performance by the management.\"",
    options: ["The management took notice of his remarkable performance.","Management has taken notice of performance.","Management takes notice of performance.","Performance took notice of management."],
    correctAnswer: "The management took notice of his remarkable performance.",
    explanation: "Simple past passive \"Notice was taken of... by...\" converts to simple past active \"The management took notice...\".",
    hint: "Took notice of..."
  },
  {
    id: "add4-c11-16",
    classLevel: "11",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct verb:\n\"Not only the students but also their teacher ___ praised for the science project.\"",
    options: ["was","were","are","have been"],
    correctAnswer: "was",
    explanation: "When subjects are connected by \"not only... but also\", verb agrees with closer subject (\"their teacher\" - singular).",
    hint: "Agrees with nearer subject \"teacher\"."
  },
  {
    id: "add4-c11-17",
    classLevel: "11",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"Every man, woman, and child ___ evacuated from the flood-affected zone.\"",
    options: ["was","were","are","have been"],
    correctAnswer: "was",
    explanation: "Nouns preceded by \"Every\" take singular verb (\"was\").",
    hint: "Preceded by \"Every\" takes singular verb."
  },
  {
    id: "add4-c11-18",
    classLevel: "11",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"The jury ___ divided in their opinions regarding the verdict.\"",
    options: ["were","was","is","has been"],
    correctAnswer: "were",
    explanation: "When members of a collective noun (\"jury\") disagree or act individually, verb is plural (\"were\") and pronoun is \"their\".",
    hint: "Divided opinion in collective noun takes plural verb."
  },
  {
    id: "add4-c11-19",
    classLevel: "11",
    topic: "Modals & Conditionals",
    difficulty: "Hard",
    questionText: "Choose the correct conditional form:\n\"If I ___ the chief guest, I would have inaugurated the new wing.\"",
    options: ["had been","were","am","was"],
    correctAnswer: "had been",
    explanation: "Third conditional past hypothetical: \"If + had been\" pairs with \"would have + past participle\".",
    hint: "Type 3 conditional: If + had been."
  },
  {
    id: "add4-c11-20",
    classLevel: "11",
    topic: "Modals & Conditionals",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"Lest you ___ fail, work with dedication and care.\"",
    options: ["should","might","would","could"],
    correctAnswer: "should",
    explanation: "Conjunction \"Lest\" is strictly followed by modal auxiliary \"should\".",
    hint: "Lest is followed by \"should\"."
  },
  {
    id: "add4-c11-21",
    classLevel: "11",
    topic: "Modals & Conditionals",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"He ___ rather starve than beg for money.\"",
    options: ["would","should","could","might"],
    correctAnswer: "would",
    explanation: "Idiomatic expression \"would rather... than\" expresses preference.",
    hint: "Would rather... than preference."
  },
  {
    id: "add4-c11-22",
    classLevel: "11",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the subjunctive verb form:\n\"The manager demanded that the employee ___ a written explanation.\"",
    options: ["submit","submits","submitted","should submit"],
    correctAnswer: "submit",
    explanation: "Present Subjunctive Mood after verbs of command/demand requires bare base form (\"submit\") for all persons.",
    hint: "Present subjunctive uses base form V1."
  },
  {
    id: "add4-c11-23",
    classLevel: "11",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"I wish I ___ more time to complete the manuscript.\"",
    options: ["had","have","would have","have had"],
    correctAnswer: "had",
    explanation: "Subjunctive after \"I wish\" expressing present regret takes simple past (\"had\").",
    hint: "Wish + simple past for present regret."
  },
  {
    id: "add4-c11-24",
    classLevel: "11",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"Hardly had the curtain dropped ___ the audience erupted into applause.\"",
    options: ["when","than","then","as"],
    correctAnswer: "when",
    explanation: "Hardly had... when structure.",
    hint: "Hardly had takes \"when\"."
  },
  {
    id: "add4-c11-25",
    classLevel: "11",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"He is accustomed ___ working under high pressure.\"",
    options: ["to","with","for","in"],
    correctAnswer: "to",
    explanation: "The adjective phrase \"accustomed to\" takes preposition \"to\" + gerund (\"working\").",
    hint: "Accustomed + to."
  },
  {
    id: "add4-c11-26",
    classLevel: "11",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank:\n\"She is good ___ solving complex mathematical problems.\"",
    options: ["at","in","with","for"],
    correctAnswer: "at",
    explanation: "Adjective \"good\" indicating skill takes preposition \"at\".",
    hint: "Good + at."
  },
  {
    id: "add4-c11-27",
    classLevel: "11",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Choose the phrasal preposition:\n\"___ the severe weather conditions, the flight departed on schedule.\"",
    options: ["In spite of","Despite of","Because of","Owing to"],
    correctAnswer: "In spite of",
    explanation: "\"In spite of\" means despite; note that \"despite\" does not take \"of\".",
    hint: "In spite of (never \"despite of\")."
  },
  {
    id: "add4-c11-28",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the type of subordinate clause:\n\"Whatever you decide will be accepted by the team.\"",
    options: ["Noun Clause acting as Subject","Adjective Clause","Adverb Clause of Condition","Relative Clause"],
    correctAnswer: "Noun Clause acting as Subject",
    explanation: "\"Whatever you decide\" functions as the subject noun clause of the sentence.",
    hint: "Subordinate clause acting as subject noun."
  },
  {
    id: "add4-c11-29",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Select the correctly punctuated complex sentence:",
    options: ["Although he was exhausted, he completed the report; however, he made no errors.","Although he was exhausted he completed the report.","Although he was exhausted, he completed the report.","Although, he was exhausted he completed report."],
    correctAnswer: "Although he was exhausted, he completed the report.",
    explanation: "Subordinate clause at the beginning requires a comma before the main clause.",
    hint: "Comma after initial subordinate clause."
  },
  {
    id: "add4-c11-30",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the error:\n\"The doctor advised him to lay in bed for a week.\"",
    options: ["lay -> lie","for -> since","advised -> suggested","bed -> the bed"],
    correctAnswer: "lay -> lie",
    explanation: "Intransitive verb \"lie\" (to recline) should be used instead of transitive verb \"lay\" (to place).",
    hint: "Lie (recline) vs Lay (place)."
  },
  {
    id: "add4-c12-1",
    classLevel: "12",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to Indirect Speech:\n\"Had I known your predicament, I would have offered assistance,\" said the advocate.",
    options: ["The advocate stated that had he known my predicament, he would have offered assistance.","The advocate said that if he knew my predicament he will offer assistance.","The advocate told he had known predicament and offered assistance.","The advocate asked if he had known my predicament."],
    correctAnswer: "The advocate stated that had he known my predicament, he would have offered assistance.",
    explanation: "Third conditional (\"Had I known... would have offered\") remains unshifted in tense during indirect speech report.",
    hint: "Type 3 conditional tense remains unshifted."
  },
  {
    id: "add4-c12-2",
    classLevel: "12",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Report the complex discourse:\n\"Why don't we initiate a digital literacy campaign for the elderly?\" proposed the secretary.\n\"That is a commendable suggestion!\" exclaimed the chairperson.",
    options: ["The secretary proposed initiating a digital literacy campaign for the elderly, to which the chairperson exclaimed with appreciation that it was a commendable suggestion.","The secretary proposed why don't we start campaign. The chairperson said good suggestion.","The secretary asked why not start campaign and chairperson exclaimed it is good.","The secretary told to start campaign."],
    correctAnswer: "The secretary proposed initiating a digital literacy campaign for the elderly, to which the chairperson exclaimed with appreciation that it was a commendable suggestion.",
    explanation: "Combines proposal (\"proposed initiating\") and exclamation (\"exclaimed with appreciation that...\") into a coherent reporting paragraph.",
    hint: "Reported speech synthesis of multi-speaker dialogue."
  },
  {
    id: "add4-c12-3",
    classLevel: "12",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech:\n\"Do not venture near the cliff edge; the rocks are unstable,\" warned the forest guard.",
    options: ["The forest guard warned the tourists not to venture near the cliff edge, explaining that the rocks were unstable.","The forest guard warned that don't venture near cliff edge because rocks are unstable.","The forest guard told no venture near cliff.","The forest guard warned tourists to not go near cliff edge."],
    correctAnswer: "The forest guard warned the tourists not to venture near the cliff edge, explaining that the rocks were unstable.",
    explanation: "Negative command (\"not to venture\") + explanatory clause (\"explaining that the rocks were unstable\").",
    hint: "Not to + verb + explanatory cause."
  },
  {
    id: "add4-c12-4",
    classLevel: "12",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to direct speech:\nThe director instructed the team that they were to finalize the audit report by dusk.",
    options: ["The director said to the team, \"You are to finalize the audit report by dusk.\"","The director said, \"You were to finalize audit report by dusk.\"","The director asked team, \"Finalize audit report by dusk.\"","The director told, \"You must finalized report by dusk.\""],
    correctAnswer: "The director said to the team, \"You are to finalize the audit report by dusk.\"",
    explanation: "Indirect \"were to finalize\" converts back to direct formal imperative \"are to finalize\".",
    hint: "Were to -> are to."
  },
  {
    id: "add4-c12-5",
    classLevel: "12",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice:\n\"It is time to distribute the answer scripts to the examinees.\"",
    options: ["It is time for the answer scripts to be distributed to the examinees.","It is time answer scripts are distributed.","Answer scripts should distribute to examinees.","It is time examinees were given answer scripts."],
    correctAnswer: "It is time for the answer scripts to be distributed to the examinees.",
    explanation: "Structure \"It is time + infinitive\" converts to \"It is time + for + object + to be + past participle\".",
    hint: "It is time for + object + to be + V3."
  },
  {
    id: "add4-c12-6",
    classLevel: "12",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice:\n\"The authorities ought to have addressed the infrastructure grievances earlier.\"",
    options: ["The infrastructure grievances ought to have been addressed by the authorities earlier.","The infrastructure grievances ought to be addressed earlier.","Authorities were to address grievances.","Grievances had to be addressed by authorities."],
    correctAnswer: "The infrastructure grievances ought to have been addressed by the authorities earlier.",
    explanation: "Modal perfect passive: Modal + have + been + past participle (\"ought to have been addressed\").",
    hint: "Ought to have been + V3."
  },
  {
    id: "add4-c12-7",
    classLevel: "12",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Active Voice:\n\"The manuscript is believed to have been written in the sixteenth century.\"",
    options: ["Scholars believe that the manuscript was written in the sixteenth century.","People believe that manuscript was wrote in sixteenth century.","It was believed scholars wrote manuscript.","They believe manuscript is written in sixteenth century."],
    correctAnswer: "Scholars believe that the manuscript was written in the sixteenth century.",
    explanation: "Passive infinitive construction \"is believed to have been written\" converts to active clause \"Scholars believe that...\".",
    hint: "Believe that + past simple clause."
  },
  {
    id: "add4-c12-8",
    classLevel: "12",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice:\n\"He likes people respecting his authority.\"",
    options: ["He likes his authority to be respected by people.","He likes being respected his authority.","His authority is liked to be respected.","People are liked to respect his authority."],
    correctAnswer: "He likes his authority to be respected by people.",
    explanation: "Gerund/infinitive passive transformation: \"likes + object + to be + V3\".",
    hint: "Likes + object + to be + V3."
  },
  {
    id: "add4-c12-9",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the error in formal register:\n\"Scarcely had the keynote speaker commenced his address than a power outage disrupted the proceedings.\"",
    options: ["than -> when","commenced -> commencing","had -> did","disrupted -> disrupts"],
    correctAnswer: "than -> when",
    explanation: "\"Scarcely had...\" correlates with \"when\", not \"than\" (which correlates with \"no sooner\").",
    hint: "Scarcely had correlates with when."
  },
  {
    id: "add4-c12-10",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Spot the error in advanced syntax:\n\"Not only the CEO but also the board members was present at the annual general meeting.\"",
    options: ["was -> were","members -> member","present -> presenting","at -> in"],
    correctAnswer: "was -> were",
    explanation: "Correlative conjunction \"not only... but also\" dictates verb agreement with closer subject (\"board members\" - plural).",
    hint: "Agrees with nearer plural subject."
  },
  {
    id: "add4-c12-11",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in sentence:\n\"The reason why he resigned from his post was because he was unwell.\"",
    options: ["was because -> was that","why -> that","resigned -> resigns","unwell -> illness"],
    correctAnswer: "was because -> was that",
    explanation: "Expression \"The reason why...\" is followed by predicate clause introduced by \"was that\", not \"was because\".",
    hint: "The reason why... was that..."
  },
  {
    id: "add4-c12-12",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Find the error in:\n\"He is one of those visionaries who has transformed the tech industry.\"",
    options: ["has -> have","visionaries -> visionary","transformed -> transform","who -> which"],
    correctAnswer: "has -> have",
    explanation: "Relative pronoun \"who\" refers to plural antecedent \"visionaries\", requiring plural verb \"have\".",
    hint: "Antecedent visionaries requires plural verb \"have\"."
  },
  {
    id: "add4-c12-13",
    classLevel: "12",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Choose the modal expressing subjunctive necessity:\n\"It is imperative that every delegate ___ present during the voting session.\"",
    options: ["be","is","should be","must be"],
    correctAnswer: "be",
    explanation: "Formal mandatory subjunctive requires base verb \"be\" (without modal or inflected form).",
    hint: "Mandatory subjunctive uses bare base verb \"be\"."
  },
  {
    id: "add4-c12-14",
    classLevel: "12",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the blank for past unfulfilled obligation:\n\"You ___ submitted your research paper prior to the deadline; now you face a penalty.\"",
    options: ["ought to have","must have","could have","might have"],
    correctAnswer: "ought to have",
    explanation: "\"Ought to have + V3\" expresses a past duty that was not fulfilled.",
    hint: "Past unfulfilled duty."
  },
  {
    id: "add4-c12-15",
    classLevel: "12",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"___ you require further technical assistance, do not hesitate to contact support.\"",
    options: ["Should","If","Would","Could"],
    correctAnswer: "Should",
    explanation: "Inverted conditional clause: \"Should you require...\" replaces \"If you require...\".",
    hint: "Inverted conditional \"Should you require...\"."
  },
  {
    id: "add4-c12-16",
    classLevel: "12",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Choose the modal for high probability deduction:\n\"The streets are submerged in water; it ___ rained heavily overnight.\"",
    options: ["must have","should have","can have","would have"],
    correctAnswer: "must have",
    explanation: "\"Must have + V3\" denotes high probability deduction regarding past events.",
    hint: "Past deduction must have + V3."
  },
  {
    id: "add4-c12-17",
    classLevel: "12",
    topic: "Subject-Verb & Inversion Rules",
    difficulty: "Hard",
    questionText: "Identify inverted order:\n\"Little ___ that his research would revolutionize modern medicine.\"",
    options: ["did he know","he knew","he had known","does he knew"],
    correctAnswer: "did he know",
    explanation: "Negative adverb \"Little\" at sentence head causes inversion (\"did he know\").",
    hint: "Little + inverted auxiliary + subject."
  },
  {
    id: "add4-c12-18",
    classLevel: "12",
    topic: "Subject-Verb & Inversion Rules",
    difficulty: "Hard",
    questionText: "Choose the correct verb:\n\"A series of high-level lectures ___ scheduled for the upcoming academic week.\"",
    options: ["has been","have been","are","were"],
    correctAnswer: "has been",
    explanation: "Collective phrase \"A series of...\" takes singular verb (\"has been\").",
    hint: "A series of takes singular verb."
  },
  {
    id: "add4-c12-19",
    classLevel: "12",
    topic: "Subject-Verb & Inversion Rules",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"Under no circumstances ___ confidential documents be removed from the archives.\"",
    options: ["should","must not","are","can not"],
    correctAnswer: "should",
    explanation: "Negative adverbial phrase \"Under no circumstances\" causes inversion: \"should confidential documents be...\".",
    hint: "Under no circumstances + modal + subject."
  },
  {
    id: "add4-c12-20",
    classLevel: "12",
    topic: "Subject-Verb & Inversion Rules",
    difficulty: "Hard",
    questionText: "Choose the correct sentence:\n\"The governor, accompanied by his delegates, has arrived at the summit.\"",
    options: ["The governor, accompanied by his delegates, has arrived at the summit.","The governor, accompanied by his delegates, have arrived.","The governor, accompanied by delegates, are arriving.","The governor accompanied by delegates have arrived."],
    correctAnswer: "The governor, accompanied by his delegates, has arrived at the summit.",
    explanation: "Phrases like \"accompanied by\" do not alter singular subject \"The governor\", so verb is singular (\"has\").",
    hint: "Accompanied by does not make subject plural."
  },
  {
    id: "add4-c12-21",
    classLevel: "12",
    topic: "Complex Clause Structure & Synthesis",
    difficulty: "Hard",
    questionText: "Synthesize into a single Simple Sentence:\n\"He was exhausted by the relentless journey. He refused to abandon the expedition.\"",
    options: ["In spite of being exhausted by the relentless journey, he refused to abandon the expedition.","Although he was exhausted, he refused to abandon the expedition.","He was exhausted yet he refused to abandon expedition.","He was exhausted so he abandoned expedition."],
    correctAnswer: "In spite of being exhausted by the relentless journey, he refused to abandon the expedition.",
    explanation: "Prepositional phrase \"In spite of being...\" creates a single Simple Sentence.",
    hint: "Prepositional phrase + main clause = Simple Sentence."
  },
  {
    id: "add4-c12-22",
    classLevel: "12",
    topic: "Complex Clause Structure & Synthesis",
    difficulty: "Hard",
    questionText: "Identify the type of clause:\n\"He spoke with such eloquence that the entire audience was mesmerized.\"",
    options: ["Adverb Clause of Result","Adverb Clause of Purpose","Noun Clause","Adjective Clause"],
    correctAnswer: "Adverb Clause of Result",
    explanation: "\"that the entire audience was mesmerized\" introduced by \"such... that\" expresses result/consequence.",
    hint: "Adverb clause of result with \"such... that\"."
  },
  {
    id: "add4-c12-23",
    classLevel: "12",
    topic: "Complex Clause Structure & Synthesis",
    difficulty: "Hard",
    questionText: "Synthesize into a Complex Sentence using Causal Conjunction:\n\"The flood damaged the railway tracks. The train service was suspended for two days.\"",
    options: ["Since the flood damaged the railway tracks, the train service was suspended for two days.","The flood damaged railway tracks and train service was suspended.","The flood damaging railway tracks, train service was suspended.","The train service was suspended so flood damaged tracks."],
    correctAnswer: "Since the flood damaged the railway tracks, the train service was suspended for two days.",
    explanation: "Subordinate causal conjunction \"Since\" joins cause and effect into a Complex Sentence.",
    hint: "Complex sentence with causal conjunction \"Since\"."
  },
  {
    id: "add4-c12-24",
    classLevel: "12",
    topic: "Complex Clause Structure & Synthesis",
    difficulty: "Hard",
    questionText: "Transform into Negative without changing meaning:\n\"Every member supported the motion unanimously.\"",
    options: ["There was no member who did not support the motion.","No member supported the motion.","Members did not support the motion.","Every member did not reject motion."],
    correctAnswer: "There was no member who did not support the motion.",
    explanation: "Affirmative to negative transformation: \"Every member supported\" -> \"There was no member who did not support\".",
    hint: "Double negative preserves affirmative meaning."
  },
  {
    id: "add4-c12-25",
    classLevel: "12",
    topic: "Prepositions & Idiomatic Phrasal Verbs",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"The board of directors agreed to abide ___ the decision of the arbitrator.\"",
    options: ["by","with","to","for"],
    correctAnswer: "by",
    explanation: "Phrasal verb \"abide by\" means to comply with or respect a decision.",
    hint: "Abide by a decision."
  },
  {
    id: "add4-c12-26",
    classLevel: "12",
    topic: "Prepositions & Idiomatic Phrasal Verbs",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"He succeeded in getting the resolution passed ___ virtue of his overwhelming majority.\"",
    options: ["by","in","with","on"],
    correctAnswer: "by",
    explanation: "Idiomatic prepositional phrase \"by virtue of\" means on account of or through.",
    hint: "By virtue of."
  },
  {
    id: "add4-c12-27",
    classLevel: "12",
    topic: "Prepositions & Idiomatic Phrasal Verbs",
    difficulty: "Medium",
    questionText: "Choose the correct phrasal verb:\n\"The negotiations ___ owing to irreconcilable differences between the parties.\"",
    options: ["broke down","broke up","broke out","broke off"],
    correctAnswer: "broke down",
    explanation: "Phrasal verb \"broke down\" means collapsed or failed in negotiations.",
    hint: "Break down = fail/collapse."
  },
  {
    id: "add4-c12-28",
    classLevel: "12",
    topic: "Determiners & Articles in Formal Register",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"___ little knowledge is a dangerous thing.\"",
    options: ["A","The","Few","Little"],
    correctAnswer: "A",
    explanation: "Idiomatic proverb: \"A little knowledge is a dangerous thing\" (\"a little\" means a small amount).",
    hint: "Proverb: A little knowledge..."
  },
  {
    id: "add4-c12-29",
    classLevel: "12",
    topic: "Determiners & Articles in Formal Register",
    difficulty: "Hard",
    questionText: "Fill in the blank:\n\"He is an authority ___ international environmental jurisprudence.\"",
    options: ["on","in","at","about"],
    correctAnswer: "on",
    explanation: "The noun \"authority\" indicating expertise takes preposition \"on\".",
    hint: "An authority on a subject."
  },
  {
    id: "add4-c12-30",
    classLevel: "12",
    topic: "Prepositions & Idiomatic Phrasal Verbs",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"The committee decision was taken in compliance ___ the court guidelines.\"",
    options: ["with","to","for","by"],
    correctAnswer: "with",
    explanation: "Idiomatic prepositional phrase is \"in compliance with\".",
    hint: "In compliance + with."
  },
  // ==================== NEW BATCH 200 QUESTIONS (20 PER CLASS 3-12) ====================
  {
    id: "add5-c3-1",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Which word is a proper noun in: \"Rohan lives in Delhi.\"",
    options: ["lives","Rohan","in","city"],
    correctAnswer: "Rohan",
    explanation: "Proper nouns are specific names of people or places and begin with a capital letter (Rohan).",
    hint: "Look for the specific name of a person."
  },
  {
    id: "add5-c3-2",
    classLevel: "3",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Fill in the blank: \"She has ___ yellow duck.\"",
    options: ["a","an","the","no article"],
    correctAnswer: "a",
    explanation: "Use \"a\" before consonant sounds (\"yellow\").",
    hint: "Yellow starts with a consonant sound."
  },
  {
    id: "add5-c3-3",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Choose the correct pronoun: \"Rahul is happy because ___ won the prize.\"",
    options: ["he","she","it","they"],
    correctAnswer: "he",
    explanation: "Rahul is a male singular noun, so the appropriate pronoun is \"he\".",
    hint: "Pronoun for a boy."
  },
  {
    id: "add5-c3-4",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Identify the action verb: \"The bird sings in the tree.\"",
    options: ["bird","sings","in","tree"],
    correctAnswer: "sings",
    explanation: "\"Sings\" is the action performed by the bird.",
    hint: "Action done by the subject."
  },
  {
    id: "add5-c3-5",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Select the adjective: \"The big dog barked loudly.\"",
    options: ["big","barked","loudly","dog"],
    correctAnswer: "big",
    explanation: "\"Big\" describes the noun \"dog\".",
    hint: "Word describing the dog."
  },
  {
    id: "add5-c3-6",
    classLevel: "3",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Choose the correct preposition: \"The ball is ___ the box.\"",
    options: ["in","underneath of","between","during"],
    correctAnswer: "in",
    explanation: "\"In\" shows position inside an object.",
    hint: "Inside something."
  },
  {
    id: "add5-c3-7",
    classLevel: "3",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Which conjunction joins the sentence: \"I like apples ___ oranges.\"",
    options: ["and","but","because","so"],
    correctAnswer: "and",
    explanation: "\"And\" connects similar items.",
    hint: "Joining two items together."
  },
  {
    id: "add5-c3-8",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Pick the plural form of \"child\".",
    options: ["childs","children","childrens","childes"],
    correctAnswer: "children",
    explanation: "The irregular plural of \"child\" is \"children\".",
    hint: "Irregular plural ending in -ren."
  },
  {
    id: "add5-c3-9",
    classLevel: "3",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Choose the correct punctuation mark for: \"Where are you going\"",
    options: ["Question mark (?)","Full stop (.)","Comma (,)","Exclamation mark (!)"],
    correctAnswer: "Question mark (?)",
    explanation: "Questions end with a question mark (?).",
    hint: "Asking a question."
  },
  {
    id: "add5-c3-10",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Identify the opposite (antonym) of \"hot\".",
    options: ["cold","warm","boiling","spicy"],
    correctAnswer: "cold",
    explanation: "The antonym of hot is cold.",
    hint: "Low temperature word."
  },
  {
    id: "add5-c3-11",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Fill in the blank: \"An elephant is a ___ animal.\"",
    options: ["large","tiny","narrow","short"],
    correctAnswer: "large",
    explanation: "Elephants are big/large animals.",
    hint: "Describes huge size."
  },
  {
    id: "add5-c3-12",
    classLevel: "3",
    topic: "Articles (A, An, The)",
    difficulty: "Easy",
    questionText: "Choose the correct article: \"I saw ___ owl on the roof.\"",
    options: ["an","a","the","no article"],
    correctAnswer: "an",
    explanation: "Use \"an\" before vowel sounds (\"owl\").",
    hint: "Starts with vowel sound O."
  },
  {
    id: "add5-c3-13",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the pronoun in: \"We are playing in the park.\"",
    options: ["We","playing","park","in"],
    correctAnswer: "We",
    explanation: "\"We\" replaces a group of people including the speaker.",
    hint: "First person plural pronoun."
  },
  {
    id: "add5-c3-14",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Select the action verb: \"Mona writes neat notes.\"",
    options: ["writes","neat","notes","Mona"],
    correctAnswer: "writes",
    explanation: "\"Writes\" is the action performed.",
    hint: "Action verb."
  },
  {
    id: "add5-c3-15",
    classLevel: "3",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Pick the correct preposition: \"The cat jumped ___ the chair.\"",
    options: ["off","underneath of","during","since"],
    correctAnswer: "off",
    explanation: "Jumping away from a surface uses \"off\".",
    hint: "Leaving a surface."
  },
  {
    id: "add5-c3-16",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Choose the plural of \"foot\".",
    options: ["feet","foots","feets","footies"],
    correctAnswer: "feet",
    explanation: "The irregular plural of \"foot\" is \"feet\".",
    hint: "Double o changes to double e."
  },
  {
    id: "add5-c3-17",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Identify the adjective in: \"She wore a red dress.\"",
    options: ["red","dress","wore","she"],
    correctAnswer: "red",
    explanation: "\"Red\" describes the color of the dress.",
    hint: "Color word."
  },
  {
    id: "add5-c3-18",
    classLevel: "3",
    topic: "Prepositions & Conjunctions",
    difficulty: "Easy",
    questionText: "Fill in the blank with a conjunction: \"He ran fast ___ he missed the bus.\"",
    options: ["but","and","so","or"],
    correctAnswer: "but",
    explanation: "\"But\" connects contrasting facts.",
    hint: "Shows contrast."
  },
  {
    id: "add5-c3-19",
    classLevel: "3",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Easy",
    questionText: "Which sentence starts with a capital letter and ends with a full stop?",
    options: ["The sun rises in the east.","the sun rises in the east","The sun rises in the east?","the Sun rises in the East"],
    correctAnswer: "The sun rises in the east.",
    explanation: "Correct sentence starts with capital \"T\" and ends with full stop \".\".",
    hint: "Capital start and period end."
  },
  {
    id: "add5-c3-20",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Identify the possessive pronoun: \"This book is mine.\"",
    options: ["mine","book","this","is"],
    correctAnswer: "mine",
    explanation: "\"Mine\" is a possessive pronoun showing ownership.",
    hint: "Shows ownership."
  },
  {
    id: "add5-c4-1",
    classLevel: "4",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Choose the correct article: \"___ Taj Mahal is located in Agra.\"",
    options: ["The","A","An","No article"],
    correctAnswer: "The",
    explanation: "Famous historical monuments take the definite article \"The\".",
    hint: "Famous monument."
  },
  {
    id: "add5-c4-2",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the abstract noun: \"Honesty is the best policy.\"",
    options: ["Honesty","best","policy","is"],
    correctAnswer: "Honesty",
    explanation: "Honesty is a quality/concept that cannot be physically touched, making it an abstract noun.",
    hint: "Name of a moral quality."
  },
  {
    id: "add5-c4-3",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Select the correct form of verb: \"They ___ playing cricket yesterday.\"",
    options: ["were","was","are","is"],
    correctAnswer: "were",
    explanation: "Plural subject \"They\" takes past continuous verb \"were\".",
    hint: "Past plural continuous verb."
  },
  {
    id: "add5-c4-4",
    classLevel: "4",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Choose the adverb of manner in: \"The boy walked slowly.\"",
    options: ["slowly","boy","walked","the"],
    correctAnswer: "slowly",
    explanation: "\"Slowly\" describes how (the manner in which) the boy walked.",
    hint: "Ends in -ly, tells how."
  },
  {
    id: "add5-c4-5",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank with a preposition: \"The clock hangs ___ the wall.\"",
    options: ["on","in","at","into"],
    correctAnswer: "on",
    explanation: "Objects attached to surfaces take \"on\".",
    hint: "Surface attachment."
  },
  {
    id: "add5-c4-6",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Choose the correct conjunction: \"You can have tea ___ coffee.\"",
    options: ["or","because","so","until"],
    correctAnswer: "or",
    explanation: "\"Or\" gives a choice between options.",
    hint: "Presents a choice."
  },
  {
    id: "add5-c4-7",
    classLevel: "4",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the subject in: \"The shiny blue car stopped at the red light.\"",
    options: ["The shiny blue car","stopped","at the red light","car stopped"],
    correctAnswer: "The shiny blue car",
    explanation: "The full noun phrase performing the action is \"The shiny blue car\".",
    hint: "Who or what performed the action."
  },
  {
    id: "add5-c4-8",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Select the past tense of \"catch\".",
    options: ["caught","catched","catching","catches"],
    correctAnswer: "caught",
    explanation: "The irregular past tense of catch is caught.",
    hint: "Irregular past form."
  },
  {
    id: "add5-c4-9",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Which word is a collective noun: \"A fleet of ships arrived at the port.\"",
    options: ["fleet","ships","port","arrived"],
    correctAnswer: "fleet",
    explanation: "\"Fleet\" refers to a collection/group of ships.",
    hint: "Group name for ships."
  },
  {
    id: "add5-c4-10",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Neither Priya ___ Sita was present.\"",
    options: ["nor","or","and","but"],
    correctAnswer: "nor",
    explanation: "The correlative pair is \"Neither ... nor\".",
    hint: "Pairs with Neither."
  },
  {
    id: "add5-c4-11",
    classLevel: "4",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Choose the comparative adjective: \"A tiger is ___ than a cat.\"",
    options: ["stronger","strong","strongest","more strong"],
    correctAnswer: "stronger",
    explanation: "Comparison between two uses the comparative form \"-er\" (stronger).",
    hint: "Comparative degree ending in -er."
  },
  {
    id: "add5-c4-12",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the possessive adjective in: \"This is my bag.\"",
    options: ["my","this","bag","is"],
    correctAnswer: "my",
    explanation: "\"My\" modifies the noun \"bag\" to show ownership.",
    hint: "Adjective showing ownership."
  },
  {
    id: "add5-c4-13",
    classLevel: "4",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Select the correct article: \"He wants to become ___ astronaut.\"",
    options: ["an","a","the","no article"],
    correctAnswer: "an",
    explanation: "\"Astronaut\" begins with a vowel sound /æ/, so \"an\" is required.",
    hint: "Vowel sound start."
  },
  {
    id: "add5-c4-14",
    classLevel: "4",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Choose the adverb of time: \"We will visit the museum tomorrow.\"",
    options: ["tomorrow","museum","visit","will"],
    correctAnswer: "tomorrow",
    explanation: "\"Tomorrow\" answers when the action will happen.",
    hint: "Tells when."
  },
  {
    id: "add5-c4-15",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"She has been living here ___ 2020.\"",
    options: ["since","for","from","in"],
    correctAnswer: "since",
    explanation: "Use \"since\" with a specific starting point in time (\"2020\").",
    hint: "Starting point of time."
  },
  {
    id: "add5-c4-16",
    classLevel: "4",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the predicate in: \"The birds fly high in the sky.\"",
    options: ["fly high in the sky","The birds","birds fly","in the sky"],
    correctAnswer: "fly high in the sky",
    explanation: "The predicate includes the verb and everything after it.",
    hint: "Verb and rest of sentence."
  },
  {
    id: "add5-c4-17",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Choose the correct plural form of \"leaf\".",
    options: ["leaves","leafs","leafes","leavs"],
    correctAnswer: "leaves",
    explanation: "Nouns ending in -f usually change to -ves in plural (leaves).",
    hint: "-f changes to -ves."
  },
  {
    id: "add5-c4-18",
    classLevel: "4",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Identify the preposition of place: \"There is a garden behind our house.\"",
    options: ["behind","garden","house","there"],
    correctAnswer: "behind",
    explanation: "\"Behind\" indicates location/place.",
    hint: "Tells position/place."
  },
  {
    id: "add5-c4-19",
    classLevel: "4",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Select the synonym of \"fragile\".",
    options: ["delicate","strong","heavy","tough"],
    correctAnswer: "delicate",
    explanation: "Fragile means easily broken or delicate.",
    hint: "Means easily broken."
  },
  {
    id: "add5-c4-20",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Fill in the blank with a reflexive pronoun: \"I completed the homework ___.\"",
    options: ["myself","himself","herself","themselves"],
    correctAnswer: "myself",
    explanation: "Subject \"I\" pairs with reflexive pronoun \"myself\".",
    hint: "Reflexive form for \"I\"."
  },
  {
    id: "add5-c5-1",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the type of noun for \"courage\":",
    options: ["Abstract Noun","Proper Noun","Collective Noun","Material Noun"],
    correctAnswer: "Abstract Noun",
    explanation: "Courage is a state or quality that cannot be physically touched.",
    hint: "A quality or feeling."
  },
  {
    id: "add5-c5-2",
    classLevel: "5",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Fill in the blank with suitable degree of adjective: \"Gold is ___ than silver.\"",
    options: ["more expensive","expensive","most expensive","expensiver"],
    correctAnswer: "more expensive",
    explanation: "Multi-syllable adjectives use \"more\" for comparative degree.",
    hint: "Comparative degree of multi-syllable word."
  },
  {
    id: "add5-c5-3",
    classLevel: "5",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct verb: \"Each of the students ___ received a certificate.\"",
    options: ["has","have","were","are"],
    correctAnswer: "has",
    explanation: "\"Each\" takes a singular verb (\"has\").",
    hint: "Each is always singular."
  },
  {
    id: "add5-c5-4",
    classLevel: "5",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the adverb in: \"She spoke very quietly.\"",
    options: ["quietly","spoke","she","very"],
    correctAnswer: "quietly",
    explanation: "\"Quietly\" is the adverb describing the verb \"spoke\".",
    hint: "Describes how she spoke."
  },
  {
    id: "add5-c5-5",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Select the correct preposition: \"Divide the sweets ___ the two brothers.\"",
    options: ["between","among","with","into"],
    correctAnswer: "between",
    explanation: "Use \"between\" when dividing or dealing with exactly two entities.",
    hint: "Used for two people."
  },
  {
    id: "add5-c5-6",
    classLevel: "5",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Convert to interrogative sentence: \"He can swim across the river.\"",
    options: ["Can he swim across the river?","He swim across river can?","Did he swim across the river?","Does he swim across river?"],
    correctAnswer: "Can he swim across the river?",
    explanation: "Invert modal auxiliary \"Can\" to the front to form a question.",
    hint: "Put auxiliary verb first."
  },
  {
    id: "add5-c5-7",
    classLevel: "5",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Choose the correct modal verb for advice: \"You ___ brush your teeth twice a day.\"",
    options: ["should","might","could","would"],
    correctAnswer: "should",
    explanation: "\"Should\" expresses advice or recommendation.",
    hint: "Gives good advice."
  },
  {
    id: "add5-c5-8",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Identify the conjunction: \"Although it was raining, they went out to play.\"",
    options: ["Although","raining","playing","they"],
    correctAnswer: "Although",
    explanation: "\"Although\" is a subordinating conjunction indicating concession.",
    hint: "Subordinating conjunction."
  },
  {
    id: "add5-c5-9",
    classLevel: "5",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Choose the correct past continuous tense: \"When I called him, he ___ his dinner.\"",
    options: ["was eating","eats","ate","is eating"],
    correctAnswer: "was eating",
    explanation: "Past continuous (\"was eating\") shows an ongoing action in the past interrupted by another event.",
    hint: "Past ongoing action."
  },
  {
    id: "add5-c5-10",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Select the correct pronoun: \"The boy ___ won the race is my cousin.\"",
    options: ["who","which","whom","whose"],
    correctAnswer: "who",
    explanation: "Use \"who\" as subject relative pronoun for people.",
    hint: "Relative pronoun for people."
  },
  {
    id: "add5-c5-11",
    classLevel: "5",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Identify the error in: \"She don't like chocolate ice cream.\"",
    options: ["don't -> doesn't","like -> likes","ice cream -> ice creams","she -> her"],
    correctAnswer: "don't -> doesn't",
    explanation: "Third person singular \"She\" requires \"doesn't\".",
    hint: "She takes doesn't."
  },
  {
    id: "add5-c5-12",
    classLevel: "5",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Choose the correct prefix to make the opposite of \"kind\".",
    options: ["un-","dis-","in-","im-"],
    correctAnswer: "un-",
    explanation: "The opposite of kind is unkind.",
    hint: "Prefix un-."
  },
  {
    id: "add5-c5-13",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"The house was built ___ bricks and mortar.\"",
    options: ["with","by","of","from"],
    correctAnswer: "with",
    explanation: "Building materials used as tools take \"with\".",
    hint: "Materials used."
  },
  {
    id: "add5-c5-14",
    classLevel: "5",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Select the correct passive voice: \"The girl drew a picture.\"",
    options: ["A picture was drawn by the girl.","A picture is drawn by girl.","A picture had drawn by girl.","The girl was drawn picture."],
    correctAnswer: "A picture was drawn by the girl.",
    explanation: "Simple past passive: Object + was + past participle (drawn) + by + Subject.",
    hint: "was + V3."
  },
  {
    id: "add5-c5-15",
    classLevel: "5",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Choose the idiom meaning \"very rare\":",
    options: ["Once in a blue moon","A piece of cake","Break a leg","Spill the beans"],
    correctAnswer: "Once in a blue moon",
    explanation: "\"Once in a blue moon\" means extremely rarely.",
    hint: "Blue moon phrase."
  },
  {
    id: "add5-c5-16",
    classLevel: "5",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"Bread and butter ___ his favorite breakfast.\"",
    options: ["is","are","were","have been"],
    correctAnswer: "is",
    explanation: "When two items express a single idea/food item, a singular verb \"is\" is used.",
    hint: "Single combined food item."
  },
  {
    id: "add5-c5-17",
    classLevel: "5",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the demonstrative pronoun in: \"These are fresh apples.\"",
    options: ["These","are","fresh","apples"],
    correctAnswer: "These",
    explanation: "\"These\" points out specific plural items nearby.",
    hint: "Demonstrative word."
  },
  {
    id: "add5-c5-18",
    classLevel: "5",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Select the adverb of frequency: \"He always arrives on time.\"",
    options: ["always","time","arrives","on"],
    correctAnswer: "always",
    explanation: "\"Always\" answers how often (frequency) an action occurs.",
    hint: "Tells how often."
  },
  {
    id: "add5-c5-19",
    classLevel: "5",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Choose the correct suffix for \"child\" to form an adjective:",
    options: ["-ish","-ment","-ness","-ful"],
    correctAnswer: "-ish",
    explanation: "Childish is an adjective formed by adding -ish.",
    hint: "Forms childish."
  },
  {
    id: "add5-c5-20",
    classLevel: "5",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the type of sentence: \"What a beautiful painting this is!\"",
    options: ["Exclamatory Sentence","Assertive Sentence","Imperative Sentence","Interrogative Sentence"],
    correctAnswer: "Exclamatory Sentence",
    explanation: "Sentences expressing strong feelings and ending with ! are exclamatory.",
    hint: "Expresses emotion with !."
  },
  {
    id: "add5-c6-1",
    classLevel: "6",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Choose the correct preposition: \"The manager was annoyed ___ his assistant's negligence.\"",
    options: ["at","with","for","to"],
    correctAnswer: "at",
    explanation: "Annoyed \"at\" something non-human/behavior, but annoyed \"with\" a person.",
    hint: "Annoyed at a situation/negligence."
  },
  {
    id: "add5-c6-2",
    classLevel: "6",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the transitive verb in: \"She bought a new bicycle yesterday.\"",
    options: ["bought","bicycle","yesterday","she"],
    correctAnswer: "bought",
    explanation: "\"Bought\" takes a direct object (\"a new bicycle\"), so it is transitive.",
    hint: "Verb taking a direct object."
  },
  {
    id: "add5-c6-3",
    classLevel: "6",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Select the correct modal for ability in past: \"When he was young, he ___ run five miles without stopping.\"",
    options: ["could","can","should","might"],
    correctAnswer: "could",
    explanation: "\"Could\" expresses past ability.",
    hint: "Past ability."
  },
  {
    id: "add5-c6-4",
    classLevel: "6",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"One of my friends ___ moving to Canada next week.\"",
    options: ["is","are","were","have been"],
    correctAnswer: "is",
    explanation: "The subject \"One\" is singular, so it takes singular verb \"is\".",
    hint: "Subject is \"One\"."
  },
  {
    id: "add5-c6-5",
    classLevel: "6",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Choose the correct reported speech: She said, \"I am reading a novel.\"",
    options: ["She said that she was reading a novel.","She said that she is reading a novel.","She told she read a novel.","She says that she was reading."],
    correctAnswer: "She said that she was reading a novel.",
    explanation: "Present continuous (\"am reading\") changes to past continuous (\"was reading\").",
    hint: "am reading -> was reading."
  },
  {
    id: "add5-c6-6",
    classLevel: "6",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the material noun: \"The ring is made of pure gold.\"",
    options: ["gold","ring","pure","made"],
    correctAnswer: "gold",
    explanation: "\"Gold\" is a substance/material used to make things.",
    hint: "A physical substance."
  },
  {
    id: "add5-c6-7",
    classLevel: "6",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Select the correct relative pronoun: \"The book ___ you gave me was very interesting.\"",
    options: ["which","who","whose","whom"],
    correctAnswer: "which",
    explanation: "Use \"which\" or \"that\" as relative pronoun for non-human objects.",
    hint: "Relative pronoun for objects."
  },
  {
    id: "add5-c6-8",
    classLevel: "6",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Choose the passive voice of: \"Someone stole my bicycle.\"",
    options: ["My bicycle was stolen.","My bicycle is stolen.","Someone was stolen bicycle.","My bicycle has stolen."],
    correctAnswer: "My bicycle was stolen.",
    explanation: "Indefinite agent \"Someone\" is omitted in passive voice: \"My bicycle was stolen.\"",
    hint: "Simple past passive without agent."
  },
  {
    id: "add5-c6-9",
    classLevel: "6",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Identify the type of phrase in italics: \"He walked *with great speed*.\"",
    options: ["Adverb Phrase","Adjective Phrase","Noun Phrase","Prepositional Verb"],
    correctAnswer: "Adverb Phrase",
    explanation: "\"With great speed\" modifies the verb \"walked\", describing how he walked.",
    hint: "Modifies verb walked."
  },
  {
    id: "add5-c6-10",
    classLevel: "6",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"___ you work hard, you will not succeed.\"",
    options: ["Unless","If","Although","Because"],
    correctAnswer: "Unless",
    explanation: "\"Unless\" means \"If ... not\".",
    hint: "Negative condition."
  },
  {
    id: "add5-c6-11",
    classLevel: "6",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Select the superlative form of \"far\" for distance:",
    options: ["farthest","further","farther","furthest"],
    correctAnswer: "farthest",
    explanation: "Farthest refers strictly to physical distance.",
    hint: "Physical distance superlative."
  },
  {
    id: "add5-c6-12",
    classLevel: "6",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Identify the error in: \"He is superior than me in service.\"",
    options: ["than -> to","me -> I","is -> was","in -> on"],
    correctAnswer: "than -> to",
    explanation: "Latin comparative adjectives like superior take \"to\" instead of \"than\".",
    hint: "Superior takes \"to\"."
  },
  {
    id: "add5-c6-13",
    classLevel: "6",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Choose the correct punctuation: \"alok, rita and sumit are friends\"",
    options: ["Alok, Rita, and Sumit are friends.","alok, Rita and sumit are friends.","Alok Rita and Sumit are friends","Alok, rita and Sumit are friends."],
    correctAnswer: "Alok, Rita, and Sumit are friends.",
    explanation: "Capitalize proper names and end with full stop.",
    hint: "Proper names capitalized."
  },
  {
    id: "add5-c6-14",
    classLevel: "6",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"The train had left before we ___ the station.\"",
    options: ["reached","had reached","reach","was reaching"],
    correctAnswer: "reached",
    explanation: "Past perfect (\"had left\") is paired with simple past (\"reached\").",
    hint: "Simple past after before."
  },
  {
    id: "add5-c6-15",
    classLevel: "6",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Select the correct collective noun: \"A ___ of wolves surrounded the camp.\"",
    options: ["pack","herd","flock","swarm"],
    correctAnswer: "pack",
    explanation: "Group of wolves is called a \"pack\".",
    hint: "Group of wolves."
  },
  {
    id: "add5-c6-16",
    classLevel: "6",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Identify the auxiliary verb in: \"They have been waiting for two hours.\"",
    options: ["have","waiting","two","for"],
    correctAnswer: "have",
    explanation: "\"Have\" acts as primary helping/auxiliary verb.",
    hint: "Helping verb."
  },
  {
    id: "add5-c6-17",
    classLevel: "6",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Choose the antonym of \"ancient\":",
    options: ["modern","old","historic","antique"],
    correctAnswer: "modern",
    explanation: "Ancient means belonging to the distant past; modern is the opposite.",
    hint: "Opposite of ancient."
  },
  {
    id: "add5-c6-18",
    classLevel: "6",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"He spoke as if he ___ everything.\"",
    options: ["knew","knows","has known","is knowing"],
    correctAnswer: "knew",
    explanation: "Unreal/hypothetical clause introduced by \"as if\" takes simple past tense (\"knew\").",
    hint: "Hypothetical past tense."
  },
  {
    id: "add5-c6-19",
    classLevel: "6",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Select the sentence with correct word order:",
    options: ["She rarely comes here on Sundays.","She comes rarely here on Sundays.","Rarely she on Sundays comes here.","Here she comes on Sundays rarely."],
    correctAnswer: "She rarely comes here on Sundays.",
    explanation: "Adverbs of frequency go before the main verb.",
    hint: "Frequency adverb before main verb."
  },
  {
    id: "add5-c6-20",
    classLevel: "6",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Identify the participle in: \"The barking dog kept everyone awake.\"",
    options: ["barking","dog","kept","awake"],
    correctAnswer: "barking",
    explanation: "\"Barking\" is a present participle functioning as an adjective modifying \"dog\".",
    hint: "-ing word modifying noun."
  },
  {
    id: "add5-c7-1",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in editing: \"Every student must submit their project on Monday.\"",
    options: ["their -> his/her","submit -> submitting","on -> at","must -> should"],
    correctAnswer: "their -> his/her",
    explanation: "Singular indefinite pronoun \"Every student\" requires singular possessive \"his/her\".",
    hint: "Singular subject requires singular pronoun."
  },
  {
    id: "add5-c7-2",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank with appropriate preposition: \"The criminal was charged ___ murder.\"",
    options: ["with","of","for","by"],
    correctAnswer: "with",
    explanation: "Correct idiom is \"charged with\" a crime.",
    hint: "Charged + with."
  },
  {
    id: "add5-c7-3",
    classLevel: "7",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to reported speech: He asked, \"Where do you live?\"",
    options: ["He asked where I lived.","He asked where do I live.","He asked where I am living.","He told where I live."],
    correctAnswer: "He asked where I lived.",
    explanation: "Wh- question retains wh- word, subject comes before verb, tense shifts to simple past.",
    hint: "Question word + Subject + Past verb."
  },
  {
    id: "add5-c7-4",
    classLevel: "7",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct tense: \"By next year, I ___ my graduation.\"",
    options: ["will have completed","completed","have completed","will complete"],
    correctAnswer: "will have completed",
    explanation: "Action completed before a future deadline takes Future Perfect tense (\"will have completed\").",
    hint: "Future Perfect tense."
  },
  {
    id: "add5-c7-5",
    classLevel: "7",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Select the correct passive voice: \"Who broke this mirror?\"",
    options: ["By whom was this mirror broken?","Who was broken this mirror?","By whom this mirror was broken?","By who mirror broke?"],
    correctAnswer: "By whom was this mirror broken?",
    explanation: "Questions with \"Who\" change to \"By whom + aux + object + V3\".",
    hint: "By whom + auxiliary + subject + V3."
  },
  {
    id: "add5-c7-6",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the clause in italics: \"I know the place *where he was born*.\"",
    options: ["Adjective Clause","Noun Clause","Adverb Clause","Prepositional Clause"],
    correctAnswer: "Adjective Clause",
    explanation: "\"Where he was born\" modifies the noun \"place\", making it an Adjective Clause.",
    hint: "Modifies the noun place."
  },
  {
    id: "add5-c7-7",
    classLevel: "7",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Choose the correct modal verb for obligation: \"Candidates ___ answer all questions.\"",
    options: ["must","may","could","might"],
    correctAnswer: "must",
    explanation: "\"Must\" expresses strict obligation or rule.",
    hint: "Strict rule/requirement."
  },
  {
    id: "add5-c7-8",
    classLevel: "7",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Not only the teacher but also the students ___ present.\"",
    options: ["were","was","is","has been"],
    correctAnswer: "were",
    explanation: "In \"Not only ... but also\", verb agrees with closer subject (\"students\" - plural).",
    hint: "Agrees with nearer subject."
  },
  {
    id: "add5-c7-9",
    classLevel: "7",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the gerund in: \"Swimming is good exercise for health.\"",
    options: ["Swimming","exercise","health","is"],
    correctAnswer: "Swimming",
    explanation: "\"Swimming\" is a verb form ending in -ing acting as a noun subject.",
    hint: "Verb + ing functioning as noun."
  },
  {
    id: "add5-c7-10",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Select the synonym of \"meticulous\":",
    options: ["careful","careless","hasty","lazy"],
    correctAnswer: "careful",
    explanation: "Meticulous means paying great attention to detail, very careful.",
    hint: "Very careful and precise."
  },
  {
    id: "add5-c7-11",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Choose the correct phrase: \"He is addicted ___ computer games.\"",
    options: ["to","with","for","in"],
    correctAnswer: "to",
    explanation: "Correct preposition after addicted is \"to\".",
    hint: "Addicted + to."
  },
  {
    id: "add5-c7-12",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"If it rains, we ___ cancel the picnic.\"",
    options: ["will","would have","had","were"],
    correctAnswer: "will",
    explanation: "First conditional: Simple present in if-clause + \"will\" + base verb.",
    hint: "First conditional result."
  },
  {
    id: "add5-c7-13",
    classLevel: "7",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the sentence structure: \"Although he was tired, he kept working, and he finished the report.\"",
    options: ["Compound-Complex Sentence","Complex Sentence","Compound Sentence","Simple Sentence"],
    correctAnswer: "Compound-Complex Sentence",
    explanation: "Contains at least two independent clauses and one dependent clause.",
    hint: "Multiple main clauses + dependent clause."
  },
  {
    id: "add5-c7-14",
    classLevel: "7",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Select the correct determiner: \"There is ___ hope left for his recovery.\"",
    options: ["little","few","a few","many"],
    correctAnswer: "little",
    explanation: "\"Little\" is used with uncountable nouns (\"hope\") to mean almost none.",
    hint: "Uncountable negative determiner."
  },
  {
    id: "add5-c7-15",
    classLevel: "7",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Choose the proper reported command: The officer said, \"Halt!\"",
    options: ["The officer commanded them to halt.","The officer said that halt.","The officer told them halt.","The officer asked to halt."],
    correctAnswer: "The officer commanded them to halt.",
    explanation: "Imperative command changes to \"commanded + object + to + base verb\".",
    hint: "Commanded + to + verb."
  },
  {
    id: "add5-c7-16",
    classLevel: "7",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the part of speech of \"fast\" in: \"He runs fast.\"",
    options: ["Adverb","Adjective","Noun","Verb"],
    correctAnswer: "Adverb",
    explanation: "\"Fast\" modifies the verb \"runs\", so it functions as an adverb.",
    hint: "Modifies verb runs."
  },
  {
    id: "add5-c7-17",
    classLevel: "7",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"The box was ___ heavy for the child to lift.\"",
    options: ["too","so","very","much"],
    correctAnswer: "too",
    explanation: "Structure \"too + adjective + for someone to do\" expresses excessive degree.",
    hint: "too ... to structure."
  },
  {
    id: "add5-c7-18",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error: \"He enjoys to play football on weekends.\"",
    options: ["to play -> playing","enjoys -> enjoy","on -> in","weekends -> weekend"],
    correctAnswer: "to play -> playing",
    explanation: "The verb \"enjoy\" is followed by a gerund (\"playing\"), not an infinitive.",
    hint: "Enjoy takes gerund (-ing)."
  },
  {
    id: "add5-c7-19",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Select the correct idiom meaning \"to fail completely\":",
    options: ["Bite the dust","Spill the tea","Burn midnight oil","Hit the nail on head"],
    correctAnswer: "Bite the dust",
    explanation: "\"Bite the dust\" means to fail or be defeated completely.",
    hint: "To fall or be defeated."
  },
  {
    id: "add5-c7-20",
    classLevel: "7",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"She insisted ___ paying the restaurant bill.\"",
    options: ["on","at","in","for"],
    correctAnswer: "on",
    explanation: "Insist takes the preposition \"on\" followed by a gerund.",
    hint: "Insist + on."
  },
  {
    id: "add5-c8-1",
    classLevel: "8",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Choose the correct option for subject-verb agreement: \"A pair of scissors ___ on the table.\"",
    options: ["is","are","were","have been"],
    correctAnswer: "is",
    explanation: "\"A pair of...\" is a singular noun subject, taking singular verb \"is\".",
    hint: "Subject is \"A pair\"."
  },
  {
    id: "add5-c8-2",
    classLevel: "8",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to Indirect Speech: Rohan said to me, \"Will you help me tomorrow?\"",
    options: ["Rohan asked me if I would help him the next day.","Rohan asked me will I help him tomorrow.","Rohan told me if I will help him next day.","Rohan asked that would I help him."],
    correctAnswer: "Rohan asked me if I would help him the next day.",
    explanation: "Yes/no question uses \"if/whether\", will -> would, tomorrow -> the next day.",
    hint: "if + subject + would + next day."
  },
  {
    id: "add5-c8-3",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in: \"If I was a king, I would help the poor.\"",
    options: ["was -> were","a -> the","would -> will","king -> kings"],
    correctAnswer: "was -> were",
    explanation: "Unreal/hypothetical condition requires subjunctive mood \"were\".",
    hint: "Hypothetical if uses were."
  },
  {
    id: "add5-c8-4",
    classLevel: "8",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice: \"People say that honesty always pays.\"",
    options: ["It is said that honesty always pays.","Honesty always pays is said by people.","People are said that honesty pays.","Honesty was said by people."],
    correctAnswer: "It is said that honesty always pays.",
    explanation: "Sentences starting with \"People say\" turn into \"It is said that...\" in passive voice.",
    hint: "It is said that..."
  },
  {
    id: "add5-c8-5",
    classLevel: "8",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"He behaves as though he ___ the owner of the firm.\"",
    options: ["were","is","was","has been"],
    correctAnswer: "were",
    explanation: "Hypothetical comparison after \"as though\" uses subjunctive \"were\".",
    hint: "Subjunctive form after as though."
  },
  {
    id: "add5-c8-6",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the adjective clause in: \"The boy who won the medal is my neighbour.\"",
    options: ["who won the medal","is my neighbour","The boy","won the medal is"],
    correctAnswer: "who won the medal",
    explanation: "\"who won the medal\" is a relative clause modifying \"the boy\".",
    hint: "Relative clause starting with who."
  },
  {
    id: "add5-c8-7",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Choose the correct phrasal verb: \"The firemen managed to ___ the fire.\"",
    options: ["put out","put off","put on","put down"],
    correctAnswer: "put out",
    explanation: "\"Put out\" means extinguish a fire.",
    hint: "Extinguish."
  },
  {
    id: "add5-c8-8",
    classLevel: "8",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Scarcely had he stepped out ___ it started raining.\"",
    options: ["when","than","then","before"],
    correctAnswer: "when",
    explanation: "Correlative conjunction pair is \"Scarcely had ... when\".",
    hint: "Scarcely pairs with when."
  },
  {
    id: "add5-c8-9",
    classLevel: "8",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Identify the type of sentence: \"Listen carefully, or you will miss the instructions.\"",
    options: ["Compound Sentence","Simple Sentence","Complex Sentence","Exclamatory Sentence"],
    correctAnswer: "Compound Sentence",
    explanation: "Two independent clauses connected by coordinating conjunction \"or\".",
    hint: "Coordinating conjunction \"or\"."
  },
  {
    id: "add5-c8-10",
    classLevel: "8",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct tense: \"I ___ this book for three hours now.\"",
    options: ["have been reading","am reading","read","was reading"],
    correctAnswer: "have been reading",
    explanation: "Action started in past and continuing till now takes Present Perfect Continuous (\"have been reading\").",
    hint: "for three hours now."
  },
  {
    id: "add5-c8-11",
    classLevel: "8",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Select the appropriate preposition: \"He died ___ malaria.\"",
    options: ["of","from","with","by"],
    correctAnswer: "of",
    explanation: "Die \"of\" a disease (malaria), but die \"from\" an external cause/wound.",
    hint: "Die of a disease."
  },
  {
    id: "add5-c8-12",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the correct edit: \"No sooner did he see the tiger then he ran away.\"",
    options: ["then -> than","did -> had","ran -> run","away -> off"],
    correctAnswer: "then -> than",
    explanation: "Correlative pair is \"No sooner ... than\" (not \"then\").",
    hint: "No sooner takes than."
  },
  {
    id: "add5-c8-13",
    classLevel: "8",
    topic: "Nouns & Pronouns",
    difficulty: "Hard",
    questionText: "Choose the correct pronoun: \"Let you and ___ solve this puzzle.\"",
    options: ["me","I","myself","we"],
    correctAnswer: "me",
    explanation: "The verb/preposition \"let\" takes object pronoun \"me\".",
    hint: "Let takes objective case."
  },
  {
    id: "add5-c8-14",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Select the antonym of \"obstinate\":",
    options: ["flexible","stubborn","rigid","firm"],
    correctAnswer: "flexible",
    explanation: "Obstinate means stubborn/rigid; flexible is the antonym.",
    hint: "Opposite of stubborn."
  },
  {
    id: "add5-c8-15",
    classLevel: "8",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the blank with modal verb: \"Walk carefully lest you ___ stumble.\"",
    options: ["should","might","would","could"],
    correctAnswer: "should",
    explanation: "Conjunction \"lest\" is always followed by modal verb \"should\".",
    hint: "Lest takes should."
  },
  {
    id: "add5-c8-16",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the participle phrase: \"Having completed his homework, Aryan went out to play.\"",
    options: ["Having completed his homework","Aryan went out","went out to play","completed his homework"],
    correctAnswer: "Having completed his homework",
    explanation: "\"Having completed his homework\" is a perfect participle phrase.",
    hint: "Perfect participle phrase."
  },
  {
    id: "add5-c8-17",
    classLevel: "8",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Choose the passive voice of: \"Don't insult the poor.\"",
    options: ["Let the poor not be insulted.","The poor must not insult.","Poor should not insult.","Don't let poor insulted."],
    correctAnswer: "Let the poor not be insulted.",
    explanation: "Negative imperative passive: \"Let + object + not + be + V3\".",
    hint: "Let ... not be V3."
  },
  {
    id: "add5-c8-18",
    classLevel: "8",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Fill in the blank: \"The news ___ true.\"",
    options: ["is","are","were","have been"],
    correctAnswer: "is",
    explanation: "\"News\" is an uncountable noun taking singular verb \"is\".",
    hint: "Uncountable singular noun."
  },
  {
    id: "add5-c8-19",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in omission: \"He is senior than all his colleagues.\"",
    options: ["than -> to","senior -> more senior","colleagues -> colleague","his -> him"],
    correctAnswer: "than -> to",
    explanation: "Adjectives like senior, junior, superior take \"to\" instead of \"than\".",
    hint: "Senior takes to."
  },
  {
    id: "add5-c8-20",
    classLevel: "8",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Choose the correct word: \"His explanation was completely ___.\"",
    options: ["comprehensible","comprehend","comprehension","comprehensively"],
    correctAnswer: "comprehensible",
    explanation: "Adjective \"comprehensible\" fits after linking verb was + adverb completely.",
    hint: "Adjective meaning understandable."
  },
  {
    id: "add5-c9-1",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the correct error correction: \"The furniture in these rooms are antique.\"",
    options: ["are -> is","rooms -> room","furniture -> furnitures","antique -> antiques"],
    correctAnswer: "are -> is",
    explanation: "Uncountable noun \"Furniture\" is singular and takes singular verb \"is\".",
    hint: "Furniture is uncountable."
  },
  {
    id: "add5-c9-2",
    classLevel: "9",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to indirect speech: The guide said, \"Do not touch the exhibits.\"",
    options: ["The guide instructed us not to touch the exhibits.","The guide said to us don't touch exhibits.","The guide told that do not touch.","The guide asked not touching exhibits."],
    correctAnswer: "The guide instructed us not to touch the exhibits.",
    explanation: "Negative imperative command turns into \"instructed/ordered + object + not to + base verb\".",
    hint: "instructed + not to + verb."
  },
  {
    id: "add5-c9-3",
    classLevel: "9",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Select the passive voice: \"They are constructing a new bridge across the river.\"",
    options: ["A new bridge is being constructed across the river.","A new bridge was constructed across river.","A new bridge has been constructed.","A bridge is constructing by them."],
    correctAnswer: "A new bridge is being constructed across the river.",
    explanation: "Present continuous passive: Object + is being + past participle (constructed).",
    hint: "is being + V3."
  },
  {
    id: "add5-c9-4",
    classLevel: "9",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Neither of the proposals ___ acceptable to the board.\"",
    options: ["is","are","were","have been"],
    correctAnswer: "is",
    explanation: "\"Neither\" as subject refers to \"not one\" and takes singular verb \"is\".",
    hint: "Neither is singular."
  },
  {
    id: "add5-c9-5",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the non-finite verb: \"I saw a man carrying a heavy sack.\"",
    options: ["carrying","saw","man","heavy"],
    correctAnswer: "carrying",
    explanation: "\"Carrying\" is a present participle acting as a non-finite verb.",
    hint: "Participle functioning non-finitely."
  },
  {
    id: "add5-c9-6",
    classLevel: "9",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Choose the correct preposition: \"She is proficient ___ three foreign languages.\"",
    options: ["in","at","with","on"],
    correctAnswer: "in",
    explanation: "Proficient takes preposition \"in\".",
    hint: "Proficient in something."
  },
  {
    id: "add5-c9-7",
    classLevel: "9",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Hardly had the bell rung ___ the students rushed out.\"",
    options: ["when","than","then","as"],
    correctAnswer: "when",
    explanation: "Correlative pair is \"Hardly ... when\".",
    hint: "Hardly pairs with when."
  },
  {
    id: "add5-c9-8",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Select the correct edit: \"He gave me many advices regarding career options.\"",
    options: ["advices -> pieces of advice","many -> much","options -> option","gave -> gives"],
    correctAnswer: "advices -> pieces of advice",
    explanation: "Advice is uncountable; use \"pieces of advice\" for plural counting.",
    hint: "Advice is uncountable."
  },
  {
    id: "add5-c9-9",
    classLevel: "9",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to active voice: \"The letter was sent by the secretary yesterday.\"",
    options: ["The secretary sent the letter yesterday.","The secretary was sending letter.","Secretary has sent letter.","The letter sent secretary."],
    correctAnswer: "The secretary sent the letter yesterday.",
    explanation: "Simple past active: Subject (secretary) + past verb (sent) + object (letter).",
    hint: "Subject + V2 + Object."
  },
  {
    id: "add5-c9-10",
    classLevel: "9",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Choose the correct modal verb: \"You ___ not worry; everything is under control.\"",
    options: ["need","must","should","would"],
    correctAnswer: "need",
    explanation: "\"Need not\" expresses absence of obligation or necessity.",
    hint: "Need not = no obligation."
  },
  {
    id: "add5-c9-11",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the type of subordinate clause: \"He spoke so fast that nobody could understand him.\"",
    options: ["Adverb Clause of Result","Adjective Clause","Noun Clause","Adverb Clause of Condition"],
    correctAnswer: "Adverb Clause of Result",
    explanation: "\"that nobody could understand him\" shows the result of speaking so fast.",
    hint: "Expresses result after so...that."
  },
  {
    id: "add5-c9-12",
    classLevel: "9",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"The jury ___ divided in their opinions.\"",
    options: ["were","was","is","has been"],
    correctAnswer: "were",
    explanation: "When collective noun members act individually or disagree, plural verb \"were\" is used.",
    hint: "Divided members take plural verb."
  },
  {
    id: "add5-c9-13",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Choose the antonym of \"authentic\":",
    options: ["spurious","genuine","real","original"],
    correctAnswer: "spurious",
    explanation: "Authentic means real/genuine; spurious means fake/false.",
    hint: "Means fake or unauthentic."
  },
  {
    id: "add5-c9-14",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error: \"I prefer coffee than tea in the morning.\"",
    options: ["than -> to","prefer -> preferred","in -> at","coffee -> a coffee"],
    correctAnswer: "than -> to",
    explanation: "Verb \"prefer\" takes preposition \"to\" (prefer X to Y).",
    hint: "Prefer X to Y."
  },
  {
    id: "add5-c9-15",
    classLevel: "9",
    topic: "Articles (A, An, The)",
    difficulty: "Medium",
    questionText: "Select the correct determiner: \"Could you please lend me ___ money?\"",
    options: ["some","any","few","many"],
    correctAnswer: "some",
    explanation: "Polite requests expecting a yes response use \"some\".",
    hint: "Polite request uses some."
  },
  {
    id: "add5-c9-16",
    classLevel: "9",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"The river has ___ its banks after heavy rain.\"",
    options: ["overflowed","overflown","overflows","overflowing"],
    correctAnswer: "overflowed",
    explanation: "Past participle of overflow is \"overflowed\" (not overflown).",
    hint: "Past participle of overflow."
  },
  {
    id: "add5-c9-17",
    classLevel: "9",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Choose the correct reported question: She asked me, \"How long have you been waiting?\"",
    options: ["She asked me how long I had been waiting.","She asked me how long have I been waiting.","She asked me how long was I waiting.","She told me how long I waited."],
    correctAnswer: "She asked me how long I had been waiting.",
    explanation: "Present perfect continuous (\"have been waiting\") becomes past perfect continuous (\"had been waiting\").",
    hint: "have been -> had been."
  },
  {
    id: "add5-c9-18",
    classLevel: "9",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Identify the phrasal verb meaning \"to cancel an event\":",
    options: ["Call off","Call on","Call for","Call up"],
    correctAnswer: "Call off",
    explanation: "\"Call off\" means cancel.",
    hint: "Means cancel."
  },
  {
    id: "add5-c9-19",
    classLevel: "9",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Three-fourths of the task ___ completed.\"",
    options: ["has been","have been","were","are"],
    correctAnswer: "has been",
    explanation: "Fraction of a singular uncountable noun (\"the task\") takes singular verb \"has been\".",
    hint: "Fraction of singular task."
  },
  {
    id: "add5-c9-20",
    classLevel: "9",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Medium",
    questionText: "Choose the correct punctuation: \"it is a well known fact that practice makes perfect\"",
    options: ["It is a well-known fact that practice makes perfect.","it is a well-known fact that practice makes perfect","It is a well known fact that practice makes perfect?","It is a well-known fact, that practice makes perfect."],
    correctAnswer: "It is a well-known fact that practice makes perfect.",
    explanation: "Hyphenate compound modifier \"well-known\", capitalize \"It\", end with full stop.",
    hint: "Hyphenated compound adjective."
  },
  {
    id: "add5-c10-1",
    classLevel: "10",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Identify the error in the sentence: \"The committee have submitted its report to the ministry.\"",
    options: ["have -> has","its -> their","submitted -> submitting","to -> in"],
    correctAnswer: "have -> has",
    explanation: "Collective noun acting as a single unit with singular pronoun \"its\" requires singular verb \"has\".",
    hint: "Collective unit takes singular verb."
  },
  {
    id: "add5-c10-2",
    classLevel: "10",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Fill in the blank with correct tense: \"By November, the team ___ on this research project for two years.\"",
    options: ["will have been working","will work","is working","has worked"],
    correctAnswer: "will have been working",
    explanation: "Duration extending up to a future point requires Future Perfect Continuous tense.",
    hint: "Future Perfect Continuous."
  },
  {
    id: "add5-c10-3",
    classLevel: "10",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to Indirect Speech: The judge said, \"Call the first witness.\"",
    options: ["The judge ordered them to call the first witness.","The judge said to call the first witness.","The judge told that call first witness.","The judge asked call the witness."],
    correctAnswer: "The judge ordered them to call the first witness.",
    explanation: "Official command changes to \"ordered + object + to + base verb\".",
    hint: "Ordered + to + verb."
  },
  {
    id: "add5-c10-4",
    classLevel: "10",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Choose the correct Passive Voice: \"Why did your brother write such a harsh letter?\"",
    options: ["Why was such a harsh letter written by your brother?","Why such a harsh letter was written by your brother?","Why did a harsh letter written by brother?","Why was brother written such letter?"],
    correctAnswer: "Why was such a harsh letter written by your brother?",
    explanation: "Interrogative simple past passive: Why + was + object + V3 + by + agent.",
    hint: "Why + was + object + V3."
  },
  {
    id: "add5-c10-5",
    classLevel: "10",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Select the correct preposition: \"He is blind ___ his own shortcomings.\"",
    options: ["to","of","in","with"],
    correctAnswer: "to",
    explanation: "\"Blind to\" means unwilling to notice or acknowledge.",
    hint: "Blind to faults."
  },
  {
    id: "add5-c10-6",
    classLevel: "10",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"No sooner had the doctor arrived ___ the patient breathed his last.\"",
    options: ["than","then","when","before"],
    correctAnswer: "than",
    explanation: "No sooner is strictly paired with \"than\".",
    hint: "No sooner takes than."
  },
  {
    id: "add5-c10-7",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the correct editing option: \"Each of the candidates were interviewed individually.\"",
    options: ["were -> was","candidates -> candidate","individually -> individual","interviewed -> interviewing"],
    correctAnswer: "were -> was",
    explanation: "Subject \"Each\" is singular and requires singular verb \"was\".",
    hint: "Each is singular."
  },
  {
    id: "add5-c10-8",
    classLevel: "10",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Choose the correct modal expression: \"She ___ have caught the flight if she had left on time.\"",
    options: ["would","will","can","should"],
    correctAnswer: "would",
    explanation: "Third conditional result clause uses \"would have + V3\".",
    hint: "Third conditional result."
  },
  {
    id: "add5-c10-9",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the function of the infinitive: \"To err is human, to forgive divine.\"",
    options: ["Subject of the verb","Direct object","Adverbial modifier","Complement of adjective"],
    correctAnswer: "Subject of the verb",
    explanation: "The infinitives \"To err\" and \"to forgive\" act as noun subjects of the sentences.",
    hint: "Functions as subject."
  },
  {
    id: "add5-c10-10",
    classLevel: "10",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"The police ___ investigating the cyber fraud.\"",
    options: ["are","is","was","has been"],
    correctAnswer: "are",
    explanation: "\"Police\" is a plural collective noun requiring plural verb \"are\".",
    hint: "Police takes plural verb."
  },
  {
    id: "add5-c10-11",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Select the synonym of \"lucid\":",
    options: ["clear","vague","confusing","dark"],
    correctAnswer: "clear",
    explanation: "Lucid means clear, easily understood.",
    hint: "Clear and understandable."
  },
  {
    id: "add5-c10-12",
    classLevel: "10",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Choose the correct active voice: \"The bridge was destroyed by the torrential floods.\"",
    options: ["The torrential floods destroyed the bridge.","The torrential floods were destroying the bridge.","Torrential floods destroy bridge.","The bridge destroyed torrential floods."],
    correctAnswer: "The torrential floods destroyed the bridge.",
    explanation: "Simple past active: Subject (floods) + V2 (destroyed) + Object (bridge).",
    hint: "Subject + V2 + Object."
  },
  {
    id: "add5-c10-13",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in preposition: \"The boy resemblance with his grandfather.\"",
    options: ["resemblance with -> resembles","his -> him","grandfather -> grandfathers","boy -> boys"],
    correctAnswer: "resemblance with -> resembles",
    explanation: "Verb \"resembles\" is transitive and takes no preposition.",
    hint: "Resembles takes no preposition."
  },
  {
    id: "add5-c10-14",
    classLevel: "10",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"She succeeded by dint ___ sheer perseverance.\"",
    options: ["of","by","with","for"],
    correctAnswer: "of",
    explanation: "Idiomatic prepositional phrase is \"by dint of\".",
    hint: "By dint + of."
  },
  {
    id: "add5-c10-15",
    classLevel: "10",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert to direct speech: He exclaimed with joy that they had won the championship.",
    options: ["He said, \"Hurrah! We have won the championship.\"","He said, \"Alas! We won championship.\"","He told, \"We win championship.\"","He exclaimed, \"We won the championship!\""],
    correctAnswer: "He said, \"Hurrah! We have won the championship.\"",
    explanation: "Exclaimed with joy changes back to interjection \"Hurrah!\" + Present Perfect.",
    hint: "Hurrah! for joy."
  },
  {
    id: "add5-c10-16",
    classLevel: "10",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Select the correct option for condition: \"Had I known about the meeting, I ___ attended it.\"",
    options: ["would have","will have","would","had"],
    correctAnswer: "would have",
    explanation: "Inverted third conditional \"Had I known...\" takes \"would have + V3\" in result clause.",
    hint: "Had + V3 takes would have."
  },
  {
    id: "add5-c10-17",
    classLevel: "10",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Identify the error: \"Ten miles are a long distance to cover on foot.\"",
    options: ["are -> is","miles -> mile","on -> by","long -> longer"],
    correctAnswer: "are -> is",
    explanation: "Specific quantity or distance (\"Ten miles\") treated as a single unit takes singular verb \"is\".",
    hint: "Distance as single unit is singular."
  },
  {
    id: "add5-c10-18",
    classLevel: "10",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"The meeting was postponed ___ bad weather.\"",
    options: ["owing to","because","despite","in spite"],
    correctAnswer: "owing to",
    explanation: "Prepositional phrase \"owing to\" acts as adjective/adverb meaning because of.",
    hint: "Prepositional phrase meaning because of."
  },
  {
    id: "add5-c10-19",
    classLevel: "10",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Choose the correct figure of speech in: \"The news was a dagger to his heart.\"",
    options: ["Metaphor","Simile","Personification","Hyperbole"],
    correctAnswer: "Metaphor",
    explanation: "Direct implied comparison without using like/as is a Metaphor.",
    hint: "Direct comparison without like/as."
  },
  {
    id: "add5-c10-20",
    classLevel: "10",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Select the correct edit: \"Neither he nor his friends has arrived yet.\"",
    options: ["has -> have","nor -> or","arrived -> arrive","his -> their"],
    correctAnswer: "has -> have",
    explanation: "In \"neither... nor\", verb agrees with closer subject (\"his friends\" - plural).",
    hint: "Agrees with nearer plural subject."
  },
  {
    id: "add5-c11-1",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the grammatical error: \"He prevented me to go to the night show.\"",
    options: ["to go -> from going","me -> I","to -> for","prevented -> prevents"],
    correctAnswer: "to go -> from going",
    explanation: "Verb \"prevent\" takes idiom \"prevent + object + from + gerund\".",
    hint: "Prevent someone from doing."
  },
  {
    id: "add5-c11-2",
    classLevel: "11",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"The manager insisted that the report ___ submitted before noon.\"",
    options: ["be","is","was","should be"],
    correctAnswer: "be",
    explanation: "Mandative subjunctive mood after \"insisted that\" uses bare subjunctive verb \"be\".",
    hint: "Subjunctive bare verb."
  },
  {
    id: "add5-c11-3",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Choose the correct transformation: \"He is too proud to admit his fault.\" (Remove \"too\")",
    options: ["He is so proud that he will not admit his fault.","He is very proud that he admits fault.","He is so proud to admit his fault.","He is proud enough to admit fault."],
    correctAnswer: "He is so proud that he will not admit his fault.",
    explanation: "Removing \"too... to\" converts to \"so... that + subject + cannot/will not + verb\".",
    hint: "so ... that he will not."
  },
  {
    id: "add5-c11-4",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Select the appropriate phrasal verb: \"The negotiation ___ due to lack of trust.\"",
    options: ["broke down","broke up","broke out","broke off"],
    correctAnswer: "broke down",
    explanation: "Break down means fail or collapse (for talks/negotiations).",
    hint: "Collapse or fail."
  },
  {
    id: "add5-c11-5",
    classLevel: "11",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice: \"One should keep one's promises.\"",
    options: ["Promises should be kept.","Promises should keep by one.","One's promises were kept.","One should be kept promises."],
    correctAnswer: "Promises should be kept.",
    explanation: "Impersonal agent \"One/one's\" is dropped: \"Promises should be kept.\"",
    hint: "Promises + should be + V3."
  },
  {
    id: "add5-c11-6",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the clause: \"Whatever you decide will be acceptable to us.\"",
    options: ["Noun Clause acting as Subject","Adjective Clause","Adverb Clause","Prepositional Clause"],
    correctAnswer: "Noun Clause acting as Subject",
    explanation: "\"Whatever you decide\" acts as noun subject of the main verb \"will be\".",
    hint: "Clause acting as subject."
  },
  {
    id: "add5-c11-7",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Supposing if he fails, what will he do?\" (Identify error)",
    options: ["Remove \"if\" (Supposing and if are redundant)","fails -> fail","do -> done","will -> would"],
    correctAnswer: "Remove \"if\" (Supposing and if are redundant)",
    explanation: "Using \"Supposing\" and \"if\" together is redundant; use one or the other.",
    hint: "Redundancy of supposing and if."
  },
  {
    id: "add5-c11-8",
    classLevel: "11",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Choose the correct indirect speech: \"If I were you, I would accept the job offer,\" said my friend.",
    options: ["My friend advised me to accept the job offer.","My friend said if he was me he would accept.","My friend told that if I were you.","My friend asked me accepting job."],
    correctAnswer: "My friend advised me to accept the job offer.",
    explanation: "Advice expressed in hypothetical conditional indirect speech simplifies to \"advised + object + to + verb\".",
    hint: "Advised + to + verb."
  },
  {
    id: "add5-c11-9",
    classLevel: "11",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"The chief guest, accompanied by his deputies, ___ arrived.\"",
    options: ["has","have","were","are"],
    correctAnswer: "has",
    explanation: "Parenthetical phrases introduced by \"accompanied by\" do not alter singular subject \"The chief guest\".",
    hint: "Accompanied by does not make subject plural."
  },
  {
    id: "add5-c11-10",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the figure of speech in: \"The leaves danced in the autumn wind.\"",
    options: ["Personification","Metaphor","Simile","Oxymoron"],
    correctAnswer: "Personification",
    explanation: "Giving human quality (\"danced\") to inanimate objects (\"leaves\") is Personification.",
    hint: "Human action given to non-human."
  },
  {
    id: "add5-c11-11",
    classLevel: "11",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Choose the correct preposition: \"His opinion is congruent ___ mine.\"",
    options: ["with","to","for","by"],
    correctAnswer: "with",
    explanation: "Congruent takes preposition \"with\".",
    hint: "Congruent + with."
  },
  {
    id: "add5-c11-12",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Not until the lights went out ___ how dark the alley was.\"",
    options: ["did we realize","we realized","we did realize","had we realize"],
    correctAnswer: "did we realize",
    explanation: "Negative introductory phrase \"Not until...\" triggers subject-auxiliary inversion (\"did we realize\").",
    hint: "Inversion after negative adverb."
  },
  {
    id: "add5-c11-13",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Select the antonym of \"ephemeral\":",
    options: ["eternal","transient","fleeting","brief"],
    correctAnswer: "eternal",
    explanation: "Ephemeral means short-lived; eternal means lasting forever.",
    hint: "Lasting forever."
  },
  {
    id: "add5-c11-14",
    classLevel: "11",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error: \"The reason why he failed is because he did not study.\"",
    options: ["because -> that","failed -> fails","study -> studied","why -> when"],
    correctAnswer: "because -> that",
    explanation: "Phrase \"The reason... is\" requires predicate noun clause introduced by \"that\", not \"because\".",
    hint: "The reason why is that."
  },
  {
    id: "add5-c11-15",
    classLevel: "11",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Choose the correct conditional sentence:",
    options: ["If he had trained harder, he would have won the medal.","If he trained harder, he would win medal yesterday.","If he trains harder, he had won.","If he has trained, he won."],
    correctAnswer: "If he had trained harder, he would have won the medal.",
    explanation: "Third conditional: If + past perfect, would have + past participle.",
    hint: "had trained ... would have won."
  },
  {
    id: "add5-c11-16",
    classLevel: "11",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"She is averse ___ taking unnecessary financial risks.\"",
    options: ["to","from","with","at"],
    correctAnswer: "to",
    explanation: "Averse takes preposition \"to\" followed by gerund/noun.",
    hint: "Averse + to."
  },
  {
    id: "add5-c11-17",
    classLevel: "11",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the inversion: \"Scarcely ___ entered the hall when the lights flickered.\"",
    options: ["had she","she had","did she","was she"],
    correctAnswer: "had she",
    explanation: "Scarcely at sentence beginning causes inversion: auxiliary \"had\" before subject \"she\".",
    hint: "Scarcely + had + subject."
  },
  {
    id: "add5-c11-18",
    classLevel: "11",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Active Voice: \"It is expected that the president will inaugurate the summit.\"",
    options: ["People expect the president to inaugurate the summit.","President expects inaugurate summit.","The summit inaugurates president.","Inaugurating summit expected by people."],
    correctAnswer: "People expect the president to inaugurate the summit.",
    explanation: "\"It is expected\" active translation is \"People expect + object + to + verb\".",
    hint: "People expect ... to inaugurate."
  },
  {
    id: "add5-c11-19",
    classLevel: "11",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"He worked hard lest his family ___ suffer.\"",
    options: ["should","would","might","could"],
    correctAnswer: "should",
    explanation: "\"Lest\" is followed by subjunctive modal \"should\".",
    hint: "Lest takes should."
  },
  {
    id: "add5-c11-20",
    classLevel: "11",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Identify the correct usage of subjunctive mood:",
    options: ["I wish I were capable of solving this complex formula.","I wish I was capable of solving.","I wish I am capable.","I wish I will be capable."],
    correctAnswer: "I wish I were capable of solving this complex formula.",
    explanation: "Wish clauses expressing unreal present desires require subjunctive \"were\".",
    hint: "I wish I were..."
  },
  {
    id: "add5-c12-1",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in diction: \"The magistrate acquitted him from all charges.\"",
    options: ["from -> of","acquitted -> acquits","all -> every","charges -> charge"],
    correctAnswer: "from -> of",
    explanation: "Acquit takes preposition \"of\" (acquitted him of all charges).",
    hint: "Acquit + of."
  },
  {
    id: "add5-c12-2",
    classLevel: "12",
    topic: "Verbs & Tenses",
    difficulty: "Hard",
    questionText: "Fill in the blank with subjunctive verb: \"The board recommended that the CEO ___ immediately.\"",
    options: ["resign","resigns","resigned","must resign"],
    correctAnswer: "resign",
    explanation: "Mandative subjunctive after \"recommended that\" uses base form of verb (\"resign\").",
    hint: "Subjunctive base form."
  },
  {
    id: "add5-c12-3",
    classLevel: "12",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Choose the correct indirect speech: \"May God bless you with prosperity!\" said the saint.",
    options: ["The saint prayed that God might bless him with prosperity.","The saint prayed May God bless him.","The saint said that God will bless him.","The saint asked God blessing him."],
    correctAnswer: "The saint prayed that God might bless him with prosperity.",
    explanation: "Optative sentence in reported speech changes to \"prayed that + subject + might + base verb\".",
    hint: "prayed that God might..."
  },
  {
    id: "add5-c12-4",
    classLevel: "12",
    topic: "Adjectives & Adverbs",
    difficulty: "Hard",
    questionText: "Select the correct phrase: \"He succeeded on account of his ___ efforts.\"",
    options: ["assiduous","insidious","acidic","audacious"],
    correctAnswer: "assiduous",
    explanation: "Assiduous means showing great care, attention, and effort.",
    hint: "Meaning diligent/hardworking."
  },
  {
    id: "add5-c12-5",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in structure: \"Not only did he lose his wallet, but also his phone.\"",
    options: ["Not only did he lose his wallet -> He lost not only his wallet","but -> and","lose -> lost","his -> him"],
    correctAnswer: "Not only did he lose his wallet -> He lost not only his wallet",
    explanation: "Parallel structure requires parallel items following \"not only\" and \"but also\" (both noun phrases).",
    hint: "Parallel placement of not only."
  },
  {
    id: "add5-c12-6",
    classLevel: "12",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Passive Voice: \"Who taught you advanced quantum physics?\"",
    options: ["By whom were you taught advanced quantum physics?","By who you were taught physics?","Who was taught you physics?","By whom quantum physics taught?"],
    correctAnswer: "By whom were you taught advanced quantum physics?",
    explanation: "Who -> By whom + auxiliary (were) + subject (you) + V3 (taught).",
    hint: "By whom were you taught..."
  },
  {
    id: "add5-c12-7",
    classLevel: "12",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"He spoke with such eloquence ___ everyone was mesmerized.\"",
    options: ["that","as","so","which"],
    correctAnswer: "that",
    explanation: "Correlative pair \"such + noun + that + clause\" shows result.",
    hint: "such ... that."
  },
  {
    id: "add5-c12-8",
    classLevel: "12",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Select the correct prepositional idiom: \"In accordance ___ statutory regulations, the factory was inspected.\"",
    options: ["with","to","for","by"],
    correctAnswer: "with",
    explanation: "Correct idiom is \"in accordance with\".",
    hint: "In accordance + with."
  },
  {
    id: "add5-c12-9",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error: \"Having eaten the dinner, the dishes were washed by Maya.\"",
    options: ["Dangling participle error: Having eaten the dinner, Maya washed the dishes.","dishes -> dish","were -> was","by -> from"],
    correctAnswer: "Dangling participle error: Having eaten the dinner, Maya washed the dishes.",
    explanation: "The participle \"Having eaten\" wrongfully modifies \"dishes\". Maya ate dinner, so Maya must follow the modifier.",
    hint: "Dangling participle modifier."
  },
  {
    id: "add5-c12-10",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Choose the correct word pair: \"The economic crisis had a devastating ___ on the small business ___.\"",
    options: ["effect; sector","affect; sector","effect; vector","affect; suitor"],
    correctAnswer: "effect; sector",
    explanation: "\"Effect\" is a noun meaning result; \"sector\" refers to a segment of the economy.",
    hint: "Noun effect + economic sector."
  },
  {
    id: "add5-c12-11",
    classLevel: "12",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"Were I in his position, I ___ resign immediately.\"",
    options: ["would","will","had","shall"],
    correctAnswer: "would",
    explanation: "Inverted second conditional \"Were I...\" takes \"would + base verb\" in result clause.",
    hint: "Were I ... I would."
  },
  {
    id: "add5-c12-12",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the error in comparison: \"Delhi is bigger than any city in Haryana.\"",
    options: ["any city -> any other city","bigger -> more big","than -> to","in -> at"],
    correctAnswer: "any city -> any other city",
    explanation: "When comparing a noun with members of another group or excluding itself, use \"any other city\".",
    hint: "Exclusionary comparison uses any other."
  },
  {
    id: "add5-c12-13",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Choose the correct synonym of \"ubiquitous\":",
    options: ["omnipresent","rare","hidden","scarce"],
    correctAnswer: "omnipresent",
    explanation: "Ubiquitous means found or existing everywhere (omnipresent).",
    hint: "Present everywhere."
  },
  {
    id: "add5-c12-14",
    classLevel: "12",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Select the correct inversion structure: \"Little ___ that the team had already plotted against him.\"",
    options: ["did he suspect","he suspected","he did suspect","was he suspecting"],
    correctAnswer: "did he suspect",
    explanation: "Adverb \"Little\" at the beginning of a sentence causes subject-verb inversion (\"did he suspect\").",
    hint: "Little + did he suspect."
  },
  {
    id: "add5-c12-15",
    classLevel: "12",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the sentence type: \"Having finished the manuscript, the author submitted it to the publisher, who accepted it enthusiastically.\"",
    options: ["Complex Sentence","Simple Sentence","Compound Sentence","Compound-Complex Sentence"],
    correctAnswer: "Complex Sentence",
    explanation: "Contains one main clause and a relative subordinate clause introduced by \"who\".",
    hint: "Main clause + relative clause."
  },
  {
    id: "add5-c12-16",
    classLevel: "12",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"He was acquitted ___ the charge of embezzlement.\"",
    options: ["of","from","with","for"],
    correctAnswer: "of",
    explanation: "Acquitted takes preposition \"of\".",
    hint: "Acquitted + of."
  },
  {
    id: "add5-c12-17",
    classLevel: "12",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Convert to Active Voice: \"Notice is hereby given that trespassers will be prosecuted.\"",
    options: ["We hereby give notice that we will prosecute trespassers.","Notice gives trespassers prosecution.","Trespassers hereby notice prosecution.","People give notice trespassers."],
    correctAnswer: "We hereby give notice that we will prosecute trespassers.",
    explanation: "Active conversion restores the institutional authority subject \"We\".",
    hint: "We hereby give notice..."
  },
  {
    id: "add5-c12-18",
    classLevel: "12",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the fault in: \"She is more cleverer than her sister.\"",
    options: ["more cleverer -> cleverer","than -> to","sister -> sisters","she -> her"],
    correctAnswer: "more cleverer -> cleverer",
    explanation: "Avoid double comparatives (\"more cleverer\"); use \"cleverer\".",
    hint: "Double comparative error."
  },
  {
    id: "add5-c12-19",
    classLevel: "12",
    topic: "Prepositions & Conjunctions",
    difficulty: "Hard",
    questionText: "Fill in the blank: \"The old gentleman is suffering ___ a rare blood disorder.\"",
    options: ["from","with","of","by"],
    correctAnswer: "from",
    explanation: "Suffer takes preposition \"from\" when describing an illness/disorder.",
    hint: "Suffering + from."
  },
  {
    id: "add5-c12-20",
    classLevel: "12",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Choose the sentence with correct parallel structure:",
    options: ["She likes hiking, swimming, and riding bicycles.","She likes hiking, to swim, and riding bicycles.","She likes to hike, swimming, and ride bicycles.","She likes hiking, swim, and riding."],
    correctAnswer: "She likes hiking, swimming, and riding bicycles.",
    explanation: "Parallel structure requires all listed activities to use gerund form (-ing).",
    hint: "All items in gerund (-ing) form."
  }
];

export const CLASS3_TO_8_MASSIVE_QUESTIONS: GrammarQuestion[] = [
  // Class 3 Nouns, Pronouns, Verbs, Adjectives, Prepositions
  {
    id: "m-c3-1",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Which word is a Proper Noun in the sentence: \"Rohan went to Delhi on Monday.\"",
    options: ["Rohan", "went", "on", "to"],
    correctAnswer: "Rohan",
    explanation: "Proper nouns are specific names of persons, places, or days and start with capital letters.",
    hint: "Name of a specific person."
  },
  {
    id: "m-c3-2",
    classLevel: "3",
    topic: "Nouns & Pronouns",
    difficulty: "Easy",
    questionText: "Choose the correct pronoun to fill in the blank: \"Rita is hungry. ___ is eating an apple.\"",
    options: ["He", "She", "It", "They"],
    correctAnswer: "She",
    explanation: "\"Rita\" is a female name, so female singular pronoun \"She\" is used.",
    hint: "Pronoun for a girl."
  },
  {
    id: "m-c3-3",
    classLevel: "3",
    topic: "Verbs & Tenses",
    difficulty: "Easy",
    questionText: "Identify the action verb: \"The birds fly high in the sky.\"",
    options: ["birds", "fly", "high", "sky"],
    correctAnswer: "fly",
    explanation: "\"Fly\" expresses the action done by the birds.",
    hint: "Action word."
  },
  {
    id: "m-c3-4",
    classLevel: "3",
    topic: "Adjectives & Adverbs",
    difficulty: "Easy",
    questionText: "Choose the adjective in the sentence: \"She wore a beautiful pink dress.\"",
    options: ["wore", "beautiful", "dress", "she"],
    correctAnswer: "beautiful",
    explanation: "\"Beautiful\" describes the quality of the dress (noun).",
    hint: "Describing word."
  },
  {
    id: "m-c3-5",
    classLevel: "3",
    topic: "Articles & Prepositions",
    difficulty: "Easy",
    questionText: "Fill in the blank with the correct article: \"Anish saw ___ elephant at the zoo.\"",
    options: ["a", "an", "the", "no article"],
    correctAnswer: "an",
    explanation: "\"Elephant\" begins with a vowel sound 'e', so article \"an\" is used.",
    hint: "Word starts with a vowel sound."
  },
  {
    id: "m-c3-6",
    classLevel: "3",
    topic: "Articles & Prepositions",
    difficulty: "Easy",
    questionText: "Fill in the correct preposition: \"The book is ___ the table.\"",
    options: ["on", "in", "under", "between"],
    correctAnswer: "on",
    explanation: "When an object touches the top surface of something, we use \"on\".",
    hint: "Surface contact."
  },
  {
    id: "m-c3-7",
    classLevel: "3",
    topic: "Hindi Vyakaran - Sangya & Sarvanam",
    difficulty: "Easy",
    questionText: "वाक्य में संज्ञा शब्द पहचानिए: \"राधा गाना गा रही है।\"",
    options: ["गाना", "राधा", "रही", "है"],
    correctAnswer: "राधा",
    explanation: "व्यक्ति का नाम संज्ञा (Proper Noun) होता है।",
    hint: "व्यक्ति का नाम"
  },
  {
    id: "m-c3-8",
    classLevel: "3",
    topic: "Hindi Vyakaran - Sangya & Sarvanam",
    difficulty: "Easy",
    questionText: "सर्वनाम शब्द चुनिए: \"वह मेरा मित्र है।\"",
    options: ["वह", "मित्र", "है", "सुंदर"],
    correctAnswer: "वह",
    explanation: "संज्ञा के स्थान पर प्रयोग होने वाला शब्द सर्वनाम है।",
    hint: "संज्ञा की जगह आने वाला शब्द"
  },

  // Class 4 Nouns, Pronouns, Verbs, Adjectives, Prepositions, Conjunctions
  {
    id: "m-c4-1",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Identify the Collective Noun in: \"A flock of birds flew over the lake.\"",
    options: ["birds", "flock", "lake", "flew"],
    correctAnswer: "flock",
    explanation: "Collective nouns represent a group of people, animals, or things. \"Flock\" is a group of birds.",
    hint: "Group name."
  },
  {
    id: "m-c4-2",
    classLevel: "4",
    topic: "Nouns & Pronouns",
    difficulty: "Medium",
    questionText: "Select the correct Possessive Pronoun: \"This toy belongs to Rahul. It is ___.\"",
    options: ["him", "his", "he", "himself"],
    correctAnswer: "his",
    explanation: "\"His\" shows possession/ownership for Rahul.",
    hint: "Shows ownership."
  },
  {
    id: "m-c4-3",
    classLevel: "4",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Change the sentence into Simple Past Tense: \"She dances gracefully.\"",
    options: ["She danced gracefully.", "She is dancing gracefully.", "She will dance gracefully.", "She has danced gracefully."],
    correctAnswer: "She danced gracefully.",
    explanation: "Simple past tense uses V2 form of the verb: \"dance\" -> \"danced\".",
    hint: "Past form of dance."
  },
  {
    id: "m-c4-4",
    classLevel: "4",
    topic: "Conjunctions & Prepositions",
    difficulty: "Medium",
    questionText: "Choose the correct conjunction: \"He worked hard ___ he failed the exam.\"",
    options: ["and", "but", "so", "because"],
    correctAnswer: "but",
    explanation: "\"But\" joins two contrasting ideas (working hard vs failing).",
    hint: "Shows contrast."
  },
  {
    id: "m-c4-5",
    classLevel: "4",
    topic: "Hindi Vyakaran - Visheshana & Kriya",
    difficulty: "Medium",
    questionText: "विशेषण शब्द पहचानिए: \"मोहन के पास लाल गुब्बारा है।\"",
    options: ["मोहन", "पास", "लाल", "गुब्बारा"],
    correctAnswer: "लाल",
    explanation: "जो शब्द संज्ञा (गुब्बारा) की विशेषता बताता है, वह विशेषण होता है।",
    hint: "रंग या गुण बताने वाला शब्द"
  },
  {
    id: "m-c4-6",
    classLevel: "4",
    topic: "Hindi Vyakaran - Visheshana & Kriya",
    difficulty: "Medium",
    questionText: "क्रिया शब्द कौन-सा है? \"बच्चे मैदान में फुटबॉल खेल रहे हैं।\"",
    options: ["बच्चे", "मैदान", "फुटबॉल", "खेल रहे हैं"],
    correctAnswer: "खेल रहे हैं",
    explanation: "कार्य के करने या होने का बोध कराने वाले शब्द क्रिया कहलाते हैं।",
    hint: "काम बताने वाला शब्द"
  },

  // Class 5 Nouns, Pronouns, Verbs, Tenses, Adverbs, Prepositions, Subject-Verb Agreement
  {
    id: "m-c5-1",
    classLevel: "5",
    topic: "Subject-Verb Agreement",
    difficulty: "Medium",
    questionText: "Choose the correct verb form: \"Neither my friend nor his brothers ___ present at the party.\"",
    options: ["was", "were", "is", "has"],
    correctAnswer: "were",
    explanation: "When subjects are joined by 'neither...nor', the verb agrees with the nearer subject ('brothers' = plural -> 'were').",
    hint: "Agrees with plural subject brothers."
  },
  {
    id: "m-c5-2",
    classLevel: "5",
    topic: "Adjectives & Adverbs",
    difficulty: "Medium",
    questionText: "Identify the degree of comparison: \"Mount Everest is the highest peak in the world.\"",
    options: ["Positive degree", "Comparative degree", "Superlative degree", "None of these"],
    correctAnswer: "Superlative degree",
    explanation: "\"Highest\" is the superlative degree of the adjective 'high'.",
    hint: "-est form with 'the'."
  },
  {
    id: "m-c5-3",
    classLevel: "5",
    topic: "Verbs & Tenses",
    difficulty: "Medium",
    questionText: "Identify the tense: \"They have been living in Jaipur for ten years.\"",
    options: ["Present Continuous", "Present Perfect", "Present Perfect Continuous", "Past Perfect Continuous"],
    correctAnswer: "Present Perfect Continuous",
    explanation: "Formula: have/has + been + V-ing shows Present Perfect Continuous tense.",
    hint: "have + been + -ing."
  },
  {
    id: "m-c5-4",
    classLevel: "5",
    topic: "Prepositions & Conjunctions",
    difficulty: "Medium",
    questionText: "Fill in the correct preposition: \"She divided the sweets ___ all four children.\"",
    options: ["between", "among", "with", "into"],
    correctAnswer: "among",
    explanation: "\"Among\" is used when distributing or referring to more than two persons/things.",
    hint: "Used for more than two people."
  },
  {
    id: "m-c5-5",
    classLevel: "5",
    topic: "Hindi Vyakaran - Kaal & Sandhi",
    difficulty: "Medium",
    questionText: "वाक्य का काल पहचानिए: \"कल हम पिकनिक जाएँगे।\"",
    options: ["वर्तमान काल", "भूतकाल", "भविष्यत् काल", "इनमें से कोई नहीं"],
    correctAnswer: "भविष्यत् काल",
    explanation: "आने वाले समय में कार्य होने का बोध कराने वाले वाक्य भविष्यत् काल के होते हैं।",
    hint: "आने वाले समय की बात"
  },

  // Class 6 Tenses, Active Passive, Direct Indirect, Editing, Clauses
  {
    id: "m-c6-1",
    classLevel: "6",
    topic: "Active & Passive Voice",
    difficulty: "Medium",
    questionText: "Convert into Passive Voice: \"The teacher taught the lesson.\"",
    options: [
      "The lesson was taught by the teacher.",
      "The lesson is taught by the teacher.",
      "The lesson had taught by the teacher.",
      "The teacher was teaching the lesson."
    ],
    correctAnswer: "The lesson was taught by the teacher.",
    explanation: "Simple past active (taught) becomes 'was/were + past participle (V3)' in passive voice.",
    hint: "was + taught."
  },
  {
    id: "m-c6-2",
    classLevel: "6",
    topic: "Direct & Indirect Speech",
    difficulty: "Medium",
    questionText: "Convert to Indirect Speech: \"Rhea said, 'I am reading a novel.'\"",
    options: [
      "Rhea said that she was reading a novel.",
      "Rhea said that I am reading a novel.",
      "Rhea said that she is reading a novel.",
      "Rhea told she had read a novel."
    ],
    correctAnswer: "Rhea said that she was reading a novel.",
    explanation: "Present Continuous ('am reading') changes to Past Continuous ('was reading') in reported speech.",
    hint: "am reading -> was reading."
  },
  {
    id: "m-c6-3",
    classLevel: "6",
    topic: "Modals & Auxiliaries",
    difficulty: "Medium",
    questionText: "Fill in the modal showing permission: \"___ I come in, Sir?\"",
    options: ["May", "Can", "Must", "Should"],
    correctAnswer: "May",
    explanation: "\"May\" is used to ask for formal polite permission.",
    hint: "Polite formal request."
  },
  {
    id: "m-c6-4",
    classLevel: "6",
    topic: "Editing & Omission",
    difficulty: "Medium",
    questionText: "Spot the error in sentence: \"Each of the students have submitted their assignment.\"",
    options: ["have -> has", "their -> its", "students -> student", "submitted -> submit"],
    correctAnswer: "have -> has",
    explanation: "\"Each of...\" is singular and takes a singular verb (\"has\"), not plural (\"have\").",
    hint: "'Each' takes singular verb."
  },
  {
    id: "m-c6-5",
    classLevel: "6",
    topic: "Hindi Vyakaran - Muhavare & Karak",
    difficulty: "Medium",
    questionText: "मुहावरे का सही अर्थ चुनिए: \"नौ दो ग्यारह होना\"",
    options: ["गिनती करना", "भाग जाना", "अंगूठा दिखाना", "सो जाना"],
    correctAnswer: "भाग जाना",
    explanation: "\"नौ दो ग्यारह होना\" का अर्थ है तुरंत भाग जाना।",
    hint: "चंपत होना / भाग जाना"
  },

  // Class 7 Advanced Tenses, Clauses, Conditionals, Prepositions, Voice
  {
    id: "m-c7-1",
    classLevel: "7",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Change to Active Voice: \"A poem has been written by Kabir.\"",
    options: [
      "Kabir has written a poem.",
      "Kabir wrote a poem.",
      "Kabir is writing a poem.",
      "Kabir had written a poem."
    ],
    correctAnswer: "Kabir has written a poem.",
    explanation: "Passive 'has been written' corresponds to Active Present Perfect 'has written'.",
    hint: "Present Perfect active."
  },
  {
    id: "m-c7-2",
    classLevel: "7",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Convert into Indirect Speech: \"The doctor said to the patient, 'Take your medicines on time.'\"",
    options: [
      "The doctor advised the patient to take his medicines on time.",
      "The doctor told the patient that take your medicines on time.",
      "The doctor ordered the patient taking medicines on time.",
      "The doctor requested the patient he should take medicines."
    ],
    correctAnswer: "The doctor advised the patient to take his medicines on time.",
    explanation: "Imperative sentences expressing advice use reporting verb 'advised' followed by 'to + infinitive'.",
    hint: "Doctor's advice -> advised + to + V1."
  },
  {
    id: "m-c7-3",
    classLevel: "7",
    topic: "Sentence Correction & Punctuation",
    difficulty: "Hard",
    questionText: "Identify the Relative Clause in: \"The boy who won the gold medal is my cousin.\"",
    options: [
      "who won the gold medal",
      "The boy is my cousin",
      "won the gold medal",
      "is my cousin"
    ],
    correctAnswer: "who won the gold medal",
    explanation: "\"Who won the gold medal\" is an adjective/relative clause modifying the noun 'boy'.",
    hint: "Clause starting with relative pronoun 'who'."
  },
  {
    id: "m-c7-4",
    classLevel: "7",
    topic: "Editing & Omission",
    difficulty: "Hard",
    questionText: "Identify the incorrect word: \"Although it was raining heavily, but we decided to go for a walk.\"",
    options: ["heavily", "but", "decided", "for"],
    correctAnswer: "but",
    explanation: "Do not use 'but' in a clause that already begins with 'Although'. 'Although... but' is redundant.",
    hint: "Redundant conjunction with 'Although'."
  },
  {
    id: "m-c7-5",
    classLevel: "7",
    topic: "Hindi Vyakaran - Samas & Sandhi",
    difficulty: "Hard",
    questionText: "\"राजकुमार\" शब्द में कौन-सा समास है?",
    options: ["द्वंद्व समास", "तत्पुरुष समास", "द्विगु समास", "अव्ययीभाव समास"],
    correctAnswer: "तत्पुरुष समास",
    explanation: "\"राजा का कुमार\" - उत्तर पद प्रधान होने और कारक चिह्न (का) का लोप होने के कारण यह तत्पुरुष समास है।",
    hint: "राजा का कुमार (कारक चिह्न का लोप)"
  },

  // Class 8 High Order Grammar, Tenses, Modals, Clauses, Voice, Transformation
  {
    id: "m-c8-1",
    classLevel: "8",
    topic: "Active & Passive Voice",
    difficulty: "Hard",
    questionText: "Change into Passive Voice: \"Who broke this beautiful antique vase?\"",
    options: [
      "By whom was this beautiful antique vase broken?",
      "Who was broken this beautiful antique vase?",
      "By whom this beautiful antique vase was broken?",
      "Whom broke this beautiful antique vase?"
    ],
    correctAnswer: "By whom was this beautiful antique vase broken?",
    explanation: "Interrogative sentences starting with 'Who' change to 'By whom + auxiliary verb + subject + V3?'.",
    hint: "By whom + was + subject + V3?"
  },
  {
    id: "m-c8-2",
    classLevel: "8",
    topic: "Direct & Indirect Speech",
    difficulty: "Hard",
    questionText: "Change to Indirect Speech: \"The stranger asked me, 'Where do you live?'\"",
    options: [
      "The stranger asked me where I lived.",
      "The stranger asked me where do I live.",
      "The stranger asked me where did I live.",
      "The stranger inquired me that where I live."
    ],
    correctAnswer: "The stranger asked me where I lived.",
    explanation: "Wh-questions in indirect speech keep the question word as conjunction, remove 'do', and change subject + past verb ('I lived').",
    hint: "where + I + lived."
  },
  {
    id: "m-c8-3",
    classLevel: "8",
    topic: "Modals & Auxiliaries",
    difficulty: "Hard",
    questionText: "Choose the modal expressing strong moral duty: \"We ___ respect our national elders and freedom fighters.\"",
    options: ["ought to", "might", "can", "could"],
    correctAnswer: "ought to",
    explanation: "\"Ought to\" is used to express moral obligation and duty.",
    hint: "Moral duty."
  },
  {
    id: "m-c8-4",
    classLevel: "8",
    topic: "Subject-Verb Agreement",
    difficulty: "Hard",
    questionText: "Select the grammatically correct sentence:",
    options: [
      "Bread and butter is a wholesome breakfast.",
      "Bread and butter are a wholesome breakfast.",
      "Bread and butter have a wholesome breakfast.",
      "Bread and butter were a wholesome breakfast."
    ],
    correctAnswer: "Bread and butter is a wholesome breakfast.",
    explanation: "When two nouns express a single combined idea or dish (bread and butter), a singular verb 'is' is used.",
    hint: "Single combined meal idea -> singular verb."
  },
  {
    id: "m-c8-5",
    classLevel: "8",
    topic: "Hindi Vyakaran - Alankar & Sandhi",
    difficulty: "Hard",
    questionText: "\"चरण कमल बंदौ हरि राई\" में कौन-सा अलंकार है?",
    options: ["अनुप्रास अलंकार", "उपमा अलंकार", "रूपक अलंकार", "यमक अलंकार"],
    correctAnswer: "रूपक अलंकार",
    explanation: "यहाँ उपमेय (चरण) में उपमान (कमल) का अभेद आरोप किया गया है, अतः रूपक अलंकार है।",
    hint: "अभेद आरोप (चरण रूपी कमल)"
  }
];

GRAMMAR_QUESTION_BANK.push(...CLASS3_TO_8_MASSIVE_QUESTIONS);
