import { CheckCircle2, AlertTriangle, Sparkles, BookOpen, Clipboard, LogOut, Code, Award, TrendingUp, ArrowLeft } from 'lucide-react';
import { Attempt } from '../types';
import { useState } from 'react';

interface ResultPageProps {
  attempt: any; // Result object returned by API
  onClose: () => void;
}

export default function ResultPage({ attempt, onClose }: ResultPageProps) {
  const [copied, setCopied] = useState(false);

  // Safely grab score values
  const scoreVal = attempt.score !== undefined ? attempt.score : 0;
  const accuracyVal = attempt.accuracy !== undefined ? attempt.accuracy : scoreVal;
  const confidenceVal = attempt.confidence !== undefined ? attempt.confidence : 0.95;
  const categoryVal = attempt.predicted_cohort || attempt.prediction_category || 'Average Performer';
  
  // Format feedback sections safely
  const feedback = attempt.feedback || {};

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(attempt, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryTheme = (cat: string) => {
    if (cat.includes('High')) {
      return {
        bg: 'bg-emerald-50 border-emerald-100',
        text: 'text-emerald-700',
        badge: 'bg-emerald-500 text-white',
        icon: Award
      };
    } else if (cat.includes('Improvement') || cat.includes('Needs')) {
      return {
        bg: 'bg-rose-50 border-rose-100',
        text: 'text-rose-700',
        badge: 'bg-rose-500 text-white',
        icon: AlertTriangle
      };
    } else {
      return {
        bg: 'bg-amber-50 border-amber-100',
        text: 'text-amber-700',
        badge: 'bg-amber-500 text-white',
        icon: TrendingUp
      };
    }
  };

  const theme = getCategoryTheme(categoryVal);
  const IconHeader = theme.icon;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6" id="result-page">
      {/* Back navigation header button */}
      <div className="flex items-center">
        <button 
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-lg transition duration-150 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* KPI Stats Top Bar */}
      <div className={`p-8 rounded-2xl border ${theme.bg} transition-all duration-300 shadow-sm`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.badge}`}>
              <IconHeader className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>Performance Profile Evaluated</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5 font-display">Assessment Summary Logged</h3>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${theme.badge}`}>
            {categoryVal}
          </span>
        </div>

        {/* Big numbers row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Score</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{scoreVal}%</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy Rating</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{accuracyVal}%</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ML Classifier</p>
            <p className="text-sm font-bold text-slate-700 tracking-tight truncate mt-3 uppercase">{categoryVal.replace(' Performer', '')}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ML Confidence</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{(confidenceVal * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* AI FEEDBACK PAGE - Report Card design */}
      <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-md space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 font-display">AI Personalized Development Report</h4>
              <p className="text-xs text-slate-400">Contextual Gemini recommendations generated on this assessment</p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleCopyToClipboard}
            className="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition text-slate-600 cursor-pointer"
          >
            <Clipboard className="w-3.5 h-3.5" />
            {copied ? 'Copied' : 'Copy Insights'}
          </button>
        </div>

        {/* Real formatted report card fields list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div className="space-y-6">
            {/* Strengths field */}
            <div className="space-y-2 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h5 className="font-bold text-xs uppercase tracking-higher text-blue-800 flex items-center gap-1.5 font-display">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Key Identified Strengths
              </h5>
              <p className="text-slate-600 text-xs leading-relaxed italic">
                {feedback.strengths || 'Demonstrates proper core understanding, accurately isolating target patterns and successfully structuring optimal results.'}
              </p>
            </div>

            {/* Areas for Improvement field */}
            <div className="space-y-2 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h5 className="font-bold text-xs uppercase tracking-higher text-amber-800 flex items-center gap-1.5 font-display">
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                Areas for Improvement / Weaknesses
              </h5>
              <p className="text-slate-600 text-xs leading-relaxed italic">
                {feedback.weaknesses || feedback.improvement_areas || 'Recommended to focus on edge case stability and handling multi-threaded processing paradigms.'}
              </p>
            </div>

            {/* Motivational Feedback panel */}
            <div className="space-y-2 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h5 className="font-bold text-xs uppercase tracking-higher text-slate-800 flex items-center gap-1.5 font-display">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Motivational Feedback
              </h5>
              <p className="text-slate-600 text-xs leading-relaxed italic">
                {feedback.motivational_feedback || 'Your progress highlights clear analytic aptitude. Continuous practice in actual deployments will expand this talent further.'}
              </p>
            </div>
          </div>

          <div className="space-y-6 border-l border-slate-100 md:pl-8">
            {/* Learning Recommendations */}
            <div className="space-y-2 bg-indigo-50/40 p-5 rounded-xl border border-indigo-100/60">
              <h4 className="font-bold text-xs uppercase tracking-widest text-indigo-950 border-b border-indigo-100 pb-1.5 flex items-center gap-1.5 font-display">
                <BookOpen className="w-4 h-4 text-indigo-700" />
                Learning Recommendations
              </h4>
              <p className="text-slate-755 text-xs leading-relaxed italic mt-1.5">
                {feedback.learning_plan || feedback.learning_recommendations || 'Enroll in foundational courses covering operational scaling, algorithms refinement, and microservices lifecycle patterns.'}
              </p>
            </div>

            {/* Career Development Suggestions */}
            <div className="space-y-2 bg-blue-50/40 p-5 rounded-xl border border-blue-100/60">
              <h4 className="font-bold text-xs uppercase tracking-widest text-blue-950 border-b border-blue-100 pb-1.5 flex items-center gap-1.5 font-display">
                <Award className="w-4 h-4 text-blue-700" />
                Career Development Suggestions
              </h4>
              <p className="text-slate-755 text-xs leading-relaxed italic mt-1.5 font-normal">
                {feedback.career_suggestions || 'Target technical lead assignments to nurture high-level system architectural oversight while leading localized sprint tasks.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-850 text-xs uppercase tracking-wide shadow-sm hover:shadow-md transition duration-150 cursor-pointer animate-fade-in"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
