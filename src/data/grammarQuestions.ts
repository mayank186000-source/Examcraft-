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
  'Sentence Correction & Punctuation'
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
  }
];

