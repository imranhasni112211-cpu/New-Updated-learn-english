import { useState } from "react";
import { 
  Check, 
  ArrowRight, 
  Award, 
  HelpCircle, 
  ShieldAlert, 
  Sparkles, 
  Smile, 
  Star, 
  Heart, 
  CheckCircle2, 
  Volume2, 
  ShieldCheck, 
  BookOpen, 
  MessageSquare, 
  Flame 
} from "lucide-react";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  category: "Grammar" | "Vocabulary" | "Idioms" | "Business";
  explanation: string;
}

const PLACEMENT_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Select the most friendly and natural response to: 'Hello! I am happy to meet you.'",
    options: [
      "Hello! It is a pleasure to meet you too.",
      "Yes, I do not care.",
      "Goodbye forever.",
      "I am meet you yesterday."
    ],
    correctAnswer: 0,
    category: "Grammar",
    explanation: "Responding back with 'pleasure to meet you too' is a warm, polite, and grammatically perfect way to return a friendly greeting."
  },
  {
    id: 2,
    text: "Complete the sentence describing a healthy habit: 'Every afternoon, I _______ to practice my English conversation.'",
    options: [
      "love",
      "loved",
      "loving",
      "am love"
    ],
    correctAnswer: 0,
    category: "Grammar",
    explanation: "Present simple tense 'love' goes with the subject 'I' to describe a regular positive habit or preference."
  },
  {
    id: 3,
    text: "Which word means to feel sure of your own abilities and comfortable talking to others?",
    options: [
      "Shy",
      "Confident",
      "Nervous",
      "Confused"
    ],
    correctAnswer: 1,
    category: "Vocabulary",
    explanation: "Being 'confident' means believing in yourself, which is the key goal of our English conversation course!"
  },
  {
    id: 4,
    text: "Complete the statement: 'Don't worry about making mistakes! They are just __________ to learn and improve.'",
    options: [
      "problems",
      "opportunities",
      "failures",
      "blocks"
    ],
    correctAnswer: 1,
    category: "Vocabulary",
    explanation: "Every mistake you make is a wonderful opportunity to learn, improve your speaking confidence, and grow!"
  },
  {
    id: 5,
    text: "If you want to politely ask someone to repeat what they said because you didn't hear it, what is the best phrase to use?",
    options: [
      "What? Say it again now!",
      "Could you please repeat that? I want to make sure I understand.",
      "You are too quiet, stop talking.",
      "I will ignore what you said."
    ],
    correctAnswer: 1,
    category: "Business",
    explanation: "Asking politely with 'Could you please repeat that?' is a standard, positive, and confident way of communicating."
  },
  {
    id: 6,
    text: "Complete the encouraging idiom: 'Practice makes ________.'",
    options: [
      "perfect",
      "difficult",
      "slow",
      "boring"
    ],
    correctAnswer: 0,
    category: "Idioms",
    explanation: "The famous idiom 'Practice makes perfect' reminds us that repeating exercises builds speaking confidence and fluent communication skills!"
  }
];

interface PlacementQuizProps {
  token: string;
  onQuizComplete: (level: string) => void;
}

export default function PlacementQuiz({ token, onQuizComplete }: PlacementQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentQuestion = PLACEMENT_QUESTIONS[currentIdx];

  const handleOptionSelect = (optIndex: number) => {
    if (submitted) return;
    setSelectedOpt(optIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedOpt === null) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedOpt }));
    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentIdx < PLACEMENT_QUESTIONS.length - 1) {
      setCurrentIdx((idx) => idx + 1);
      setSelectedOpt(null);
      setSubmitted(false);
    } else {
      calculateAndSyncLevel();
    }
  };

  const calculateAndSyncLevel = async () => {
    setSyncing(true);
    setErrorMsg("");

    // Calculate score
    let score = 0;
    PLACEMENT_QUESTIONS.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    // Grade to CEFR Level (6 questions)
    let cefrLevel = "Beginner (A1)";
    if (score === 6) cefrLevel = "Upper-Intermediate (B2)";
    else if (score === 5) cefrLevel = "Intermediate (B1)";
    else if (score >= 3) cefrLevel = "Elementary (A2)";
    else cefrLevel = "Beginner (A1)";

    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cefrLevel }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Profile sync crashed");
      }

      setQuizFinished(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update your competence level on the server.");
    } finally {
      setSyncing(false);
    }
  };

  if (quizFinished) {
    // Calculate final correct count to display
    let score = 0;
    PLACEMENT_QUESTIONS.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) score++;
    });

    let cefrLevel = "Beginner (A1)";
    let desc = "You're at the exciting beginning of your journey!";
    if (score === 6) {
      cefrLevel = "Upper-Intermediate (B2)";
      desc = "Excellent foundation in English syntax, vocabulary, and communication!";
    } else if (score === 5) {
      cefrLevel = "Intermediate (B1)";
      desc = "Very strong basic skills. Ready to achieve natural conversation flow!";
    } else if (score >= 3) {
      cefrLevel = "Elementary (A2)";
      desc = "Great work! You have solid fundamentals to start practicing voice tasks.";
    }

    return (
      <div id="quiz-finished-view" className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10 max-w-2xl mx-auto my-8 animate-fade-in space-y-8">
        {/* Celebration Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-3xl font-extrabold font-sans text-slate-900 tracking-tight">Evaluation Completed!</h2>
          <p className="text-sm text-slate-500 font-sans max-w-md mx-auto">
            You've taken the first brave step. We analyzed your grammar, vocabulary, and situational awareness.
          </p>
        </div>

        {/* Current CEFR Level Display Card */}
        <div className="bg-gradient-to-tr from-indigo-50/50 via-white to-slate-50/50 border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] uppercase tracking-wider text-indigo-500 font-mono font-extrabold block">Your Placement Standard</span>
            <span className="text-2xl font-extrabold font-sans text-slate-800 tracking-tight block">{cefrLevel}</span>
            <span className="text-xs text-slate-500 font-sans block">{desc}</span>
          </div>
          <div className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-center flex-shrink-0">
            <div className="text-[10px] font-mono opacity-80 uppercase font-bold tracking-wider leading-none">Score</div>
            <div className="text-2xl font-extrabold font-sans mt-0.5">{score} / {PLACEMENT_QUESTIONS.length}</div>
          </div>
        </div>

        {/* Requirements 2 & 4: Strengths & Improvement Areas & Speaking Confidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-100 rounded-2xl p-5 space-y-3 bg-white">
            <div className="flex items-center space-x-2 text-emerald-600 font-bold font-sans text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> <span>Key Strengths Identified</span>
            </div>
            <ul className="space-y-2 text-slate-600 text-xs font-sans list-disc pl-4 leading-relaxed">
              <li>Excellent grasp of common polite greetings and social etiquette.</li>
              <li>Strong recognition of subject-verb agreement in the present simple tense.</li>
              <li>Understands contextual meanings of descriptive nouns and adjectives.</li>
            </ul>
          </div>
          <div className="border border-slate-100 rounded-2xl p-5 space-y-3 bg-white">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold font-sans text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4" /> <span>Confidence Focus Areas</span>
            </div>
            <ul className="space-y-2 text-slate-600 text-xs font-sans list-disc pl-4 leading-relaxed">
              <li>Developing real-time verbal reply response speed.</li>
              <li>Phonetic stress and pronunciation of silent vowels in conversation.</li>
              <li>Building the confidence to speak freely without fear of mistakes!</li>
            </ul>
          </div>
        </div>

        {/* Requirement 3: Beautiful, personalized motivational continuation message */}
        <div className="bg-indigo-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <p className="text-sm font-sans italic leading-relaxed text-slate-100 z-10 relative">
            "Great job! Based on your assessment, you already have a foundation in English. With regular practice, you can significantly improve your speaking skills, confidence, pronunciation, and communication abilities. Every successful English speaker started exactly where you are today. Continue your learning journey to become more confident in conversations, interviews, workplace communication, and everyday interactions."
          </p>
          <div className="mt-4 flex items-center space-x-2 text-[10px] font-mono text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>LEARNING ADVICE — MISTAKES ARE STEPS TO ELOQUENCE</span>
          </div>
        </div>

        {/* Feature Highlights with Speaking Confidence Emphasized */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold font-sans text-slate-500 uppercase tracking-widest text-center">Interactive Study Tools Unlocked</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
              <Volume2 className="w-8 h-8 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 font-sans block leading-snug">Pronunciation Lab</span>
                <span className="text-[10px] text-slate-500 font-sans block leading-none">Phonetic calibration</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
              <MessageSquare className="w-8 h-8 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 font-sans block leading-snug">AI Vocal Chat</span>
                <span className="text-[10px] text-slate-500 font-sans block leading-none">Interactive speaking</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
              <Smile className="w-8 h-8 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 font-sans block leading-snug">Confidence Tracker</span>
                <span className="text-[10px] text-slate-500 font-sans block leading-none">Progress milestones</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button to Complete assessment and start the learning journey */}
        <div className="pt-2">
          <button
            id="start-learning-journey-btn"
            onClick={() => onQuizComplete(cefrLevel)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/20 active:scale-[0.99] text-white font-bold font-sans py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 text-base"
          >
            <span>Unlock Your Personal Learning Workspace</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="placement-quiz-box" className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl mx-auto my-8 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-sans text-white tracking-tight">Proficiency Level Placement</h2>
          <p className="text-xs text-slate-400 font-sans">Let's benchmark your standard English syntax and lexicon.</p>
        </div>
        <div className="font-mono text-xs font-semibold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
          Q: {currentIdx + 1} / {PLACEMENT_QUESTIONS.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-150 h-1.5 overflow-hidden">
        <div 
          className="bg-indigo-600 h-full transition-all duration-500" 
          style={{ width: `${((currentIdx + 1) / PLACEMENT_QUESTIONS.length) * 100}%` }}
        ></div>
      </div>

      <div className="p-6">
        {/* Category Badge */}
        <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-indigo-50 text-indigo-700">
            {currentQuestion.category} Benchmark
          </span>
          <div className="flex items-center text-xs text-gray-400">
            <HelpCircle className="w-3.5 h-3.5 mr-1" /> Help available
          </div>
        </div>

        {/* Question Text */}
        <h3 className="text-lg font-bold font-sans text-slate-800 tracking-tight leading-relaxed mb-6">
          {currentQuestion.text}
        </h3>

        {/* Options List */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            let itemClass = "w-full text-left px-5 py-4 rounded-xl border font-sans text-sm font-medium transition-all duration-200 flex items-center justify-between ";
            let textClass = "text-slate-700";
            
            if (submitted) {
              if (index === currentQuestion.correctAnswer) {
                itemClass += "bg-emerald-50 border-emerald-300 text-emerald-850 shadow-sm";
                textClass = "text-emerald-800 font-semibold";
              } else if (answers[currentQuestion.id] === index) {
                itemClass += "bg-rose-50 border-rose-300 text-rose-850";
                textClass = "text-rose-800 font-semibold";
              } else {
                itemClass += "bg-gray-50 border-gray-200 text-gray-300 opacity-60";
                textClass = "text-gray-400";
              }
            } else {
              if (selectedOpt === index) {
                itemClass += "bg-indigo-50 border-indigo-500 border-2 text-indigo-850 shadow-sm shadow-indigo-50/20";
                textClass = "text-indigo-900 font-bold";
              } else {
                itemClass += "bg-white hover:bg-slate-50 border-gray-200 hover:border-slate-350 active:scale-[0.99]";
              }
            }

            return (
              <button
                key={index}
                id={`q-opt-${index}`}
                onClick={() => handleOptionSelect(index)}
                disabled={submitted}
                className={itemClass}
              >
                <span className={textClass}>{option}</span>
                {submitted && index === currentQuestion.correctAnswer && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Section */}
        {submitted && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 animate-fade-in">
            <span className="font-mono text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">Academic Explanation:</span>
            <p className="text-xs text-slate-650 font-sans leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Error Messaging */}
        {errorMsg && (
          <div className="mb-4 bg-rose-50 text-rose-800 p-3 rounded-lg flex items-center text-xs font-sans">
            <ShieldAlert className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          {!submitted ? (
            <button
              id="submit-answer-btn"
              onClick={handleSubmitAnswer}
              disabled={selectedOpt === null}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold font-sans flex items-center transition-all ${
                selectedOpt === null
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98]"
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              id="next-question-btn"
              onClick={handleNext}
              disabled={syncing}
              className="bg-slate-900 hover:bg-slate-850 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-semibold font-sans flex items-center shadow-lg transition-all"
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Calibrating...
                </>
              ) : currentIdx < PLACEMENT_QUESTIONS.length - 1 ? (
                <>
                  Next Question <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Complete Test <Award className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
