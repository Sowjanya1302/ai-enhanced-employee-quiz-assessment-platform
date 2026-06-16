import { BookOpen, History, Award, Clock, FileCheck2, ChevronRight, HelpCircle, Sparkles, Trophy, Calendar } from 'lucide-react';
import { Quiz, Attempt } from '../types';
import ResultPage from './ResultPage';

interface EmployeeDashboardProps {
  employeeUser: any;
  quizzes: Quiz[];
  attempts: Attempt[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onStartQuiz: (quiz: Quiz) => void;
  selectedCompletedAttempt: Attempt | null;
  setSelectedCompletedAttempt: (attempt: Attempt | null) => void;
}

export default function EmployeeDashboard({
  employeeUser,
  quizzes,
  attempts,
  activeTab,
  setActiveTab,
  onStartQuiz,
  selectedCompletedAttempt,
  setSelectedCompletedAttempt,
}: EmployeeDashboardProps) {
  
  // Calculate analytics widgets stats
  const totalTaken = attempts.length;
  const avgScore = totalTaken > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalTaken) : 0;
  const avgAccuracy = totalTaken > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy_percentage, 0) / totalTaken) : 0;
  
  // Get latest prediction cohort badge
  const latestCohort = totalTaken > 0 ? attempts[0].prediction_category : employeeUser.previous_performance || 'Average Performer';

  return (
    <div className="w-full space-y-8" id="employee-dashboard">
      
      {/* Dynamic Dashboard Navigation Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historical Performance</p>
            <p className="text-xl font-bold mt-1 text-slate-900">{latestCohort}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quiz Performance Level</p>
            <p className="text-2xl font-bold mt-1 text-slate-900">{avgScore}% Score</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">Completed Assessments</p>
            <p className="text-2xl font-bold mt-1 text-slate-900">{totalTaken} Quiz Attempts</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluation Accuracy</p>
            <p className="text-2xl font-bold mt-1 text-slate-900">{avgAccuracy}% Ratio</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Internal Tabs controller */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => { setActiveTab('AVAILABLE_QUIZZES'); setSelectedCompletedAttempt(null); }}
          className={`pb-3.5 px-6 font-semibold text-sm transition-all relative cursor-pointer ${activeTab === 'AVAILABLE_QUIZZES' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Available Quizzes
          {activeTab === 'AVAILABLE_QUIZZES' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full"></span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('MY_HISTORY')}
          className={`pb-3.5 px-6 font-semibold text-sm transition-all relative cursor-pointer ${activeTab === 'MY_HISTORY' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
        >
          My Completed Assessments
          {activeTab === 'MY_HISTORY' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Tabs panels render */}
      {selectedCompletedAttempt ? (
        <ResultPage attempt={selectedCompletedAttempt} onClose={() => setSelectedCompletedAttempt(null)} />
      ) : (
        <>
          {activeTab === 'AVAILABLE_QUIZZES' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Available MCQ Assessments</h3>
                  <p className="text-xs text-slate-500">Pick an assessment to evaluate your skills. Results instantly align with performance classifiers.</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600">
                  {quizzes.length} Evaluations Loaded
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map((q) => (
                  <div key={q.id} className="bg-white rounded-xl border border-slate-100 hover:border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition duration-200">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500 font-mono">ID: #{q.id}</span>
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {q.time_limit_minutes} Min limit
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 font-display">{q.title}</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{q.description}</p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{q.question_count || 5} Questions</span>
                      <button 
                        onClick={() => onStartQuiz(q)}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs leading-none rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      >
                        Start Test
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'MY_HISTORY' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Completed Assessment Log</h3>
                  <p className="text-xs text-slate-500">Track scores, machine learning performance classifications, and tailored coaching insights.</p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg">{attempts.length} Attempts Taken</span>
              </div>

              {attempts.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center max-w-lg mx-auto">
                  <History className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="font-bold text-sm text-slate-800 font-display">No Assessment History Found</h4>
                  <p className="text-slate-500 text-xs mt-1">Take any of the available quizzes to log your assessment attempts.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="grid grid-cols-6 bg-slate-50 p-4 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-2">Quiz Title</div>
                    <div className="text-center">Score</div>
                    <div className="text-center">Accuracy</div>
                    <div className="text-center">Prediction cohort</div>
                    <div className="text-right">Action</div>
                  </div>
                  
                  <div className="divide-y divide-slate-100 text-sm text-slate-700">
                    {attempts.map((a) => (
                      <div key={a.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50/50 transition">
                        <div className="col-span-2 font-bold text-slate-900 font-display">{a.quiz_title}</div>
                        <div className="text-center font-semibold text-slate-800">{a.score}%</div>
                        <div className="text-center text-slate-500">{a.accuracy_percentage}%</div>
                        <div className="text-center">
                          <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full ${
                            a.prediction_category?.includes('High') 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : a.prediction_category?.includes('Needs') 
                                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {a.prediction_category}
                          </span>
                        </div>
                        <div className="text-right">
                          <button 
                            onClick={() => setSelectedCompletedAttempt(a)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ml-auto text-right"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                            Report Card
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
