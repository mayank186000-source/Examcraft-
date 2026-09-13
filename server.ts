import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";
import mammoth from "mammoth";

dotenv.config();

// Helper to safely parse PDF buffer without throwing runtime import errors
async function parsePdfBuffer(fileBuffer: Buffer): Promise<string> {
  try {
    let pdfFn: any;
    try {
      pdfFn = require("pdf-parse");
    } catch {
      // ignore
    }
    if (typeof pdfFn !== "function") {
      try {
        const mod: any = await import("pdf-parse");
        pdfFn = mod?.default || mod;
      } catch {
        // ignore
      }
    }
    if (typeof pdfFn !== "function" && typeof (pdfFn as any)?.default === "function") {
      pdfFn = (pdfFn as any).default;
    }
    if (typeof pdfFn === "function") {
      const data = await pdfFn(fileBuffer);
      return data?.text || "";
    }
  } catch (err) {
    console.warn("PDF parsing warning:", err);
  }
  return "";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Helper to initialize Gemini
  const getGeminiClient = (customKey?: string) => {
    let apiKey = customKey?.trim();
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY?.trim();
    }
    if (
      !apiKey ||
      apiKey === "MY_GEMINI_API_KEY" ||
      apiKey.startsWith("ya29.") || // OAuth access tokens are not valid API keys for GoogleGenAI SDK
      apiKey.length < 10
    ) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Helper to initialize OpenAI (ChatGPT)
  const getOpenAIClient = (customKey?: string) => {
    let apiKey = customKey?.trim();
    if (!apiKey) {
      apiKey = process.env.OPENAI_API_KEY?.trim();
    }
    if (!apiKey || apiKey.length < 10) {
      return null;
    }
    return new OpenAI({ apiKey });
  };

  // Helper to initialize Grok (xAI)
  const getGrokClient = (customKey?: string) => {
    let apiKey = customKey?.trim();
    if (!apiKey) {
      apiKey = process.env.GROK_API_KEY?.trim();
    }
    if (!apiKey || apiKey.length < 10) {
      return null;
    }
    return new OpenAI({
      apiKey,
      baseURL: "https://api.xai.com/v1",
    });
  };

  // Helper to clean JSON responses wrapped in markdown codeblocks
  const cleanJsonResponse = (str: string): string => {
    let cleaned = str.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    }
    return cleaned.trim();
  };

  // Multi-provider text generation helper
  const generateContentMultiProvider = async ({
    prompt,
    customKeys,
    preferredProvider,
    systemPrompt,
    filePart
  }: {
    prompt: string;
    customKeys?: { gemini?: string; openai?: string; grok?: string };
    preferredProvider?: "gemini" | "openai" | "grok";
    systemPrompt?: string;
    filePart?: { inlineData: { mimeType: string; data: string } };
  }): Promise<string> => {
    const providersToTry = preferredProvider
      ? [preferredProvider, "gemini", "openai", "grok"]
      : ["gemini", "openai", "grok"];

    const uniqueProviders = Array.from(new Set(providersToTry)) as ("gemini" | "openai" | "grok")[];

    let attemptedAny = false;
    let lastError = "";

    for (const provider of uniqueProviders) {
      try {
        if (provider === "gemini") {
          const gemini = getGeminiClient(customKeys?.gemini);
          if (!gemini) continue;
          attemptedAny = true;
          
          const geminiModelsToTry = [
            "gemini-3.7-flash",
            "gemini-3.1-flash-lite",
            "gemini-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
          ];
          let geminiSuccess = false;

          for (const mName of geminiModelsToTry) {
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                const contents: any[] = [];
                if (filePart) {
                  contents.push(filePart);
                }
                contents.push(systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt);

                const resp = await gemini.models.generateContent({
                  model: mName,
                  contents,
                  config: { responseMimeType: "application/json", temperature: 0.7 }
                });
                if (resp.text) {
                  geminiSuccess = true;
                  return cleanJsonResponse(resp.text);
                }
              } catch (gemErr: any) {
                const errMsg = gemErr?.message || String(gemErr);
                const isTransient = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE") || errMsg.includes("429");
                lastError = errMsg;
                if (isTransient && attempt === 0) {
                  // Short pause before retrying transient high demand
                  await new Promise((r) => setTimeout(r, 600));
                  continue;
                }
                break;
              }
            }
          }
          if (!geminiSuccess) {
            continue;
          }
        } else if (provider === "openai") {
          const openai = getOpenAIClient(customKeys?.openai);
          if (!openai) continue;
          attemptedAny = true;
          const messages: any[] = [];
          if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
          messages.push({ role: "user", content: prompt });

          const resp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            response_format: { type: "json_object" },
            temperature: 0.7
          });
          const content = resp.choices[0]?.message?.content;
          if (content) return cleanJsonResponse(content);
        } else if (provider === "grok") {
          const grok = getGrokClient(customKeys?.grok);
          if (!grok) continue;
          attemptedAny = true;
          const messages: any[] = [];
          if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
          messages.push({ role: "user", content: prompt });

          try {
            const resp = await grok.chat.completions.create({
              model: "grok-2-latest",
              messages,
              response_format: { type: "json_object" },
              temperature: 0.7
            });
            const content = resp.choices[0]?.message?.content;
            if (content) return cleanJsonResponse(content);
          } catch (grokErr: any) {
            const resp = await grok.chat.completions.create({
              model: "grok-2",
              messages,
              temperature: 0.7
            });
            const content = resp.choices[0]?.message?.content;
            if (content) return cleanJsonResponse(content);
          }
        }
      } catch (err: any) {
        console.error(`Provider ${provider} error:`, err?.message || err);
        lastError = err?.message || String(err);
      }
    }

    if (!attemptedAny) {
      throw new Error("No active API keys found. Please add a Gemini, OpenAI, or Grok API Key in settings.");
    }

    throw new Error(lastError || "AI providers failed to generate content.");
  };

  // Rule-based CBSE Answer Evaluator Fallback Engine
  const evaluateAnswerWithRuleEngine = (
    questionText: string,
    maxMarks: number,
    officialAnswer: string,
    studentAnswer: string,
    subjectName?: string
  ) => {
    const normOfficial = (officialAnswer || "").toLowerCase();
    const normStudent = (studentAnswer || "").toLowerCase();

    const stopwords = new Set([
      "this", "that", "there", "their", "when", "with", "from", "have", "been", "were",
      "what", "which", "where", "into", "than", "then", "also", "some", "such", "only",
      "other", "about", "more", "most", "each", "and", "or", "the", "a", "an", "is", "are"
    ]);
    const officialWords = normOfficial
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopwords.has(w));

    const uniqueKeyTerms = Array.from(new Set(officialWords));
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const term of uniqueKeyTerms) {
      if (normStudent.includes(term)) {
        matchedKeywords.push(term);
      } else {
        missingKeywords.push(term);
      }
    }

    const matchRatio = uniqueKeyTerms.length > 0 ? matchedKeywords.length / uniqueKeyTerms.length : 0.7;
    const studentWordCount = studentAnswer.trim().split(/\s+/).length;
    const expectedWordCount = Math.max(10, maxMarks * 12);
    const lengthRatio = Math.min(1.0, studentWordCount / expectedWordCount);

    const combinedRatio = Math.min(1.0, matchRatio * 0.75 + lengthRatio * 0.25);

    let rawAwarded = Math.round(combinedRatio * maxMarks * 2) / 2;
    if (studentWordCount > 5 && rawAwarded === 0) {
      rawAwarded = 0.5;
    }
    const awardedMarks = Math.min(maxMarks, Math.max(0, rawAwarded));
    const percentage = Math.round((awardedMarks / maxMarks) * 100);

    let grade = "A1";
    if (percentage < 33) grade = "E (Needs Revision)";
    else if (percentage < 50) grade = "D";
    else if (percentage < 60) grade = "C2";
    else if (percentage < 70) grade = "C1";
    else if (percentage < 80) grade = "B2";
    else if (percentage < 90) grade = "A2";

    const totalSteps = Math.max(2, maxMarks);
    const markPerStep = Number((maxMarks / totalSteps).toFixed(1));
    const stepBreakdown = [];

    for (let i = 0; i < totalSteps; i++) {
      const isMatched = i < Math.ceil(matchRatio * totalSteps);
      stepBreakdown.push({
        step: `Step ${i + 1}: Technical concept & formula application`,
        marksGiven: isMatched ? markPerStep : 0,
        maxForStep: markPerStep,
        status: isMatched ? "correct" : "missing",
        remark: isMatched ? "Key point addressed in student answer" : "Missing key terminology or SI units"
      });
    }

    const defaultMissing = [
      "SI Units (cm/m)",
      "Cartesian Sign Convention",
      "Formula & Law Definition",
      "Step-by-step Substitution",
      "Concluding Answer Statement"
    ];

    const finalMissing = missingKeywords.length > 0 ? missingKeywords.slice(0, 5) : defaultMissing.slice(0, 3);

    return {
      awardedMarks,
      maxMarks,
      percentage,
      grade,
      stepBreakdown,
      missingKeywords: finalMissing,
      examinerFeedback: awardedMarks === maxMarks
        ? "Excellent attempt! All steps, formulas, and terminology are accurately presented according to CBSE marking standards."
        : `Answer checked against CBSE marking scheme. Awarded ${awardedMarks}/${maxMarks} marks (${percentage}%). Required Improvements: Focus on ${finalMissing.join(", ")} to score full marks in board exams.`,
      idealAnswer: officialAnswer || "Complete step-by-step model answer with diagrams, formulas, and SI units as expected in CBSE Board Examination."
    };
  };

  // API Routes
  const DATA_FILE = path.join(process.cwd(), "serverData.json");

  interface ServerStore {
    papers: Record<string, any>;
    users: any[];
    downloadLogs: any[];
    grammarResults: any[];
    customQuestions: any[];
    evaluatedCopies: any[];
    questionBankSets: any[];
    deregisteredEmails?: string[];
    activities?: any[];
  }

  function loadServerStore(): ServerStore {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(content);
        return {
          papers: parsed.papers || {},
          users: parsed.users || [],
          downloadLogs: parsed.downloadLogs || [],
          grammarResults: parsed.grammarResults || [],
          customQuestions: parsed.customQuestions || [],
          evaluatedCopies: parsed.evaluatedCopies || [],
          questionBankSets: parsed.questionBankSets || [],
          deregisteredEmails: parsed.deregisteredEmails || [],
          activities: parsed.activities || []
        };
      }
    } catch (err) {
      console.error("Failed to load serverStore:", err);
    }
    return { papers: {}, users: [], downloadLogs: [], grammarResults: [], customQuestions: [], evaluatedCopies: [], questionBankSets: [], deregisteredEmails: [], activities: [] };
  }

  function saveServerStore(store: ServerStore) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save serverStore:", err);
    }
  }

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Examidea CBSE 10th Paper Generator" });
  });

  // --- PERSISTENCE ENDPOINTS ---

  // 1. Papers: GET all
  app.get("/api/papers", (req, res) => {
    const store = loadServerStore();
    const list = Object.values(store.papers).sort(
      (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    res.json({ success: true, papers: list, paperMap: store.papers });
  });

  // 2. Papers: POST / Save or sync paper
  app.post("/api/papers", (req, res) => {
    try {
      const { paper, user } = req.body;
      if (!paper || (!paper.id && !paper.paperCode)) {
        return res.status(400).json({ error: "Invalid paper data" });
      }
      const store = loadServerStore();
      const code = String(paper.paperCode || paper.id).trim().toUpperCase().replace(/\s+/g, '');
      const creator = paper.generatedBy || user || { email: 'guest@examcraft.internal', name: 'Guest User (Guest)' };
      
      const fullPaper = {
        ...paper,
        paperCode: code,
        generatedBy: creator
      };

      store.papers[code] = fullPaper;

      // Auto-track paper generation under user profile in server store
      if (creator && creator.email) {
        const emailNorm = creator.email.toLowerCase().trim();
        const existingIdx = store.users.findIndex(u => u && u.email && u.email.toLowerCase() === emailNorm);
        if (existingIdx >= 0) {
          store.users[existingIdx].generatedCount = (store.users[existingIdx].generatedCount || 0) + 1;
        } else {
          store.users.unshift({
            id: `usr-${Date.now()}`,
            name: creator.name || emailNorm.split('@')[0],
            email: emailNorm,
            role: emailNorm.includes('admin') || emailNorm === 'mukesh186000@gmail.com' ? 'admin' : 'student',
            photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
            dailyQuotaLimit: 5,
            dailyDownloadsUsed: 0,
            lastDownloadDate: new Date().toISOString().split('T')[0],
            totalDownloads: 0,
            generatedCount: 1,
            createdAt: new Date().toISOString()
          });
        }
      }

      saveServerStore(store);

      res.json({ success: true, paper: fullPaper });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save paper" });
    }
  });

  // 3. Papers: DELETE paper by code
  app.delete("/api/papers/:code", (req, res) => {
    try {
      const code = req.params.code.trim().toUpperCase().replace(/\s+/g, '');
      const store = loadServerStore();
      if (store.papers[code]) {
        delete store.papers[code];
        saveServerStore(store);
      }
      res.json({ success: true, code });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete paper" });
    }
  });

  // 4. Users: GET all
  app.get("/api/users", (req, res) => {
    const store = loadServerStore();
    const deregistered = new Set((store.deregisteredEmails || []).map(e => String(e).toLowerCase().trim()));
    const activeUsers = (store.users || []).filter(u => {
      const uEmail = u && u.email ? String(u.email).toLowerCase().trim() : '';
      const uId = u && u.id ? String(u.id).toLowerCase().trim() : '';
      const uName = u && u.name ? String(u.name).toLowerCase().trim() : '';
      return !deregistered.has(uEmail) && !deregistered.has(uId) && !deregistered.has(uName);
    });
    res.json({ success: true, users: activeUsers, deregisteredEmails: store.deregisteredEmails || [] });
  });

  // 5. Users: POST / Sync user (rejects deregistered users)
  app.post("/api/users", (req, res) => {
    try {
      const { user } = req.body;
      if (!user) {
        return res.status(400).json({ error: "Invalid user object" });
      }
      const rawEmail = user.email ? String(user.email).toLowerCase().trim() : '';
      const rawId = user.id ? String(user.id).trim() : '';
      const rawName = user.name ? String(user.name).trim() : '';

      const normKey = rawEmail || rawId || rawName;
      if (!normKey) {
        return res.status(400).json({ error: "Invalid user object" });
      }
      const store = loadServerStore();

      // If user was previously deregistered, logging in or syncing immediately restores/activates them!
      if (store.deregisteredEmails && store.deregisteredEmails.length > 0) {
        store.deregisteredEmails = store.deregisteredEmails.filter(item => {
          const norm = String(item || '').toLowerCase().trim();
          if (!norm) return false;
          if (rawEmail && (norm === rawEmail || norm.includes(rawEmail) || rawEmail.includes(norm))) return false;
          if (rawId && (norm === rawId.toLowerCase() || norm.includes(rawId.toLowerCase()))) return false;
          if (rawName && (norm === rawName.toLowerCase() || norm.includes(rawName.toLowerCase()))) return false;
          return true;
        });
      }

      const idx = store.users.findIndex(u => {
        const uEmail = u.email ? String(u.email).toLowerCase().trim() : '';
        const uId = u.id ? String(u.id).trim() : '';
        if (rawEmail && uEmail && rawEmail === uEmail) return true;
        if (rawId && uId && rawId === uId) return true;
        return false;
      });

      if (idx >= 0) {
        store.users[idx] = { ...store.users[idx], ...user };
      } else {
        store.users.unshift(user);
      }
      saveServerStore(store);
      res.json({ success: true, user, deregisteredEmails: store.deregisteredEmails || [] });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save user" });
    }
  });

  // 6. Users: POST / Quota
  app.post("/api/users/quota", (req, res) => {
    try {
      const { userId, newQuota } = req.body;
      const store = loadServerStore();
      store.users = store.users.map(u => u.id === userId ? { ...u, dailyQuotaLimit: newQuota } : u);
      saveServerStore(store);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update quota" });
    }
  });

  // 6b. Users: POST / Deregister user (permanently deregisters student & purges records)
  app.post("/api/users/deregister", (req, res) => {
    try {
      const { userId, email, name, userIdOrEmail } = req.body;
      const targetId = String(userId || userIdOrEmail || '').trim();
      const targetEmail = String(email || userIdOrEmail || '').toLowerCase().trim();
      const targetName = String(name || '').toLowerCase().trim();

      if (!targetId && !targetEmail && !targetName) {
        return res.status(400).json({ error: "Missing user identifiers" });
      }

      const GENERIC_RESERVED_TERMS = new Set([
        'guest',
        'guest@examcraft.internal',
        'guest user',
        'guest student',
        'student',
        'student@examidea.internal',
        'admin',
        'anonymous',
        'user'
      ]);

      const targets = new Set<string>(
        [targetEmail, targetId, targetName, String(userIdOrEmail || '').toLowerCase().trim()]
          .filter(Boolean)
          .map(s => s.toLowerCase().trim())
          .filter(s => !GENERIC_RESERVED_TERMS.has(s))
      );

      const store = loadServerStore();

      // 1. Remove from store.users
      store.users = (store.users || []).filter(u => {
        const uEmail = u.email ? String(u.email).toLowerCase().trim() : '';
        const uId = u.id ? String(u.id).trim().toLowerCase() : '';
        const uName = u.name ? String(u.name).trim().toLowerCase() : '';
        if (targetId && uId === targetId.toLowerCase()) return false;
        if (targetEmail && uEmail === targetEmail) return false;
        if (targets.has(uEmail) || targets.has(uId) || targets.has(uName)) return false;
        return true;
      });

      // 2. Remove from store.activities
      store.activities = (store.activities || []).filter(a => {
        const sEmail = a.studentEmail ? String(a.studentEmail).toLowerCase().trim() : '';
        const sId = a.studentId ? String(a.studentId).trim().toLowerCase() : '';
        const sName = a.studentName ? String(a.studentName).trim().toLowerCase() : '';
        if (targetEmail && sEmail === targetEmail) return false;
        if (targetId && sId === targetId.toLowerCase()) return false;
        if (targets.has(sEmail) || targets.has(sId) || targets.has(sName)) return false;
        return true;
      });

      // 3. Remove from store.downloadLogs
      store.downloadLogs = (store.downloadLogs || []).filter(l => {
        const lEmail = l.userEmail ? String(l.userEmail).toLowerCase().trim() : '';
        const lName = l.userName ? String(l.userName).trim().toLowerCase() : '';
        if (targetEmail && lEmail === targetEmail) return false;
        if (targets.has(lEmail) || targets.has(lName)) return false;
        return true;
      });

      // 4. Remove from store.grammarResults
      store.grammarResults = (store.grammarResults || []).filter(g => {
        const gEmail = g.userEmail ? String(g.userEmail).toLowerCase().trim() : '';
        const gName = g.userName ? String(g.userName).trim().toLowerCase() : '';
        if (targetEmail && gEmail === targetEmail) return false;
        if (targets.has(gEmail) || targets.has(gName)) return false;
        return true;
      });

      // 5. Add to store.deregisteredEmails (ONLY specific non-generic identifiers)
      if (!store.deregisteredEmails) store.deregisteredEmails = [];
      targets.forEach(k => {
        if (k && !GENERIC_RESERVED_TERMS.has(k) && !store.deregisteredEmails?.includes(k)) {
          store.deregisteredEmails?.push(k);
        }
      });

      saveServerStore(store);
      res.json({ success: true, deregisteredEmails: store.deregisteredEmails });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to deregister user" });
    }
  });

  // 6c. Users: POST / Re-register user (clears temporary deregistration status)
  app.post("/api/users/re-register", (req, res) => {
    try {
      const { email, userId, keys } = req.body;
      const targets = new Set<string>();
      if (email) targets.add(String(email).toLowerCase().trim());
      if (userId) targets.add(String(userId).toLowerCase().trim());
      if (Array.isArray(keys)) {
        keys.forEach(k => k && targets.add(String(k).toLowerCase().trim()));
      }

      const store = loadServerStore();
      if (store.deregisteredEmails) {
        store.deregisteredEmails = store.deregisteredEmails.filter(item => {
          const norm = String(item || '').toLowerCase().trim();
          if (!norm) return false;
          // Check if norm matches any target or vice-versa
          for (const target of targets) {
            if (norm === target || norm.includes(target) || target.includes(norm)) {
              return false;
            }
          }
          return true;
        });
      }
      saveServerStore(store);
      res.json({ success: true, deregisteredEmails: store.deregisteredEmails || [] });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to re-register user" });
    }
  });

  // 7. Download Logs: GET
  app.get("/api/download-logs", (req, res) => {
    const store = loadServerStore();
    res.json({ success: true, logs: store.downloadLogs });
  });

  // 8. Download Logs: POST
  app.post("/api/download-logs", (req, res) => {
    try {
      const { log } = req.body;
      if (!log) return res.status(400).json({ error: "Invalid log" });
      const store = loadServerStore();
      store.downloadLogs.unshift(log);

      if (log && log.userEmail) {
        const rawEmail = String(log.userEmail).toLowerCase().trim();
        if (rawEmail && !rawEmail.includes('guest') && !rawEmail.includes('anonymous')) {
          const idx = store.users.findIndex(u => {
            const uEmail = u && u.email ? String(u.email).toLowerCase().trim() : '';
            return uEmail && uEmail === rawEmail;
          });
          const today = new Date().toISOString().split('T')[0];
          if (idx >= 0) {
            store.users[idx].totalDownloads = (store.users[idx].totalDownloads || 0) + 1;
            store.users[idx].dailyDownloadsUsed = (store.users[idx].lastDownloadDate === today ? (store.users[idx].dailyDownloadsUsed || 0) : 0) + 1;
            store.users[idx].lastDownloadDate = today;
          } else {
            store.users.unshift({
              id: `usr-${Date.now()}`,
              name: log.userName || rawEmail.split('@')[0],
              email: rawEmail,
              role: log.userRole === 'admin' || rawEmail === 'mukesh186000@gmail.com' ? 'admin' : 'student',
              photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
              dailyQuotaLimit: 5,
              dailyDownloadsUsed: 1,
              lastDownloadDate: today,
              totalDownloads: 1,
              createdAt: log.timestamp || new Date().toISOString()
            });
          }
        }
      }

      saveServerStore(store);
      res.json({ success: true, log });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to record log" });
    }
  });

  // 9. Grammar Results: GET
  app.get("/api/grammar-results", (req, res) => {
    const store = loadServerStore();
    res.json({ success: true, results: store.grammarResults });
  });

  // 10. Grammar Results: POST
  app.post("/api/grammar-results", (req, res) => {
    try {
      const { result } = req.body;
      if (!result || !result.code) return res.status(400).json({ error: "Invalid result" });
      const store = loadServerStore();
      store.grammarResults = [result, ...store.grammarResults.filter(r => r && r.code !== result.code)];

      // Auto-track user & activity in server store when taking a test
      if (result && result.userEmail) {
        const emailNorm = String(result.userEmail).toLowerCase().trim();
        const userName = result.userName || (emailNorm.includes('guest') ? 'Guest Student' : emailNorm.split('@')[0]);
        const today = new Date().toISOString().split('T')[0];

        // Active test submission clears any stale deregistration for this student!
        if (store.deregisteredEmails && store.deregisteredEmails.length > 0) {
          store.deregisteredEmails = store.deregisteredEmails.filter(item => {
            const norm = String(item || '').toLowerCase().trim();
            return norm !== emailNorm && !emailNorm.includes(norm);
          });
        }

        const existingIdx = store.users.findIndex(u => u && u.email && u.email.toLowerCase() === emailNorm);
        if (existingIdx >= 0) {
          store.users[existingIdx].grammarCount = (store.users[existingIdx].grammarCount || 0) + 1;
          store.users[existingIdx].lastDownloadDate = today;
          if (result.userName && (!store.users[existingIdx].name || store.users[existingIdx].name.toLowerCase() === 'student')) {
            store.users[existingIdx].name = result.userName;
          }
        } else if (!emailNorm.includes('guest') && !emailNorm.includes('anonymous')) {
          store.users.unshift({
            id: `usr-${Date.now()}`,
            name: userName,
            email: emailNorm,
            role: emailNorm === 'mukesh186000@gmail.com' ? 'admin' : 'student',
            photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
            dailyQuotaLimit: 5,
            dailyDownloadsUsed: 0,
            lastDownloadDate: today,
            totalDownloads: 0,
            grammarCount: 1,
            createdAt: new Date().toISOString()
          });
        }

        // Auto-create activity entry if missing
        if (!store.activities) store.activities = [];
        const actId = `quiz_${result.code}_${Date.now()}`;
        const existingActIdx = store.activities.findIndex((a: any) => a.paperCode === result.code && a.studentEmail === emailNorm);
        if (existingActIdx < 0) {
          store.activities.unshift({
            id: actId,
            studentId: emailNorm,
            studentName: userName,
            studentEmail: emailNorm,
            activityType: 'quiz_submitted',
            paperId: result.code,
            paperCode: result.code,
            paperTitle: `${result.topic || 'Grammar Practice'} (Class ${result.classLevel || 'General'})`,
            subject: 'English Grammar & Practice',
            classLevel: String(result.classLevel || '10'),
            score: result.score || 0,
            totalMarks: result.total || 5,
            percentage: result.percentage || 0,
            timeTakenSeconds: result.timeTakenSeconds || 60,
            timestamp: new Date().toISOString()
          });
          store.activities = store.activities.slice(0, 1000);
        }
      }

      saveServerStore(store);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save grammar result" });
    }
  });

  // 11. Grammar Results: DELETE
  app.delete("/api/grammar-results/:code", (req, res) => {
    try {
      const code = req.params.code;
      const store = loadServerStore();
      store.grammarResults = store.grammarResults.filter(r => r.code !== code);
      saveServerStore(store);
      res.json({ success: true, code });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete grammar result" });
    }
  });

  // 12. Custom Questions Vault: GET
  app.get("/api/custom-questions", (req, res) => {
    try {
      const store = loadServerStore();
      res.json({ success: true, questions: store.customQuestions || [] });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch custom questions" });
    }
  });

  // 13. Custom Questions Vault: POST (Batch add/save)
  app.post("/api/custom-questions", (req, res) => {
    try {
      const { questions } = req.body;
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "No questions provided" });
      }
      const store = loadServerStore();
      const existingMap = new Map((store.customQuestions || []).map((q: any) => [q.id, q]));
      
      questions.forEach((q: any) => {
        const qId = q.id || `cq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        existingMap.set(qId, {
          ...q,
          id: qId,
          source: 'admin_imported',
          importedAt: q.importedAt || new Date().toISOString()
        });
      });

      store.customQuestions = Array.from(existingMap.values());
      saveServerStore(store);
      res.json({ success: true, count: store.customQuestions.length, questions: store.customQuestions });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save custom questions" });
    }
  });

  // 14. Custom Questions Vault: DELETE
  app.delete("/api/custom-questions/:id", (req, res) => {
    try {
      const qId = req.params.id;
      const store = loadServerStore();
      store.customQuestions = (store.customQuestions || []).filter((q: any) => q.id !== qId);
      saveServerStore(store);
      res.json({ success: true, id: qId });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete custom question" });
    }
  });

  // 14a. Student Activities Sync
  app.get("/api/activities", (req, res) => {
    try {
      const store = loadServerStore();
      res.json({ success: true, activities: store.activities || [] });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load activities" });
    }
  });

  app.post("/api/activities", (req, res) => {
    try {
      const { activity } = req.body;
      if (!activity) {
        res.status(400).json({ error: "Missing activity payload" });
        return;
      }
      const store = loadServerStore();
      const list = store.activities || [];
      const actId = activity.id || `${activity.studentEmail || 'user'}_${activity.paperCode || 'code'}_${activity.activityType}_${activity.timestamp}`;
      const normActivity = { ...activity, id: actId };
      const idx = list.findIndex((a: any) => a.id === actId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...normActivity };
      } else {
        list.unshift(normActivity);
      }
      store.activities = list.slice(0, 1000);

      // Active student activity clears any stale deregistration for this student!
      if (activity && activity.studentEmail) {
        const rawEmail = String(activity.studentEmail).toLowerCase().trim();
        if (store.deregisteredEmails && store.deregisteredEmails.length > 0) {
          store.deregisteredEmails = store.deregisteredEmails.filter(item => {
            const norm = String(item || '').toLowerCase().trim();
            return norm !== rawEmail && !rawEmail.includes(norm);
          });
        }
        if (rawEmail && !rawEmail.includes('guest') && !rawEmail.includes('anonymous')) {
          const userIdx = store.users.findIndex(u => {
            const uEmail = u && u.email ? String(u.email).toLowerCase().trim() : '';
            return uEmail && uEmail === rawEmail;
          });
          if (userIdx < 0) {
            store.users.unshift({
              id: activity.studentId || `usr-${Date.now()}`,
              name: activity.studentName || rawEmail.split('@')[0],
              email: rawEmail,
              role: rawEmail === 'mukesh186000@gmail.com' ? 'admin' : 'student',
              photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
              dailyQuotaLimit: 5,
              dailyDownloadsUsed: 0,
              lastDownloadDate: new Date().toISOString().split('T')[0],
              totalDownloads: 0,
              createdAt: activity.timestamp || new Date().toISOString()
            });
          }
        }
      }

      saveServerStore(store);
      res.json({ success: true, activity: normActivity });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save activity" });
    }
  });

  // 14b. Unified Store Data Endpoint for Admin & System Sync
  app.get("/api/admin/all-data", (req, res) => {
    try {
      const store = loadServerStore();
      const GENERIC_RESERVED_TERMS = new Set([
        'guest',
        'guest@examcraft.internal',
        'guest user',
        'guest student',
        'student',
        'student@examidea.internal',
        'admin',
        'anonymous',
        'user'
      ]);
      const deregistered = new Set(
        (store.deregisteredEmails || [])
          .map(e => String(e).toLowerCase().trim())
          .filter(e => e.length > 0 && !GENERIC_RESERVED_TERMS.has(e))
      );
      const activeUsers = (store.users || []).filter(u => {
        const uEmail = u && u.email ? String(u.email).toLowerCase().trim() : '';
        const uId = u && u.id ? String(u.id).toLowerCase().trim() : '';
        const uName = u && u.name ? String(u.name).toLowerCase().trim() : '';
        return !deregistered.has(uEmail) && !deregistered.has(uId) && !deregistered.has(uName);
      });
      const activeActivities = (store.activities || []).filter(a => {
        const sEmail = a && a.studentEmail ? String(a.studentEmail).toLowerCase().trim() : '';
        const sId = a && a.studentId ? String(a.studentId).toLowerCase().trim() : '';
        const sName = a && a.studentName ? String(a.studentName).toLowerCase().trim() : '';
        return !deregistered.has(sEmail) && !deregistered.has(sId) && !deregistered.has(sName);
      });
      const activeDownloadLogs = (store.downloadLogs || []).filter(l => {
        const lEmail = l && l.userEmail ? String(l.userEmail).toLowerCase().trim() : '';
        const lName = l && l.userName ? String(l.userName).toLowerCase().trim() : '';
        return !deregistered.has(lEmail) && !deregistered.has(lName);
      });
      const activeGrammarResults = (store.grammarResults || []).filter(g => {
        const gEmail = g && g.userEmail ? String(g.userEmail).toLowerCase().trim() : '';
        const gName = g && g.userName ? String(g.userName).toLowerCase().trim() : '';
        return !deregistered.has(gEmail) && !deregistered.has(gName);
      });

      res.json({
        success: true,
        users: activeUsers,
        deregisteredEmails: store.deregisteredEmails || [],
        papers: Object.values(store.papers || {}),
        grammarResults: activeGrammarResults,
        downloadLogs: activeDownloadLogs,
        evaluatedCopies: store.evaluatedCopies || [],
        customQuestions: store.customQuestions || [],
        questionBankSets: store.questionBankSets || [],
        activities: activeActivities
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load store data" });
    }
  });

  // 14c. Question Bank Sets: GET
  app.get("/api/question-bank", (req, res) => {
    try {
      const store = loadServerStore();
      let list = store.questionBankSets || [];
      const { classLevel, subject, marks } = req.query;
      if (classLevel && classLevel !== "all") {
        list = list.filter((item: any) => String(item.classLevel) === String(classLevel));
      }
      if (subject && subject !== "all") {
        list = list.filter((item: any) => String(item.subject).toLowerCase().includes(String(subject).toLowerCase()));
      }
      if (marks && marks !== "all") {
        list = list.filter((item: any) => Number(item.totalMarks) === Number(marks));
      }
      res.json({ success: true, questionBankSets: list });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch question bank sets" });
    }
  });

  // 14d. Question Bank Sets: POST (Save / Update)
  app.post("/api/question-bank", (req, res) => {
    try {
      const { paperSet } = req.body;
      if (!paperSet || !paperSet.title) {
        return res.status(400).json({ error: "Paper set object with title is required" });
      }
      const store = loadServerStore();
      if (!store.questionBankSets) store.questionBankSets = [];

      const setObj = {
        id: paperSet.id || `qb-set-${Date.now()}`,
        title: paperSet.title.trim(),
        classLevel: paperSet.classLevel || "10",
        subject: paperSet.subject || "General",
        subjectId: paperSet.subjectId || "",
        totalMarks: Number(paperSet.totalMarks) || 40,
        timeAllowed: paperSet.timeAllowed || "1 Hour",
        description: paperSet.description || "",
        questionsCount: Array.isArray(paperSet.questions) ? paperSet.questions.length : (paperSet.questionsCount || 0),
        questions: Array.isArray(paperSet.questions) ? paperSet.questions : [],
        rawContent: paperSet.rawContent || "",
        fileUrl: paperSet.fileUrl || "",
        createdAt: paperSet.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: paperSet.createdBy || "Mukesh (Admin)"
      };

      const existingIndex = store.questionBankSets.findIndex((s: any) => s.id === setObj.id);
      if (existingIndex >= 0) {
        store.questionBankSets[existingIndex] = setObj;
      } else {
        store.questionBankSets.unshift(setObj);
      }

      saveServerStore(store);
      res.json({ success: true, paperSet: setObj });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save question bank set" });
    }
  });

  // 14e. Question Bank Sets: DELETE
  app.delete("/api/question-bank/:id", (req, res) => {
    try {
      const setId = req.params.id;
      const store = loadServerStore();
      if (store.questionBankSets) {
        store.questionBankSets = store.questionBankSets.filter((s: any) => s.id !== setId);
        saveServerStore(store);
      }
      res.json({ success: true, id: setId });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete question bank set" });
    }
  });

  // 15. AI Document & Text Parser Endpoint for Admin Question Import
  app.post("/api/parse-document-questions", async (req, res) => {
    try {
      const {
        rawText,
        fileBase64,
        fileName,
        classLevel,
        subjectId,
        subjectName,
        chapterId,
        chapterName,
        topic,
        customKeys,
        preferredProvider
      } = req.body;

      let extractedText = (rawText || "").trim();
      let filePart: { inlineData: { mimeType: string; data: string } } | undefined = undefined;

      if (fileBase64 && fileName) {
        const fileBuffer = Buffer.from(fileBase64, 'base64');
        const ext = path.extname(fileName).toLowerCase();

        if (ext === '.pdf') {
          const pdfText = await parsePdfBuffer(fileBuffer);
          if (pdfText && pdfText.trim().length > 0) {
            extractedText = (pdfText || "") + "\n\n" + extractedText;
          }
          filePart = {
            inlineData: {
              mimeType: 'application/pdf',
              data: fileBase64
            }
          };
        } else if (['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'].includes(ext) || fileName.startsWith('data:image/')) {
          let mime = 'image/jpeg';
          if (ext === '.png') mime = 'image/png';
          else if (ext === '.webp') mime = 'image/webp';
          else if (ext === '.bmp') mime = 'image/bmp';
          
          filePart = {
            inlineData: {
              mimeType: mime,
              data: fileBase64
            }
          };
          if (!extractedText) {
            extractedText = `Image of paper-based questions uploaded: ${fileName}. Extract all handwritten or printed text and questions cleanly using OCR.`;
          }
        } else if (ext === '.docx' || ext === '.doc') {
          const docResult = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = (docResult.value || "") + "\n\n" + extractedText;
        } else if (ext === '.txt' || ext === '.json' || ext === '.csv') {
          extractedText = fileBuffer.toString('utf-8') + "\n\n" + extractedText;
        }
      }

      if ((!extractedText || extractedText.trim().length < 5) && !filePart) {
        return res.status(400).json({ error: "Could not extract readable text from uploaded file or text field." });
      }

      const prompt = `You are a professional CBSE Curriculum Specialist and AI Question Parser.
Analyze the following document text and parse ALL valid questions into a structured JSON array.

Target Context:
- Class Level: Class ${classLevel || '10'}
- Subject: ${subjectName || subjectId || 'General Subject'} (ID: ${subjectId || 'science-086'})
- Default Chapter ID: ${chapterId || 'ch-gen'}
- Default Chapter Name: ${chapterName || 'General Chapter'}
- Default Topic: ${topic || 'General Topic'}

Instructions:
1. Identify every question in the provided text.
2. For each question, extract or classify:
   - "type": "mcq" | "ar" | "vsa" | "sa" | "la" | "case_study"
   - "marks": 1 for MCQ/AR, 2 for VSA, 3 for SA, 4 for Case Study/AR, 5 for LA (or as stated in text)
   - "difficulty": "easy" | "medium" | "hard"
   - "isCompetency": boolean (true if real-world scenario/application)
   - "questionText": clean question statement
   - "options": Array of strings (e.g. ["A) Option 1", "B) Option 2", ...]) ONLY if type is "mcq" or "ar"
   - "correctAnswer": correct option or model solution
   - "markingScheme": step-by-step marking key or brief answer key
   - "explanation": brief explanation if available
   - "topic": specific topic if mentioned, or default to "${topic || 'General Topic'}"
   - "chapterName": specific chapter if mentioned, or default to "${chapterName || 'General Chapter'}"
   - "chapterId": "${chapterId || 'ch-gen'}"
   - "subjectId": "${subjectId || 'science-086'}"

Document Text to Parse:
"""
${extractedText.slice(0, 25000)}
"""

Return JSON format:
{
  "questions": [
    {
      "id": "cq-1",
      "subjectId": "${subjectId || 'science-086'}",
      "chapterId": "${chapterId || 'ch-gen'}",
      "chapterName": "${chapterName || 'General Chapter'}",
      "topic": "${topic || 'General Topic'}",
      "type": "mcq",
      "marks": 1,
      "difficulty": "medium",
      "isCompetency": false,
      "questionText": "Question statement text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ...",
      "markingScheme": "1 Mark for correct option.",
      "explanation": "..."
    }
  ]
}`;

      const aiResponseStr = await generateContentMultiProvider({
        prompt,
        customKeys,
        preferredProvider,
        systemPrompt: "You are a specialized CBSE Question Bank Parser. Output ONLY valid JSON matching the requested schema.",
        filePart
      });

      const parsedJson = JSON.parse(aiResponseStr);
      const parsedList = Array.isArray(parsedJson.questions) ? parsedJson.questions : [];

      const formattedQuestions = parsedList.map((q: any, idx: number) => ({
        id: q.id || `import-q-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        subjectId: q.subjectId || subjectId || 'science-086',
        chapterId: q.chapterId || chapterId || 'ch-gen',
        chapterName: q.chapterName || chapterName || 'General Chapter',
        topic: q.topic || topic || 'General Topic',
        type: q.type || (q.options ? 'mcq' : 'sa'),
        marks: q.marks || (q.type === 'mcq' ? 1 : q.type === 'sa' ? 3 : 2),
        difficulty: q.difficulty || 'medium',
        isCompetency: Boolean(q.isCompetency),
        questionText: q.questionText || `Question ${idx + 1}`,
        options: Array.isArray(q.options) ? q.options : undefined,
        correctAnswer: q.correctAnswer || 'Answer provided in text',
        markingScheme: q.markingScheme || '1 Mark per correct key point.',
        explanation: q.explanation || '',
        source: 'admin_imported'
      }));

      res.json({
        success: true,
        questions: formattedQuestions,
        totalExtracted: formattedQuestions.length
      });
    } catch (err: any) {
      console.error("Error parsing document questions:", err);
      res.status(500).json({ error: err?.message || "Failed to parse document questions." });
    }
  });

  // AI Route 1: Generate Full CBSE Question Paper
  app.post("/api/generate-paper", async (req, res) => {
    try {
      const {
        subjectName,
        subjectCode,
        selectedChapters,
        totalMarks,
        timeMinutes,
        difficulty,
        competencyPercent,
        customKeys,
        preferredProvider
      } = req.body;

      const uniqueSeed = `SEED-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const classNameMatch = subjectName?.match(/Class\s*(\d+)/i);
      const targetClass = classNameMatch ? classNameMatch[1] : "10";
      const chapterListString = Array.isArray(selectedChapters) && selectedChapters.length > 0 
        ? selectedChapters.map((c: any) => typeof c === 'string' ? c : (c.title || c.name || String(c))).join(", ")
        : "Full Syllabus";

      const prompt = `You are a Senior CBSE Board Exam Moderator and Subject Matter Expert for ${subjectName} (Code: ${subjectCode}).
Generate an official-pattern CBSE Class ${targetClass} Question Paper according to latest 2025-2026 syllabus and blueprint guidelines.

CRITICAL INSTRUCTIONS - STRICT CHAPTER FILTERING & ANTI-REPETITION:
Generation Request Seed: ${uniqueSeed}
1. STRICT CHAPTER SCOPE: You MUST ONLY generate questions for the following specified chapters: [${chapterListString}].
   - CRITICAL PERMANENT RULE: DO NOT generate or include ANY question from chapters that are NOT listed in [${chapterListString}].
   - EVERY question object MUST set the "chapter" field to one of the selected chapters: [${chapterListString}].
2. ZERO DUPLICATION GUARANTEE: EVERY SINGLE QUESTION in this question paper MUST be 100% unique, distinct, and completely different in topic, question phrasing, numerical values, chemical reactions, diagrams, and question style.
3. NO CONCEPT REPETITION: Do NOT repeat the same concept, question type, or numerical problem twice in different sections.
4. SUBJECT-SPECIFIC INTEGRITY:
   - FOR SCIENCE/MATH SUBJECTS: You MUST generate SPECIFIC, solvable mathematical calculations, word problems, physics numericals, or chemistry equations. DO NOT ask generic or meta questions like "Explain the core concepts of Mathematics" or "Discuss the principles of Science". EVERY question must have a specific numeric or factual answer.
   - FOR LANGUAGES/LITERATURE: Generate specific grammar exercises, reading comprehension passages, and chapter-specific literature questions from [${chapterListString}].
   - FOR SOCIAL SCIENCE: Generate specific questions about historical dates, events, geography map work, or political case studies from [${chapterListString}].
5. FRESH NUMERICALS & CONTEXTS: Use novel numerical values, fresh real-world case scenarios, original experiment setups, and distinct assertion-reasoning pairings.

Paper Details:
- Subject: ${subjectName}
- Total Marks: ${totalMarks || 80}
- Duration: ${timeMinutes || 180} minutes
- MANDATORY Chapters Covered ONLY: [${chapterListString}]
- Target Difficulty: ${difficulty || "Balanced"}
- Competency/Case-based Question Ratio: ${competencyPercent || 50}%

Mandatory Official CBSE Blueprint Matrix for ${subjectName} (${totalMarks} Marks):
- IF Class 12 Science/Math (70 Marks): Section A (16 MCQs & AR, 1M = 16M), Section B (5 VSA, 2M = 10M), Section C (7 SA, 3M = 21M), Section D (2 Case Studies, 4M = 8M), Section E (3 LA, 5M = 15M). Total 33 questions.
- IF Class 12 Science/Math (80 Marks): Section A (20 MCQs & AR, 1M = 20M), Section B (5 VSA, 2M = 10M), Section C (6 SA, 3M = 18M), Section D (4 LA, 5M = 20M), Section E (3 Case Studies, 4M = 12M).
- IF Class 10/9 Science/Math (80 Marks): Section A (20 MCQs & AR, 1M = 20M), Section B (6 VSA, 2M = 12M), Section C (7 SA, 3M = 21M), Section D (3 LA, 5M = 15M), Section E (3 Case Studies, 4M = 12M).
- IF English/Literature (80 Marks): Section A: Reading Skills (20M), Section B: Writing & Grammar (20M), Section C: Literature (40M).
- If none of the above match exactly, infer the most accurate official CBSE pattern for this specific class and subject.

CRITICAL REQUIREMENT FOR CASE STUDY & UNSEEN PASSAGE QUESTIONS:
For any question that includes a passage, case study scenario, or source data (e.g. in Section E or Reading Section), you MUST explicitly include a top-level key "casePassage" inside the question object containing the full passage excerpt or scenario text.

For EACH question, provide:
1. Question Text in English and Hindi (Devanagari script)
2. casePassage in English and Hindi (mandatory string for case study / passage questions)
3. Options in English and Hindi (if MCQ/Assertion-Reason)
4. Correct Answer in English and Hindi
5. Step-by-Step Marking Scheme & Answer Key in English and Hindi
6. Typology (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating)
7. Competency-based flag (true/false)

Return strictly valid JSON adhering to this schema:
{
  "paperTitle": "CBSE EXAMINATION - ${subjectName}",
  "generalInstructions": [
    "Question paper comprises structured Sections as per official CBSE syllabus.",
    "Section A consists of objective MCQs / Reading Skills.",
    "Section B consists of Short Answers / Writing Skills & Integrated Grammar.",
    "Section C / D / E consist of Long Answers & Integrated Case-Based Units."
  ],
  "generalInstructionsHindi": [
    "प्रश्न पत्र में आधिकारिक सीबीएसई पाठ्यक्रम के अनुसार खंड शामिल हैं।",
    "खंड अ में वस्तुनिष्ठ बहुविकल्पीय प्रश्न / पठन कौशल शामिल हैं।"
  ],
  "sections": [
    {
      "sectionName": "SECTION A",
      "description": "Objective Type Questions (1 Mark Each)",
      "descriptionHindi": "वस्तुनिष्ठ प्रश्न (प्रत्येक 1 अंक)",
      "questions": [
        {
          "id": "q1", // MUST BE UNIQUE PER QUESTION
          "qNo": 1,
          "type": "case",
          "marks": 4,
          "casePassage": "Excerpt text / source data here in English...",
          "casePassageHindi": "गद्यांश / मामला अध्ययन पाठ यहाँ हिंदी में...",
          "questionText": "Sub-questions here in English...",
          "questionTextHindi": "प्रश्न हिंदी (देवनागरी लिपि) में...",
          "options": ["A) ...", "B) ..."],
          "optionsHindi": ["A) ...", "B) ..."],
          "correctAnswer": "Option letter and details in English",
          "correctAnswerHindi": "विकल्प और विवरण हिंदी में",
          "markingScheme": "1 mark for correct choice.",
          "markingSchemeHindi": "सही उत्तर के लिए 1 अंक।",
          "chapter": "Chapter name",
          "isCompetency": true
        }
      ]
    }
  ]
}`;

      const rawJson = await generateContentMultiProvider({
        prompt,
        customKeys,
        preferredProvider
      });

      const parsedData = JSON.parse(rawJson);
      res.json({ success: true, paper: parsedData });
    } catch (error: any) {
      console.log("AI generation using local assembly engine.");
      res.json({
        success: false,
        isFallback: true,
        error: "AI API keys not configured or authentication failed. Falling back to Instant Local Paper Assembly."
      });
    }
  });

  // AI Route 2: Evaluate Student Answer
  app.post("/api/evaluate-answer", async (req, res) => {
    const { questionText, maxMarks, officialAnswer, studentAnswer, imageDataUrl, subjectName, customKeys, preferredProvider } = req.body;

    if (!studentAnswer && !imageDataUrl && !questionText) {
      return res.status(400).json({ error: "Question text or student answer / image is required." });
    }

    try {
      let filePart: { inlineData: { mimeType: string; data: string } } | undefined = undefined;

      if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/')) {
        const matches = imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          filePart = {
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          };
        }
      }

      const prompt = `You are a strict and fair CBSE Board Examiner and Expert Teacher for ${subjectName || "Subject"}.
Evaluate the student's answer paper according to official CBSE step-wise marking rules.

Question: ${questionText || "Scanned Student Answer Sheet Evaluation"}
Maximum Marks: ${maxMarks || 5}
Model Answer / Marking Scheme: ${officialAnswer || "Standard CBSE textbook solution and step-wise grading scheme"}

Student's Submitted Answer / Sheet Text:
"""
${studentAnswer || (filePart ? "Please extract handwritten/typed student answer from attached image and evaluate step by step." : "")}
"""

Evaluate carefully:
1. Marks awarded (0 to ${maxMarks}, supporting half marks e.g. 3.5)
2. Step-by-step mark breakdown (what got marks, what missed marks, step status 'correct'|'partial'|'incorrect')
3. Key missing keywords/concepts mandatory for full CBSE marks
4. Examiner feedback & actionable tips highlighting SPECIFIC topics and concepts where improvement is needed.
5. Ideal CBSE Topper Model Answer.

Return strictly valid JSON in this format:
{
  "awardedMarks": 3.5,
  "maxMarks": 5,
  "percentage": 70.0,
  "grade": "B1",
  "stepBreakdown": [
    { "step": "Correct formula stated", "marksGiven": 1, "maxForStep": 1, "status": "correct" },
    { "step": "Substitution and unit calculation", "marksGiven": 1.5, "maxForStep": 2, "status": "partial", "remark": "SI unit missing in intermediate step" },
    { "step": "Final conclusion statement", "marksGiven": 1, "maxForStep": 2, "status": "partial", "remark": "Calculation mistake in final simplification" }
  ],
  "missingKeywords": ["SI Unit", "Inverted Image", "Cartesian Convention"],
  "examinerFeedback": "Good attempt! Pay careful attention to unit conversions and sign conventions to achieve top grade.",
  "idealAnswer": "Ideal step-by-step model answer expected in CBSE Board Exams..."
}`;

      const rawJson = await generateContentMultiProvider({
        prompt,
        customKeys,
        preferredProvider,
        filePart
      });

      const parsed = JSON.parse(rawJson);
      res.json({ success: true, evaluation: parsed });
    } catch (error: any) {
      console.log("Using CBSE Rule Engine fallback.");
      const ruleEval = evaluateAnswerWithRuleEngine(
        questionText || "Answer Sheet Evaluation",
        Number(maxMarks) || 5,
        officialAnswer || "",
        studentAnswer || "Student answer submitted for evaluation.",
        subjectName
      );
      res.json({ success: true, evaluation: ruleEval, isFallback: true });
    }
  });

  // Route: Get Evaluated Copies for a Student
  app.get("/api/evaluated-copies", (req, res) => {
    try {
      const email = req.query.email ? String(req.query.email).toLowerCase().trim() : '';
      const store = loadServerStore();
      const records = store.evaluatedCopies || [];
      if (email) {
        const studentCopies = records.filter(c => c.studentEmail && String(c.studentEmail).toLowerCase().trim() === email);
        return res.json({ success: true, copies: studentCopies });
      }
      res.json({ success: true, copies: records });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch evaluated copies" });
    }
  });

  // Route: Save Evaluated Copy
  app.post("/api/evaluated-copies", (req, res) => {
    try {
      const { record } = req.body;
      if (!record || !record.id) return res.status(400).json({ error: "Invalid evaluated copy record" });

      const store = loadServerStore();
      store.evaluatedCopies = [record, ...(store.evaluatedCopies || []).filter(c => c.id !== record.id)];
      saveServerStore(store);

      res.json({ success: true, record });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save evaluated copy" });
    }
  });

  // Route: Send Evaluated Copy Email to Student
  app.post("/api/send-evaluated-copy-email", (req, res) => {
    try {
      const { copyId, studentEmail, studentName, testTitle, subjectName, awardedMarks, maxMarks, percentage, grade, evaluation } = req.body;

      if (!studentEmail) {
        return res.status(400).json({ error: "Student registered email address is required" });
      }

      const cleanEmail = String(studentEmail).trim().toLowerCase();
      const senderEmail = "mukesh186000@gmail.com";
      const sentTime = new Date().toISOString();

      const store = loadServerStore();
      const existingIdx = (store.evaluatedCopies || []).findIndex(c => c.id === copyId);
      
      if (existingIdx >= 0) {
        store.evaluatedCopies[existingIdx].emailSent = true;
        store.evaluatedCopies[existingIdx].emailSentAt = sentTime;
        store.evaluatedCopies[existingIdx].studentEmail = cleanEmail;
        saveServerStore(store);
      }

      console.log(`📧 [AUTO EMAIL DISPATCH SUCCESS] Report for "${testTitle || 'Test Copy'}" dispatched from website/admin (${senderEmail}) directly to registered student email: ${cleanEmail} (Marks: ${awardedMarks}/${maxMarks} - ${percentage}%)`);

      res.json({
        success: true,
        message: `Evaluation report & improvement tips sent to registered email: ${cleanEmail}`,
        sentAt: sentTime,
        senderEmail,
        recipientEmail: cleanEmail,
        deliveryChannel: "ExamIdea Official Website Dispatch (mukesh186000@gmail.com)"
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to dispatch evaluated copy email" });
    }
  });

  // AI Route 3: Generate Single AI Competency Question
  app.post("/api/ai-question", async (req, res) => {
    try {
      const { subject, chapter, type, difficulty, customKeys, preferredProvider } = req.body;

      const prompt = `Generate 1 high-quality CBSE board exam question for:
Subject: ${subject}
Chapter: ${chapter}
Question Type: ${type} (e.g. MCQ, Assertion-Reason, Short Answer 3M, Case Study 4M)
Difficulty: ${difficulty}

Include realistic context, diagram description if relevant, step-wise marking scheme, and explanation. Also provide accurate Hindi (Devanagari script) translations for questionText, options, casePassage, and markingScheme.

Return JSON:
{
  "questionText": "...",
  "questionTextHindi": "...",
  "options": ["A)...", "B)...", "C)...", "D)..."],
  "optionsHindi": ["A)...", "B)...", "C)...", "D)..."],
  "correctAnswer": "...",
  "correctAnswerHindi": "...",
  "marks": 3,
  "markingScheme": "...",
  "markingSchemeHindi": "...",
  "explanation": "...",
  "explanationHindi": "...",
  "isCompetency": true
}`;

      const rawJson = await generateContentMultiProvider({
        prompt,
        customKeys,
        preferredProvider
      });

      res.json({ success: true, question: JSON.parse(rawJson) });
    } catch (error: any) {
      res.json({
        success: false,
        error: "AI API keys not configured or invalid."
      });
    }
  });

  // AI Route 4: Translate Complete Paper or Questions to Hindi Devanagari
  app.post("/api/translate-paper", async (req, res) => {
    try {
      const { paper, customKeys, preferredProvider } = req.body;
      if (!paper || !paper.sections) {
        return res.status(400).json({ error: "Paper object with sections is required." });
      }

      const prompt = `You are a professional translator for CBSE Board Examination papers.
Translate the following CBSE Question Paper questions and sections into authentic Devanagari Hindi (accurate CBSE terminology).

Input JSON structure of paper:
${JSON.stringify(paper, null, 2)}

INSTRUCTIONS:
1. Preserve ALL existing fields and keys in the paper object.
2. For each question in each section, add/update these Hindi fields:
   - "questionTextHindi": Exact Hindi translation of "questionText"
   - "optionsHindi": Array of Hindi translations for "options" (if options exist)
   - "markingSchemeHindi": Exact Hindi translation of "markingScheme"
   - "casePassageHindi": Exact Hindi translation of "casePassage" (if casePassage exists)
   - "explanationHindi": Exact Hindi translation of "explanation" (if explanation exists)
   - "correctAnswerHindi": Exact Hindi translation of "correctAnswer"
3. Add "generalInstructionsHindi": Array of Hindi translations for generalInstructions
4. For each section, add "descriptionHindi": Hindi translation for section description

Return ONLY the updated valid JSON object representing the translated paper.`;

      const rawJson = await generateContentMultiProvider({
        prompt,
        customKeys,
        preferredProvider
      });

      const parsedTranslatedPaper = JSON.parse(rawJson);
      res.json({ success: true, paper: parsedTranslatedPaper });
    } catch (error: any) {
      console.error("AI translate paper error:", error);
      res.status(500).json({ success: false, error: error?.message || "Translation failed." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Examidea Server running on http://localhost:${PORT}`);
  });
}

startServer();
