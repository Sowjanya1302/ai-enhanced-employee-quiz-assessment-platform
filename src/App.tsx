import { useState, useEffect, FormEvent } from 'react';
import { 
  ShieldCheck, Cpu, Play, LogOut, CheckCircle, AlertTriangle, 
  Sparkles, BookOpen, User, Users, BarChart3, Clock, HelpCircle, 
  Layers, Plus, Trash, Edit, X, Compass, ChevronRight, LayoutDashboard, Database, ArrowLeft
} from 'lucide-react';

// Import Types
import { Quiz, Question, Attempt, EmployeeStat, ModelInfo } from './types';

// Import Modular Components
import LandingPage from './components/LandingPage';
import QuizInterface from './components/QuizInterface';
import ResultPage from './components/ResultPage';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  // Navigation Routing States
  // 'HUB' | 'EMPLOYEE_REG_LOGIN' | 'ADMIN_LOGIN' | 'EMPLOYEE_DASHBOARD' | 'ADMIN_DASHBOARD'
  const [currentView, setCurrentView] = useState<'HUB' | 'EMPLOYEE_REG_LOGIN' | 'ADMIN_LOGIN' | 'EMPLOYEE_DASHBOARD' | 'ADMIN_DASHBOARD'>('HUB');
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD'); // Sub-views inside dashboards

  // Authorization state
  const [employeeUser, setEmployeeUser] = useState<any | null>(null);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  // Authentication Submission Forms
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPerf, setRegPerf] = useState('Average Performer');
  const [logEmail, setLogEmail] = useState('');
  const [logPassword, setLogPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Domain Core Lists
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [employees, setEmployees] = useState<EmployeeStat[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Active quiz taker states
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: string }>({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [quizTimerActive, setQuizTimerActive] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState<any | null>(null);

  // Quiz Editor admin panel templates
  const [editedQuiz, setEditedQuiz] = useState<Omit<Quiz, 'id'> & { id?: number }>({ title: '', description: '', time_limit_minutes: 10 });
  const [editorQuestions, setEditorQuestions] = useState<Question[]>([
    { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
  ]);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // ML Predictor interactive tab states
  const [mlScore, setMlScore] = useState<number>(85);
  const [mlAccuracy, setMlAccuracy] = useState<number>(85);
  const [mlTimeTaken, setMlTimeTaken] = useState<number>(300);
  const [mlAttemptsCount, setMlAttemptsCount] = useState<number>(1);
  const [mlPerfCategory, setMlPerfCategory] = useState<number>(2); // 1 = Needs Imp, 2 = Avg, 3 = High
  const [predictorResult, setPredictorResult] = useState<{ category: string; probability: number } | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [trainingModeActive, setTrainingModeActive] = useState(false);

  // View specific analytics structures
  const [selectedCompletedAttempt, setSelectedCompletedAttempt] = useState<Attempt | null>(null);
  const [globalFeedbackLoading, setGlobalFeedbackLoading] = useState(false);

  // Trigger base dataset loads
  useEffect(() => {
    checkActiveSession();
    fetchModelInfo();
  }, []);

  // Sync when view changes
  useEffect(() => {
    if (currentView === 'ADMIN_DASHBOARD') {
      fetchAdminData();
    } else if (currentView === 'EMPLOYEE_DASHBOARD' && employeeUser) {
      fetchEmployeeHistory(employeeUser.id);
      fetchGlobalQuizzes();
    }
  }, [currentView, employeeUser]);

  // Quiz timer hook
  useEffect(() => {
    let interval: any = null;
    if (quizTimerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setQuizTimerActive(false);
            clearInterval(interval);
            handleAutoSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizTimerActive, secondsRemaining]);

  const checkActiveSession = async () => {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      if (data.admin) {
        setAdminUser(data.admin);
        setCurrentView('ADMIN_DASHBOARD');
        setActiveTab('DASHBOARD');
      } else if (data.employee) {
        setEmployeeUser(data.employee);
        setCurrentView('EMPLOYEE_DASHBOARD');
        setActiveTab('AVAILABLE_QUIZZES');
      }
    } catch (e) {
      console.warn('Fallback to native standalone cache state rules.');
    }
  };

  const fetchGlobalQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      setQuizzes(data);
    } catch (_) {
      console.error('Quiz retrieval error.');
    }
  };

  const fetchAdminData = async () => {
    try {
      await fetchGlobalQuizzes();
      
      const empRes = await fetch('/api/employees');
      const emps = await empRes.json();
      setEmployees(emps);

      const attemptRes = await fetch('/api/results');
      const atts = await attemptRes.json();
      setAttempts(atts);
    } catch (e) {
      console.error('Failed to parse logs.', e);
    }
  };

  const fetchEmployeeHistory = async (empId: number) => {
    try {
      const res = await fetch(`/api/employee/${empId}/results`);
      const data = await res.json();
      setAttempts(data);
    } catch (e) {
      console.error('Failed fetching individual employee history.', e);
    }
  };

  const fetchModelInfo = async () => {
    try {
      const res = await fetch('/api/ml/model-info');
      if (res.ok) {
        const data = await res.json();
        setModelInfo(data);
      }
    } catch (e) {
      console.error('ML info loading error', e);
    }
  };

  const handleRegisterEmployee = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regName || !regEmail || !regPassword) {
      setAuthError('Please complete all fields.');
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          previous_performance: regPerf
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Registration failed.');
      } else {
        setAuthSuccess('Account registered! Proceeding to auto-login...');
        setTimeout(() => {
          setLogEmail(regEmail);
          setLogPassword(regPassword);
          setAuthMode('LOGIN');
          setRegName('');
          setRegPassword('');
        }, 1200);
      }
    } catch (err: any) {
      setAuthError('Connection error: ' + err.message);
    }
  };

  const handleEmployeeLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: logEmail, password: logPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Invalid credentials.');
      } else {
        setEmployeeUser(data.employee);
        setLogEmail('');
        setLogPassword('');
        setCurrentView('EMPLOYEE_DASHBOARD');
        setActiveTab('AVAILABLE_QUIZZES');
      }
    } catch (err: any) {
      setAuthError('Connection error: ' + err.message);
    }
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Admin credentials declined.');
      } else {
        setAdminUser(data.admin);
        setAdminEmail('');
        setAdminPassword('');
        setCurrentView('ADMIN_DASHBOARD');
        setActiveTab('DASHBOARD');
      }
    } catch (err: any) {
      setAuthError('Api link down: ' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (_) {}
    setEmployeeUser(null);
    setAdminUser(null);
    setCurrentView('HUB');
    setActiveTab('DASHBOARD');
    setActiveQuiz(null);
    setQuizQuestions([]);
    setSelectedAnswers({});
    setQuizTimerActive(false);
    setQuizSubmitted(null);
  };

  // ACTIVE QUIZ INTERACTION METRIC ENGINE
  const startQuizAttempt = async (quiz: Quiz) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/questions`);
      if (!res.ok) {
        alert('Could not download quiz structure.');
        return;
      }
      const data = await res.json();
      if (data.questions.length === 0) {
        alert('This quiz is currently empty! Create questions first.');
        return;
      }

      setActiveQuiz(quiz);
      setQuizQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setSecondsRemaining(quiz.time_limit_minutes * 60);
      setQuizTimerActive(true);
      setQuizSubmitted(null);
    } catch (e) {
      alert('Internal connection block.');
    }
  };

  const handleSelectOption = (qId: number, val: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const handleAutoSubmitQuiz = () => {
    submitQuizAnswers();
  };

  const submitQuizAnswers = async () => {
    if (!activeQuiz || !employeeUser) return;
    setQuizTimerActive(false);

    // Calc time taken
    const totalTimeAllowedSeconds = activeQuiz.time_limit_minutes * 60;
    const timeTakenSecs = Math.max(10, totalTimeAllowedSeconds - secondsRemaining);

    setGlobalFeedbackLoading(true);
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeUser.id,
          quiz_id: activeQuiz.id,
          answers: selectedAnswers,
          time_taken_seconds: timeTakenSecs
        })
      });

      const data = await res.json();
      setGlobalFeedbackLoading(false);

      if (res.ok) {
        setQuizSubmitted(data.attempt);
        // Refresh local history
        await fetchEmployeeHistory(employeeUser.id);
      } else {
        alert(data.error || 'Failed to submit quiz attempt.');
      }
    } catch (e) {
      setGlobalFeedbackLoading(false);
      alert('Network transfer dropped your responses.');
    }
  };

  // MANUAL CUSTOM ML INTERACTION MODEL TAB
  const handleTestMLPredictor = async () => {
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_score: mlScore,
          accuracy_percentage: mlAccuracy,
          time_taken: mlTimeTaken,
          attempts: mlAttemptsCount,
          previous_performance: mlPerfCategory
        })
      });
      const data = await res.json();
      setPredictorResult(data);
    } catch (e) {
      console.error('Predictor block down.');
    }
  };

  const handleRetrainMLModel = async () => {
    setTrainingModeActive(true);
    try {
      const res = await fetch('/api/ml/retrain', { method: 'POST' });
      const data = await res.json();
      setTrainingModeActive(false);
      if (res.ok) {
        fetchModelInfo();
        alert(`Model retrained! New verification accuracy: ${(data.accuracy * 100).toFixed(2)}%`);
      }
    } catch (_) {
      setTrainingModeActive(false);
    }
  };

  // ADMIN SYSTEM QUIZ & QUESTION CRUD OPERATIONS
  const handleAddQuestionRow = () => {
    setEditorQuestions(prev => [
      ...prev,
      { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
    ]);
  };

  const handleRemoveQuestionRow = (index: number) => {
    if (editorQuestions.length <= 1) return;
    setEditorQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestionRowField = (index: number, key: keyof Question, value: string) => {
    setEditorQuestions(prev => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [key]: value };
      return clone;
    });
  };

  const handleOpenCreateQuiz = () => {
    setEditedQuiz({ title: '', description: '', time_limit_minutes: 10 });
    setEditorQuestions([{ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }]);
    setShowQuizModal(true);
  };

  const handleOpenEditQuiz = async (quiz: Quiz) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/questions`);
      const data = await res.json();
      
      setEditedQuiz({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        time_limit_minutes: quiz.time_limit_minutes
      });

      const rawQuestionData = data.questions.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option || 'A'
      }));

      setEditorQuestions(rawQuestionData.length > 0 ? rawQuestionData : [
        { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
      ]);
      setShowQuizModal(true);
    } catch (e) {
      alert('Could not configure editor state.');
    }
  };

  const handleSaveQuiz = async (e: FormEvent) => {
    e.preventDefault();
    if (!editedQuiz.title || !editedQuiz.time_limit_minutes) {
      alert('Title and duration limit must not be blank.');
      return;
    }

    const payload = {
      title: editedQuiz.title,
      description: editedQuiz.description,
      time_limit_minutes: editedQuiz.time_limit_minutes,
      questions: editorQuestions
    };

    try {
      let res;
      if (editedQuiz.id) {
        res = await fetch(`/api/quiz/${editedQuiz.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/quiz/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowQuizModal(false);
        await fetchAdminData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Could not complete save action.');
      }
    } catch (e) {
      alert('Connection block during save loop.');
    }
  };

  const handleDeleteQuiz = async (qId: number) => {
    if (!confirm('Are you absolutely sure you want to delete this quiz, its questions, and all linked attempts database records?')) return;
    try {
      const res = await fetch(`/api/quiz/${qId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      alert('Network transfer fail.');
    }
  };

  // PREPARE CHARTS FOR ANALYTICS VIEW
  const getAverageScorePerQuizChart = () => {
    const quizMap: { [title: string]: { sum: number; count: number } } = {};
    attempts.forEach(a => {
      if (!quizMap[a.quiz_title]) {
        quizMap[a.quiz_title] = { sum: 0, count: 0 };
      }
      quizMap[a.quiz_title].sum += a.score;
      quizMap[a.quiz_title].count += 1;
    });

    const labels = Object.keys(quizMap);
    const dataVals = labels.map(l => Math.round(quizMap[l].sum / quizMap[l].count));

    return {
      labels: labels.length > 0 ? labels : ['No Quiz Attempt Records Listed'],
      datasets: [
        {
          label: 'Avg Score (%)',
          data: dataVals.length > 0 ? dataVals : [0],
          backgroundColor: '#2563EB',
          borderColor: '#1E3A8A',
          borderRadius: 6,
          borderWidth: 1,
        },
      ],
    };
  };

  const getPredictionCohortPieChart = () => {
    const counts = { 'High Performer': 0, 'Average Performer': 0, 'Needs Improvement': 0 };
    attempts.forEach(a => {
      let cat = a.prediction_category;
      if (!cat) {
        if (a.score >= 80) {
          cat = 'High Performer';
        } else if (a.score >= 55) {
          cat = 'Average Performer';
        } else {
          cat = 'Needs Improvement';
        }
      }
      const validCat = cat as keyof typeof counts;
      if (validCat && counts[validCat] !== undefined) {
        counts[validCat]++;
      }
    });

    return {
      labels: ['High Performer', 'Average Performer', 'Needs Improvement'],
      datasets: [
        {
          label: 'Performers Segment',
          data: [counts['High Performer'], counts['Average Performer'], counts['Needs Improvement']],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 0,
        }
      ]
    };
  };

  const getCompletionRatesLineChart = () => {
    const attemptsByDate: { [date: string]: number } = {};
    attempts.forEach(a => {
      const d = new Date(a.submission_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      attemptsByDate[d] = (attemptsByDate[d] || 0) + 1;
    });

    const labels = Object.keys(attemptsByDate).sort();
    const dataVals = labels.map(l => attemptsByDate[l]);

    return {
      labels: labels.length > 0 ? labels : ['No History'],
      datasets: [
        {
          label: 'Daily Attempts',
          data: dataVals.length > 0 ? dataVals : [0],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          pointBackgroundColor: '#2563EB',
          tension: 0.3,
          borderWidth: 2,
        }
      ]
    };
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-68 bg-[#0F172A] text-slate-300 flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800">
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Company Brand Logo and Title */}
          <div className="p-6 border-b border-slate-850 flex items-center gap-3 bg-[#111C44]/40">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white ring-4 ring-blue-500/10">
              <Cpu className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="font-mono font-bold text-xl uppercase tracking-tighter text-white">
                ASSESSMENT
              </h1>
            </div>
          </div>

          {/* Dynamic Navigation lists */}
          <nav className="flex-1 text-sm py-6 px-4 space-y-1.5 overflow-y-auto">
            {currentView === 'HUB' && (
              <>
                <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">Platform Gateway</div>
                <button 
                  onClick={() => setCurrentView('HUB')} 
                  className="w-full px-4 py-2.5 bg-blue-700 text-white rounded-lg flex items-center justify-between text-left font-semibold text-xs uppercase"
                >
                  <span>Gateway Home</span>
                  <span className="text-[9px] bg-emerald-500 text-white font-bold h-2 w-2 rounded-full animate-ping"></span>
                </button>
                
                <button 
                  onClick={() => { setCurrentView('EMPLOYEE_REG_LOGIN'); setAuthMode('LOGIN'); }} 
                  className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-800 hover:text-white transition text-left uppercase flex items-center justify-between"
                >
                  <span>Employee Workspace</span>
                  <User className="w-3.5 h-3.5 opacity-65" />
                </button>
                
                <button 
                  onClick={() => setCurrentView('ADMIN_LOGIN')} 
                  className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-800 hover:text-white transition text-left uppercase flex items-center justify-between"
                >
                  <span>Administrative Authority</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                </button>
              </>
            )}

            {currentView === 'EMPLOYEE_REG_LOGIN' && (
              <>
                <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">Platform Gateways</div>
                <button 
                  onClick={() => setCurrentView('HUB')} 
                  className="w-full px-4 py-2.5 text-left transition rounded-lg hover:bg-slate-800 text-xs font-bold uppercase"
                >
                  &lsaquo; Return to Gateway
                </button>
                <div className="px-4 py-2 bg-slate-800 text-slate-200 border-l-4 border-blue-600 font-semibold text-xs rounded-r-lg uppercase">
                  {authMode === 'LOGIN' ? 'Employee Login' : 'Employee Registration'}
                </div>
              </>
            )}

            {currentView === 'ADMIN_LOGIN' && (
              <>
                <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">Platform Gateways</div>
                <button 
                  onClick={() => setCurrentView('HUB')} 
                  className="w-full px-4 py-2.5 text-left transition rounded-lg hover:bg-slate-800 text-xs font-bold uppercase"
                >
                  &lsaquo; Return to Gateway
                </button>
                <div className="px-4 py-2 bg-slate-800 text-slate-200 border-l-4 border-amber-500 font-semibold text-xs rounded-r-lg uppercase">
                  Admin Challenge Session
                </div>
              </>
            )}

            {/* EMPLOYEE PORTAL USER NAVIGATION */}
            {currentView === 'EMPLOYEE_DASHBOARD' && employeeUser && (
              <>
                <div className="px-3 pb-2.5 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  User: {employeeUser.name}
                </div>
                
                <button 
                  onClick={() => { setActiveTab('AVAILABLE_QUIZZES'); setSelectedCompletedAttempt(null); }} 
                  className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between uppercase transition-all ${activeTab === 'AVAILABLE_QUIZZES' ? 'bg-blue-700 text-white' : 'hover:bg-slate-850'}`}
                >
                  <span>Available Quizzes</span>
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                </button>
                
                <button 
                  onClick={() => { setActiveTab('MY_HISTORY'); setSelectedCompletedAttempt(null); }} 
                  className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between uppercase transition-all ${activeTab === 'MY_HISTORY' ? 'bg-blue-700 text-white' : 'hover:bg-slate-850'}`}
                >
                  <span>My Completed Tests</span>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                </button>
              </>
            )}

            {/* ADMIN AUTHD CONSOLE NAVIGATION */}
            {currentView === 'ADMIN_DASHBOARD' && adminUser && (
              <>
                <div className="px-3 pb-2.5 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Admin System Console
                </div>
                {[
                  { tabId: 'DASHBOARD', name: 'Dashboard Analytics', icon: BarChart3 },
                  { tabId: 'QUIZZES', name: 'Manage Quizzes', icon: Edit },
                  { tabId: 'ADD_QUESTIONS', name: 'Add Questions', icon: HelpCircle },
                  { tabId: 'EMPLOYEES', name: 'Candidate Registry', icon: Users },
                  { tabId: 'RESULTS', name: 'Audit Results Logs', icon: CheckCircle },
                  { tabId: 'AI_FEEDBACK', name: 'AI Feedback Reports', icon: Sparkles },
                ].map((item) => {
                  const NavIcon = item.icon;
                  return (
                    <button 
                      key={item.tabId}
                      onClick={() => setActiveTab(item.tabId)}
                      className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between uppercase transition-all ${activeTab === item.tabId ? 'bg-blue-700 text-white' : 'hover:bg-slate-800'}`}
                    >
                      <span>{item.name}</span>
                      <NavIcon className="w-4 h-4 shrink-0" />
                    </button>
                  );
                })}
              </>
            )}
          </nav>

          {/* Secure log out footer parameters */}
          {currentView !== 'HUB' && (employeeUser || adminUser) && (
            <div className="p-4 border-t border-slate-850">
              <button 
                onClick={handleLogout}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                Log out session
              </button>
            </div>
          )}



        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto">
        
        {/* TOP COMPONENT HEADER */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-sm sticky top-0 z-40 select-none">
          <span className="text-xs font-bold text-slate-550 uppercase tracking-widest font-sans flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            {currentView === 'HUB' && 'Enterprise Platform gateway'}
            {currentView === 'EMPLOYEE_REG_LOGIN' && 'Sign in employee dashboard'}
            {currentView === 'ADMIN_LOGIN' && 'Administrative Challenge challenge gate'}
            {currentView === 'EMPLOYEE_DASHBOARD' && `Employee Workstation // Current Employee: ${employeeUser?.name}`}
            {currentView === 'ADMIN_DASHBOARD' && 'Admin Analytics Workspace Center'}
          </span>

          {/* Profile details */}
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              {employeeUser && (
                <>
                  <p className="font-extrabold text-slate-900 font-display uppercase">{employeeUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wider">Candidate ID: #{employeeUser.id}</p>
                </>
              )}
              {adminUser && (
                <>
                  <p className="font-extrabold text-slate-900 font-display">Sarah Jenkins</p>
                  <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Chief HR Officer</p>
                </>
              )}
              {!employeeUser && !adminUser && (
                <>
                  <p className="font-bold text-slate-400">UNAUTHORIZED</p>
                  <p className="text-[9px] text-rose-500 font-semibold">GATEKEEPER CHALLENGE REQUIRED</p>
                </>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-sm font-bold shadow-sm">
              {employeeUser ? employeeUser.name.charAt(0).toUpperCase() : (adminUser ? 'A' : '?')}
            </div>
          </div>
        </header>

        {/* COMPONENT BODY */}
        <div className="p-8 flex-1 flex flex-col gap-6">
          
          {/* 1. Landing Page Hub */}
          {currentView === 'HUB' && (
            <LandingPage 
              onSelectView={setCurrentView} 
              onSetAuthMode={setAuthMode} 
            />
          )}

          {/* 2. Employee Registration & Signup screen */}
          {currentView === 'EMPLOYEE_REG_LOGIN' && (
            <div className="flex-1 flex justify-center items-center py-6">
              <div className="w-full max-w-md bg-white border border-slate-100 p-8 rounded-2xl shadow-xl space-y-6">
                
                {/* Dynamic tab toggler */}
                <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  <button 
                    onClick={() => { setAuthMode('LOGIN'); setAuthError(''); setAuthSuccess(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition tracking-wider ${authMode === 'LOGIN' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Employee Login
                  </button>
                  <button 
                    onClick={() => { setAuthMode('REGISTER'); setAuthError(''); setAuthSuccess(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition tracking-wider ${authMode === 'REGISTER' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Employee Register
                  </button>
                </div>

                {authError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {authMode === 'LOGIN' ? (
                  <form onSubmit={handleEmployeeLogin} className="space-y-4 font-sans text-xs font-semibold text-slate-600">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400">Employee Corporate Email</label>
                      <input 
                        type="email" 
                        value={logEmail}
                        onChange={e => setLogEmail(e.target.value)}
                        placeholder="employee@platform.com"
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400">Secret Password</label>
                      <input 
                        type="password" 
                        value={logPassword}
                        onChange={e => setLogPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 outline-none"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-3 bg-blue-750 hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase transition tracking-wider shadow-md cursor-pointer"
                    >
                      Authenticate Account
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterEmployee} className="space-y-4 font-sans text-xs font-semibold text-slate-600">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400">Full Name</label>
                      <input 
                        type="text" 
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400">Corporate Email</label>
                      <input 
                        type="email" 
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="jane@platform.com"
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400">Initial Password Key</label>
                      <input 
                        type="password" 
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400">Baseline Performer status</label>
                      <select 
                        value={regPerf}
                        onChange={e => setRegPerf(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none"
                      >
                        <option value="High Performer">High Performer</option>
                        <option value="Average Performer">Average Performer</option>
                        <option value="Needs Improvement">Needs Improvement</option>
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-3 bg-blue-750 hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase transition tracking-wider shadow-md cursor-pointer"
                    >
                      Process Registration
                    </button>
                  </form>
                )}

                <div className="pt-4 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => setCurrentView('HUB')} 
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Entrance Gateway
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Administrative Secure Login Node Entry */}
          {currentView === 'ADMIN_LOGIN' && (
            <div className="flex-1 flex justify-center items-center py-6">
              <div className="w-full max-w-sm bg-white border border-slate-100 p-8 rounded-2xl shadow-xl space-y-6">
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto ring-4 ring-amber-500/10">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base font-display uppercase tracking-wider">HR Secure Authority Port</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Challenge Identity Authentication</p>
                </div>

                {authError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-medium animate-pulse">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4 font-sans text-xs font-semibold text-slate-650">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400">Admin email address</label>
                    <input 
                      type="email" 
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="admin@platform.com"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400">Password string challenge</label>
                    <input 
                      type="password" 
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 outline-none"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase transition tracking-wider shadow-md cursor-pointer"
                  >
                    Authenticate Identity
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => setCurrentView('HUB')} 
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Entrance Gateway
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. Authenticated employee dashboard workspace */}
          {currentView === 'EMPLOYEE_DASHBOARD' && employeeUser && (
            <div className="flex-1 flex flex-col gap-6">
              
              {quizSubmitted ? (
                <ResultPage 
                  attempt={quizSubmitted} 
                  onClose={() => {
                    setQuizSubmitted(null);
                    setActiveQuiz(null);
                    setActiveTab('MY_HISTORY');
                  }} 
                />
              ) : activeQuiz ? (
                <QuizInterface 
                  quiz={activeQuiz}
                  questions={quizQuestions}
                  currentIndex={currentQuestionIndex}
                  selectedAnswers={selectedAnswers}
                  onSelectAnswer={handleSelectOption}
                  onNext={() => setCurrentQuestionIndex(prev => prev + 1)}
                  onPrevious={() => setCurrentQuestionIndex(prev => prev - 1)}
                  onSubmit={submitQuizAnswers}
                  secondsRemaining={secondsRemaining}
                  isLoading={globalFeedbackLoading}
                  onCancel={() => {
                    if (window.confirm("Are you sure you want to quit the assessment section? None of your selected answers will be submitted.")) {
                      setActiveQuiz(null);
                      setQuizQuestions([]);
                    }
                  }}
                />
              ) : (
                <EmployeeDashboard 
                  employeeUser={employeeUser}
                  quizzes={quizzes}
                  attempts={attempts}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onStartQuiz={startQuizAttempt}
                  selectedCompletedAttempt={selectedCompletedAttempt}
                  setSelectedCompletedAttempt={setSelectedCompletedAttempt}
                />
              )}
            </div>
          )}

          {/* 5. Authenticated administration panel workspace */}
          {currentView === 'ADMIN_DASHBOARD' && adminUser && (
            <div className="flex-1 flex flex-col gap-6">
              <AdminDashboard 
                employees={employees}
                quizzes={quizzes}
                attempts={attempts}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onOpenCreateQuiz={handleOpenCreateQuiz}
                onOpenEditQuiz={handleOpenEditQuiz}
                onDeleteQuiz={handleDeleteQuiz}
                onRefresh={fetchAdminData}
                attemptsAverageScoreChartData={getAverageScorePerQuizChart()}
                predictionsCohortChartData={getPredictionCohortPieChart()}
                completionRatesLineChartData={getCompletionRatesLineChart()}
              />
            </div>
          )}

        </div>

        {/* BOTTOM GLOBAL METRICS LOGGING BAR */}
        <footer className="mt-auto h-10 border-t border-slate-100 flex items-center px-8 bg-white text-slate-400 text-[10px] font-semibold gap-8 select-none shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>API Router proxy status: <b>200 OK</b></span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Database state: <b>MySQL simulated connection stable</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span>Machine learning model records: <b>550 instances augmented</b></span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-slate-350">
            <span>Service scale-to-zero online</span>
          </div>
        </footer>

      </main>

      {/* QUIZ FORM CREATE / EDIT DIALOG MODAL */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-6 z-50">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-150 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 text-white rounded-t-2xl font-sans text-sm flex justify-between items-center">
              <span className="font-bold flex items-center gap-2 uppercase font-display">
                <Edit className="w-4 h-4 text-blue-500" />
                {editedQuiz.id ? 'Configure MCQ deployment track' : 'Deploy new MCQ quiz track'}
              </span>
              <button onClick={() => setShowQuizModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5 border border-slate-650 rounded p-0.5 shrink-0" />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleSaveQuiz} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-dashed border-slate-150 pb-5">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Quiz/Assessment Module Title</label>
                  <input 
                    type="text" 
                    value={editedQuiz.title}
                    onChange={e => setEditedQuiz(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Advanced TypeScript & Clean Coding Patterns"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 text-xs font-sans font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Time limit (Minutes)</label>
                  <input 
                    type="number" 
                    value={editedQuiz.time_limit_minutes}
                    onChange={e => setEditedQuiz(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) || 10 }))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 text-xs font-sans font-semibold"
                    required
                  />
                </div>
                <div className="col-span-1 md:col-span-3 space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">Short Syllabus or Description Summary</label>
                  <textarea 
                    value={editedQuiz.description}
                    onChange={e => setEditedQuiz(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Provide expectation topic descriptions..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-900 text-xs font-sans font-semibold"
                  />
                </div>
              </div>

              {/* Questions block builder */}
              <div className="space-y-4">
                <div className="flex justify-between items-center sm:flex-row flex-col gap-2">
                  <h4 className="font-extrabold text-slate-800 text-xs font-display uppercase tracking-wider">MCQ Questions block list</h4>
                  <button 
                    type="button" 
                    onClick={handleAddQuestionRow}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg uppercase text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Append Question row
                  </button>
                </div>

                <div className="space-y-4 max-h-[32vh] overflow-y-auto pr-1">
                  {editorQuestions.map((q, idx) => (
                    <div key={idx} className="border border-slate-200 p-5 rounded-2xl bg-slate-50 relative space-y-3 shadow-inner">
                      
                      {editorQuestions.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveQuestionRow(idx)}
                          className="absolute top-3 right-3 text-red-600 hover:text-red-800 font-bold border border-red-200 rounded-lg px-2 py-0.5 text-[9px] cursor-pointer"
                        >
                          Delete Row
                        </button>
                      )}

                      <div className="bg-slate-250/20 px-2 py-1 rounded inline-block text-[10px] font-mono font-bold text-slate-500 uppercase">
                        MCQ Question Number #{idx + 1}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-slate-400 block tracking-wider">Question Statement / Problem string</label>
                        <input 
                          type="text" 
                          value={q.question_text}
                          onChange={e => updateQuestionRowField(idx, 'question_text', e.target.value)}
                          placeholder="What key parameter does Random Forest training reduce..."
                          className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs"
                          required
                        />
                      </div>

                      {/* Choices option grid */}
                      <div className="grid grid-cols-2 gap-3.5 text-xs text-slate-650">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 block uppercase">Option A</label>
                          <input 
                            type="text" 
                            value={q.option_a}
                            onChange={e => updateQuestionRowField(idx, 'option_a', e.target.value)}
                            className="w-full border p-1 rounded-lg bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 block uppercase">Option B</label>
                          <input 
                            type="text" 
                            value={q.option_b}
                            onChange={e => updateQuestionRowField(idx, 'option_b', e.target.value)}
                            className="w-full border p-1 rounded-lg bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 block uppercase">Option C</label>
                          <input 
                            type="text" 
                            value={q.option_c}
                            onChange={e => updateQuestionRowField(idx, 'option_c', e.target.value)}
                            className="w-full border p-1 rounded-lg bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 block uppercase">Option D</label>
                          <input 
                            type="text" 
                            value={q.option_d}
                            onChange={e => updateQuestionRowField(idx, 'option_d', e.target.value)}
                            className="w-full border p-1 rounded-lg bg-white"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] uppercase text-slate-400 block tracking-wider mb-1">Correct selection option choice</label>
                        <select 
                          value={q.correct_option}
                          onChange={e => updateQuestionRowField(idx, 'correct_option', e.target.value)}
                          className="border border-slate-200 rounded-lg p-1.5 bg-white text-xs text-slate-850"
                        >
                          <option value="A">Option Choice A</option>
                          <option value="B">Option Choice B</option>
                          <option value="C">Option Choice C</option>
                          <option value="D">Option Choice D</option>
                        </select>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowQuizModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel deploy
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase transition cursor-pointer shadow-sm"
                >
                  Save assessment module
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
