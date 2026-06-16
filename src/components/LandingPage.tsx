import { Sparkles, User, UserPlus, ShieldAlert } from 'lucide-react';

interface LandingPageProps {
  onSelectView: (view: 'HUB' | 'EMPLOYEE_REG_LOGIN' | 'ADMIN_LOGIN', tab?: string) => void;
  onSetAuthMode: (mode: 'LOGIN' | 'REGISTER') => void;
}

export default function LandingPage({ onSelectView, onSetAuthMode }: LandingPageProps) {
  return (
    <div className="flex-1 bg-slate-50 min-h-full flex flex-col justify-between" id="landing-page">
      {/* Dynamic welcome page hero card wrapper */}
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20 w-full flex-1 flex flex-col justify-center">
        {/* Welcome and Hero Header */}
        <div className="text-center max-w-3.5xl mx-auto mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold tracking-wide border border-blue-100 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Talent via Smart Analytics
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-display">
            AI-Enhanced Employee <span className="text-blue-700 bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Quiz & Assessment</span> Platform
          </h1>
          
          <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Empowering organizations with intelligent employee assessments, machine learning-based performance prediction, and personalized AI-driven development feedback.
          </p>

          {/* Action Login/Reg Buttons Grid */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 max-w-xl mx-auto">
            <button 
              onClick={() => { onSetAuthMode('LOGIN'); onSelectView('EMPLOYEE_REG_LOGIN'); }}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-700 text-white rounded-lg shadow-md hover:bg-blue-800 transition duration-150 font-semibold flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <User className="w-4 h-4" />
              Employee Login
            </button>
            
            <button 
              onClick={() => { onSetAuthMode('REGISTER'); onSelectView('EMPLOYEE_REG_LOGIN'); }}
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition border border-slate-200 duration-150 font-semibold flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Employee Registration
            </button>

            <button 
              onClick={() => onSelectView('ADMIN_LOGIN')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-950 text-white rounded-lg shadow-md hover:bg-slate-900 transition duration-150 font-semibold flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Admin Login
            </button>
          </div>
        </div>

        {/* Platform Guidelines Information block */}
        <div className="mt-12 bg-slate-100/60 rounded-xl border border-slate-200/50 p-4 font-mono text-xs text-slate-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0 animate-pulse"></span>
            <span>SYSTEM_TEST_ACCESS: Employee: <b>employee@platform.com</b> (user123) | Administrator: <b>admin@platform.com</b> (admin123)</span>
          </div>
          <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-500 font-bold shrink-0">AUTHENTICATED SECURE LOG</span>
        </div>
      </div>
    </div>
  );
}
