import { useState, useEffect, FormEvent } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement 
} from 'chart.js';
import { 
  Users, Edit, Trash, Plus, FileCheck2, Cpu, BarChart3, 
  Settings, UserCheck, ShieldAlert, Award, ArrowRight, Sparkles, RefreshCw, Mail, Activity, Clock,
  HelpCircle, BookOpen, ChevronRight, ChevronDown, ChevronUp, Code, AlertTriangle
} from 'lucide-react';
import { Quiz, Attempt, EmployeeStat, ModelInfo } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AdminDashboardProps {
  employees: EmployeeStat[];
  quizzes: Quiz[];
  attempts: Attempt[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateQuiz: () => void;
  onOpenEditQuiz: (quiz: Quiz) => void;
  onDeleteQuiz: (qId: number) => void;
  onRefresh?: () => Promise<void> | void;

  // Chart data generators
  attemptsAverageScoreChartData: any;
  predictionsCohortChartData: any;
  completionRatesLineChartData: any;
}

export default function AdminDashboard({
  employees,
  quizzes,
  attempts,
  activeTab,
  setActiveTab,
  onOpenCreateQuiz,
  onOpenEditQuiz,
  onDeleteQuiz,
  onRefresh,
  attemptsAverageScoreChartData,
  predictionsCohortChartData,
  completionRatesLineChartData,
}: AdminDashboardProps) {

  // Add Question local state variables
  const [selectedQuizId, setSelectedQuizId] = useState<number | ''>('');
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('A');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // AI Feedback tab detailed select state
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  // Load questions when selected quiz changes
  const fetchQuestionsOfQuiz = async (quizId: number) => {
    setLoadingQuestions(true);
    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions`);
      const data = await response.json();
      setQuizQuestions(data.questions || []);
    } catch (err) {
      console.error('Error fetching quiz questions', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (selectedQuizId) {
      fetchQuestionsOfQuiz(Number(selectedQuizId));
    } else if (quizzes.length > 0) {
      setSelectedQuizId(quizzes[0].id);
    }
  }, [selectedQuizId, quizzes]);

  const handleAddQuestionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId || !questionText || !optionA || !optionB || !optionC || !optionD) {
      alert('Please fill out all fields first.');
      return;
    }
    setSubmittingQuestion(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: Number(selectedQuizId),
          question_text: questionText,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_option: correctOption
        })
      });
      if (response.ok) {
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setCorrectOption('A');
        // Refresh question list
        await fetchQuestionsOfQuiz(Number(selectedQuizId));
        // Refresh parent stats
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to append question.');
      }
    } catch (err) {
      console.error('Error adding question:', err);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleDeleteSubQuestion = async (qId: number) => {
    if (!confirm('Are you sure you want to delete this MCQ question?')) return;
    try {
      const response = await fetch(`/api/questions/${qId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchQuestionsOfQuiz(Number(selectedQuizId));
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        alert('Failed to delete question.');
      }
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  // Filter attempts with AI reports
  const attemptsWithFeedback = attempts.filter(a => a.feedback);

  // Set default selected report if none selected but feedback list is present
  useEffect(() => {
    if (attemptsWithFeedback.length > 0 && selectedReportId === null) {
      setSelectedReportId(attemptsWithFeedback[0].id);
    }
  }, [attemptsWithFeedback, selectedReportId]);

  // Calculate generic Admin statistics cards
  const totalEmployeesCount = employees.length;
  const totalQuizzesCount = quizzes.length;
  const totalAttemptsCount = attempts.length;
  const avgTestScore = totalAttemptsCount > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttemptsCount) : 0;

  return (
    <div className="w-full space-y-8" id="admin-dashboard">
      
      {/* 4 Statistics KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Employees</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-950 font-display">{totalEmployeesCount}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">Active candidates</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Quizzes</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-950 font-display">{totalQuizzesCount}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Assessment tracks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
            <Edit className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">Total Attempts</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-950 font-display">{totalAttemptsCount}</p>
            <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase tracking-wider">Scoring evaluated</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Score</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-950 font-display">{avgTestScore}%</p>
            <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-wider font-sans">Overall average score</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1">
        {[
          { tabId: 'DASHBOARD', name: 'Performance Analytics', icon: BarChart3 },
          { tabId: 'QUIZZES', name: 'Manage Quizzes', icon: Edit },
          { tabId: 'ADD_QUESTIONS', name: 'Add Questions', icon: HelpCircle },
          { tabId: 'EMPLOYEES', name: 'Manage Employees', icon: Users },
          { tabId: 'RESULTS', name: 'View Results', icon: FileCheck2 },
          { tabId: 'AI_FEEDBACK', name: 'AI Feedback Reports', icon: Sparkles },
        ].map((item) => {
          const TabIcon = item.icon;
          return (
            <button 
              key={item.tabId}
              onClick={() => setActiveTab(item.tabId)}
              className={`pb-3 px-4 font-semibold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${activeTab === item.tabId ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
              {activeTab === item.tabId && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      
      {/* 1. ANALYTICS & STATS DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Visual Charts panel card */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h4 className="font-bold text-slate-800 text-sm font-display uppercase tracking-wider">Candidate Performance Trackers</h4>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Dashboard Feed</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl h-[280px] flex flex-col justify-between">
                  <h5 className="font-semibold text-xs text-slate-500 mb-2 uppercase text-center">Average Score Per Quiz Module</h5>
                  <div className="flex-1 min-h-0 relative">
                    {attempts.length > 0 ? (
                      <Bar 
                        data={attemptsAverageScoreChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true, max: 100 } }
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400 font-mono">No simulation logs registered</div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl h-[280px] flex flex-col justify-between">
                  <h5 className="font-semibold text-xs text-slate-500 mb-2 uppercase text-center">Quiz Completion Rates Weekly</h5>
                  <div className="flex-1 min-h-0 relative">
                    {attempts.length > 0 ? (
                      <Line 
                        data={completionRatesLineChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } }
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400 font-mono">No dates registered</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction Pie Chart distribution card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 mb-5 font-display uppercase tracking-wider">Performance Segment Breakdown</h4>
                
                {attempts.length > 0 ? (
                  <div className="h-52 relative">
                    <Pie 
                      data={predictionsCohortChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'sans-serif', size: 9, weight: 'bold' } } } }
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400 text-xs font-medium">No performer categories traced. Start a candidate test.</div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 text-[11px] space-y-1.5 text-slate-500 bg-slate-50 p-3 rounded-lg border font-medium">
                <div className="flex justify-between font-semibold">
                  <span>Classification Type:</span>
                  <span className="text-slate-800">Score Bucket Distribution</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Performance Milestones:</span>
                  <span className="text-slate-800">3 Custom Cohorts</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. MANAGE QUIZZES SECTION (CRUD EDITOR) */}
      {activeTab === 'QUIZZES' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Manage Assessment Quizzes</h3>
              <p className="text-xs text-slate-500">Deploy, edit, and delete multiple-choice custom quizzes for HR evaluations.</p>
            </div>
            <button 
              onClick={onOpenCreateQuiz}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs leading-none rounded-lg flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              CREATE NEW QUIZ
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-6 p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Quiz Module Details</div>
              <div>Duration Limit</div>
              <div>Question Count</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-100">
              {quizzes.map((q) => (
                <div key={q.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50/50 transition duration-150">
                  <div className="col-span-2 pr-4">
                    <h4 className="font-bold text-slate-900 text-sm font-display">{q.title}</h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{q.description || 'No description supplied.'}</p>
                  </div>
                  <div className="text-sm text-slate-700 font-semibold">{q.time_limit_minutes} Minutes</div>
                  <div className="text-sm text-slate-700 font-medium">{q.question_count || 5} Questions</div>
                  <div className="col-span-2 flex justify-end gap-2 shrink-0">
                    <button 
                      onClick={() => onOpenEditQuiz(q)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                      Configure
                    </button>
                    <button 
                      onClick={() => onDeleteQuiz(q.id)}
                      className="px-3 py-1.5 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                    >
                      <Trash className="w-3.5 h-3.5 text-rose-600" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD QUESTIONS SECTION */}
      {activeTab === 'ADD_QUESTIONS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Add & Edit Quiz Questions</h3>
              <p className="text-xs text-slate-500">Pick any active quiz module and configure multiple-choice questions (MCQs) instantly.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Selected Quiz:</label>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(Number(e.target.value))}
                className="border border-slate-200 rounded-lg p-2.5 bg-white text-slate-850 font-semibold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer max-w-[250px] truncate"
              >
                {quizzes.length === 0 && <option value="">No quizzes available</option>}
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form to Add Question */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit">
              <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600 animate-pulse" />
                Add New MCQ Question
              </h4>

              <form onSubmit={handleAddQuestionSubmit} className="space-y-4 text-slate-700 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-450">Question Query/Text</label>
                  <textarea
                    rows={3}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Enter the complete question text query..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 text-xs font-sans font-semibold focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Option A</label>
                    <input
                      type="text"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      placeholder="Answer option A"
                      className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white text-slate-900 text-xs font-sans font-semibold focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Option B</label>
                    <input
                      type="text"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      placeholder="Answer option B"
                      className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white text-slate-900 text-xs font-sans font-semibold focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Option C</label>
                    <input
                      type="text"
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                      placeholder="Answer option C"
                      className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white text-slate-900 text-xs font-sans font-semibold focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Option D</label>
                    <input
                      type="text"
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
                      placeholder="Answer option D"
                      className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white text-slate-900 text-xs font-sans font-semibold focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-450">Correct Choice/Option</label>
                  <select
                    value={correctOption}
                    onChange={(e) => setCorrectOption(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-850 font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="A">Option A is Correct</option>
                    <option value="B">Option B is Correct</option>
                    <option value="C">Option C is Correct</option>
                    <option value="D">Option D is Correct</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submittingQuestion || !selectedQuizId}
                  className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                  {submittingQuestion ? 'Saving Question...' : 'Add Question'}
                </button>
              </form>
            </div>

            {/* List of existing Questions */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between min-h-[400px]">
              <div>
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                  <span>Questions in selected Quiz ({quizQuestions.length})</span>
                  {loadingQuestions && <span className="text-[10px] font-bold text-slate-400 animate-pulse tracking-wider">Syncing database...</span>}
                </h4>

                {quizQuestions.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-700 font-bold text-sm">No MCQ questions deployed yet</p>
                      <p className="text-slate-400 text-xs mt-1">Deploy some questions on the left panel to populate this assessment track.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {quizQuestions.map((q, qidx) => (
                      <div key={q.id || qidx} className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl relative hover:border-slate-200 transition">
                        <button
                          type="button"
                          onClick={() => handleDeleteSubQuestion(q.id)}
                          className="absolute top-4 right-4 p-1 rounded-md text-rose-500 hover:bg-rose-50 border border-slate-150 hover:border-rose-150 transition cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>

                        <div className="pr-10">
                          <span className="text-[10px] font-bold text-blue-700 font-mono">Q{qidx + 1}.</span>
                          <h5 className="font-bold text-slate-950 mt-1 pl-1 leading-relaxed">{q.question_text}</h5>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold pl-1">
                          <div className={`p-2 rounded-lg border ${q.correct_option === 'A' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold' : 'bg-white text-slate-650 border-slate-100'}`}>
                            <span className="font-bold mr-1 text-[10px] font-mono">A.</span> {q.option_a}
                          </div>
                          <div className={`p-2 rounded-lg border ${q.correct_option === 'B' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold' : 'bg-white text-slate-650 border-slate-100'}`}>
                            <span className="font-bold mr-1 text-[10px] font-mono">B.</span> {q.option_b}
                          </div>
                          <div className={`p-2 rounded-lg border ${q.correct_option === 'C' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold' : 'bg-white text-slate-650 border-slate-100'}`}>
                            <span className="font-bold mr-1 text-[10px] font-mono">C.</span> {q.option_c}
                          </div>
                          <div className={`p-2 rounded-lg border ${q.correct_option === 'D' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold' : 'bg-white text-slate-650 border-slate-100'}`}>
                            <span className="font-bold mr-1 text-[10px] font-mono">D.</span> {q.option_d}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MANAGE EMPLOYEES LIST REGISTRY */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Candidate Registry</h3>
              <p className="text-xs text-slate-500">View employees baseline registered classes, total assessment completions count, and dynamic scores averages.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-650 rounded-lg">
              {employees.length} Candidates Logged
            </span>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Name & email</div>
              <div className="text-center">Quizzes Taken</div>
              <div className="text-center">Average Score</div>
              <div className="text-center">Accuracy</div>
              <div className="text-center">Avg Time Taken</div>
              <div className="text-right">Performer Class</div>
            </div>

            <div className="divide-y divide-slate-100">
              {employees.map((e) => (
                <div key={e.id} className="grid grid-cols-7 p-4 items-center hover:bg-slate-50/50 transition font-sans text-sm">
                  <div className="col-span-2">
                    <h5 className="font-bold text-slate-900 font-display">{e.name}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{e.email}</p>
                  </div>
                  <div className="text-center text-slate-700 font-semibold">{e.total_quizzes_taken}</div>
                  <div className="text-center font-bold text-slate-800">{e.avg_score}%</div>
                  <div className="text-center text-slate-500">{e.avg_accuracy}%</div>
                  <div className="text-center text-slate-500">{Math.floor(e.avg_time / 60)}m {e.avg_time % 60}s</div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                      e.previous_performance.includes('High') 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : e.previous_performance.includes('Needs') 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {e.previous_performance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW RESULTS AUDIT LOGS */}
      {activeTab === 'RESULTS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">System Assessment Audit Log</h3>
              <p className="text-xs text-slate-500">Track and audit every test submission. Includes duration timing, accuracy rating, and predicted cohort.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg">
              {attempts.length} Total Submissions
            </span>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Candidate Employee</div>
              <div className="col-span-2">Quiz Module Title</div>
              <div className="text-center">Accuracy</div>
              <div className="text-center font-display">Duration</div>
              <div className="text-right font-display">Prediction Class</div>
            </div>

            <div className="divide-y divide-slate-100 text-sm">
              {attempts.map((a) => (
                <div key={a.id} className="grid grid-cols-7 p-4 items-center hover:bg-slate-50/50 transition text-slate-700">
                  <div className="col-span-2">
                    <h5 className="font-bold text-slate-900 uppercase font-display">{a.employee_name}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Attempt no. #{a.attempt_count}</p>
                  </div>
                  <div className="col-span-2 font-medium text-slate-800 pr-3 truncate">{a.quiz_title}</div>
                  <div className="text-center font-bold text-slate-900">{a.accuracy_percentage}%</div>
                  <div className="text-center text-slate-555">{Math.floor(a.time_taken_seconds / 60)}m {a.time_taken_seconds % 60}s</div>
                  <div className="text-right font-semibold">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                      a.prediction_category?.includes('High') 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : a.prediction_category?.includes('Needs') 
                          ? 'bg-rose-50 text-rose-700' 
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {a.prediction_category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI FEEDBACK REPORTS */}
      {activeTab === 'AI_FEEDBACK' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                <span>AI Feedback Reports</span>
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Review automated deep-dive performance feedback reports generated by Gemini after employees submit their assessments.
              </p>
            </div>
            <div className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{attemptsWithFeedback.length} AI Reports Generated</span>
            </div>
          </div>

          {attemptsWithFeedback.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h4 className="text-slate-900 font-extrabold text-sm">No AI Feedback Reports yet</h4>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Gemini feedback reports are created automatically upon completion of employee assessment quizzes. Encourage employees to log in and attempt deployed quizzes to view live feedback analysis.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Left Column - Report lists */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden flex flex-col h-[580px]">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
                  Assessment Attempts List
                </h4>
                
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {attemptsWithFeedback.map((a) => {
                    const isSelected = selectedReportId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedReportId(a.id)}
                        className={`w-full text-left p-4 rounded-xl border transition flex flex-col justify-between cursor-pointer relative ${
                          isSelected 
                            ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-100' 
                            : 'bg-slate-50/40 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 h-full w-1 bg-blue-700 rounded-r-xl" />
                        )}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 font-mono">ATTEMPT #{a.id}</span>
                            <h5 className="font-bold text-slate-950 tracking-tight text-xs mt-0.5 leading-tight">{a.employee_name}</h5>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5 max-w-[170px] truncate">{a.quiz_title}</p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                              a.score >= 75 ? 'bg-emerald-50 text-emerald-700' : a.score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {a.score}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            {a.submission_date}
                          </span>
                          <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded uppercase text-[8px] tracking-wider font-mono">
                            {a.prediction_category || 'Trained'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column - Report Details */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col h-[580px] overflow-hidden">
                {(() => {
                  const currentReport = attemptsWithFeedback.find(r => r.id === selectedReportId);
                  if (!currentReport) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <HelpCircle className="w-10 h-10 text-slate-300" />
                        <div>
                          <p className="text-slate-800 font-bold text-sm">No Report Selected</p>
                          <p className="text-slate-400 text-xs">Select any candidate feedback card on the left panel to trigger detail deep-dive view.</p>
                        </div>
                      </div>
                    );
                  }

                  const feedback = currentReport.feedback;
                  if (!feedback) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <AlertTriangle className="w-10 h-10 text-amber-500" />
                        <div>
                          <p className="text-slate-800 font-bold text-sm font-display font-bold">Failed to Load Feedback</p>
                          <p className="text-slate-400 text-xs">This attempt has no linked AI data.</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in">
                      
                      {/* View Report Header details */}
                      <div className="border-b border-slate-150 pb-4 mb-4">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div>
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest font-mono">Gemini Evaluator Core Report</span>
                            <h4 className="text-base font-bold text-slate-950 mt-0.5 font-display">{currentReport.employee_name}</h4>
                            <p className="text-xs text-slate-500 font-sans tracking-tight">{currentReport.quiz_title}</p>
                          </div>
                          
                          <div className="flex gap-2 shrink-0">
                            <div className="text-center bg-emerald-50 border border-emerald-100 p-2 rounded-xl min-w-[70px]">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Score</p>
                              <p className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">{currentReport.score}%</p>
                            </div>
                            <div className="text-center bg-indigo-50 border border-indigo-100 p-2 rounded-xl min-w-[70px]">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
                              <p className="text-lg font-extrabold text-indigo-700 font-mono mt-0.5">{currentReport.accuracy_percentage}%</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Scroll Grid */}
                      <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4">
                        
                        {/* 1. Strengths block */}
                        {feedback.strengths && (
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Core Performance Strengths
                            </h5>
                            <div className="p-3.5 bg-emerald-50/50 border border-emerald-100/60 rounded-xl text-xs text-slate-700 leading-relaxed font-sans font-medium">
                              {feedback.strengths}
                            </div>
                          </div>
                        )}

                        {/* 2. Weaknesses block */}
                        {feedback.weaknesses && (
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Identified Gaps & Weaknesses
                            </h5>
                            <div className="p-3.5 bg-amber-50/40 border border-amber-100/60 rounded-xl text-xs text-slate-700 leading-relaxed font-sans font-medium">
                              {feedback.weaknesses}
                            </div>
                          </div>
                        )}

                        {/* 3. Improvement areas */}
                        {feedback.improvement_areas && (
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Target Improvement Areas
                            </h5>
                            <div className="p-3.5 bg-blue-50/40 border border-blue-100/60 rounded-xl text-xs text-slate-700 leading-relaxed font-sans font-medium">
                              {feedback.improvement_areas}
                            </div>
                          </div>
                        )}

                        {/* 4. Action Learning Plan */}
                        {(feedback.learning_plan || feedback.learning_recommendations) && (
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
                              Personalized Training & Learning Plan
                            </h5>
                            <div className="p-3.5 bg-violet-50/30 border border-violet-100/60 rounded-xl text-xs text-slate-700 leading-relaxed font-sans font-medium">
                              {feedback.learning_plan || feedback.learning_recommendations}
                            </div>
                          </div>
                        )}

                        {/* 5. Career & motiv feedback */}
                        {feedback.motivational_feedback && (
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-display">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                              Motivational Coach Sentiment
                            </h5>
                            <blockquote className="p-4 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl italic text-xs text-slate-600 font-sans leading-relaxed font-normal">
                              "{feedback.motivational_feedback}"
                            </blockquote>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })()}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
