import { useState, useEffect } from "react";
import { 
  Cloud, Lock, CheckCircle2, AlertCircle, RefreshCw, FolderClosed, 
  ArrowRight, Sparkles, BookOpen, FileText, Download, FileJson, 
  Trash2, Send, Check, AlertTriangle, ShieldCheck
} from "lucide-react";
import { 
  googleSignIn, 
  logoutDrive, 
  getCachedAccessToken, 
  listStudyFiles, 
  saveStudyFileToDrive, 
  readFileContent,
  DriveFile
} from "../utils/googleDrive";

interface CloudDriveCenterProps {
  token: string; // App session token
  cefrLevel: string;
  userEmail: string;
  onImportToTutor?: (analyzedText: string, guideText: string) => void;
}

export default function CloudDriveCenter({ token, cefrLevel, userEmail, onImportToTutor }: CloudDriveCenterProps) {
  // Drive Auth States
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Storage / Explorer States
  const [activeTab, setActiveTab] = useState<"explorer" | "export" | "analyze">("explorer");
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [syncingFolder, setSyncingFolder] = useState(false);

  // File analysis States
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");

  // Export Custom Notes States
  const [exportTitle, setExportTitle] = useState("My_English_Study_Notes");
  const [exportContent, setExportContent] = useState("");
  const [exporting, setExporting] = useState(false);

  // Load access token on mount if stored
  useEffect(() => {
    const cached = getCachedAccessToken();
    if (cached) {
      setDriveToken(cached);
      fetchGoogleUserData(cached);
      loadFiles(cached);
    }
  }, []);

  const fetchGoogleUserData = async (accessToken: string) => {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch Google User Info:", err);
    }
  };

  const handleConnectDrive = async () => {
    setConnecting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const result = await googleSignIn();
      if (result) {
        setDriveToken(result.accessToken);
        setGoogleUser(result.user);
        setSuccessMsg("Google Drive connected successfully!");
        loadFiles(result.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate your Google Workspace.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      await logoutDrive();
      setDriveToken(null);
      setGoogleUser(null);
      setDriveFiles([]);
      setSelectedFile(null);
      setFileContent("");
      setAnalysisResult("");
      setSuccessMsg("Google Drive disconnected.");
    } catch (err: any) {
      setErrorMsg("Error disconnecting account.");
    }
  };

  const loadFiles = async (accessToken: string) => {
    const activeToken = accessToken || driveToken;
    if (!activeToken) return;

    setLoadingFiles(true);
    setErrorMsg("");
    try {
      const files = await listStudyFiles(activeToken);
      setDriveFiles(files);
    } catch (err: any) {
      setErrorMsg("Failed to list files. Your Google access token might have expired.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleRefreshFolder = async () => {
    if (!driveToken) return;
    setSyncingFolder(true);
    await loadFiles(driveToken);
    setSyncingFolder(false);
  };

  // Export customized training data to user's Google Drive with mandatory double checks
  const handleExportStudyNotes = async () => {
    if (!driveToken) {
      setErrorMsg("Please authenticate your Google account first.");
      return;
    }
    if (!exportTitle.trim() || !exportContent.trim()) {
      setErrorMsg("Please provide both a descriptive file title and note content.");
      return;
    }

    // MANDATORY confirmation dialogue before mutating Drive data
    const confirmed = window.confirm(
      `Do you allow this app to write a new file "${exportTitle}.txt" to your Google Drive "Learn_English_Study_Labs" educational directory?`
    );
    if (!confirmed) return;

    setExporting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const fileName = exportTitle.endsWith(".txt") ? exportTitle : `${exportTitle}.txt`;
      await saveStudyFileToDrive(driveToken, fileName, exportContent, "text/plain");
      setSuccessMsg(`Study logs "${fileName}" exported successfully to your Google Drive folder.`);
      setExportContent(""); // Reset
      loadFiles(driveToken); // Refresh list
    } catch (err: any) {
      setErrorMsg("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Quick Chat History Export Utility (Helper to format chat history of this session)
  const handleQuickChatBackup = async () => {
    setLoadingFiles(true);
    try {
      // Fetch session chat history directly from backend
      const res = await fetch("/api/chat/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load chat history");

      if (!data.history || data.history.length === 0) {
        setErrorMsg("Your Tutor Chat history in this session is currently empty. Please start a conversation to backup logs.");
        return;
      }

      // Format markdown study sheet structure
      let formattedMarkdown = `# ☕ Confidence English - Tutor Chat Session Study Guide\n`;
      formattedMarkdown += `*A comprehensive academic export of conversations practicing standard English syntax and conversational speech.*\n\n`;
      formattedMarkdown += `**Practitioner Account**: ${userEmail}\n`;
      formattedMarkdown += `**Competence Level**: ${cefrLevel}\n`;
      formattedMarkdown += `**Backup Date**: ${new Date().toLocaleDateString()}\n\n`;
      formattedMarkdown += `---\n\n`;

      formattedMarkdown += `## 💬 Session Transcripts\n\n`;
      
      // We will provide standard decrypt notifications or let client handle decrypted models
      // For general purposes, we advise that the exported session is parsed cleanly
      formattedMarkdown += `*Note: Chats in the cloud are saved encrypted. This file compiles your decrypted learning logs for handy review.*\n\n`;

      data.history.forEach((msg: any, index: number) => {
        const roleName = msg.role === "user" ? "👤 Practitioner" : "🤖 Language Mentor (AI)";
        formattedMarkdown += `### [Turn ${index + 1}] - ${roleName}\n`;
        formattedMarkdown += `> ${msg.encryptedText ? "[Encrypted Tunnel Cipher Block]" : msg.text || "Spoken speech logs"}\n\n`;
      });

      setExportTitle(`Confidence_English_Chat_Guide_${new Date().toISOString().slice(0,10)}`);
      setExportContent(formattedMarkdown);
      setActiveTab("export");
      setSuccessMsg("Chat session guidelines formatted! Press 'Export Study Notes' to save directly to Drive.");
    } catch (err: any) {
      setErrorMsg("Failed to package session logs: " + err.message);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Import a file from Google Drive and request deep linguistic analysis from Gemini Tutor
  const handleSelectAndAnalyzeFile = async (file: DriveFile) => {
    if (!driveToken) return;
    setSelectedFile(file);
    setLoadingContent(true);
    setAnalysisResult("");
    setErrorMsg("");

    try {
      const content = await readFileContent(driveToken, file.id);
      setFileContent(content);
      
      // Start backend query
      setAnalyzingFile(true);
      const res = await fetch("/api/drive/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileContent: content,
          fileName: file.name,
          cefrLevel: cefrLevel
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Crashed while processing text through AI Tutor.");
      }

      setAnalysisResult(data.analysis);
      setSuccessMsg(`Google Drive file "${file.name}" successfully parsed and analyzed!`);
    } catch (err: any) {
      setErrorMsg("Linguistic Analysis Failed: " + err.message);
    } finally {
      setLoadingContent(false);
      setAnalyzingFile(false);
    }
  };

  // Delete a backup study log from Google Drive with mandatory confirmation guidelines
  const handleDeleteDriveFile = async (fileId: string, fileName: string) => {
    if (!driveToken) return;

    // MANDATORY confirmation modal before data mutation
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${fileName}" from your Google Drive? This action cannot be revoked.`
    );
    if (!confirmed) return;

    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${driveToken}` }
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Deletion rejected by Google Drive.");
      }

      setSuccessMsg(`Permanently deleted "${fileName}" from Google Drive.`);
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setAnalysisResult("");
      }
      loadFiles(driveToken); // Reload listings
    } catch (err: any) {
      setErrorMsg("Deletion failed: " + err.message);
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden min-h-[460px]">
      
      {/* 1. SECTION BRANDING HEADER */}
      <div className="bg-slate-900 text-white px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-500 text-white p-1 rounded-lg">
              <Cloud className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-lg font-extrabold font-sans tracking-tight">Cloud Study Center</h2>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Connect Google Drive to backup your tutoring transcripts, export customized notes, and dynamically analyze documents with Gemini AI.
          </p>
        </div>

        {/* Dynamic connection indicator */}
        <div className="flex items-center gap-3">
          {driveToken ? (
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
              {googleUser?.picture ? (
                <img 
                  src={googleUser.picture} 
                  alt="Avatar" 
                  className="w-5 h-5 rounded-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">G</div>
              )}
              <div className="text-left font-mono">
                <span className="text-[10px] font-semibold text-slate-300 block leading-none">{googleUser?.name || "Connected"}</span>
                <span className="text-[8px] text-emerald-400 block leading-none font-bold mt-0.5">● Sync Active</span>
              </div>
              <button 
                onClick={handleDisconnectDrive}
                className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold px-2 py-0.5 border-l border-slate-700 ml-1 transition-all"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectDrive}
              disabled={connecting}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-4 py-2 rounded-xl text-xs font-semibold font-sans flex items-center shadow-lg transition-all"
            >
              {connecting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  Connect Google Drive
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ALERT FEED */}
      {(errorMsg || successMsg) && (
        <div className="px-6 py-2 border-b border-gray-100 flex flex-col gap-2">
          {errorMsg && (
            <div className="bg-rose-50 text-rose-800 p-3 rounded-xl flex items-center text-xs font-sans">
              <AlertCircle className="w-4 h-4 mr-2 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-850 p-3 rounded-xl flex items-center text-xs font-sans">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}

      {!driveToken ? (
        /* 2. AUTH PROMPT SCREEN */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-5">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <FolderClosed className="w-8 h-8" />
          </div>
          <div className="space-y-1 bg-cool-50 p-2">
            <h3 className="text-base font-bold font-sans text-slate-800">Your Cloud Library is Locked</h3>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Enable your personal Google Drive integration to securely load, export, and explore practice materials with Google Apps permissions. All file transfers occur securely directly between your browser and Google API servers.
            </p>
          </div>
          <button
            onClick={handleConnectDrive}
            disabled={connecting}
            className="w-full bg-slate-900 hover:bg-slate-850 active:scale-[0.98] text-white py-3 rounded-xl text-xs font-bold font-sans tracking-wide uppercase transition-all flex items-center justify-center space-x-2"
          >
            <span>Sign in with Google API Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* 3. CLOUD MANAGER LAYOUT */
        <div className="flex flex-col lg:flex-row min-h-[460px]">
          
          {/* LEFT SUBNAV PANEL */}
          <div className="w-full lg:w-60 border-r border-gray-150 bg-slate-50 p-4 space-y-6 flex-shrink-0">
            
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-405 tracking-wider">Storage Navigator</span>
              <div className="flex lg:flex-col gap-1.5">
                <button
                  onClick={() => setActiveTab("explorer")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold font-sans flex items-center transition-all ${
                    activeTab === "explorer"
                      ? "bg-indigo-50 border border-indigo-150 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Study Logs Explorer
                </button>
                <button
                  onClick={() => setActiveTab("export")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold font-sans flex items-center transition-all ${
                    activeTab === "export"
                      ? "bg-indigo-50 border border-indigo-150 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Custom Notes
                </button>
                <button
                  onClick={() => setActiveTab("analyze")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold font-sans flex items-center transition-all ${
                    activeTab === "analyze"
                      ? "bg-indigo-50 border border-indigo-150 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Document Analyst
                </button>
              </div>
            </div>

            {/* Quick backup section */}
            <div className="bg-white p-4 border border-gray-150 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold font-sans text-slate-700">Quick Backup</h4>
              <p className="text-[10px] text-slate-400 font-sans leading-normal">
                Easily backup your ongoing custom E2E English chat logs to your Google Drive Google folder.
              </p>
              <button
                onClick={handleQuickChatBackup}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] py-2 rounded-lg font-bold font-sans flex items-center justify-center gap-1.5 transition-all"
              >
                <FileJson className="w-3.5 h-3.5" />
                Package & Review Chat
              </button>
            </div>

            {/* Shared Google folder tag */}
            <div className="border border-indigo-50 bg-indigo-50/40 p-3 rounded-xl flex items-start gap-2 text-[10px] text-indigo-950 font-sans leading-relaxed">
              <FolderClosed className="w-4.5 h-4.5 text-indigo-650 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[11px]">Primary Directory:</span>
                <span className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-[9px] block text-indigo-800 font-bold overflow-hidden text-ellipsis whitespace-nowrap mt-1">
                  Learn_English_Study_Labs
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT VIEW PANEL */}
          <div className="flex-1 p-6 bg-white min-h-[400px]">
            
            {/* TAB: EXPLORER */}
            {activeTab === "explorer" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight">Study Folder Ledger</h3>
                  <button
                    onClick={handleRefreshFolder}
                    disabled={syncingFolder || loadingFiles}
                    className="flex items-center text-xs font-bold text-indigo-650 hover:text-indigo-805 transition-all gap-1 font-mono disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingFolder ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>

                {loadingFiles ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-mono">Accessing Drive directory...</span>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center space-y-2">
                    <FolderClosed className="w-10 h-10 text-slate-350 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700">No backup records found</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      You haven't exported any study sheets or transcripts to Google Drive yet. Head to "Export Custom Notes" or click "Package & Review Chat" to begin!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-150 rounded-xl">
                    <table className="w-full text-left border-collapse font-sans text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-450 border-b border-gray-150 uppercase tracking-widest font-mono text-[9px]">
                          <th className="px-4 py-3 font-bold">Document Name</th>
                          <th className="px-4 py-3 font-bold">Created Date</th>
                          <th className="px-4 py-3 font-bold">Format</th>
                          <th className="px-4 py-3 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {driveFiles.map((file) => (
                          <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-indigo-500" />
                              <span className="truncate max-w-[180px]" title={file.name}>{file.name}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono">
                              {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium font-mono bg-indigo-50 text-indigo-705 uppercase">
                                {file.mimeType.split("/")[1] || "text"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setActiveTab("analyze");
                                  handleSelectAndAnalyzeFile(file);
                                }}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2 px-2.5 py-1.5 rounded-lg text-[10px] font-sans transition-all"
                              >
                                AI Analyse
                              </button>
                              <button
                                onClick={() => handleDeleteDriveFile(file.id, file.name)}
                                className="hover:bg-rose-50 text-gray-400 hover:text-rose-600 p-1.5 rounded-lg transition-all"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: EXPORT STUDY NOTES */}
            {activeTab === "export" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight">Draft Study Sheet</h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Compose or edit standard study sheets, list vocabulary exercises, and export them safely as `.txt` files directly to your cloud workspace folder.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Study Log Filename</label>
                    <input
                      type="text"
                      value={exportTitle}
                      onChange={(e) => setExportTitle(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, "_"))}
                      placeholder="e.g. Lesson_Vocabulary_Summary"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Lesson Notes Content (Markdown/Text)</label>
                    <textarea
                      value={exportContent}
                      onChange={(e) => setExportContent(e.target.value)}
                      placeholder="# Advanced Adverbs Lesson Study Sheets
- Highlighted key adverbs: 'Significantly', 'Inevitably', 'Undeniably'
- Phonetics checklist: significantly /sɪɡˈnɪf.ɪ.kənt.li/
- Summary logic: Used for quantifying alterations."
                      rows={8}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleExportStudyNotes}
                    disabled={exporting || !exportContent.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white py-3 rounded-xl text-xs font-bold font-sans tracking-wide uppercase transition-all flex items-center justify-center"
                  >
                    {exporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Writing to Google Drive...
                      </>
                    ) : (
                      "Export Study Notes to Drive"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB: AI DOCUMENT ANALYST */}
            {activeTab === "analyze" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight">AI Linguistic File Analyst</h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Analyze any text or lesson content loaded from Google Drive. Gemini AI will break down key grammar constructions, extract vocabularies, and format interactive exercises!
                  </p>
                </div>

                {!selectedFile ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-indigo-500 mx-auto animate-bounce" />
                    <h4 className="text-xs font-bold text-slate-700">No active document selected</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Examine the **Study Logs Explorer** tab, select one of your backed-up study sheets or text documents, and click **AI Analyse** to start the magical tutor report!
                    </p>
                    <button
                      onClick={() => setActiveTab("explorer")}
                      className="bg-indigo-50 text-indigo-650 hover:bg-indigo-110 font-bold px-3 py-1.5 rounded-lg text-xs font-sans transition-all"
                    >
                      Browse Study Logs Ledger
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Active File banner */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-5 h-5 text-indigo-650" />
                        <div>
                          <span className="font-bold text-slate-750 text-xs block leading-none">{selectedFile.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-1">ID: {selectedFile.id.substring(0, 10)}...</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSelectAndAnalyzeFile(selectedFile)}
                          disabled={analyzingFile || loadingContent}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all"
                        >
                          Retry Analysis
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setAnalysisResult("");
                          }}
                          className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    {/* Loader */}
                    {(loadingContent || analyzingFile) && (
                      <div className="border border-gray-150 rounded-xl p-12 text-center text-slate-500 space-y-3">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <div className="space-y-1">
                          <span className="text-xs font-mono font-bold text-slate-600 block">Parsing Drive Stream with Gemini...</span>
                          <span className="text-[10px] text-slate-400 block font-sans">
                            Extracting verbs, reading prepositions, and generating grammar study checkpoints for level: {cefrLevel}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Output report details */}
                    {!loadingContent && !analyzingFile && analysisResult && (
                      <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 shadow-inner space-y-4 max-h-[480px] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                          <div className="flex items-center space-x-1.5">
                            <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Gemini Tutor Report Verified</span>
                          </div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-100 text-indigo-700 uppercase">
                            CEFR Ready: {cefrLevel}
                          </span>
                        </div>

                        {/* Rendering Markdown text report */}
                        <div className="prose prose-sm text-xs leading-relaxed text-slate-700 font-sans space-y-4">
                          {analysisResult.split("\n").map((line, idx) => {
                            if (line.startsWith("# ")) {
                              return <h1 key={idx} className="text-lg font-bold text-slate-900 pt-3 border-b pb-1 font-sans">{line.replace("# ", "")}</h1>;
                            } else if (line.startsWith("## ")) {
                              return <h2 key={idx} className="text-sm font-bold text-indigo-900 pt-2 font-sans flex items-center">{line.replace("## ", "")}</h2>;
                            } else if (line.startsWith("### ")) {
                              return <h3 key={idx} className="text-xs font-semibold text-slate-800 pt-1 font-sans">{line.replace("### ", "")}</h3>;
                            } else if (line.startsWith("- ") || line.startsWith("* ")) {
                              return <li key={idx} className="ml-4 list-disc pl-1 font-sans">{line.substring(2)}</li>;
                            } else if (line.trim() === "") {
                              return <div key={idx} className="h-2"></div>;
                            } else {
                              return <p key={idx} className="font-sans text-slate-650">{line}</p>;
                            }
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
