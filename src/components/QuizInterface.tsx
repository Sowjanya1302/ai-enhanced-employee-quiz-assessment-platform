import { Clock, HelpCircle, ChevronLeft, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Quiz, Question } from '../types';

interface QuizInterfaceProps {
  quiz: Quiz;
  questions: Question[];
  currentIndex: number;
  selectedAnswers: { [qId: number]: string };
  onSelectAnswer: (qId: number, val: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  secondsRemaining: number;
  isLoading: boolean;
  onCancel?: () => void;
}

export default function QuizInterface({
  quiz,
  questions,
  currentIndex,
  selectedAnswers,
  onSelectAnswer,
  onNext,
  onPrevious,
  onSubmit,
  secondsRemaining,
  isLoading,
  onCancel,
}: QuizInterfaceProps) {
  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-12 text-center max-w-xl mx-auto shadow-sm">
        <HelpCircle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-850">Empty Evaluation Track</h3>
        <p className="text-slate-500 text-sm mt-1">This quiz does not have questions loaded yet.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const currentSelectedValue = currentQuestion.id ? selectedAnswers[currentQuestion.id] : undefined;

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
      {onCancel && (
        <div className="flex items-center">
          <button 
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Quit Assessment
          </button>
        </div>
      )}
      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-md p-8 flex flex-col justify-between min-h-[500px]" id="quiz-interface">
        {/* Title & Timing Header */}
        <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5 mb-6">
          <div>
            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Assessment Live Attempt
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-2 font-display">{quiz.title}</h2>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
              {questions.length} Questions Assessment Track
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-red-50 text-red-700 border border-red-100 rounded-xl p-3 shadow-sm select-none">
            <Clock className="w-5 h-5 text-red-600 animate-pulse shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none mb-1">Time Remaining</p>
              <p className="text-xl font-mono font-extrabold tracking-tight">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className="font-bold text-slate-850">Processing Submissions</h3>
            <p className="text-slate-500 text-xs">Evaluating scores, calibrating prediction models, and generating tailored Gemini coaching profiles...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Beautiful rounded progress bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between font-semibold text-xs text-slate-500 mb-2">
                <span className="uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            {/* MCQ Option selection list */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-slate-900 leading-relaxed font-display">
                {currentQuestion.question_text}
              </h4>

              <div className="grid grid-cols-1 gap-3.5">
                {[
                  { key: 'A', label: currentQuestion.option_a },
                  { key: 'B', label: currentQuestion.option_b },
                  { key: 'C', label: currentQuestion.option_c },
                  { key: 'D', label: currentQuestion.option_d },
                ].map((opt) => {
                  const isSelected = currentSelectedValue === opt.key;
                  return (
                    <button 
                      type="button"
                      key={opt.key}
                      onClick={() => currentQuestion.id && onSelectAnswer(currentQuestion.id, opt.key)}
                      className={`p-4 text-left border rounded-xl flex items-center gap-4 transition duration-150 cursor-pointer text-sm font-medium ${
                        isSelected 
                          ? 'bg-blue-50/50 border-blue-300 text-slate-900 ring-2 ring-blue-600/10' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold border transition ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm' 
                          : 'border-slate-300 bg-slate-50 text-slate-600'
                      }`}>
                        {opt.key}
                      </span>
                      <span className="flex-1">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
              <button 
                type="button"
                disabled={currentIndex === 0}
                onClick={onPrevious}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Question
              </button>

              {currentIndex < questions.length - 1 ? (
                <button 
                  type="button"
                  onClick={onNext}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={onSubmit}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold leading-none uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition duration-150 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Assessment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
