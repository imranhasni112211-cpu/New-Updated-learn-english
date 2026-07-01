import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Dynamic Logo Route (Serves the uploaded input_file_0.png if present, or a beautifully crafted custom SVG fallback)
app.get("/api/logo.png", (req, res) => {
  const rootDir = process.cwd();
  const candidates = [
    path.join(rootDir, "input_file_0.png"),
    path.join(rootDir, "input_file_1.png"),
    path.join(rootDir, "attached_image_0.png"),
    path.join(rootDir, "logo.png"),
    path.join(rootDir, "src", "assets", "logo.png"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      res.sendFile(candidate);
      return;
    }
  }

  // Fallback to any image in the root directory
  try {
    const files = fs.readdirSync(rootDir);
    const imgFile = files.find(
      (f) =>
        f.toLowerCase().endsWith(".png") ||
        f.toLowerCase().endsWith(".jpg") ||
        f.toLowerCase().endsWith(".jpeg")
    );
    if (imgFile) {
      res.sendFile(path.join(rootDir, imgFile));
      return;
    }
  } catch (err) {
    console.error("Error searching for image in root:", err);
  }

  // Elegant High-Fidelity SVG Fallback matching the uploaded design
  res.setHeader("Content-Type", "image/svg+xml");
  res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#ffffff" />
      
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&amp;family=Caveat:wght@700&amp;family=Inter:wght@400;600;700&amp;display=swap');
          
          .logo-title-learn {
            font-family: 'Montserrat', sans-serif;
            font-weight: 900;
            fill: #0c1c38;
          }
          
          .logo-title-english {
            font-family: 'Montserrat', sans-serif;
            font-weight: 900;
          }
          
          .logo-subtitle {
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            fill: #0c1c38;
            letter-spacing: 1.5px;
          }
          
          .logo-script {
            font-family: 'Caveat', cursive;
            font-size: 42px;
            font-weight: 700;
            fill: #051a3a;
          }
          
          .logo-author {
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            fill: #475569;
          }
        </style>
        
        <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7" />
          <stop offset="25%" stop-color="#0ea5e9" />
          <stop offset="50%" stop-color="#10b981" />
          <stop offset="75%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#ea580c" />
        </linearGradient>
        
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00a3e0" />
          <stop offset="35%" stop-color="#02b07e" />
          <stop offset="65%" stop-color="#8cc63f" />
          <stop offset="100%" stop-color="#f7931e" />
        </linearGradient>
        
        <linearGradient id="bluePageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00aeef" />
          <stop offset="100%" stop-color="#0054a6" />
        </linearGradient>
        
        <linearGradient id="orangePageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff200" />
          <stop offset="30%" stop-color="#f7931e" />
          <stop offset="100%" stop-color="#f15a24" />
        </linearGradient>
        
        <linearGradient id="archGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0d47a1" />
          <stop offset="50%" stop-color="#ffeb3b" />
          <stop offset="100%" stop-color="#ff7043" />
        </linearGradient>
      </defs>

      <!-- 1. GRAPHIC Emblem Group -->
      <g id="logo-emblem-badge" transform="translate(15, 0)">
        
        <!-- Background outer decorative ring with gap & leaf top right -->
        <g stroke-linecap="round">
          <!-- Main dark blue crescent/shield bubble backing -->
          <path d="M 450 140 C 290 150, 190 280, 210 460 C 220 540, 270 600, 340 640" fill="none" stroke="#0054a6" stroke-width="26" />
          
          <!-- Outer orange swoosh curve on the right -->
          <path d="M 620 635 C 710 590, 770 490, 760 360 C 750 240, 670 170, 560 145" fill="none" stroke="#f15a24" stroke-width="20" />
          
          <!-- Top green leaf sweep/accent -->
          <path d="M 540 120 C 600 130, 665 170, 715 235" fill="none" stroke="#02b07e" stroke-width="16" />
          
          <!-- Speech Bubble Tail pointing bottom-left -->
          <path d="M 330 630 Q 345 740, 245 770 C 235 775, 230 765, 240 755 Q 360 670, 362 610 Z" fill="#0054a6" />
        </g>

        <!-- Graduation Cap (Centered at 490, 275) -->
        <g id="grad-cap" transform="translate(490, 275)">
          <!-- Base Cap Band -->
          <path d="M -70 15 L -70 38 C -70 50, 70 50, 70 38 L 70 15" fill="#0d1e3d" />
          <!-- Diamond Cap Top -->
          <polygon points="0,-65 170,-15 0,35 -170,-15" fill="#132a52" />
          <polygon points="0,-65 170,-15 0,35 -170,-15" fill="none" stroke="#2c4266" stroke-width="5" />
          <!-- Cap Button -->
          <circle cx="0" cy="-5" r="10" fill="#475569" />
          <!-- Rope/Cord & Beautiful Tassel hanging on the right side -->
          <path d="M 0 -5 Q 115 15, 140 65" fill="none" stroke="#475569" stroke-width="5.5" stroke-linecap="round" />
          <polygon points="140,65 130,105 150,105" fill="#0d1e3d" />
        </g>

        <!-- Dynamic stars between Cap & Book -->
        <!-- Center Big Orange Star -->
        <polygon points="490,380 494,402 516,406 494,410 490,432 486,410 464,406 486,402" fill="#f7931e" />
        <!-- Left Cyan Star -->
        <polygon points="410,380 412,393 425,395 412,397 410,410 408,397 395,395 408,393" fill="#00aeef" />
        <!-- Right Dark Star -->
        <polygon points="570,380 572,393 585,395 572,397 570,410 568,397 555,395 568,393" fill="#132a52" />

        <!-- Open Book (Spanning middle of emblem) -->
        <g id="open-book" transform="translate(490, 470)">
          <!-- Left book pages with white trim underneath for authentic multi-layer stack feel -->
          <path d="M -15 45 C -105 10, -165 45, -165 45" fill="none" stroke="#e2e8f0" stroke-width="8" />
          <path d="M -20 53 C -108 18, -160 53, -160 53" fill="none" stroke="#cbd5e1" stroke-width="8" />
          <path d="M -15 35 C -105 0, -170 35, -170 35 L -170 -100 C -170 -100, -105 -135, -15 -100 Z" fill="url(#bluePageGrad)" />
          <path d="M -15 35 Q -92.5 -17.5, -170 35 L -170 -100 Q -92.5 -152.5, -15 -100 Z" fill="none" stroke="#0054a6" stroke-width="4.5" />
          
          <!-- Outer white lines on Left Page -->
          <path d="M -150 -75 Q -105 -105, -35 -80" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.85" />
          <path d="M -150 -55 Q -105 -85, -35 -60" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.85" />

          <!-- Right book pages with stack pages under layers -->
          <path d="M 15 45 C 105 10, 165 45, 165 45" fill="none" stroke="#e2e8f0" stroke-width="8" />
          <path d="M 20 53 C 108 18, 160 53, 160 53" fill="none" stroke="#cbd5e1" stroke-width="8" />
          <path d="M 15 35 C 105 0, 170 35, 170 35 L 170 -100 C 170 -100, 105 -135, 15 -100 Z" fill="url(#orangePageGrad)" />
          <path d="M 15 35 Q 92.5 -17.5, 170 35 L 170 -100 Q 92.5 -152.5, 15 -100 Z" fill="none" stroke="#f15a24" stroke-width="4.5" />
          
          <!-- Outer white lines on Right Page -->
          <path d="M 35 -80 Q 105 -105, 150 -75" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.85" />
          <path d="M 35 -60 Q 105 -85, 150 -55" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.85" />

          <!-- Spine shadow -->
          <path d="M -15 -100 Q 0 -110, 15 -100 L 15 35 Q 0 25, -15 35 Z" fill="#0c1d37" opacity="0.32" />
        </g>
      </g>

      <!-- 2. TYPOGRAPHY: Title Header -->
      <g id="logo-title" transform="translate(0, 10)">
        <text x="500" y="670" text-anchor="middle" font-size="96" class="logo-title-learn">
          Learn <tspan fill="url(#textGrad)" class="logo-title-english">English</tspan>
        </text>
      </g>

      <!-- 3. TYPOGRAPHY: Bullet Navigator Subtitle with Decorative Side Lines -->
      <g id="logo-bullets" transform="translate(0, 0)">
        <!-- Horizontal Accent Lines -->
        <line x1="72" y1="738" x2="135" y2="738" stroke="#0054a6" stroke-width="3" stroke-linecap="round" />
        <line x1="865" y1="738" x2="928" y2="738" stroke="#f15a24" stroke-width="3" stroke-linecap="round" stroke-opacity="0.9" />
        
        <!-- Multi-colored Bullets Checklist text -->
        <text x="500" y="746" text-anchor="middle" font-size="28" class="logo-subtitle">
          Learn <tspan fill="#00aeef" font-size="34"> • </tspan> Practice <tspan fill="#02b07e" font-size="34"> • </tspan> Improve <tspan fill="#f7931e" font-size="34"> • </tspan> Succeed
        </text>
      </g>

      <!-- 4. TYPOGRAPHY: Script Motto With Colorful Arch Sweep -->
      <g id="logo-motto" transform="translate(0, 20)">
        <text x="500" y="818" text-anchor="middle" class="logo-script">
          Your Journey to Confident English, Every Day.
        </text>
        
        <!-- Underline arched brush strokes -->
        <path d="M 150 852 Q 500 878, 850 855" fill="none" stroke="url(#archGrad)" stroke-width="5" stroke-linecap="round"/>
      </g>

      <!-- 5. TYPOGRAPHY: Author Credit Line -->
      <g id="logo-author" transform="translate(0, 48)">
        <!-- Outer thin guidelines -->
        <line x1="72" y1="915" x2="240" y2="915" stroke="#475569" stroke-width="1.8" />
        <line x1="760" y1="915" x2="928" y2="915" stroke="#475569" stroke-width="1.8" />
        
        <!-- Emerald side bullet dots -->
        <circle cx="268" cy="915" r="9.5" fill="#02b07e" />
        <circle cx="732" cy="915" r="9.5" fill="#02b07e" />
        
        <!-- Author Text -->
        <text x="500" y="924" text-anchor="middle" font-size="24.5" class="logo-author">
          Created by <tspan fill="#0d47a1" font-weight="900">Imran.Qaseem</tspan>
        </text>
      </g>
    </svg>
  `);
});


// Initialize Gemini SDK with custom User-Agent as requested by the guidelines
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
} catch (err) {
  console.error("Failed to initialize GoogleGenAI client:", err);
}

// Ensure database directories and schema
const DB_PATH = path.join(process.cwd(), "data", "db.json");

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const defaultData = {
      users: [] as any[],
      sessions: {} as Record<string, { email: string; expires: number }>,
      chats: {} as Record<string, any[]>,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf8");
  }
}

ensureDb();

function getDb() {
  ensureDb();
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(content);
  } catch (err) {
    return { users: [], sessions: {}, chats: {} };
  }
}

function saveDb(data: any) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

// Secure PBKDF2 Password Hashing
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// XSS Sanitizer
function sanitizeInput(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Robust registration input check
function validateRegistration(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  // Email format verification (standard regex)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email structure" });
    return;
  }

  // Password complexity verification: minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters long" });
    return;
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    res.status(400).json({
      error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (#, $, %, etc.)",
    });
    return;
  }

  if (displayName.trim().length < 2) {
    res.status(400).json({ error: "Display name must be at least 2 characters long" });
    return;
  }

  next();
}

// Middleware: Authenticate User
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const db = getDb();
  const session = db.sessions[token];

  if (!session || session.expires < Date.now()) {
    // Clean up expired session if exists
    if (session) {
      delete db.sessions[token];
      saveDb(db);
    }
    res.status(401).json({ error: "Session expired or invalid. Please log in again." });
    return;
  }

  const user = db.users.find((u: any) => u.email === session.email);
  if (!user) {
    res.status(401).json({ error: "User associated with this session no longer exists" });
    return;
  }

  // Extend session expires (e.g. 1 hour from active use)
  session.expires = Date.now() + 60 * 60 * 1000;
  saveDb(db);

  (req as any).user = {
    email: user.email,
    displayName: user.displayName,
    cefrLevel: user.cefrLevel || "Beginner (A1)",
  };
  next();
}

// --- API AUTH ROUTES ---

// 1. Register Auth Endpoint
app.post("/api/auth/register", validateRegistration, (req, res) => {
  const { email, password, displayName } = req.body;
  const db = getDb();

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = db.users.find((u: any) => u.email === normalizedEmail);

  if (existingUser) {
    res.status(400).json({ error: "This email is already registered." });
    return;
  }

  const salt = generateSalt();
  const hash = hashPassword(password, salt);

  const newUser = {
    email: normalizedEmail,
    displayName: sanitizeInput(displayName),
    salt,
    hash,
    cefrLevel: "Beginner (A1)", // Default level, can be set via placement test
    createdAt: Date.now(),
  };

  db.users.push(newUser);
  saveDb(db);

  res.status(201).json({ success: true, message: "User registered successfully." });
});

// 2. Login Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const db = getDb();
  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find((u: any) => u.email === normalizedEmail);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.hash) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  // Generate secure token
  const token = generateSessionToken();
  const expires = Date.now() + 60 * 60 * 1000; // 1-hour validity

  db.sessions[token] = {
    email: user.email,
    expires,
  };
  saveDb(db);

  res.json({
    success: true,
    token,
    user: {
      email: user.email,
      displayName: user.displayName,
      cefrLevel: user.cefrLevel || "Beginner (A1)",
    },
  });
});

// 3. Me Details Auth Endpoint
app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({ success: true, user: (req as any).user });
});

// 4. Update Profile CEFR Level
app.post("/api/auth/profile", authenticateToken, (req, res) => {
  const { cefrLevel } = req.body;
  if (!cefrLevel) {
    res.status(400).json({ error: "Level is required." });
    return;
  }

  const db = getDb();
  const userIndex = db.users.findIndex((u: any) => u.email === (req as any).user.email);
  
  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  db.users[userIndex].cefrLevel = cefrLevel;
  saveDb(db);

  res.json({ success: true, cefrLevel });
});


// --- SECURED E2E ENCRYPTED CHAT STORAGE ENDPOINTS ---
// These endpoints only accept and return ciphertext. The server itself has no key to read them.

// Save Encrypted Chat History
app.post("/api/chat/save", authenticateToken, (req, res) => {
  const { items } = req.body; // Array of encrypted message objects: { role, encryptedText, iv, timestamp }
  if (!items || !Array.isArray(items)) {
    res.status(400).json({ error: "Invalid data structure format" });
    return;
  }

  // Integrity validation checks to verify role & ciphertext payloads
  for (const item of items) {
    if (!item.role || !item.encryptedText || !item.iv) {
      res.status(400).json({ error: "Payload items must be fully formed crytopgraphic encryptions (role, ciphertext, and IV are required)" });
      return;
    }
  }

  const db = getDb();
  const email = (req as any).user.email;
  db.chats[email] = items;
  saveDb(db);

  res.json({ success: true, savedCount: items.length });
});

// Get Encrypted Chat History
app.get("/api/chat/history", authenticateToken, (req, res) => {
  const db = getDb();
  const email = (req as any).user.email;
  const history = db.chats[email] || [];
  res.json({ success: true, history });
});


// --- GOOGLE DRIVE FILE ANALYSIS PROXY ENDPOINT (uses Server-Side Gemini API Key) ---
app.post("/api/drive/analyze", authenticateToken, async (req, res) => {
  const { fileContent, fileName, cefrLevel } = req.body;

  if (!fileContent) {
    res.status(400).json({ error: "File content is required for analysis." });
    return;
  }

  if (!ai) {
    res.status(500).json({ error: "Gemini AI config is missing on the server. Please check GEMINI_API_KEY." });
    return;
  }

  const userCefr = cefrLevel || "Beginner (A1)";

  const systemInstruction = `
    You are an expert English language assessor and tutoring mentor.
    Your main goal is to analyze the user's provided document (which they loaded from their Google Drive) and create a highly engaging, confidence-building study guide.
    Design your response to match professional linguistic training standards at the CEFR standard of: "${userCefr}".
    
    Structure your analysis strictly into clean, beautiful sections using markdown:
    
    # 📚 Google Drive Study Guide: [Insert File Name Here]
    
    ## 📑 Executive Summary
    Provide a highly simplified, clear overview of the content. Explain the central theme and target audience in simple language.
    
    ## 🤯 Grammar & Syntax Demystified
    Highlight 2-3 key grammatical configurations, sentence structures, or styling choices from the text. Explain how they work with simple steps and examples.
    
    ## 🎓 Level-Up Vocabulary Builder
    Extract 3-5 high-value verbs, nouns, or expressions found in the text. For each, display:
    - **Word/Phrase**: [Word/Phrase]
    - **CEFR level estimate**: [A1-C2]
    - **Phonetic Pronunciation Tip**: [Pronunciation guides, e.g., /kənˈfɪdəns/]
    - **Contextual Meaning**: [Definition]
    - **Practical Speaking Example**: [Create a natural, friendly, conversational sentence including this word]
    
    ## 🧪 Interactive Comprehension Check
    Create 3 simple, friendly multiple-choice questions or fill-in-the-blank queries with answers hidden in markdown spoiler tags (e.g., > **Answer**: C) based on this text.
    
    ## 🗣️ Daily Speaking Challenge
    Provide a personalized conversation starter or speaking prompt relative to this file's theme. Encourage them to practice aloud with the AI English Tutor!
  `;

  try {
    const contents = [
      {
        role: "user",
        parts: [{ text: `Please analyze this file: "${fileName}" with content:\n\n${fileContent.substring(0, 10000)}` }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const resultText = response.text || "Failed to generate analysis study guide.";
    res.json({ success: true, analysis: resultText });
  } catch (err: any) {
    console.error("Analysis API Error:", err);
    res.status(500).json({ error: "We were unable to analyze the file. Details: " + err.message });
  }
});


// --- AI ENGLISH TUTOR PROXY ENDPOINT (uses Server-Side Gemini API Key) ---
app.post("/api/tutor/chat", authenticateToken, async (req, res) => {
  const { message, settings, history } = req.body;
  
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  if (!ai) {
    res.status(500).json({ error: "Gemini AI config is missing on the server. Please check GEMINI_API_KEY." });
    return;
  }

  const cefrLevel = settings?.cefrLevel || "Beginner (A1)";
  const tutorStyle = settings?.tutorStyle || "Sam (Friendly)";
  const accent = settings?.accent || "American";

  // System instruction to guide the AI learning assistant behavior
  const systemInstruction = `
    You are an intelligent AI English Tutoring Assistant named "AI English Tutor".
    Your sole design objective is to help students progress confidently from beginner to professional English proficiency.
    We are currently practicing at a CEFR level of: "${cefrLevel}". Your style personality is "${tutorStyle}", and your specified English pronunciation accent is "${accent}".
    
    CRITICAL ENGAGEMENT DIRECTIVES:
    1. Respond to the user's message in clear English optimized for their current CEFR level (${cefrLevel}).
       - Beginner (A1): Simple vocabulary, short clear sentences, high friendliness, no idioms.
       - Intermediate (B1/B2): Conversational, introducing simple metaphors, practical idioms, correcting complex clauses.
       - Advanced (C1/C2): Nuanced professional and academic vocabulary, corporate dialog patterns, stylistic elegance.
    2. PROVIDE ACTIVE LINGUISTIC ASSISTANCE:
       - Every turn, analyze the user's message for grammar, spelling, or styling optimizations.
       - If there's an error, point it out gently by displaying a "Grammar Correction" section. Show both the incorrect original block and the corrected suggestion (using clear side-by-side or highlighted notation).
       - Suggest 1-2 new level-appropriate vocabulary words or idioms relevant to the conversation context to help them scale up.
    3. Include phonetic tips if they want pronunciation training.
    4. Speak naturally, ask 1 follow-up question to keep the dialogue active and immersive.
    5. Ensure of absolute clarity and structured layout inside your response (use line breaks and elegant spacing).
  `;

  try {
    // Restructure conversation history to keep context for Gemini
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      // Pick the last 8 messages for context safety to stay under rate limits
      const contextHistory = history.slice(-8);
      for (const h of contextHistory) {
         contents.push({
           role: h.role === "user" ? "user" : "model",
           parts: [{ text: h.text }]
         });
      }
    }
    
    // Add the current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const resultText = response.text || "I was unable to formulate a response. Let us try speaking again.";
    res.json({ success: true, text: resultText });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "The English Tutor is resting briefly. Error details: " + err.message });
  }
});


// --- INITIALIZE SERVER + VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite server in Development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in Production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booting! Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
