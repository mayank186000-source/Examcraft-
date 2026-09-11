import { GeneratedPaper } from '../types';

// Language Translation Engine for CBSE Test Papers (English, Hindi, Bilingual)

export type LanguageMode = 'en' | 'hi' | 'bilingual';

// Helper to fetch fast Google Translate API for accurate Hindi conversion
export async function fetchGoogleTranslation(text: string): Promise<string> {
  if (!text || !text.trim() || /[\u0900-\u097F]/.test(text)) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translatedStr = data[0].map((part: any) => part[0] || '').join('');
      if (translatedStr && translatedStr.trim()) return translatedStr.trim();
    }
  } catch (err) {
    console.warn('Google Translation fallback warning:', err);
  }
  return getCleanHindiTranslation(text);
}

// Ensures all questions in paper have native Devanagari Hindi fields pre-filled asynchronously in parallel
export async function ensurePaperHindiTranslations(paper: GeneratedPaper): Promise<GeneratedPaper> {
  if (!paper || !paper.sections) return paper;

  const newPaper: GeneratedPaper = JSON.parse(JSON.stringify(paper));

  const translationTasks: Promise<void>[] = [];

  newPaper.sections.forEach(sec => {
    sec.questions.forEach(q => {
      // 1. Question text
      if (!q.questionTextHindi && q.questionText) {
        translationTasks.push(
          fetchGoogleTranslation(q.questionText).then(res => {
            q.questionTextHindi = res;
          })
        );
      }

      // 2. Case passage
      if (q.casePassage && !q.casePassageHindi) {
        translationTasks.push(
          fetchGoogleTranslation(q.casePassage).then(res => {
            q.casePassageHindi = res;
          })
        );
      }

      // 3. Options
      if (q.options && q.options.length > 0 && (!q.optionsHindi || q.optionsHindi.length === 0)) {
        translationTasks.push(
          Promise.all(q.options.map(opt => fetchGoogleTranslation(opt))).then(res => {
            q.optionsHindi = res;
          })
        );
      }

      // 4. Correct answer
      if (q.correctAnswer && !q.correctAnswerHindi) {
        translationTasks.push(
          fetchGoogleTranslation(q.correctAnswer).then(res => {
            q.correctAnswerHindi = res;
          })
        );
      }

      // 5. Marking scheme
      if (q.markingScheme && !q.markingSchemeHindi) {
        translationTasks.push(
          fetchGoogleTranslation(q.markingScheme).then(res => {
            q.markingSchemeHindi = res;
          })
        );
      }
    });
  });

  await Promise.all(translationTasks);
  return newPaper;
}
function getFormattedSectionHeader(sectionName: string, description: string, subjectCode?: string): { title: string; subtitle: string } {
  const cleanName = (sectionName || '').trim();
  const cleanDesc = (description || '').trim();
  const upperName = cleanName.toUpperCase();

  if (cleanName.includes(':')) {
    return { title: cleanName.toUpperCase(), subtitle: cleanDesc };
  }

  const code = (subjectCode || '').trim();
  let explicitTitle = upperName;

  if (code === '184' || code.includes('English') || code.includes('184')) {
    if (upperName === 'SECTION A') explicitTitle = 'SECTION A: READING SKILLS';
    else if (upperName === 'SECTION B') explicitTitle = 'SECTION B: WRITING SKILLS & GRAMMAR';
    else if (upperName === 'SECTION C') explicitTitle = 'SECTION C: LITERATURE TEXTBOOKS';
  } else if (code === '402' || code.includes('402')) {
    if (upperName === 'SECTION A') explicitTitle = 'SECTION A: OBJECTIVE TYPE QUESTIONS';
    else if (upperName === 'SECTION B') explicitTitle = 'SECTION B: SUBJECTIVE TYPE QUESTIONS';
  } else {
    if (upperName === 'SECTION A') explicitTitle = 'SECTION A: MULTIPLE CHOICE QUESTIONS';
    else if (upperName === 'SECTION B') explicitTitle = 'SECTION B: VERY SHORT ANSWER QUESTIONS';
    else if (upperName === 'SECTION C') explicitTitle = 'SECTION C: SHORT ANSWER QUESTIONS';
    else if (upperName === 'SECTION D') explicitTitle = 'SECTION D: LONG ANSWER QUESTIONS';
    else if (upperName === 'SECTION E') explicitTitle = 'SECTION E: CASE-BASED INTEGRATED UNITS';
    else if (upperName === 'SECTION F') explicitTitle = 'SECTION F: MAP SKILL BASED QUESTIONS';
  }

  return { title: explicitTitle, subtitle: cleanDesc };
}

// Dictionary of CBSE Header Terms & Metadata
const DICTIONARY: Record<string, { hi: string; bilingual: string }> = {
  // General Header & Metadata
  "Roll No.": { hi: "अनुक्रमांक", bilingual: "Roll No. / अनुक्रमांक" },
  "Code No": { hi: "कोड नं.", bilingual: "Code No / कोड नं." },
  "Q.P. Code / Set No.": { hi: "प्रश्न पत्र कोड / सेट संख्या", bilingual: "Q.P. Code / प्रश्न पत्र कोड" },
  "General Instructions:": { hi: "सामान्य निर्देश:", bilingual: "General Instructions / सामान्य निर्देश:" },
  "Time Allowed:": { hi: "निर्धारित समय:", bilingual: "Time Allowed / निर्धारित समय:" },
  "Hours": { hi: "घंटे", bilingual: "Hours / घंटे" },
  "Mins": { hi: "मिनट", bilingual: "Mins / मिनट" },
  "Maximum Marks:": { hi: "अधिकतम अंक:", bilingual: "Maximum Marks / अधिकतम अंक:" },
  "CONFIDENTIAL TEACHER EVALUATION COPY • MARKING SCHEME & STEP-WISE SOLUTIONS INCLUDED": {
    hi: "गोपनीय शिक्षक मूल्यांकन प्रति • अंकन योजना एवं चरणबद्ध हल शामिल",
    bilingual: "CONFIDENTIAL TEACHER EVALUATION COPY • MARKING SCHEME INCLUDED / गोपनीय अंकन योजना"
  },
  "Unique Paper Code (यूनिक पेपर कोड)": {
    hi: "यूनिक पेपर कोड (Unique Paper Code)",
    bilingual: "Unique Paper Code / यूनिक पेपर कोड"
  },
  "CASE STUDY REFERENCE PASSAGE / SOURCE DATA:": {
    hi: "केस स्टडी संदर्भ गद्यांश / स्रोत डेटा:",
    bilingual: "CASE STUDY REFERENCE PASSAGE / केस स्टडी संदर्भ गद्यांश:"
  },
  "Official CBSE Board Answer & Marking Scheme:": {
    hi: "आधिकारिक CBSE बोर्ड उत्तर एवं अंकन योजना:",
    bilingual: "Official CBSE Answer & Marking Scheme / आधिकारिक बोर्ड उत्तर व अंकन योजना:"
  },
  "CENTRAL BOARD OF SECONDARY EDUCATION": {
    hi: "केन्द्रीय माध्यमिक शिक्षा बोर्ड",
    bilingual: "CENTRAL BOARD OF SECONDARY EDUCATION / केन्द्रीय माध्यमिक शिक्षा बोर्ड"
  },

  // Sections
  "SECTION A: MULTIPLE CHOICE QUESTIONS": {
    hi: "खण्ड 'क': बहुविकल्पीय प्रश्न",
    bilingual: "SECTION A: MULTIPLE CHOICE QUESTIONS / खण्ड 'क': बहुविकल्पीय प्रश्न"
  },
  "SECTION B: VERY SHORT ANSWER QUESTIONS": {
    hi: "खण्ड 'ख': अति लघु उत्तरीय प्रश्न",
    bilingual: "SECTION B: VERY SHORT ANSWER QUESTIONS / खण्ड 'ख': अति लघु उत्तरीय प्रश्न"
  },
  "SECTION C: SHORT ANSWER QUESTIONS": {
    hi: "खण्ड 'ग': लघु उत्तरीय प्रश्न",
    bilingual: "SECTION C: SHORT ANSWER QUESTIONS / खण्ड 'ग': लघु उत्तरीय प्रश्न"
  },
  "SECTION D: LONG ANSWER QUESTIONS": {
    hi: "खण्ड 'घ': दीर्घ उत्तरीय प्रश्न",
    bilingual: "SECTION D: LONG ANSWER QUESTIONS / खण्ड 'घ': दीर्घ उत्तरीय प्रश्न"
  },
  "SECTION E: CASE-BASED INTEGRATED UNITS": {
    hi: "खण्ड 'ङ': केस-आधारित एकीकृत मूल्यांकन प्रश्न",
    bilingual: "SECTION E: CASE-BASED INTEGRATED UNITS / खण्ड 'ङ': केस-आधारित प्रश्न"
  },
  "SECTION F: MAP SKILL BASED QUESTIONS": {
    hi: "खण्ड 'च': मानचित्र कौशल आधारित प्रश्न",
    bilingual: "SECTION F: MAP SKILL BASED QUESTIONS / खण्ड 'च': मानचित्र आधारित प्रश्न"
  },
  "SECTION A: READING SKILLS": {
    hi: "खण्ड 'क': अपठित बोध एवं पठन कौशल",
    bilingual: "SECTION A: READING SKILLS / खण्ड 'क': अपठित बोध"
  },
  "SECTION B: WRITING SKILLS & GRAMMAR": {
    hi: "खण्ड 'ख': लेखन कौशल एवं व्याकरण",
    bilingual: "SECTION B: WRITING SKILLS & GRAMMAR / खण्ड 'ख': लेखन कौशल एवं व्याकरण"
  },
  "SECTION C: LITERATURE TEXTBOOKS": {
    hi: "खण्ड 'ग': साहित्य एवं पाठ्यपुस्तक",
    bilingual: "SECTION C: LITERATURE TEXTBOOKS / खण्ड 'ग': साहित्य एवं पाठ्यपुस्तक"
  },
  "SECTION A: OBJECTIVE TYPE QUESTIONS": {
    hi: "खण्ड 'क': वस्तुनिष्ठ प्रश्न",
    bilingual: "SECTION A: OBJECTIVE TYPE QUESTIONS / खण्ड 'क': वस्तुनिष्ठ प्रश्न"
  },
  "SECTION B: SUBJECTIVE TYPE QUESTIONS": {
    hi: "खण्ड 'ख': विषयनिष्ठ प्रश्न",
    bilingual: "SECTION B: SUBJECTIVE TYPE QUESTIONS / खण्ड 'ख': विषयनिष्ठ प्रश्न"
  }
};

// Sentence instruction translation helper
export function translateInstruction(text: string, mode: LanguageMode): string {
  if (mode === 'en' || !text) return text;

  // If already Hindi text
  if (/[\u0900-\u097F]/.test(text)) return text;

  let translated = text;

  if (/contains|consists of \d+ questions/i.test(text)) {
    translated = text
      .replace(/This question paper contains|consists of/i, 'इस प्रश्न पत्र में')
      .replace(/questions divided into/i, 'प्रश्न हैं जो')
      .replace(/sections/i, 'खण्डों में विभाजित हैं')
      .replace(/Section A/i, 'खण्ड क')
      .replace(/Section B/i, 'खण्ड ख')
      .replace(/Section C/i, 'खण्ड ग')
      .replace(/Section D/i, 'खण्ड घ')
      .replace(/Section E/i, 'खण्ड ङ');
  } else if (/All questions are compulsory/i.test(text)) {
    translated = "सभी प्रश्न अनिवार्य हैं। (All questions are compulsory.)";
  } else if (/Section A consists of/i.test(text)) {
    translated = text
      .replace(/Section A consists of/i, "खण्ड 'क' में")
      .replace(/objective type questions|MCQs/i, 'वस्तुनिष्ठ प्रश्न')
      .replace(/carrying 1 mark each/i, 'प्रत्येक 1 अंक का है');
  } else if (/Section B consists of/i.test(text)) {
    translated = text
      .replace(/Section B consists of/i, "खण्ड 'ख' में")
      .replace(/Very Short Answer type questions/i, 'अति लघु उत्तरीय प्रश्न')
      .replace(/carrying 2 marks each/i, 'प्रत्येक 2 अंकों का है');
  } else if (/Section C consists of/i.test(text)) {
    translated = text
      .replace(/Section C consists of/i, "खण्ड 'ग' में")
      .replace(/Short Answer type questions/i, 'लघु उत्तरीय प्रश्न')
      .replace(/carrying 3 marks each/i, 'प्रत्येक 3 अंकों का है');
  } else if (/Section D consists of/i.test(text)) {
    translated = text
      .replace(/Section D consists of/i, "खण्ड 'घ' में")
      .replace(/Long Answer type questions/i, 'दीर्घ उत्तरीय प्रश्न')
      .replace(/carrying 5 marks each/i, 'प्रत्येक 5 अंकों का है');
  } else if (/Section E consists of/i.test(text)) {
    translated = text
      .replace(/Section E consists of/i, "खण्ड 'ङ' में")
      .replace(/case-based/i, 'केस-आधारित')
      .replace(/carrying 4 marks each/i, 'प्रत्येक 4 अंकों का है');
  } else if (/no overall choice/i.test(text)) {
    translated = "कोई समग्र विकल्प नहीं है। हालांकि, कुछ प्रश्नों में आंतरिक विकल्प दिए गए हैं।";
  } else if (/calculators/i.test(text)) {
    translated = "कैल्कुलेटर का उपयोग करने की अनुमति नहीं है। (Use of calculators is not permitted.)";
  } else if (/15-minute reading time|reading time/i.test(text)) {
    translated = "प्रश्न-पत्र पढ़ने के लिए 15 मिनट का समय आवंटित किया गया है।";
  } else if (/Answers must be written clearly/i.test(text)) {
    translated = "उत्तर स्पष्ट रूप से चरणबद्ध गणना, चित्र और मुख्य शब्दों के साथ लिखे जाने चाहिए।";
  }

  if (mode === 'bilingual') {
    if (translated === text) return text;
    return `${text}\n(${translated})`;
  }

  return translated;
}

// Canonical Question Translation Repository
const QUESTION_EXACT_MAP: Record<string, string> = {
  // Math Class 10/9/12
  "If HCF(306, 657) = 9, then LCM(306, 657) is equal to:": "यदि HCF(306, 657) = 9 है, तो LCM(306, 657) का मान होगा:",
  "The discriminant of the quadratic equation 2x² - 4x + 3 = 0 is:": "द्विघात समीकरण 2x² - 4x + 3 = 0 का विविक्तकर (discriminant) है:",
  "If α and β are the zeros of the polynomial 2x² + 5x + k such that α² + β² + αβ = 21/4, find the value of k.": "यदि α और β बहुपद 2x² + 5x + k के इस प्रकार शून्यक हैं कि α² + β² + αβ = 21/4 है, तो k का मान ज्ञात कीजिए।",
  "The distance of the point P(2, 3) from the x-axis is:": "बिंदु P(2, 3) की x-अक्ष से दूरी है:",
  "The 10th term of the AP: 2, 7, 12, ... is:": "समांतर श्रेढ़ी (AP) 2, 7, 12, ... का 10वाँ पद है:",
  "If sin θ = 3/5, then the value of tan θ is:": "यदि sin θ = 3/5 है, तो tan θ का मान होगा:",
  "A die is thrown once. The probability of getting a prime number is:": "एक पासे को एक बार फेंका जाता है। एक अभाज्य संख्या प्राप्त करने की प्रायिकता होगी:",
  "Find the roots of the quadratic equation 2x² - 5x + 3 = 0 by factorisation.": "गुणनखंड विधि द्वारा द्विघात समीकरण 2x² - 5x + 3 = 0 के मूल ज्ञात कीजिए।",
  "Prove that √5 is an irrational number.": "सिद्ध कीजिए कि √5 एक अपरिमेय संख्या है।",
  "Find the coordinates of the point which divides the line segment joining (4, -3) and (8, 5) in the ratio 3:1 internally.": "उस बिंदु के निर्देशांक ज्ञात कीजिए जो (4, -3) और (8, 5) को जोड़ने वाले रेखाखंड को 3:1 के अनुपात में आंतरिक रूप से विभाजित करता है।",
  "State and prove Basic Proportionality Theorem (Thales Theorem).": "आधारभूत आनुपातिकता प्रमेय (थेल्स प्रमेय) का कथन लिखिए तथा इसे सिद्ध कीजिए।",

  // Science Class 10/9
  "Which of the following reaction represents a combination reaction?": "निम्नलिखित में से कौन-सी अभिक्रिया संयोजन अभिक्रिया को दर्शाती है?",
  "Which salt does not contain water of crystallization?": "किस लवण में क्रिस्टलन का जल नहीं होता है?",
  "Which metal reacts vigorously with cold water to evolve hydrogen gas?": "कौन-सी धातु ठंडे जल के साथ तीव्र अभिक्रिया करके हाइड्रोजन गैस उत्पन्न करती है?",
  "The breakdown of pyruvate to give carbon dioxide, water and energy takes place in:": "पाइरुवेट के विखंडन से कार्बन डाइऑक्साइड, जल तथा ऊर्जा देने का कार्य कहाँ होता है:",
  "The reproductive part of a plant is:": "पौधे का जनन अंग कौन-सा है:",
  "The SI unit of electrical resistivity is:": "विद्युत प्रतिरोधकता का SI मात्रक है:",
  "Which of the following is a non-biodegradable waste?": "निम्नलिखित में से कौन-सा अजैव निम्नीकरणीय कचरा है?",
  "The xylem in plants is responsible for:": "पौधों में जाइलम किसके लिए उत्तरदायी है:",
  "State Ohm's Law. Draw a circuit diagram to verify Ohm's law.": "ओम का नियम लिखिए। ओम के नियम के सत्यापन के लिए एक परिपथ आरेख बनाइए।",
  "Write balanced chemical equation for the reaction of steam on iron.": "लोहे पर भाप की अभिक्रिया के लिए संतुलित रासायनिक समीकरण लिखिए।",
  "Draw a neat and labelled diagram of human alimentary canal and label Stomach and Small Intestine.": "मानव पाचन तंत्र (आहार नाल) का स्वच्छ नामांकित चित्र बनाइए तथा आमाशय एवं क्षुद्रांत्र को नामांकित कीजिए।",

  // Social Science
  "Who among the following was proclaimed German Emperor in 1871 at Versailles?": "1871 में वर्साय में निम्नलिखित में से किसे जर्मन सम्राट घोषित किया गया था?",
  "Which soil is also known as Regur soil and is ideal for growing cotton?": "किस मृदा को रेगुर मृदा भी कहा जाता है और जो कपास की खेती के लिए उपयुक्त है?",
  "Which language was declared as the sole official language of Sri Lanka in 1956?": "1956 में श्रीलंका में किस भाषा को एकमात्र राजभाषा घोषित किया गया था?",
  "Which subject falls under the Concurrent List in Indian Federalism?": "भारतीय संघवाद में समवर्ती सूची के अंतर्गत कौन-सा विषय आता है?",
  "The sector of Indian economy which contributes highest to GDP today is:": "भारतीय अर्थव्यवस्था का कौन-सा क्षेत्र आज GDP में सर्वाधिक योगदान देता है?",
  "Which central agency issues currency notes in India on behalf of the Central Government?": "भारत में केंद्र सरकार की ओर से मुद्रा नोट कौन-सी एजेंसी जारी करती है?",
  "At which session of the Indian National Congress was the resolution for 'Purna Swaraj' passed in 1929?": "1929 में भारतीय राष्ट्रीय कांग्रेस के किस अधिवेशन में 'पूर्ण स्वराज' का प्रस्ताव पारित किया गया था?",
  "Which type of resource is solar energy?": "सौर ऊर्जा किस प्रकार का संसाधन है?"
};

// Sentence Pattern Replacements for Questions
const SENTENCE_PATTERNS: [RegExp, (match: string, ...args: any[]) => string][] = [
  // Assertion Reason
  [
    /Assertion\s*\((?:A)\)\s*:\s*(.*?)\s*\n?\s*Reason\s*\((?:R)\)\s*:\s*(.*)/is,
    (_, a, r) => `अभिकथन (A): ${a}\nतर्क (R): ${r}`
  ],
  // If the HCF of {a} and {b} is expressible in the form {expr}, find the value of {var}.
  [
    /^If\s+(?:the\s+)?HCF\s+of\s+(.*?)\s+and\s+(.*?)\s+is\s+expressible\s+in\s+the\s+form\s+(.*?)\,\s*(?:find\s+the\s+value\s+of|find)\s+(.*?)\.?$/i,
    (_, a, b, expr, v) => `यदि ${a} और ${b} का HCF, ${expr} के रूप में व्यक्त करने योग्य है, तो ${v} का मान ज्ञात कीजिए।`
  ],
  // If one zero of the polynomial {p} is the reciprocal of the other, then {v} is:
  [
    /^If\s+one\s+zero\s+of\s+(?:the\s+)?polynomial\s+(.*?)\s+is\s+(?:the\s+)?reciprocal\s+of\s+the\s+other\,\s*(?:then\s+)?(.*?)(?:\s+is\s*:)?\.?$/i,
    (_, p, v) => `यदि बहुपद ${p} का एक शून्यक दूसरे का व्युत्क्रम है, तो ${v} का मान है:`
  ],
  // If α and β are the zeros of the polynomial {p} such that {cond}, find the value of {v}.
  [
    /^If\s+([αβa-zA-Z\s\,]+)\s+are\s+the\s+zeros\s+of\s+the\s+polynomial\s+(.*?)\s+such\s+that\s+(.*?)\,\s*find\s+(?:the\s+value\s+of\s+)?(.*?)\.?$/i,
    (_, zeros, p, cond, v) => `यदि ${zeros} बहुपद ${p} के इस प्रकार शून्यक हैं कि ${cond} है, तो ${v} का मान ज्ञात कीजिए।`
  ],
  // The discriminant of the quadratic equation {eqn} is:
  [
    /^(?:The\s+)?discriminant\s+of\s+(?:the\s+)?quadratic\s+equation\s+(.*?)\s+is\s*:?\.?$/i,
    (_, eqn) => `द्विघात समीकरण ${eqn} का विविक्तकर (discriminant) है:`
  ],
  // The {n}th term of the AP: {ap} is:
  [
    /^(?:The\s+)?(\d+(?:st|nd|rd|th)?)\s+term\s+of\s+(?:the|an)?\s*AP\s*:?\s*(.*?)\s+is\s*:?\.?$/i,
    (_, n, ap) => `समांतर श्रेढ़ी (AP) ${ap} का ${n}वाँ पद है:`
  ],
  // The distance of the point {pt} from the {axis}-axis is:
  [
    /^(?:The\s+)?distance\s+of\s+(?:the\s+)?point\s+(.*?)\s+from\s+(?:the\s+)?([xy])-axis\s+is\s*:?\.?$/i,
    (_, pt, axis) => `बिंदु ${pt} की ${axis}-अक्ष से दूरी है:`
  ],
  // Find the roots of the quadratic equation {eqn} by factorisation.
  [
    /^Find\s+(?:the\s+)?roots\s+of\s+(?:the\s+)?quadratic\s+equation\s+(.*?)\s+by\s+factorisation\.?$/i,
    (_, eqn) => `गुणनखंड विधि द्वारा द्विघात समीकरण ${eqn} के मूल ज्ञात कीजिए।`
  ],
  // Prove that {num} is an irrational number.
  [
    /^Prove\s+that\s+(.*?)\s+is\s+an\s+irrational\s+number\.?$/i,
    (_, num) => `सिद्ध कीजिए कि ${num} एक अपरिमेय संख्या है।`
  ],
  // Find the coordinates of the point which divides the line segment joining {p1} and {p2} in the ratio {r} internally.
  [
    /^Find\s+(?:the\s+)?coordinates\s+of\s+(?:the\s+)?point\s+which\s+divides\s+(?:the\s+)?line\s+segment\s+joining\s+(.*?)\s+and\s+(.*?)\s+in\s+(?:the\s+)?ratio\s+(.*?)\s+internally\.?$/i,
    (_, p1, p2, r) => `बिंदुओं ${p1} और ${p2} को मिलाने वाले रेखाखंड को अनुपात ${r} में आंतरिक रूप से विभाजित करने वाले बिंदु के निर्देशांक ज्ञात कीजिए।`
  ],
  // If ... then ...
  [
    /^If\s+(.*?)\,\s*then\s+(?:find\s+the\s+value\s+of|the\s+value\s+of|find)\s+(.*?)\s*(?:is\s*:)?\.?$/i,
    (_, cond, target) => `यदि ${cond} है, तो ${target} का मान होगा:`
  ],
  // Solve the quadratic equation
  [
    /^Solve\s+the\s+quadratic\s+equation\s+(.*?)(?:\s+by\s+(.*?))?\.?$/i,
    (_, eqn, method) => method ? `द्विघात समीकरण ${eqn} को ${method} द्वारा हल कीजिए।` : `द्विघात समीकरण ${eqn} को हल कीजिए।`
  ],
  // Find the roots of
  [
    /^Find\s+the\s+roots\s+of\s+(.*?)\.?$/i,
    (_, eqn) => `समीकरण ${eqn} के मूल ज्ञात कीजिए।`
  ],
  // Find the value of
  [
    /^Find\s+the\s+value\s+of\s+(.*?)\.?$/i,
    (_, expr) => `${expr} का मान ज्ञात कीजिए।`
  ],
  // Find the sum of first N terms
  [
    /^Find\s+the\s+sum\s+of\s+first\s+(\d+)\s+terms\s+of\s+an\s+AP\s*(.*?)\.?$/i,
    (_, n, ap) => `समांतर श्रेढ़ी (AP) ${ap} के प्रथम ${n} पदों का योग ज्ञात कीजिए।`
  ],
  // Draw a neat and labelled diagram of
  [
    /^Draw\s+a\s+neat\s+(?:and\s+)?labelled\s+diagram\s+of\s+(.*?)\.?$/i,
    (_, obj) => `${obj} का स्वच्छ एवं नामांकित चित्र बनाइए।`
  ],
  // Differentiate between A and B
  [
    /^Differentiate\s+between\s+(.*?)\s+and\s+(.*?)\.?$/i,
    (_, a, b) => `${a} और ${b} के बीच अंतर स्पष्ट कीजिए।`
  ],
  // Write the balanced chemical equation for
  [
    /^Write\s+(?:the\s+)?balanced\s+chemical\s+equation\s+for\s+(.*?)\.?$/i,
    (_, rxn) => `${rxn} के लिए संतुलित रासायनिक समीकरण लिखिए।`
  ],
  // What is the role of
  [
    /^What\s+is\s+the\s+role\s+of\s+(.*?)(?:\s+in\s+(.*?))?\?$/i,
    (_, role, inWhat) => inWhat ? `${inWhat} में ${role} की क्या भूमिका है?` : `${role} की क्या भूमिका है?`
  ],
  // State ... law
  [
    /^State\s+(.*?)(?:\s*law|\s*theorem)?\.?$/i,
    (_, law) => `${law} का कथन लिखिए।`
  ]
];

// Helper to translate an English Question into clean Hindi
function getCleanHindiTranslation(text: string): string {
  const trimmed = text.trim();

  // 1. Check exact dictionary match
  if (QUESTION_EXACT_MAP[trimmed]) {
    return QUESTION_EXACT_MAP[trimmed];
  }

  // 2. Check pattern matching
  for (const [pattern, replacer] of SENTENCE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return trimmed.replace(pattern, replacer as any);
    }
  }

  // 3. Fallback: Clean sentence level vocabulary mapping
  let hindi = trimmed;
  
  if (/^If\s+/i.test(hindi) && /\,\s*(?:find|then)\s+/i.test(hindi)) {
    hindi = hindi
      .replace(/^If\s+/i, 'यदि ')
      .replace(/\,\s*then\s+find\s+the\s+value\s+of\s+/i, ', तो मान ज्ञात कीजिए: ')
      .replace(/\,\s*then\s+the\s+value\s+of\s+(.*?)\s+is\s*:/i, ', तो $1 का मान होगा:')
      .replace(/\,\s*find\s+the\s+value\s+of\s+/i, ', तो मान ज्ञात कीजिए: ');
  }

  // Common vocabulary replacements
  hindi = hindi
    .replace(/\bquadratic\s+equation\b/gi, 'द्विघात समीकरण')
    .replace(/\barithmetic\s+progression\b/gi, 'समांतर श्रेढ़ी')
    .replace(/\bpolynomial\b/gi, 'बहुपद')
    .replace(/\bdiscriminant\b/gi, 'विविक्तकर')
    .replace(/\bprobability\b/gi, 'प्रायिकता')
    .replace(/\bprime\s+number\b/gi, 'अभाज्य संख्या')
    .replace(/\bWhich\s+of\s+the\s+following\b/gi, 'निम्नलिखित में से कौन-सा')
    .replace(/\bis\s+equal\s+to\s*:\b/gi, 'के बराबर है:')
    .replace(/\bis\s+equal\s+to\b/gi, 'के बराबर है')
    .replace(/\bNo\s+solution\b/gi, 'कोई हल नहीं')
    .replace(/\bUnique\s+solution\b/gi, 'अद्वितीय हल')
    .replace(/\bInfinitely\s+many\s+solutions\b/gi, 'अपरिमित रूप से अनेक हल');

  return hindi;
}

// Main exported function to translate Question text
export function translateQuestionText(text: string, mode: LanguageMode, questionObj?: any): string {
  if (mode === 'en' || !text) return text;

  const hindiText = questionObj?.questionTextHindi || questionObj?.questionTextHi;

  // Check if explicit Hindi text is attached in question object
  if (hindiText) {
    if (mode === 'hi') return hindiText;
    if (mode === 'bilingual') {
      if (hindiText === text) return text;
      return `${text}\n${hindiText}`;
    }
  }

  // Check if text already contains Devanagari Hindi characters
  const hasHindi = /[\u0900-\u097F]/.test(text);
  if (hasHindi) return text;

  const hindiVer = getCleanHindiTranslation(text);

  if (mode === 'hi') {
    return hindiVer;
  }

  if (mode === 'bilingual') {
    if (hindiVer === text) return text;
    return `${text}\n${hindiVer}`;
  }

  return text;
}

// Translate option labels & text cleanly
export function translateOption(opt: string, mode: LanguageMode, optionHi?: string): string {
  if (mode === 'en' || !opt) return opt;
  if (/[\u0900-\u097F]/.test(opt)) return opt;

  if (optionHi) {
    if (mode === 'hi') return optionHi;
    if (mode === 'bilingual') {
      if (opt.trim() === optionHi.trim() || /^\s*[A-D\(\)\d\.\,\+\-\*\/\=\s]+\s*$/i.test(opt)) {
        return opt;
      }
      return `${opt}  /  ${optionHi}`;
    }
  }

  // Option translation dictionary
  const optionMap: Record<string, string> = {
    "A) No solution": "(क) कोई हल नहीं",
    "B) Unique solution": "(ख) अद्वितीय हल",
    "C) Infinitely many solutions": "(ग) अपरिमित रूप से अनेक हल",
    "D) Two solutions": "(घ) दो हल",
    "A) Both A and R are true and R is correct explanation of A": "(क) A और R दोनों सत्य हैं तथा R, A की सही व्याख्या करता है",
    "B) Both A and R are true but R is not correct explanation": "(ख) A और R दोनों सत्य हैं लेकिन R, A की सही व्याख्या नहीं करता है",
    "C) A is true but R is false": "(ग) A सत्य है लेकिन R असत्य है",
    "D) A is false but R is true": "(घ) A असत्य है लेकिन R सत्य है",
    "A) Baking Soda": "(क) बेकिंग सोडा",
    "B) Washing Soda": "(ख) धावन सोडा",
    "C) Blue Vitriol": "(ग) नीला थोथा",
    "D) Gypsum": "(घ) जिप्सम",
    "A) Sodium": "(क) सोडियम",
    "B) Iron": "(ख) लोहा",
    "C) Copper": "(ग) तांबा",
    "D) Gold": "(घ) सोना",
    "A) Mitochondria": "(क) माइटोकॉन्ड्रिया",
    "B) Cytoplasm": "(ख) कोशिकाद्रव्य",
    "C) Chloroplast": "(ग) हरितलवक",
    "D) Nucleus": "(घ) केंद्रक",
    "A) Black Soil": "(क) काली मृदा",
    "B) Alluvial Soil": "(ख) जलोढ़ मृदा",
    "C) Laterite Soil": "(ग) लेटराइट मृदा",
    "D) Arid Soil": "(घ) शुष्क मृदा",
    "A) Renewable Resource": "(क) नवीकरणीय संसाधन",
    "B) Non-renewable Resource": "(ख) गैर-नवीकरणीय संसाधन",
    "A) Liberalisation": "(क) उदारीकरण",
    "B) Privatisation": "(ख) निजीकरण",
    "C) Globalization": "(ग) वैश्वीकरण",
    "D) Nationalisation": "(घ) राष्ट्रीयकरण"
  };

  if (optionMap[opt]) {
    if (mode === 'hi') return optionMap[opt];
    if (mode === 'bilingual') return `${opt}  /  ${optionMap[opt]}`;
  }

  // Check if option is purely mathematical or numerical (e.g. "A) 2", "B) 3", "A) 5 units", "A) Na2SO4")
  const rawOptVal = opt.replace(/^(?:[A-D]|\([a-d\d]\))\)\s*/i, '').trim();
  const isPureMath = /^\s*[\d\.\,\+\-\*\/\=\^\(\)\s\w\%\°\√\π\÷]+\s*$/i.test(rawOptVal) && 
                     !/[a-zA-Z]{4,}/.test(rawOptVal);

  let hiOptText = opt
    .replace(/^A\)\s*/i, '(क) ')
    .replace(/^B\)\s*/i, '(ख) ')
    .replace(/^C\)\s*/i, '(ग) ')
    .replace(/^D\)\s*/i, '(घ) ')
    .replace(/^\(a\)\s*/i, '(क) ')
    .replace(/^\(b\)\s*/i, '(ख) ')
    .replace(/^\(c\)\s*/i, '(ग) ')
    .replace(/^\(d\)\s*/i, '(घ) ')
    .replace(/\bunits\b/gi, 'इकाई')
    .replace(/\bcm\b/gi, 'सेमी')
    .replace(/\bm\b/gi, 'मी');

  if (mode === 'hi') {
    return hiOptText;
  }

  if (mode === 'bilingual') {
    // If option is math/numeric or identical, do NOT duplicate
    if (isPureMath || hiOptText === opt) {
      return opt;
    }
    return `${opt}  /  ${hiOptText}`;
  }

  return opt;
}

// Translate answer/solution strings
export function translateAnswer(ans: string, mode: LanguageMode): string {
  if (mode === 'en' || !ans) return ans;

  if (/[\u0900-\u097F]/.test(ans)) return ans;

  let translated = ans
    .replace(/^Option\s*\(([A-D])\)\s*is correct/gi, 'विकल्प ($1) सही है।')
    .replace(/^Option\s*([A-D])\s*is correct/gi, 'विकल्प $1 सही है।')
    .replace(/\bCorrect Option:\s*/gi, 'सही विकल्प: ')
    .replace(/\bBecause\b/gi, 'क्योंकि')
    .replace(/\bGiven:\b/gi, 'दिया गया है:')
    .replace(/\bTo Prove:\b/gi, 'सिद्ध करना है:')
    .replace(/\bProof:\b/gi, 'उपपत्ति (प्रमाण):')
    .replace(/\bStep 1:\b/gi, 'चरण 1:')
    .replace(/\bStep 2:\b/gi, 'चरण 2:')
    .replace(/\bStep 3:\b/gi, 'चरण 3:')
    .replace(/\bStep 4:\b/gi, 'चरण 4:')
    .replace(/\bHence proved\.?\b/gi, 'इति सिद्धम (अतः सिद्ध हुआ)।')
    .replace(/\bTherefore,?\b/gi, 'अतः,')
    .replace(/\bAccording to Ohm's Law\b/gi, "ओम के नियम के अनुसार")
    .replace(/\bFormula:\b/gi, 'सूत्र:');

  if (mode === 'hi') return translated;
  if (mode === 'bilingual') {
    if (translated === ans) return ans;
    return `${ans}\n[उत्तर]: ${translated}`;
  }

  return ans;
}

// Translate header term
export function translateHeaderTerm(term: string, mode: LanguageMode): string {
  if (mode === 'en') return term;
  if (DICTIONARY[term]) {
    return mode === 'hi' ? DICTIONARY[term].hi : DICTIONARY[term].bilingual;
  }
  return term;
}

// Full Field-by-Field Paper State Language Transformation
export function translatePaperState(paper: GeneratedPaper, mode: LanguageMode): GeneratedPaper {
  if (!paper) return paper;

  if (mode === 'en') {
    return paper;
  }

  const translatedSections = paper.sections.map(sec => {
    const headerInfo = getFormattedSectionHeader(sec.sectionName, sec.description, paper.subjectCode);
    const translatedName = translateHeaderTerm(headerInfo.title, mode);
    const translatedDesc = translateInstruction(headerInfo.subtitle, mode);

    const translatedQuestions = sec.questions.map(q => {
      const translatedQText = translateQuestionText(q.questionText, mode, q);
      const rawPassage = q.casePassageHindi || q.casePassage;
      const translatedPassage = q.casePassage ? translateQuestionText(q.casePassage, mode, q.casePassageHindi ? { questionTextHindi: q.casePassageHindi } : undefined) : undefined;
      
      const translatedOptions = q.options?.map((opt, idx) => 
        translateOption(opt, mode, q.optionsHindi?.[idx] || (q as any).optionsHi?.[idx])
      );

      const translatedAns = q.correctAnswerHindi
        ? (mode === 'hi' ? q.correctAnswerHindi : mode === 'bilingual' ? `${q.correctAnswer}\n[उत्तर]: ${q.correctAnswerHindi}` : q.correctAnswer)
        : translateAnswer(q.correctAnswer, mode);

      const translatedMS = q.markingSchemeHindi
        ? (mode === 'hi' ? q.markingSchemeHindi : mode === 'bilingual' ? `${q.markingScheme}\n[अंकन योजना]: ${q.markingSchemeHindi}` : q.markingScheme)
        : translateInstruction(q.markingScheme, mode);

      return {
        ...q,
        questionText: translatedQText,
        casePassage: translatedPassage,
        options: translatedOptions,
        correctAnswer: translatedAns,
        markingScheme: translatedMS,
      };
    });

    return {
      ...sec,
      sectionName: translatedName,
      description: translatedDesc,
      questions: translatedQuestions
    };
  });

  const translatedGenInst = paper.generalInstructions?.map(inst => 
    translateInstruction(inst, mode)
  );

  return {
    ...paper,
    generalInstructions: translatedGenInst,
    sections: translatedSections,
  };
}
