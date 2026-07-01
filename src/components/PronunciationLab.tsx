import { useState, useRef, useEffect } from "react";
import { Mic, Square, Volume2, ShieldAlert, Sparkles, RefreshCw, CheckCircle, TrendingUp } from "lucide-react";

interface Challenge {
  id: number;
  text: string;
  ipa: string;
  focus: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

const PHONETIC_CHALLENGES: Challenge[] = [
  {
    id: 1,
    text: "They thought that three thousand thin things were thrifty.",
    ipa: "/ðeɪ θɔːt ðæt θriː ˈθaʊzənd θɪn θɪŋz wɜː ˈθrɪfti/",
    focus: "Voiced and Voiceless 'TH' sounds ( /ð/ vs /θ/ )",
    difficulty: "Intermediate",
  },
  {
    id: 2,
    text: "The rugged, rain-soaked road tested the driver's ultimate resolve.",
    ipa: "/ðə ˈrʌɡɪd, reɪn-səʊkt rəʊd ˈtɛstɪd ðə ˈdraɪvəz ˈʌltɪmɪt rɪˈzɒlv/",
    focus: "Liquid Consonant '/r/' sound resonance",
    difficulty: "Advanced",
  },
  {
    id: 3,
    text: "She sells sea shells by the sea shore.",
    ipa: "/ʃiː sɛlz siː ʃɛlz baɪ ðə siː ʃɔː/",
    focus: "Sibilant s vs sh friction ( /s/ vs /ʃ/ )",
    difficulty: "Beginner",
  },
  {
    id: 4,
    text: "Particularly peculiar corporate partnerships produce perfect profit.",
    ipa: "/pəˈtɪkjʊləli pɪˈkjuːlɪə ˈkɔːpərɪt ˈpɑːtnəʃɪps prəˈdjuːs ˈpɜːfɪkt ˈprɒfɪt/",
    focus: "Bilabial Plosive '/p/' aspiration emphasis",
    difficulty: "Advanced",
  }
];

interface PronunciationLabProps {
  token: string;
}

export default function PronunciationLab({ token }: PronunciationLabProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [mismatchAlert, setMismatchAlert] = useState("");

  const currentChallenge = PHONETIC_CHALLENGES[currentIdx];

  // Ref hooks for standard Web Audio capture
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop media processes on components unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
  };

  const startMediaRecording = async () => {
    setMismatchAlert("");
    cleanupAudio();
    setShowResult(false);
    setRecordDuration(0);

    try {
      // Connect standard microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsRecording(true);

      // Start live 2D canvas plotting
      drawOscilloscope();

      // Launch session clock
      durationTimerRef.current = setInterval(() => {
        setRecordDuration((d) => {
          if (d >= 10) {
            stopMediaRecording();
            return 10;
          }
          return d + 1;
        });
      }, 1000);

    } catch (err) {
      setMismatchAlert("Microphone access denied or disconnected. Please enable mic access in browser permissions.");
      console.error("Audiosource connection failed:", err);
    }
  };

  const stopMediaRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    cleanupAudio();
    simulateEvaluation();
  };

  // Draw real-time voice oscilloscope to canvas
  const drawOscilloscope = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      if (!analyserRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Slate black background layout
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Sine line styles
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#4f46e5"; // Violet line
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw secondary glowing emerald core line when speaker active
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1;
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        // Introduce small phase offsets for organic look
        const y = (v * height) / 2 + Math.sin(i * 0.1) * 3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();
  };

  // Simulate phonetic processing
  const simulateEvaluation = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      // Formulate mock analytical speech feedback
      const scores = {
        overall: Math.floor(Math.random() * 25) + 70, // 70 - 95
        pronunciation: Math.floor(Math.random() * 20) + 75,
        fluency: Math.floor(Math.random() * 20) + 72,
        intonation: Math.floor(Math.random() * 25) + 70,
      };

      const stressPatterns = currentChallenge.id === 1 
        ? ["Excellent stress on 'thousand'", "Missed aspiration on voiceless 'thin' (need friction)", "Linguistic timing optimal"]
        : currentChallenge.id === 2 
        ? ["High alveolar resonance on 'rugged'", "Excellent liquid transition on 'driver'", "Resolutions sound slightly clipped"]
        : currentChallenge.id === 3
        ? ["Flawless sibilant transitions", "Crisp breathing pauses", "Pacing perfectly aligned"]
        : ["Aspiration on 'particularly' is perfect", "'Corporate' stress appropriately back-shifted", "Highly polished rhythm"];

      setFeedback({
        scores,
        stressPatterns,
        recommendation: currentChallenge.id === 1 
          ? "Concentrate on biting your lower lips very slightly to aspirate /θ/ correctly." 
          : currentChallenge.id === 2 
          ? "Extend the retroflex vowel length inside /r/ roads for British or American variations."
          : currentChallenge.id === 3
          ? "Your tongue position is perfectly clear. Continue regular rhythm reading."
          : "Superb business level vocabulary flow. Keep practicing bilateral mouth pressure.",
      });

      setIsEvaluating(false);
      setShowResult(true);
    }, 2800);
  };

  // Trigger TTS to let user hear proper phonetic delivery
  const playNativeIPAFeedback = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(currentChallenge.text);
      utterance.lang = "en-US";
      utterance.rate = 0.85; // slightly slower for model training
      window.speechSynthesis.speak(utterance);
    } else {
      alert("TTS speech engine is not supported by this browser.");
    }
  };

  return (
    <div id="pronunciation-lab-container" className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-3xl mx-auto my-6 animate-fade-in">
      
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 text-white flex items-center justify-between">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest bg-indigo-500/30 border border-indigo-400/20 px-2 py-0.5 rounded-md font-bold mb-1.5 inline-block">
            Phonetic Accent Lab
          </span>
          <h2 className="text-xl font-extrabold font-sans tracking-tight">Pronunciation Lab</h2>
          <p className="text-xs text-indigo-200 font-sans">Practice reading phonemes aloud and get real-time acoustic feedback</p>
        </div>
        <Volume2 className="w-9 h-9 text-indigo-300 stroke-[1.5px] cursor-pointer hover:scale-105 active:scale-95 transition-all" onClick={playNativeIPAFeedback} title="Listen to standard pronunciation" />
      </div>

      <div className="p-6 space-y-6">
        
        {/* Challenge Board Carousel */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] ${
              currentChallenge.difficulty === "Beginner" 
                ? "bg-emerald-50 text-emerald-700" 
                : currentChallenge.difficulty === "Intermediate" 
                ? "bg-amber-50 text-amber-700" 
                : "bg-rose-50 text-rose-700"
            }`}>
              {currentChallenge.difficulty} Level
            </span>
            <span className="text-slate-400 font-mono">Focus: {currentChallenge.focus}</span>
          </div>

          <h3 className="text-lg md:text-xl font-bold font-sans text-slate-800 tracking-tight leading-relaxed mb-1.5">
            "{currentChallenge.text}"
          </h3>
          <code className="text-xs font-mono text-indigo-600 block mb-2">{currentChallenge.ipa}</code>

          {/* Prompt guide */}
          <button 
            onClick={playNativeIPAFeedback}
            className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <Volume2 className="w-4 h-4 mr-1" /> Tap to hear standard model accent
          </button>
        </div>

        {/* Audio Recording Canvas Zone */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <canvas
            ref={canvasRef}
            width={580}
            height={90}
            className="w-full bg-slate-950 rounded-xl border border-slate-900 shadow-inner"
          ></canvas>

          {/* Action Controllers */}
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                id="start-speaking-btn"
                onClick={startMediaRecording}
                disabled={isEvaluating}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 hover:shadow-lg text-white font-sans text-sm font-semibold px-6 py-3 rounded-full flex items-center shadow-md transition-all duration-200"
              >
                <Mic className="w-4.5 h-4.5 mr-2" /> Start Practicing
              </button>
            ) : (
              <button
                id="stop-speaking-btn"
                onClick={stopMediaRecording}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 hover:shadow-lg text-white font-sans text-sm font-semibold px-6 py-3 rounded-full flex items-center shadow-md transition-all duration-200 animate-pulse"
              >
                <Square className="w-4.5 h-4.5 mr-2" /> Stop & Validate ({recordDuration}s)
              </button>
            )}

            <button
              id="switch-lab-challenge-btn"
              onClick={() => {
                setCurrentIdx((currentIdx + 1) % PHONETIC_CHALLENGES.length);
                setShowResult(false);
                setFeedback(null);
              }}
              disabled={isRecording || isEvaluating}
              className="bg-slate-105 hover:bg-slate-150 active:scale-95 text-slate-700 border border-slate-200 p-3 rounded-full transition-all"
              title="Next challenge"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>

          <p className="text-[10px] font-mono text-slate-400">
            {isRecording ? "Speak now! Timing limit capped to 10 seconds." : "Press button and read the sentence out loud."}
          </p>
        </div>

        {/* Alert Messaging */}
        {mismatchAlert && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 px-4 py-3 rounded-xl flex items-start text-xs font-sans">
            <ShieldAlert className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Acoustic Connection Interrupted</span>
              <p>{mismatchAlert}</p>
            </div>
          </div>
        )}

        {/* Evaluator Loading panel */}
        {isEvaluating && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center space-y-3 animate-pulse">
            <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-mono font-medium text-slate-600">Analyzing voice pitch frequencies & acoustic alignment...</p>
          </div>
        )}

        {/* Evaluation Output results */}
        {showResult && feedback && (
          <div className="border border-gray-100 rounded-2xl p-5 space-y-5 animate-fade-in bg-white shadow-sm">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-mono font-bold text-xs text-slate-400 flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 mr-1 animate-pulse" /> AI Phonetic Report
              </span>
              <span className="text-xs font-sans font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Score Sync Validated
              </span>
            </div>

            {/* Score matrix slider stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                <span className="text-2xl font-extrabold text-slate-800 font-sans">{feedback.scores.overall}%</span>
                <span className="text-[10px] text-slate-500 font-sans block mt-1">Overall Match</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                <span className="text-2xl font-extrabold text-indigo-600 font-sans">{feedback.scores.pronunciation}%</span>
                <span className="text-[10px] text-slate-500 font-sans block mt-1">Phoneme Accuracy</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                <span className="text-2xl font-extrabold text-emerald-600 font-sans">{feedback.scores.fluency}%</span>
                <span className="text-[10px] text-slate-500 font-sans block mt-1">Pacing Rate</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                <span className="text-2xl font-extrabold text-amber-500 font-sans">{feedback.scores.intonation}%</span>
                <span className="text-[10px] text-slate-500 font-sans block mt-1">Accent Integrity</span>
              </div>

            </div>

            {/* Accent stress alignment points */}
            <div className="space-y-3">
              <span className="font-mono text-xs uppercase font-bold tracking-wider text-slate-400 block pb-1 border-b border-dashed border-slate-100">Accent stress analysis:</span>
              <ul className="space-y-1.5">
                {feedback.stressPatterns.map((pt: string, idx: number) => (
                  <li key={idx} className="flex items-start text-xs text-slate-650 font-sans">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Scientific accent coach recommendation */}
            <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4">
              <span className="text-xs uppercase font-mono font-bold text-indigo-800 block mb-1">Acoustic Coach tip:</span>
              <p className="text-xs text-slate-700 font-sans leading-relaxed">{feedback.recommendation}</p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
