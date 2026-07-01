import { Calendar, Award, Zap, Shield, HelpCircle, CheckCircle, BarChart3, TrendingUp, Sparkles, KeyRound, Trophy, Target, Lock, Crown, BookOpen, Flame } from "lucide-react";

interface StatsDashboardProps {
  displayName: string;
  cefrLevel: string;
  fingerprint: string;
}

export default function StatsDashboard({ displayName, cefrLevel, fingerprint }: StatsDashboardProps) {
  // SVG Chart Data: progression line points representing scores over past weeks
  const weeklyScores = [
    { label: "Wk 1", score: 20 },
    { label: "Wk 2", score: 35 },
    { label: "Wk 3", score: 30 },
    { label: "Wk 4", score: 55 },
    { label: "Wk 5", score: 48 },
    { label: "Wk 6", score: 72 },
    { label: "Wk 7", score: 65 },
    { label: "Wk 8", score: 85 }
  ];

  const maxVal = 100;
  const padding = 40;
  const chartHeight = 160;
  const chartWidth = 500;

  // Generate SVG plotting points for the line graph
  const points = weeklyScores
    .map((d, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / (weeklyScores.length - 1);
      const y = chartHeight - padding - (d.score * (chartHeight - padding * 2)) / maxVal;
      return `${x},${y}`;
    })
    .join(" ");

  // Map progress fields
  const competencies = [
    { title: "Syntax & Grammar", score: 78, color: "text-indigo-600", stroke: "stroke-indigo-600" },
    { title: "Active Vocabulary", score: 62, color: "text-emerald-500", stroke: "stroke-emerald-500" },
    { title: "Speaking Accent", score: 45, color: "text-rose-500", stroke: "stroke-rose-500" },
    { title: "Phonetic Listening", score: 81, color: "text-amber-500", stroke: "stroke-amber-500" }
  ];

  // Daily Streak Challenges
  const challenges = [
    { title: "Learn 5 Professional Phrases", done: true, reward: "+30XP" },
    { title: "Complete 1 Secure Speaking Session", done: false, reward: "+50XP" },
    { title: "Review E2EE Key Fingerprint validity", done: true, reward: "+10XP" }
  ];

  // Gamification Milestones
  const milestones = [
    {
      title: "First Steps",
      description: "Ignite your linguistic journey by initiating your first AI session.",
      reward: "+100 XP",
      status: "completed",
      progressText: "1 / 1 Sessions",
      progressPercent: 100,
      icon: CheckCircle,
      colorBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      title: "Vocab Architect",
      description: "Expand your mind and retain 100 sophisticated custom keywords.",
      reward: "+250 XP",
      status: "in-progress",
      progressText: "78 / 100 Words",
      progressPercent: 78,
      icon: BookOpen,
      colorBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      title: "Unstoppable",
      description: "Create an active learning routine with a continuous 5-day study streak.",
      reward: "+150 XP",
      status: "completed",
      progressText: "5 / 5 Days",
      progressPercent: 100,
      icon: Flame,
      colorBg: "bg-rose-50 text-rose-500 border-rose-100 animate-pulse",
    },
    {
      title: "Accent Elite",
      description: "Attain a high competence score (80%+) during phonetic lessons.",
      reward: "+300 XP",
      status: "completed",
      progressText: "81% / 80% Proficiency",
      progressPercent: 100,
      icon: Trophy,
      colorBg: "bg-amber-50 text-amber-500 border-amber-100",
    },
    {
      title: "The Professional",
      description: "Master complex speech elements to achieve grand C1 / C2 CEFR standard.",
      reward: "+500 XP",
      status: "locked",
      progressText: "Locked",
      progressPercent: 30,
      icon: Crown,
      colorBg: "bg-slate-50 text-slate-400 border-slate-150",
    },
  ];

  return (
    <div id="stats-dashboard-container" className="space-y-6 animate-fade-in">
      
      {/* 1. Welcome Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg">
        {/* Decorative backdrop gradients */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-indigo-600/30 to-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/2 bottom-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" /> Active Student
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-sans tracking-tight">
              Welcome back, {displayName || "Explorer"}!
            </h1>
            <p className="text-slate-300 font-sans text-sm max-w-xl">
              You are currently training at <span className="font-semibold text-indigo-300">{cefrLevel}</span> status. Complete more speaking and vocabulary tasks to reach professional mastery!
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl p-4 flex items-center space-x-3.5 pr-6 w-full md:w-auto">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">Linguistic Competence</span>
              <div className="text-lg font-extrabold font-sans text-indigo-200">{cefrLevel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Core Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Study Streak */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">Study Streak</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight block">5 Days</span>
            <span className="text-xs text-slate-500 font-sans block">Daily target met active</span>
          </div>
          <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
            <Zap className="w-5 h-5 fill-rose-500" />
          </div>
        </div>

        {/* Practice Minutes */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">Time Spent</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight block">180 Mins</span>
            <span className="text-xs text-slate-500 font-sans block">+24% improvement this week</span>
          </div>
          <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Phrases Deciphered */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">E2EE Data Vault</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight block font-mono text-sm leading-8 truncate max-w-[140px]" title={fingerprint}>
              {fingerprint.split("::")[1] || "SECURE_OFFLINE"}
            </span>
            <span className="text-xs text-slate-500 font-sans block">Authentic logs crypt-isolated</span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* Security Isolation Status */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">Secure Connection</span>
            <span className="text-2xl font-extrabold text-emerald-500 tracking-tight block flex items-center text-lg leading-8 gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              TLS + E2EE
            </span>
            <span className="text-xs text-slate-500 font-sans block">XSS Sanitized & Auth verified</span>
          </div>
          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. Analytical Progression Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Progression Line Graph */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-sans text-slate-800 tracking-tight">Linguistic Progression Graph</h3>
              <p className="text-xs text-gray-500 font-sans">Visualizing overall comprehension scores based on AI evaluations</p>
            </div>
            <span className="inline-flex items-center text-xs font-mono font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Formulating upward trajectory
            </span>
          </div>

          {/* SVG line graph container */}
          <div className="w-full h-44 overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full min-w-[450px]">
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f3f4f6" strokeWidth={1} strokeDasharray="3,3" />
              <line x1={padding} y1={(chartHeight - padding * 2) / 2 + padding} x2={chartWidth - padding} y2={(chartHeight - padding * 2) / 2 + padding} stroke="#f3f4f6" strokeWidth={1} strokeDasharray="3,3" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#f1f5f9" strokeWidth={1.5} />

              {/* Shaded Area Under Line */}
              <path
                d={`M ${padding},${chartHeight - padding} L ${points} L ${chartWidth - padding},${chartHeight - padding} Z`}
                fill="url(#chart-area-grad)"
              />

              {/* Main Glowing Line Path */}
              <path
                d={`M ${points}`}
                fill="none"
                stroke="url(#chart-line-grad)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Plot dots & tooltips */}
              {weeklyScores.map((d, index) => {
                const x = padding + (index * (chartWidth - padding * 2)) / (weeklyScores.length - 1);
                const y = chartHeight - padding - (d.score * (chartHeight - padding * 2)) / maxVal;
                return (
                  <g key={index} className="group">
                    <circle
                      cx={x}
                      cy={y}
                      r={4.5}
                      className="fill-white stroke-indigo-600 stroke-[2.5px] cursor-pointer hover:r-6 hover:stroke-emerald-500 transition-all"
                    />
                    <text
                      x={x}
                      y={y - 12}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-bold fill-indigo-900 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      {d.score}%
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {weeklyScores.map((d, index) => {
                const x = padding + (index * (chartWidth - padding * 2)) / (weeklyScores.length - 1);
                return (
                  <text
                    key={index}
                    x={x}
                    y={chartHeight - padding + 18}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-medium fill-slate-400"
                  >
                    {d.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Skill Competency Rings */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
          <div className="mb-5">
            <h3 className="text-base font-bold font-sans text-slate-800 tracking-tight">Active Proficiencies</h3>
            <p className="text-xs text-gray-500 font-sans font-medium">Dynamic metric split across four linguistical components</p>
          </div>

          <div className="space-y-4">
            {competencies.map((c, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans font-medium">
                  <span className="text-slate-600">{c.title}</span>
                  <span className={`font-bold font-mono ${c.color}`}>{c.score}%</span>
                </div>
                {/* Visual Bar plot */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${c.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Streaks & Challenges Arena */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* daily challenges list */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-sans text-slate-800 tracking-tight">Daily Streaks Checklist</h3>
              <p className="text-xs text-gray-500 font-sans">Practice daily to trigger fast cognitive language retention</p>
            </div>
            <div className="flex items-center text-xs font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md font-bold">
              <Zap className="w-3.5 h-3.5 mr-1" /> 2 / 3 COMPLETED
            </div>
          </div>

          <div className="space-y-3">
            {challenges.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  item.done
                    ? "bg-slate-50 border-slate-100 text-slate-500 line-through"
                    : "bg-white border-gray-100 text-slate-700 shadow-sm"
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-1 rounded-full ${item.done ? "bg-emerald-50 text-emerald-500" : "bg-slate-100 text-slate-350"}`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-sans font-semibold tracking-tight leading-relaxed">{item.title}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  item.done ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-600"
                }`}>
                  {item.reward}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* E2EE Certificate Status card */}
        <div className="bg-gradient-to-b from-indigo-950 to-slate-900 border border-indigo-950 p-5 rounded-2xl shadow-lg relative text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
          
          <div className="relative h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400 font-mono text-[9px] uppercase tracking-wider font-bold">
                <Shield className="w-3.5 h-3.5" /> End-to-End Cryptography
              </div>
              <h3 className="text-sm font-bold font-sans tracking-tight">Active Cipher Isolation</h3>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                All communications and practice dialogue is symmetrically stored under standard 256-bit AES protection. Key derivation remains exclusive inside your local browser storage.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-2">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Key Fingerprint Identifier</span>
              <code className="text-[10px] font-mono bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-700 block text-slate-200 truncate" title={fingerprint}>
                {fingerprint}
              </code>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Gamification - Milestones & Achievements Section */}
      <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1 px-2.5 bg-amber-50 rounded-full border border-amber-200 text-amber-600 inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 mr-1" /> Gamified Badges
              </span>
            </div>
            <h3 className="text-lg font-extrabold font-sans text-slate-800 tracking-tight">Linguistic Milestones</h3>
            <p className="text-xs text-slate-500 font-sans">Collect experience points (XP) and unlock advanced learning milestone rewards.</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest leading-normal">Overall Progress Goal</div>
            <div className="text-2xl font-extrabold text-indigo-600 font-sans tracking-tight">3 / 5 Unlocked</div>
          </div>
        </div>

        {/* Milestones Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((milestone, idx) => {
            const IconComponent = milestone.icon;
            const isCompleted = milestone.status === "completed";
            const isLocked = milestone.status === "locked";
            
            return (
              <div 
                key={idx} 
                className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden ${
                  isCompleted 
                    ? "bg-slate-50/70 border-slate-100 hover:shadow-md" 
                    : isLocked 
                      ? "bg-gray-50/50 border-gray-150 opacity-70" 
                      : "bg-white border-indigo-100 hover:border-indigo-200 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Glowing subtle element for in-progress card */}
                {milestone.status === "in-progress" && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                )}

                <div className="space-y-4">
                  {/* Top Line badge & icon */}
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${milestone.colorBg}`}>
                      <IconComponent className="w-5.5 h-5.5" />
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                        isCompleted 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                          : isLocked 
                            ? "bg-gray-100 text-gray-500 border border-gray-200" 
                            : "bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse"
                      }`}>
                        {isCompleted ? "Completed" : isLocked ? "Locked" : "In Progress"}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 mt-1">{milestone.reward}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold font-sans text-slate-800 tracking-tight flex items-center">
                      {milestone.title}
                      {isLocked && <Lock className="w-3 h-3 text-gray-400 ml-1.5" />}
                    </h4>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>

                {/* Lower progress bar portion */}
                <div className="pt-4 mt-4 border-t border-gray-100/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="text-slate-400">STATUS</span>
                    <span className={isCompleted ? "text-emerald-600" : isLocked ? "text-slate-400" : "text-indigo-600"}>
                      {milestone.progressText}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isCompleted 
                          ? "bg-emerald-500" 
                          : isLocked 
                            ? "bg-gray-300" 
                            : "bg-indigo-600"
                      }`}
                      style={{ width: `${milestone.progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
