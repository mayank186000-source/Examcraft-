import { Subject, Question } from '../types';
import { CBSE_CLASS_3_SUBJECTS, CBSE_CLASS_4_SUBJECTS } from './cbseClass5to8';

// ==========================================
// CLASS 3 & 4 CURRICULUM UTILITY MODULE
// NCERT Aligned Curriculum Structure & Question Banks
// ==========================================

export const PRIMARY_CLASS_3_SUBJECTS: Subject[] = CBSE_CLASS_3_SUBJECTS;
export const PRIMARY_CLASS_4_SUBJECTS: Subject[] = CBSE_CLASS_4_SUBJECTS;

// Question Bank for Class 3
export const CLASS_3_QUESTION_BANK: Question[] = [
  // Class 3 EVS
  {
    id: 'c3-evs-q1',
    subjectId: 'class3-science-evs',
    chapterId: 'c3-evs-ch1',
    chapterName: "Poonam's Day Out & The Plant Fairy",
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: true,
    questionText: 'Which of the following animals can fly in the sky?',
    options: ['A) Frog', 'B) Sparrow', 'C) Dog', 'D) Fish'],
    correctAnswer: 'B) Sparrow',
    markingScheme: '1 Mark for correct identification.',
    explanation: 'Sparrows have wings and light bones allowing them to fly in the air.',
    pyqYear: 2024
  },
  {
    id: 'c3-evs-q2',
    subjectId: 'class3-science-evs',
    chapterId: 'c3-evs-ch2',
    chapterName: "Water O' Water!",
    type: 'vsa',
    marks: 2,
    difficulty: 'easy',
    isCompetency: false,
    questionText: 'Name two natural sources of water and write one way to save water at home.',
    correctAnswer: 'Natural sources: Rain, Rivers, Ponds. Way to save water: Turn off the tap while brushing teeth and reuse RO waste water for cleaning.',
    markingScheme: '[1 Mark] Two sources. [1 Mark] One water conservation method.',
    pyqYear: 2023
  },
  {
    id: 'c3-evs-q3',
    subjectId: 'class3-science-evs',
    chapterId: 'c3-evs-ch4',
    chapterName: 'Foods We Eat',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'Why do elderly people need soft food compared to young children? Give two examples of food items made from rice.',
    correctAnswer: 'Elderly people often have weak teeth and digestion, so they need soft, easily digestible food. Two rice items: Dosa, Kheer (or Idli/Pulao).',
    markingScheme: '[1.5 Marks] Explanation for elderly diet. [1.5 Marks] Two food items made from rice.',
    pyqYear: 2024
  },
  // Class 3 Mathematics
  {
    id: 'c3-mth-q1',
    subjectId: 'class3-maths',
    chapterId: 'c3-mth-ch2',
    chapterName: 'Fun with Numbers',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: false,
    questionText: 'What is the expanded form of the 3-digit number 478?',
    options: ['A) 400 + 70 + 8', 'B) 40 + 700 + 8', 'C) 4 + 7 + 8', 'D) 400 + 7 + 80'],
    correctAnswer: 'A) 400 + 70 + 8',
    markingScheme: '1 Mark for correct place value expansion.',
    explanation: '4 is in hundreds place (400), 7 in tens place (70), and 8 in ones place (8).',
    pyqYear: 2024
  },
  {
    id: 'c3-mth-q2',
    subjectId: 'class3-maths',
    chapterId: 'c3-mth-ch4',
    chapterName: 'Long and Short',
    type: 'vsa',
    marks: 2,
    difficulty: 'easy',
    isCompetency: true,
    questionText: 'How many centimeters are there in 3 meters? Convert 250 cm into meters and centimeters.',
    correctAnswer: '3 meters = 300 cm (since 1 m = 100 cm). 250 cm = 2 meters and 50 centimeters.',
    markingScheme: '[1 Mark] 3 m = 300 cm. [1 Mark] 2 m 50 cm.',
    pyqYear: 2024
  },
  {
    id: 'c3-mth-q3',
    subjectId: 'class3-maths',
    chapterId: 'c3-mth-ch8',
    chapterName: 'How Many Times?',
    type: 'sa',
    marks: 3,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'If 1 box contains 6 pencils, how many pencils will be there in 8 such boxes? Solve using multiplication.',
    correctAnswer: 'Number of pencils in 1 box = 6. Number of boxes = 8. Total pencils = 6 × 8 = 48 pencils.',
    markingScheme: '[1 Mark] Statement formation. [1 Mark] Multiplication expression 6 × 8. [1 Mark] Correct answer 48.',
    pyqYear: 2023
  },
  // Class 3 English
  {
    id: 'c3-eng-q1',
    subjectId: 'class3-english',
    chapterId: 'c3-eng-sec-b',
    chapterName: 'Section B - Writing & Grammar',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: false,
    questionText: 'Which pronoun should replace the word "Rohan" in the sentence: "Rohan is my best friend."',
    options: ['A) She', 'B) He', 'C) They', 'D) It'],
    correctAnswer: 'B) He',
    markingScheme: '1 Mark for correct pronoun selection.',
    explanation: 'Rohan is a boy (singular male noun), so we use the pronoun "He".',
    pyqYear: 2024
  },
  // Class 3 Hindi
  {
    id: 'c3-hin-q1',
    subjectId: 'class3-hindi',
    chapterId: 'c3-hin-sec-b',
    chapterName: 'खंड ‘ख’ - व्याकरण',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: false,
    questionText: '‘लड़का’ शब्द का बहुवचन रूप क्या होगा?',
    options: ['A) लड़कों', 'B) लड़के', 'C) लड़कियाँ', 'D) लड़कियाँ'],
    correctAnswer: 'B) लड़के',
    markingScheme: '1 अंक सही बहुवचन चुनने पर।',
    explanation: '‘लड़का’ आकारांत पुल्लिंग शब्द है जिसका बहुवचन ‘लड़के’ होता है।',
    pyqYear: 2024
  }
];

// Question Bank for Class 4
export const CLASS_4_QUESTION_BANK: Question[] = [
  // Class 4 EVS
  {
    id: 'c4-evs-q1',
    subjectId: 'class4-science-evs',
    chapterId: 'c4-evs-ch1',
    chapterName: 'Going to School & Ear to Ear',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: true,
    questionText: 'In which state of India do school children use a "Bamboo Bridge" to cross streams?',
    options: ['A) Rajasthan', 'B) Assam', 'C) Ladakh', 'D) Kerala'],
    correctAnswer: 'B) Assam',
    markingScheme: '1 Mark for correct region identification.',
    explanation: 'In Assam, it rains a lot, so children build temporary bridges out of bamboo and rope to cross streams.',
    pyqYear: 2024
  },
  {
    id: 'c4-evs-q2',
    subjectId: 'class4-science-evs',
    chapterId: 'c4-evs-ch2',
    chapterName: 'A Day with Nandu & The Story of Amrita',
    type: 'vsa',
    marks: 2,
    difficulty: 'medium',
    isCompetency: true,
    questionText: 'Who leads an elephant herd? Why are Khejadi trees famous in Rajasthan?',
    correctAnswer: 'The oldest female elephant leads the herd. Khejadi trees are famous because they can survive in hot deserts with very little water and their leaves/bark are useful.',
    markingScheme: '[1 Mark] Oldest female elephant. [1 Mark] Khejadi tree desert adaptation.',
    pyqYear: 2023
  },
  // Class 4 Mathematics
  {
    id: 'c4-mth-q1',
    subjectId: 'class4-maths',
    chapterId: 'c4-mth-ch1',
    chapterName: 'Building with Bricks & A Trip to Bhopal',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: false,
    questionText: 'How many faces does a standard brick (cuboid) have in total?',
    options: ['A) 4 faces', 'B) 6 faces', 'C) 8 faces', 'D) 12 faces'],
    correctAnswer: 'B) 6 faces',
    markingScheme: '1 Mark for correct 3D geometric face count.',
    explanation: 'A brick is cuboidal and has 6 flat rectangular faces.',
    pyqYear: 2024
  },
  {
    id: 'c4-mth-q2',
    subjectId: 'class4-maths',
    chapterId: 'c4-mth-ch4',
    chapterName: 'Tick-Tick-Tick & The Junk Seller',
    type: 'vsa',
    marks: 2,
    difficulty: 'easy',
    isCompetency: true,
    questionText: 'Convert 3 hours into minutes. If a train starts at 14:30 in 24-hour clock time, what time is it on a 12-hour clock?',
    correctAnswer: '3 hours = 3 × 60 = 180 minutes. 14:30 on 24-hour clock = 2:30 PM on 12-hour clock.',
    markingScheme: '[1 Mark] 180 minutes. [1 Mark] 2:30 PM.',
    pyqYear: 2024
  },
  // Class 4 English
  {
    id: 'c4-eng-q1',
    subjectId: 'class4-english',
    chapterId: 'c4-eng-sec-b',
    chapterName: 'Section B - Writing & Grammar',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: false,
    questionText: 'Choose the correct adjective: "The elephant is a ___ animal."',
    options: ['A) tiny', 'B) huge', 'C) fast', 'D) sour'],
    correctAnswer: 'B) huge',
    markingScheme: '1 Mark for appropriate adjective selection.',
    explanation: '"Huge" describes the large size of an elephant.',
    pyqYear: 2024
  },
  // Class 4 Hindi
  {
    id: 'c4-hin-q1',
    subjectId: 'class4-hindi',
    chapterId: 'c4-hin-sec-b',
    chapterName: 'खंड ‘ख’ - व्याकरण',
    type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    isCompetency: false,
    questionText: '‘सूर्य’ शब्द का सही पर्यायवाची शब्द कौन-सा है?',
    options: ['A) चंद्रमा', 'B) रवि', 'C) बादल', 'D) पवन'],
    correctAnswer: 'B) रवि',
    markingScheme: '1 अंक सही पर्यायवाची शब्द चुनने पर।',
    explanation: 'सूर्य के पर्यायवाची शब्द रवि, दिनकर, भानु और दिनेश हैं।',
    pyqYear: 2024
  }
];

// Helper functions for primary curriculum lookup
export function getPrimarySubjects(classLevel: '3' | '4'): Subject[] {
  return classLevel === '3' ? PRIMARY_CLASS_3_SUBJECTS : PRIMARY_CLASS_4_SUBJECTS;
}

export function getAllPrimarySubjects(): Subject[] {
  return [...PRIMARY_CLASS_3_SUBJECTS, ...PRIMARY_CLASS_4_SUBJECTS];
}

export function getPrimaryQuestions(classLevel?: '3' | '4'): Question[] {
  if (classLevel === '3') return CLASS_3_QUESTION_BANK;
  if (classLevel === '4') return CLASS_4_QUESTION_BANK;
  return [...CLASS_3_QUESTION_BANK, ...CLASS_4_QUESTION_BANK];
}
