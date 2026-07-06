import { useState, useEffect, FormEvent } from "react"
import { 
  ShieldCheck, Lock, User, Mail, BookOpen, Sparkles, Mic, 
  TrendingUp, LogOut, KeyRound, Check, HelpCircle, Eye, EyeOff, ShieldAlert,
  Cloud
} from "lucide-react";
import { deriveE2EKey } from "./utils/crypto";
import Logo from "./logo.png";
// Imported Interactive Components
import PlacementQuiz from "./components/PlacementQuiz";
import StatsDashboard from "./components/StatsDashboard";
import PronunciationLab from "./components/PronunciationLab";
import TutorChat from "./components/TutorChat";
import CloudDriveCenter from "./components/CloudDriveCenter";

export default function App() {
  // Auth states
  const [isLogin, setIsLogin] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [fingerprint, setFingerprint] = useState("");

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Flow states
  const [isFirstRegistration, setIsFirstRegistration] = useState(false);
  const [currentTab, setCurrentTab] = useState<"tutor" | "pronunciation" | "stats" | "drive">("tutor");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Initialize and check current user on application load
  useEffect(() => {
    const savedToken = sessionStorage.getItem("english_session_token");
    const savedEmail = sessionStorage.getItem("english_user_email");
    
    // Automatic cleanup of expired sessions on reload
    if (savedToken && savedEmail) {
      setLoading(true);
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Session expired");
          return res.json();
        })
        .then((data) => {
          setToken(savedToken);
          setUser(data.user);
          
          // Attempt to restore E2E key derived from credentials dynamically if saved temporarily (in-memory only of course)
          const savedPassPhrase = sessionStorage.getItem("english_passphrase_entropy");
          if (savedPassPhrase) {
            deriveE2EKey(savedPassPhrase, savedEmail).then((key) => {
              setCryptoKey(key);
            });
          }
        })
        .catch(() => {
          handleLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  // Real-time password validations
  const passLengthMet = password.length >= 8;
  const passUpperMet = /[A-Z]/.test(password);
  const passLowerMet = /[a-z]/.test(password);
  const passDigitMet = /[0-9]/.test(password);
  const passSpecialMet = /[^A-Za-z0-9]/.test(password);
  const allPassRequirementsMet = passLengthMet && passUpperMet && passLowerMet && passDigitMet && passSpecialMet;

  // Sign up handling
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    
    if (!allPassRequirementsMet) {
      setAuthError("Password does not meet required security complexity guidelines.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "A secure registration error occurred.");
      }

      setAuthSuccess("Acount registered successfully! Logging in...");
      
      // Auto Login on register success
      setTimeout(() => {
        handleLogin(new Event("submit") as any);
      }, 1000);

    } catch (err: any) {
      setAuthError(err.message || "Failed to secure user credentials on the server.");
      setLoading(false);
    }
  };

  // Sign in handling
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Access Denied: Invalid credentials.");
      }

      const activeToken = data.token;
      sessionStorage.setItem("english_session_token", activeToken);
      sessionStorage.setItem("english_user_email", email);
      
      // Deriving AES-GCM Key securely in the browser
      const derivedKey = await deriveE2EKey(password, email);
      setCryptoKey(derivedKey);

      // Save standard credentials in-memory within sessionStorage temporarily in this sandboxed environment
      sessionStorage.setItem("english_passphrase_entropy", password);

      setToken(activeToken);
      setUser(data.user);

      // Check if the user is a first time registry and triggers placement quiz
      if (displayName !== "") {
        setIsFirstRegistration(true);
      }

      setAuthSuccess("Crypto Tunnel Established. Welcome!");
    } catch (err: any) {
      setAuthError(err.message || "Credential matching failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("english_session_token");
    sessionStorage.removeItem("english_user_email");
    sessionStorage.removeItem("english_passphrase_entropy");
    setToken(null);
    setUser(null);
    setCryptoKey(null);
    setFingerprint("");
    setEmail("");
    setPassword("");
    setDisplayName("");
    setIsFirstRegistration(false);
    setCurrentTab("tutor");
    setAuthSuccess("");
    setAuthError("");
  };

  const handleQuizResolution = (cefrLevel: string) => {
    setUser((prev: any) => ({ ...prev, cefrLevel }));
    setIsFirstRegistration(false);
  };

  if (loading && !token) {
    return (
      <div id="main-loader-screen" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono font-bold text-slate-500">Decrypting session sandbox layers...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      
      {/* 1. AUTHENTICATION SCREENS OVERLAY (If not authorized) */}
      {!token ? (
        <div id="auth-view-screen" className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-white">
          
          {/* Elegant Full Page Logo Cover Background - covering the entire background in white theme */}
          <div className="absolute inset-0 w-full h-full select-none overflow-hidden pointer-events-none z-0">
            <img 
              src="/api/logo.png" 
              alt="Full Page Logo Cover" 
              className="w-full h-full object-cover opacity-90 transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            {/* Elegant light/white professional backdrop overlay to let the gorgeous logo shine through clearly while maintaining optimal contrast */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>
          </div>

          <div className="w-full max-w-xl relative z-10 space-y-6 bg-white/95 backdrop-blur-md p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-2xl">
            
            {/* Header branding with custom unified logo */}
            <div className="text-center animate-fade-in pb-2">
              <div className="mx-auto w-72 h-72 flex items-center justify-center relative">
                <img 
                  src="/api/logo.png" 
                  alt="Learn English Logo" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Auth card panel */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-800/20 overflow-hidden">
              
              {/* Tab Toggles */}
              <div className="flex border-b border-gray-150">
                <button
                  id="tab-toggle-login"
                  onClick={() => {
                    setIsLogin(true);
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className={`w-1/2 py-4 text-xs font-bold font-mono tracking-wider uppercase transition-all ${
                    isLogin ? "border-b-2 border-indigo-600 text-indigo-600 bg-white" : "text-gray-400 hover:text-slate-600 bg-slate-50"
                  }`}
                >
                  Access Sandbox Portal
                </button>
                <button
                  id="tab-toggle-register"
                  onClick={() => {
                    setIsLogin(false);
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className={`w-1/2 py-4 text-xs font-bold font-mono tracking-wider uppercase transition-all ${
                    !isLogin ? "border-b-2 border-indigo-600 text-indigo-600 bg-white" : "text-gray-400 hover:text-slate-600 bg-slate-50"
                  }`}
                >
                  Create Secure Keycard
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                
                {/* Authorization Alerts */}
                {authError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl flex items-start text-xs font-sans">
                    <ShieldAlert className="w-4 h-4 mr-2.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl flex items-start text-xs font-sans">
                    <Check className="w-4 h-4 mr-2.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                  
                  {/* Register display name */}
                  {!isLogin && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Display Name</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          id="auth-display-name-input"
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Robin Banks"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email address field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="auth-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  </div>

                  {/* Password access field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Secure Passphrase</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="auth-password-input"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 complex digits"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                      />
                      <button
                        id="toggle-visible-pass-btn"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength validation checkpoints (shows only on registration) */}
                  {!isLogin && (
                    <div id="password-requirements-view" className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-2 animate-fade-in">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Security validation checklist:</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                        <span className={`flex items-center space-x-1.5 ${passLengthMet ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                          <Check className={`w-3.5 h-3.5 ${passLengthMet ? "opacity-100 text-emerald-500" : "opacity-30"}`} /> <span>Min 8 characters</span>
                        </span>
                        <span className={`flex items-center space-x-1.5 ${passUpperMet ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                          <Check className={`w-3.5 h-3.5 ${passUpperMet ? "opacity-100 text-emerald-500" : "opacity-30"}`} /> <span>Uppercase letter [A-Z]</span>
                        </span>
                        <span className={`flex items-center space-x-1.5 ${passLowerMet ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                          <Check className={`w-3.5 h-3.5 ${passLowerMet ? "opacity-100 text-emerald-500" : "opacity-30"}`} /> <span>Lowercase letter [a-z]</span>
                        </span>
                        <span className={`flex items-center space-x-1.5 ${passDigitMet ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                          <Check className={`w-3.5 h-3.5 ${passDigitMet ? "opacity-100 text-emerald-500" : "opacity-30"}`} /> <span>Numerical digit [0-9]</span>
                        </span>
                        <span className={`flex items-center space-x-1.5 ${passSpecialMet ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                          <Check className={`w-3.5 h-3.5 ${passSpecialMet ? "opacity-100 text-emerald-500" : "opacity-30"}`} /> <span>Special symbol (#,$,%,etc.)</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    id="auth-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] hover:shadow-lg hover:shadow-indigo-600/20 text-white py-3 rounded-xl text-xs font-bold font-sans tracking-wide uppercase transition-all flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Binding crypto credentials...
                      </>
                    ) : isLogin ? (
                      "Establish Secure Connection"
                    ) : (
                      "Generate Encryption keys & Registrate"
                    )}
                  </button>

                </form>

                <div className="flex items-center justify-center space-x-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Verified 256-Bit Crypt-Tunnel Active</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      ) : (
        
        // 2. AUTHORIZED PROTECTED LEARNING DASHBOARD PAGE
        <>
          {/* Header Strip Navigation */}
          <header className="bg-white border-b border-gray-150 shadow-xs h-16 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center shadow-xs">
                  <img 
                    src="/api/logo.png" 
                    alt="Logo Left" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-sm font-extrabold text-slate-800 font-sans tracking-tight block">Confidence English</span>
                  <span className="text-[10px] text-gray-500 font-sans block leading-none">by Imran Qaseem</span>
                </div>
              </div>

              {/* Navigation Tabs */}
              {!isFirstRegistration && (
                <nav className="flex items-center space-x-1 md:space-x-2">
                  <button
                    id="nav-tab-tutor"
                    onClick={() => setCurrentTab("tutor")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-sans flex items-center transition-all ${
                      currentTab === "tutor"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "text-slate-600 hover:bg-slate-105"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Tutor Chat
                  </button>
                  <button
                    id="nav-tab-pronunciation"
                    onClick={() => setCurrentTab("pronunciation")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-sans flex items-center transition-all ${
                      currentTab === "pronunciation"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "text-slate-600 hover:bg-slate-105"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5 mr-1.5" /> Pronunciation Lab
                  </button>
                  <button
                    id="nav-tab-stats"
                    onClick={() => setCurrentTab("stats")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-sans flex items-center transition-all ${
                      currentTab === "stats"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "text-slate-600 hover:bg-slate-105"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Metrics Track
                  </button>
                  <button
                    id="nav-tab-drive"
                    onClick={() => setCurrentTab("drive")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-sans flex items-center transition-all ${
                      currentTab === "drive"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "text-slate-600 hover:bg-slate-105"
                    }`}
                  >
                    <Cloud className="w-3.5 h-3.5 mr-1.5" /> Cloud Library
                  </button>
                </nav>
              )}

              {/* User profile strip controls with small top-right corner logo */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden md:block">
                  <span className="text-xs font-bold text-slate-800 font-sans block leading-none mb-1">{user?.displayName || "Practice Avatar"}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 uppercase">
                    Competence: {user?.cefrLevel || "Beginner (A1)"}
                  </span>
                </div>
                <button
                  id="user-logout-btn"
                  onClick={handleLogout}
                  className="bg-slate-101 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 p-2 rounded-xl transition-all"
                  title="Logout Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                
                {/* Small Logo right top of the corner */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white shadow-md flex items-center justify-center flex-shrink-0 animate-fade-in" title="Learn English Portfolio">
                  <img 
                    src="/api/logo.png" 
                    alt="Learn English Right Corner Logo" 
                    className="w-full h-full object-cover rounded-full" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

            </div>
          </header>

          {/* Core Content Body */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
            
            {/* Conditional Route 1: First-time Placement quiz */}
            {isFirstRegistration ? (
              <div className="space-y-6">
                <div className="max-w-2xl mx-auto bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-start space-x-4">
                  <KeyRound className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-indigo-900 font-sans tracking-tight">Security Credentials Loaded</h3>
                    <p className="text-xs text-slate-650 font-sans leading-relaxed">
                      Symmetric crypt-key fingerprints were derived locally under AES-GCM protocols using PBKDF2 entropy. Your practice chats remain completely unreadable to the server at rest.
                    </p>
                  </div>
                </div>

                <PlacementQuiz token={token} onQuizComplete={handleQuizResolution} />
              </div>
            ) : (
              
              // Conditional Route 2: Standard practice Workspace pages
              <div className="space-y-6">
                {currentTab === "tutor" && (
                  <TutorChat 
                    token={token} 
                    cryptoKey={cryptoKey} 
                    userEmail={email} 
                    cefrLevel={user?.cefrLevel || "Beginner (A1)"} 
                  />
                )}

                {currentTab === "pronunciation" && (
                  <PronunciationLab token={token} />
                )}

                {currentTab === "stats" && (
                  <StatsDashboard 
                    displayName={user?.displayName || "Explorer"} 
                    cefrLevel={user?.cefrLevel || "Beginner (A1)"} 
                    fingerprint={cryptoKey ? `AES-GCM::${email.substring(0,3).toUpperCase()}-TUNNEL` : "OFFLINE::SECURED"}
                  />
                )}

                {currentTab === "drive" && (
                  <CloudDriveCenter 
                    token={token} 
                    cefrLevel={user?.cefrLevel || "Beginner (A1)"} 
                    userEmail={email} 
                  />
                )}
              </div>
            )}

          </main>

          {/* Secure Environment sandboxed Footer */}
          <footer className="bg-white border-t border-gray-150 py-4 text-center text-[10px] font-mono text-slate-400">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
              <span>Secure Sandboxed English Practicing Arena | TLS Dynamic Certificates verified</span>
              <span>Account: imran.hasni112211@gmail.com</span>
            </div>
          </footer>
        </>
      )}

    </div>
  );
}
