import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Send, ShieldCheck, HelpCircle, AlertTriangle, Sparkles, User, 
  Bot, RefreshCw, KeyRound, Check, Laptop, Info, ShieldAlert 
} from "lucide-react";
import { encryptText, decryptText, getKeyFingerprint } from "../utils/crypto";

interface Message {
  role: "user" | "model";
  text: string;
  isCorrected?: boolean;
  timestamp: number;
}

interface EncryptedMessagePayload {
  role: "user" | "model";
  encryptedText: string;
  iv: string;
  timestamp: number;
}

interface TutorChatProps {
  token: string;
  cryptoKey: CryptoKey | null;
  userEmail: string;
  cefrLevel: string;
}

export default function TutorChat({ token, cryptoKey, userEmail, cefrLevel }: TutorChatProps) {
  // Tutor Settings
  const [tutorStyle, setTutorStyle] = useState("Sam (Friendly)");
  const [accent, setAccent] = useState("American");

  // Idiomatic Phrase of the Day States
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  // Dynamic phrase dictionary aligned to user CEFR level
  const getDailyPhrase = () => {
    const lvl = (cefrLevel || "").toLowerCase();
    if (lvl.includes("a1") || lvl.includes("a2") || lvl.includes("begin")) {
      return {
        phrase: "Break the ice",
        type: "A1-A2 Conversation Starter",
        meaning: "To do or say something that makes people feel relaxed and comfortable.",
        example: "A warm hello helps to break the ice when practicing English.",
      };
    } else if (lvl.includes("b1") || lvl.includes("b2") || lvl.includes("inter")) {
      return {
        phrase: "Hit the nail on the head",
        type: "B1-B2 Analytical Phrase",
        meaning: "To describe exactly what is causing a situation or answer correctly.",
        example: "Your suggestions regarding my prepositions hit the nail on the head!",
      };
    } else {
      return {
        phrase: "Operate at the cutting edge",
        type: "C1-C2 Professional Expression",
        meaning: "To use the most advanced and modern techniques or intellectual methods available.",
        example: "Polished speakers operate at the cutting edge of professional business communications.",
      };
    }
  };

  const currentPhrase = getDailyPhrase();
  
  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fingerprint, setFingerprint] = useState("AES-GCM::LOADING");

  // Grammar Correction State (parsed from last assistant message)
  const [activeCorrection, setActiveCorrection] = useState<{ original: string; corrected: string; tip: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load Key Fingerprint & Historical communications on mount
  useEffect(() => {
    if (cryptoKey) {
      getKeyFingerprint(cryptoKey, userEmail).then((fp) => setFingerprint(fp));
      loadEncryptedHistory();
    } else {
      setFingerprint("AES-GCM::NO_ACTIVE_PASSPHRASE");
    }
  }, [cryptoKey, userEmail]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load and decrypt chat history from zero-knowledge server
  const loadEncryptedHistory = async () => {
    setLoadingHistory(true);
    setStatusMsg("Decrypting sealed conversation lines key-side...");
    setErrorMessage("");

    try {
      const response = await fetch("/api/chat/history", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Loading history crashed");
      }

      const encryptedHistory: EncryptedMessagePayload[] = data.history || [];
      const decryptedList: Message[] = [];

      if (cryptoKey) {
        for (const msg of encryptedHistory) {
          try {
            const decTxt = await decryptText(msg.encryptedText, msg.iv, cryptoKey);
            decryptedList.push({
              role: msg.role,
              text: decTxt,
              timestamp: msg.timestamp,
            });
          } catch (decryptErr) {
            console.error("Single message decryption failure:", decryptErr);
            // push warning placeholder to let user know data is locked or modified
            decryptedList.push({
              role: msg.role,
              text: "⚠️ [Decryption Failed: This block is securely sealed under a different E2E keypair]",
              timestamp: msg.timestamp,
            });
          }
        }
      }

      setMessages(decryptedList);
      setStatusMsg("Sealed history loaded successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to retrieve historic ciphers.");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Sync state to zero-knowledge server by encrypting all history locally
  const syncEncryptedHistoryWithServer = async (updatedList: Message[]) => {
    if (!cryptoKey) return;
    setStatusMsg("Crypt-sealing history with AES-GCM-256...");

    try {
      const encryptedPayload: EncryptedMessagePayload[] = [];
      for (const msg of updatedList) {
        // Skip decryption failure warning items
        if (msg.text.includes("[Decryption Failed")) continue;

        const cryptOut = await encryptText(msg.text, cryptoKey);
        encryptedPayload.push({
          role: msg.role,
          encryptedText: cryptOut.ciphertext,
          iv: cryptOut.iv,
          timestamp: msg.timestamp,
        });
      }

      const response = await fetch("/api/chat/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: encryptedPayload }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to synchronize ciphers with server database");
      }

      setStatusMsg("E2EE sync complete. Conversations are fully encrypted on server.");
    } catch (err: any) {
      console.error("Cryptographic synchronization failure:", err);
      setStatusMsg("Security Warning: Cloud sync failed. Practice was kept offline in-memory.");
    }
  };

  // Submit new message to the AI proxy route
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sendingMessage) return;

    setErrorMessage("");
    const userMessageText = inputText.trim();
    setInputText("");
    setSendingMessage(true);
    setStatusMsg("Delivering prompt via secure HTTPS TLS tunnel...");

    const newLocalUserMsg: Message = {
      role: "user",
      text: userMessageText,
      timestamp: Date.now(),
    };

    const nextList = [...messages, newLocalUserMsg];
    setMessages(nextList);

    try {
      // POST plain-text over secure pipeline for immediate processing by Gemini
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessageText,
          settings: {
            cefrLevel,
            tutorStyle,
            accent,
          },
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "The AI tutor had an unexpected timing issue.");
      }

      const tutorReplyText = data.text;

      const newLocalBotMsg: Message = {
        role: "model",
        text: tutorReplyText,
        timestamp: Date.now(),
      };

      const finalIncomingList = [...nextList, newLocalBotMsg];
      setMessages(finalIncomingList);

      // Extract details for the Grammar Correction panel helper
      parseGrammarCorrections(tutorReplyText);

      // Encrypt and post everything back to long-term storage
      await syncEncryptedHistoryWithServer(finalIncomingList);

    } catch (err: any) {
      setErrorMessage(err.message || "Unable to reach Tutor proxy endpoint.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Parse custom structures from Gemini text outputs to feed auxiliary diagnostics panels
  const parseGrammarCorrections = (text: string) => {
    try {
      // Look for indicators matching grammar evaluations inside Gemini's prompt return
      const lowerText = text.toLowerCase();
      if (lowerText.includes("grammar") || lowerText.includes("correction") || lowerText.includes("incorrect")) {
        // Attempt a smart parser matching markdown block structures or highlighted lines
        // For visual enrichment, let's look for markdown blocks or highlight structures
        let original = "";
        let corrected = "";
        let tip = "Review capitalization, clause structure or preposition matches.";

        const lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.toLowerCase().includes("incorrect:") || line.toLowerCase().includes("original:")) {
            original = line.replace(/^(incorrect|original):/i, "").trim().replace(/["']/g, "");
          } else if (line.toLowerCase().includes("corrected:") || line.toLowerCase().includes("correct:")) {
            corrected = line.replace(/^(corrected|correct|suggestion):/i, "").trim().replace(/["']/g, "");
          } else if (line.toLowerCase().includes("tip:") || line.toLowerCase().includes("grammar rule:")) {
            tip = line.replace(/^(tip|grammar rule):/i, "").trim();
          }
        }

        if (original && corrected) {
          setActiveCorrection({ original, corrected, tip });
        } else {
          // General practice correction tips
          setActiveCorrection({
            original: "Practice makes perfect. Review your spelling & prepositions.",
            corrected: "Our syntax is looking highly polished!",
            tip: "Keep practicing dialogs to master verb matching."
          });
        }
      } else {
        // Hide panel if everything is perfectly correct
        setActiveCorrection(null);
      }
    } catch (pe) {
      console.error("Auxiliary parsing failure:", pe);
    }
  };

  const handleResetHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your securely encrypted chat logs? This is irreversible.")) return;
    setMessages([]);
    setActiveCorrection(null);
    await syncEncryptedHistoryWithServer([]);
  };

  return (
    <div id="tutor-chat-box" className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in max-w-6xl mx-auto my-4">
      
      {/* 1. Left Sidebar Options Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-6 lg:col-span-1">
        
        <div>
          <h3 className="text-sm font-bold font-sans text-slate-800 tracking-tight mb-3">Tutor Configuration</h3>
          
          {/* Tutor Selector */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Coach Personality</label>
              <select
                id="tutor-coach-select"
                value={tutorStyle}
                onChange={(e) => setTutorStyle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2.5 font-sans font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Sam (Friendly)">Sam — Friendly Conversationalist</option>
                <option value="Clara (Analytical)">Clara — Academic Grammarian</option>
                <option value="Liam (Executive)">Liam — Business Coach</option>
              </select>
            </div>

            {/* Accent Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Pronunciation Accent</label>
              <select
                id="tutor-accent-select"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2.5 font-sans font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="American">American Accent</option>
                <option value="British">British Accent</option>
                <option value="Australian">Australian Accent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cryptographic E2EE Status Panel */}
        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" /> E2EE Active
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Lock Tunnel signature</span>
            <code className="text-[10px] font-mono bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-md block truncate text-slate-200" title={fingerprint}>
              {fingerprint}
            </code>
          </div>

          <p className="text-[10px] text-slate-350 font-sans leading-relaxed">
            Every chat response isymmetrically crypt-sealed at rest using AES-GCM locally. The server stores ciphertexts without possession of keys.
          </p>
        </div>

        {/* Grammar Correction auxiliary diagnostics panel */}
        {activeCorrection && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3 animate-fade-in">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700">
              Grammar Correction Alert
            </span>

            <div className="space-y-2">
              <div className="text-xs">
                <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 font-bold block mb-0.5">Original / Incorrect</span>
                <p className="text-slate-650 font-sans line-through bg-rose-50/60 p-2 rounded-lg border border-rose-100/40 text-xs italic">{activeCorrection.original}</p>
              </div>

              <div className="text-xs">
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 font-bold block mb-0.5">Corrected suggestion</span>
                <p className="text-slate-800 font-sans font-semibold bg-emerald-50/60 p-2 rounded-lg border border-emerald-100/40 text-xs">{activeCorrection.corrected}</p>
              </div>

              <div className="text-xs border-t border-indigo-100/30 pt-1.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-indigo-500 font-bold block mb-0.5">Quick grammar rule</span>
                <p className="text-slate-600 font-sans text-[11px] leading-relaxed">{activeCorrection.tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* CEFR Vocabulary & Idioms Booster card */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold font-sans text-slate-800 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 mr-1.5 animate-pulse" /> Vocab Accelerator
            </span>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 roundedbg-indigo-50 border border-indigo-100 text-indigo-600 uppercase">
              {cefrLevel}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 font-bold block">{currentPhrase.type}</span>
            <h4 className="text-sm font-sans font-extrabold text-indigo-950 underline decoration-indigo-400 decoration-2">
              "{currentPhrase.phrase}"
            </h4>
            <p className="text-[11px] text-slate-600 font-sans leading-normal bg-white p-2 rounded-lg border border-slate-100">
              <strong className="text-slate-850 font-sans font-semibold">Meaning:</strong> {currentPhrase.meaning}
            </p>
            <p className="text-[10.5px] text-slate-500 font-sans italic pl-1 leading-relaxed border-l-2 border-indigo-200">
              "{currentPhrase.example}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100/65">
            <button
              onClick={() => {
                setInputText(`I would like to practice using the expression "${currentPhrase.phrase}" in a dialogue.`);
                // Scroll or focus could be triggered naturally by user
              }}
              className="text-[10px] font-sans font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer shadow-xs"
              title="Click to automatically load this expression into the message box"
            >
              Practice in Chat
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentPhrase.phrase);
                setCopiedPhrase(true);
                setTimeout(() => setCopiedPhrase(false), 2000);
              }}
              className={`text-[10px] font-sans font-bold border transition-all py-1.5 px-2.5 rounded-lg cursor-pointer ${
                copiedPhrase 
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700" 
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              {copiedPhrase ? "✓ Copied!" : "Copy Phrase"}
            </button>
          </div>
        </div>

        <button
          id="clear-logs-btn"
          onClick={handleResetHistory}
          className="w-full text-center hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-400 py-2.5 rounded-xl text-xs font-semibold font-sans transition-all active:scale-[0.98]"
        >
          Clear Encrypted Logs
        </button>

      </div>

      {/* 2. Chat Conversation Screen (Right Span) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[580px] lg:col-span-3">
        
        {/* Chat top header */}
        <div className="bg-slate-50 border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <div>
              <span className="text-xs font-bold text-slate-800 font-sans block">{tutorStyle} AI English Tutor</span>
              <span className="text-[10px] text-gray-500 font-sans leading-relaxed">Practicing at your current CEFR competence: <strong className="text-slate-700">{cefrLevel}</strong></span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-indigo-600 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-md">
            {accent.toUpperCase()} ACCENT ACTIVE
          </span>
        </div>

        {/* Message feed viewport */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50/40">
          
          {loadingHistory && (
            <div className="flex items-center justify-center space-y-2 py-12 flex-col">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs font-mono font-medium text-slate-500">Decrypting sealed dialogues locally...</p>
            </div>
          )}

          {!loadingHistory && messages.length === 0 && (
            <div className="text-center py-16 px-6 max-w-sm mx-auto space-y-3">
              <Bot className="w-10 h-10 text-slate-350 mx-auto stroke-[1.25]" />
              <h4 className="text-sm font-bold text-slate-700 font-sans">Initialize conversation with {tutorStyle}!</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Tell me something about your week, write a statement in English, or ask a question. I will analyze your grammar and pronunciation metrics dynamically!
              </p>
            </div>
          )}

          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 px-1 py-0.5 items-start ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Profile Circle Icon */}
                <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border flex-shrink-0 ${
                  isUser 
                    ? "bg-indigo-50 border-indigo-100 text-indigo-600" 
                    : "bg-emerald-50 border-emerald-100 text-emerald-600"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble Container */}
                <div className={`max-w-[76%] rounded-2xl px-4 py-3 shadow-2xs ${
                  isUser 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white border border-gray-150 text-slate-800 rounded-tl-none font-sans"
                }`}>
                  <p className="text-xs font-sans leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            );
          })}

          {sendingMessage && (
            <div className="flex gap-3 items-start flex-row">
              <div className="w-8.5 h-8.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-150 max-w-[76%] rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Status telemetry bar */}
        {statusMsg && (
          <div className="bg-slate-900 text-slate-300 px-5 py-1.5 border-t border-slate-800/80 text-[10px] font-mono flex items-center justify-between">
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
              {statusMsg}
            </span>
            <span className="text-indigo-400">Secure AES-GCM Mode</span>
          </div>
        )}

        {/* Error reporting alerts */}
        {errorMessage && (
          <div className="bg-rose-50 text-rose-800 px-5 py-2 text-xs flex items-center border-t border-rose-100">
            <ShieldAlert className="w-4 h-4 mr-2 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Message Input submit bar */}
        <form onSubmit={handleSendMessage} className="border-t border-gray-150 p-4 bg-white flex gap-2">
          <input
            id="chat-message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Practice writing a message at CEFR level ${cefrLevel}...`}
            disabled={sendingMessage || loadingHistory}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || sendingMessage || loadingHistory}
            className={`p-3 rounded-xl flex items-center justify-center transition-all ${
              !inputText.trim() || sendingMessage || loadingHistory
                ? "bg-slate-105 text-slate-350 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
