const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, 'grammarQuestions.ts');
console.log('Target file path:', targetFilePath);
let fileContent = fs.readFileSync(targetFilePath, 'utf8');

// Strip out the previous append if any to re-append cleanly
const marker = '// ==================== NEW BATCH 300 QUESTIONS (30 PER CLASS 3-12) ====================';
if (fileContent.includes(marker)) {
  const markerIdx = fileContent.indexOf(marker);
  fileContent = fileContent.slice(0, markerIdx).trimEnd() + '\n];\n';
  fs.writeFileSync(targetFilePath, fileContent, 'utf8');
}

const rootDir = path.resolve(__dirname, '../../');
const p1 = JSON.parse(fs.readFileSync(path.join(rootDir, 'questions_part1.json'), 'utf8'));
const p2 = JSON.parse(fs.readFileSync(path.join(rootDir, 'questions_part2.json'), 'utf8'));
const p3 = JSON.parse(fs.readFileSync(path.join(rootDir, 'questions_part3.json'), 'utf8'));
const p4 = JSON.parse(fs.readFileSync(path.join(rootDir, 'questions_part4.json'), 'utf8'));

let rawList = [...p1, ...p2, ...p3, ...p4];

// Fix non-unique generic titles
rawList.forEach((q, i) => {
  if (q.questionText === 'Choose the correct sentence:') {
    q.questionText = `Choose the grammatically correct sentence (${q.topic} - Class ${q.classLevel}):`;
  }
});

const extraQuestions = [
  // Class 5 (+1)
  { classLevel: '5', topic: 'Nouns & Pronouns', difficulty: 'Medium', questionText: 'Identify the possessive pronoun in: "This paintbrush is hers."', options: ['paintbrush', 'is', 'hers', 'This'], correctAnswer: 'hers', explanation: 'Possessive pronoun "hers" indicates ownership without repeating the noun.', hint: 'Word showing ownership.' },

  // Class 6 (+1)
  { classLevel: '6', topic: 'Modals & Auxiliaries', difficulty: 'Medium', questionText: 'Choose the appropriate modal for permission in formal context: "___ I enter the cabin, sir?"', options: ['May', 'Can', 'Might', 'Must'], correctAnswer: 'May', explanation: 'Use "May" for formal polite permission.', hint: 'Formal permission word.' },

  // Class 7 (+4)
  { classLevel: '7', topic: 'Editing & Omission', difficulty: 'Hard', questionText: 'Identify the error in: "He has been working here since five months."', options: ['since -> for', 'working -> worked', 'here -> there', 'has -> have'], correctAnswer: 'since -> for', explanation: 'Use "for" with a duration of time ("five months"), not "since".', hint: 'Duration of time takes "for".' },
  { classLevel: '7', topic: 'Direct & Indirect Speech', difficulty: 'Medium', questionText: 'Convert to indirect speech: The teacher said, "Water boils at 100 degrees Celsius."', options: ['The teacher said that water boils at 100 degrees Celsius.', 'The teacher said that water boiled at 100 degrees Celsius.', 'The teacher said water is boiling.', 'The teacher told water boils.'], correctAnswer: 'The teacher said that water boils at 100 degrees Celsius.', explanation: 'Scientific facts remain in simple present tense in indirect speech.', hint: 'Scientific facts do not change tense.' },
  { classLevel: '7', topic: 'Verbs & Tenses', difficulty: 'Hard', questionText: 'Choose the correct form: "By the time we reach the station, the train ___."', options: ['will have left', 'left', 'leaves', 'was leaving'], correctAnswer: 'will have left', explanation: 'Future perfect tense ("will have left") indicates an action that will be completed before another future action.', hint: 'Action completed before a future time.' },
  { classLevel: '7', topic: 'Subject-Verb Agreement', difficulty: 'Medium', questionText: 'Select the sentence with correct verb agreement for Class 7:', options: ['Either Shyam or his brothers are going to attend.', 'Either Shyam or his brothers is going.', 'Either Shyam or brothers was going.', 'Either Shyam are going.'], correctAnswer: 'Either Shyam or his brothers are going to attend.', explanation: 'In "either... or", verb agrees with the nearer subject ("his brothers" - plural).', hint: 'Agrees with nearer subject.' },

  // Class 8 (+4)
  { classLevel: '8', topic: 'Active & Passive Voice', difficulty: 'Hard', questionText: 'Convert to Passive Voice: "The principal distributed the annual awards to the winners."', options: ['The annual awards were distributed to the winners by the principal.', 'The annual awards are distributed by principal.', 'The winners were distributing awards.', 'Principal was distributed by awards.'], correctAnswer: 'The annual awards were distributed to the winners by the principal.', explanation: 'Simple past passive: Object + were + past participle (distributed) + by + Subject.', hint: 'Object + were + V3.' },
  { classLevel: '8', topic: 'Sentence Correction & Punctuation', difficulty: 'Medium', questionText: 'Identify the type of sentence: "Work hard so that you can achieve your goals."', options: ['Complex Sentence', 'Simple Sentence', 'Compound Sentence', 'Exclamatory Sentence'], correctAnswer: 'Complex Sentence', explanation: 'Contains a main clause and a subordinate clause introduced by "so that".', hint: 'Contains subordinate clause introduced by "so that".' },
  { classLevel: '8', topic: 'Direct & Indirect Speech', difficulty: 'Hard', questionText: 'Convert to indirect speech: He said to me, "Do not touch the hot iron."', options: ['He warned me not to touch the hot iron.', 'He said me to not touch hot iron.', 'He told that don\'t touch hot iron.', 'He asked me do not touch iron.'], correctAnswer: 'He warned me not to touch the hot iron.', explanation: 'Negative imperatives in reported speech change to "warned/told + object + not to + base verb".', hint: 'Negative command -> warned + not to + base verb.' },
  { classLevel: '8', topic: 'Adjectives & Adverbs', difficulty: 'Hard', questionText: 'Fill in the blank: "Of the two sisters, Ankita is the ___ intelligent."', options: ['more', 'most', 'very', 'much'], correctAnswer: 'more', explanation: 'When comparing two persons, use "the more" comparative degree.', hint: 'Comparison between two uses comparative.' },

  // Class 9 (+1)
  { classLevel: '9', topic: 'Subject-Verb Agreement', difficulty: 'Hard', questionText: 'Fill in the blank: "The physics department ___ introducing a new honors course next term."', options: ['is', 'are', 'were', 'have been'], correctAnswer: 'is', explanation: 'The singular noun phrase "The physics department" takes a singular verb ("is").', hint: 'Department acts as a singular entity.' },

  // Class 10 (+2)
  { classLevel: '10', topic: 'Editing & Omission', difficulty: 'Hard', questionText: 'Identify the error in: "Neither the minister nor his advisers was able to resolve the crisis."', options: ['was -> were', 'advisers -> adviser', 'neither -> nor', 'resolve -> resolving'], correctAnswer: 'was -> were', explanation: 'In "neither... nor", the verb agrees with the closer subject ("advisers" - plural).', hint: 'Verb agrees with plural advisers.' },
  { classLevel: '10', topic: 'Active & Passive Voice', difficulty: 'Hard', questionText: 'Convert to Passive Voice: "They have postponed the international conference until November."', options: ['The international conference has been postponed until November.', 'The international conference was postponed until November.', 'The international conference is postponed until November.', 'The conference had postponed by them.'], correctAnswer: 'The international conference has been postponed until November.', explanation: 'Present perfect passive: Object + has been + past participle (postponed).', hint: 'Present perfect passive: has been + V3.' },

  // Class 12 (+1)
  { classLevel: '12', topic: 'Prepositions & Idiomatic Phrasal Verbs', difficulty: 'Hard', questionText: 'Fill in the blank: "The committee decision was taken in compliance ___ the court guidelines."', options: ['with', 'to', 'for', 'by'], correctAnswer: 'with', explanation: 'Idiomatic prepositional phrase is "in compliance with".', hint: 'In compliance + with.' }
];

rawList.push(...extraQuestions);

const classBuckets = {};
const classes = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

for (const c of classes) {
  classBuckets[c] = [];
}

const existingTexts = new Set([...fileContent.matchAll(/questionText:\s*['\"]([^'\"]+)['\"]/g)].map(m => m[1].trim()));

for (const item of rawList) {
  const c = String(item.classLevel);
  if (!classBuckets[c]) continue;
  if (existingTexts.has(item.questionText.trim())) {
    console.log(`Skipping duplicate question in class ${c}:`, item.questionText);
    continue;
  }
  if (classBuckets[c].length < 30) {
    classBuckets[c].push(item);
    existingTexts.add(item.questionText.trim());
  }
}

const final300 = [];
for (const c of classes) {
  console.log(`Class ${c} final question count: ${classBuckets[c].length}`);
  classBuckets[c].forEach((item, idx) => {
    final300.push({
      ...item,
      id: `add4-c${c}-${idx + 1}`
    });
  });
}

console.log(`Total non-duplicate questions ready: ${final300.length}`);

const formattedItems = final300.map(item => {
  return `  {\n` +
    `    id: ${JSON.stringify(item.id)},\n` +
    `    classLevel: ${JSON.stringify(item.classLevel)},\n` +
    `    topic: ${JSON.stringify(item.topic)},\n` +
    `    difficulty: ${JSON.stringify(item.difficulty || 'Medium')},\n` +
    `    questionText: ${JSON.stringify(item.questionText)},\n` +
    `    options: ${JSON.stringify(item.options)},\n` +
    `    correctAnswer: ${JSON.stringify(item.correctAnswer)},\n` +
    `    explanation: ${JSON.stringify(item.explanation)},\n` +
    `    hint: ${JSON.stringify(item.hint || '')}\n` +
    `  }`;
}).join(',\n');

const lastBracketIdx = fileContent.lastIndexOf('];');
if (lastBracketIdx === -1) {
  console.error('Could not find closing bracket of GRAMMAR_QUESTION_BANK');
  process.exit(1);
}

const newContent = fileContent.slice(0, lastBracketIdx).trimEnd() + ',\n  // ==================== NEW BATCH 300 QUESTIONS (30 PER CLASS 3-12) ====================\n' + formattedItems + '\n];\n';

fs.writeFileSync(targetFilePath, newContent, 'utf8');
console.log(`Successfully appended ${final300.length} questions to ${targetFilePath}`);
