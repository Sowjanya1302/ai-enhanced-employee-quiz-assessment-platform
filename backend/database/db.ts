import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Password Hashing Utility using native Node crypto (highly secure & 100% platform independent)
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  previous_performance: string; // 'High Performer', 'Average Performer', 'Needs Improvement'
  created_at: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  created_at: string;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string; // 'A' | 'B' | 'C' | 'D'
}

export interface Attempt {
  id: number;
  employee_id: number;
  employee_name: string;
  quiz_id: number;
  quiz_title: string;
  score: number;                     // score out of 100
  accuracy_percentage: number;       // accuracy (0-100)
  time_taken_seconds: number;
  attempt_count: number;
  submission_date: string;
  prediction_category?: string;      // Predict model outputs: 'High Performer', 'Average Performer', 'Needs Improvement'
  prediction_probability?: number;
  feedback?: {
    strengths: string;
    weaknesses: string;
    improvement_areas: string;
    learning_plan: string;
    motivational_feedback: string;
  };
}

interface DatabaseSchema {
  employees: Employee[];
  admins: Admin[];
  quizzes: Quiz[];
  questions: Question[];
  attempts: Attempt[];
}

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'backend', 'database', 'database.json');

// Memory cache of database tables
let dbInstance: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (dbInstance) return dbInstance;

  // Ensure directories exist
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      dbInstance = JSON.parse(data);
      return dbInstance!;
    } catch (err) {
      console.error('Failed to parse database file, rebuilding default state.', err);
    }
  }

  // Create default seeded database state
  const defaultDb: DatabaseSchema = {
    employees: [
      {
        id: 1,
        name: 'Jane Doe',
        email: 'employee@platform.com',
        password_hash: hashPassword('user123'),
        previous_performance: 'Average Performer',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Alexander Mercer',
        email: 'alex@platform.com',
        password_hash: hashPassword('user123'),
        previous_performance: 'High Performer',
        created_at: new Date().toISOString()
      }
    ],
    admins: [
      {
        id: 1,
        name: 'System Admin',
        email: 'admin@platform.com',
        password_hash: hashPassword('admin123'),
        created_at: new Date().toISOString()
      }
    ],
    quizzes: [
      {
        id: 1,
        title: 'Cloud Computing & System Architecture',
        description: 'Covers major cloud service designs, scalable infrastructure, system reliability, security controls, and storage operations.',
        time_limit_minutes: 10,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Full-Stack RESTful API & Security Standards',
        description: 'Examines HTTP architectures, RESTful resource modeling, token-based authentication protocols, and API endpoint protection.',
        time_limit_minutes: 8,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Enterprise Machine Learning & Data Engineering',
        description: 'Assesses foundational knowledge in data pipelines, regression/classification, data cleaning, forest algorithms, and model evaluations.',
        time_limit_minutes: 12,
        created_at: new Date().toISOString()
      }
    ],
    questions: [
      // Cloud Quiz (Quiz ID: 1)
      {
        id: 101,
        quiz_id: 1,
        question_text: 'Which architectural component is responsible for distributing incoming application traffic across multiple target endpoints to ensure reliability?',
        option_a: 'Auto Scaling Group',
        option_b: 'Application Load Balancer',
        option_c: 'NAT Gateway',
        option_d: 'Route 53 Hosted Zone',
        correct_option: 'B'
      },
      {
        id: 102,
        quiz_id: 1,
        question_text: 'What is the primary benefit of deploying cloud resources across multiple Availability Zones?',
        option_a: 'Decreasing billing costs',
        option_b: 'Ensuring high availability and fault tolerance',
        option_c: 'Simplified network subnet configurations',
        option_d: 'Increasing the CPU performance metrics of single nodes',
        correct_option: 'B'
      },
      {
        id: 103,
        quiz_id: 1,
        question_text: 'Which storage model offers optimal file system level latency, mounting simultaneously on multiple server instances to share data pipelines?',
        option_a: 'Block Storage (EBS)',
        option_b: 'Object Storage (S3)',
        option_c: 'Elastic Network File System (EFS)',
        option_d: 'Cold Archive Glacier',
        correct_option: 'C'
      },
      {
        id: 104,
        quiz_id: 1,
        question_text: 'In the Cloud Shared Responsibility Model, which operational task rests entirely on the infrastructure customer (employee/tenant)?',
        option_a: 'Physical security of computer data centers',
        option_b: 'Virtualization host firmware patches',
        option_c: 'Operating system configuration and host firewall hardening',
        option_d: 'Disposing of obsolete storage drives',
        correct_option: 'C'
      },
      {
        id: 105,
        quiz_id: 1,
        question_text: 'What is a content delivery network (CDN) edge location utilized for?',
        option_a: 'Running high-throughput core databases',
        option_b: 'Caching static web assets geographically closer to client regions',
        option_c: 'Hosting primary container clusters',
        option_d: 'Provisioning multi-tenant subnets',
        correct_option: 'B'
      },

      // API standards (Quiz ID: 2)
      {
        id: 201,
        quiz_id: 2,
        question_text: 'Which standard HTTP reaction code should represent a successful API submission creating a resource?',
        option_a: '200 OK',
        option_b: '201 Created',
        option_c: '202 Accepted',
        option_d: '204 No Content',
        correct_option: 'B'
      },
      {
        id: 202,
        quiz_id: 2,
        question_text: 'Which HTTP request verbs are classified as safe and idempotent (making multiple identical requests achieves equivalent safe state without side effects)?',
        option_a: 'GET and POST',
        option_b: 'GET, HEAD, OPTIONS',
        option_c: 'POST and PUT',
        option_d: 'PATCH and DELETE',
        correct_option: 'B'
      },
      {
        id: 203,
        quiz_id: 2,
        question_text: 'In a stateless JSON Web Token (JWT) workflow, what is the safest storage pattern to prevent Cross-Site Scripting (XSS) intercept actions?',
        option_a: 'Browser localStorage',
        option_b: 'Session variable inside standard memory script',
        option_c: 'An HttpOnly, Secure cookie',
        option_d: 'Base64 encoded string in local index.html footer',
        correct_option: 'C'
      },
      {
        id: 204,
        quiz_id: 2,
        question_text: 'Which API structure emphasizes real-time bidirectional messaging over single persistent TCP lines without API polling overhead?',
        option_a: 'GraphQL endpoints',
        option_b: 'REST query parameters',
        option_c: 'WebSockets protocol',
        option_d: 'JSON-RPC pipelines',
        correct_option: 'C'
      },
      {
        id: 205,
        quiz_id: 2,
        question_text: 'Which security header prevents web attacks by informing the browser exclusively of valid source directories permitted for executing script hooks?',
        option_a: 'Access-Control-Allow-Origin',
        option_b: 'Content-Security-Policy (CSP)',
        option_c: 'X-Frame-Options',
        option_d: 'Strict-Transport-Security',
        correct_option: 'B'
      },

      // ML standards (Quiz ID: 3)
      {
        id: 301,
        quiz_id: 3,
        question_text: 'What is Gini impurity used for when building trees in classification modeling?',
        option_a: 'Normalising input numerical feature counts',
        option_b: 'Evaluating structural split efficiency to minimize label mixture',
        option_c: 'Converting categorical strings into float indices',
        option_d: 'Optimising model matrix convergence during gradient descents',
        correct_option: 'B'
      },
      {
        id: 302,
        quiz_id: 3,
        question_text: 'How does an ensemble Random Forest algorithm combat individual decision tree model over-fitting?',
        option_a: 'By forcing extreme depth pruning constraints',
        option_b: 'Aggregating diverse tree structures trained on random subsets of data/features',
        option_c: 'Limiting available training targets to only binary outputs',
        option_d: 'Applying standard L1 regularization formulas to tree nodes',
        correct_option: 'B'
      },
      {
        id: 303,
        quiz_id: 3,
        question_text: 'To diagnose a classifier predicting binary classes where true class distributions are highly skewed, which metric represents the proportion of correct positive predictions of all expected targets forecast?',
        option_a: 'Mean Squared Error',
        option_b: 'Precision',
        option_c: 'Recall',
        option_d: 'F1-Score',
        correct_option: 'B'
      },
      {
        id: 304,
        quiz_id: 3,
        question_text: 'Which step is a crucial prerequisite to prevent feature magnitude bias before feeding inputs into a support vector or clustering model?',
        option_a: 'Gini Tree Split algorithm',
        option_b: 'Features scaling and standardization',
        option_c: 'One-hot encoding values',
        option_d: 'Random forest bootstrapping',
        correct_option: 'B'
      },
      {
        id: 305,
        quiz_id: 3,
        question_text: 'Which cell element in a Confusion Matrix charts instances where the classifier forecast a Positive class but the actual input segment was Negative?',
        option_a: 'True Positive',
        option_b: 'False Positive (Type I Error)',
        option_c: 'False Negative (Type II Error)',
        option_d: 'True Negative',
        correct_option: 'B'
      }
    ],
    attempts: []
  };

  dbInstance = defaultDb;
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write database file to filesystem:', err);
  }
}

// ACCESSOR INTERFACES
export const db = {
  getEmployees: () => loadDatabase().employees,
  getAdmins: () => loadDatabase().admins,
  getQuizzes: () => loadDatabase().quizzes,
  getQuestions: () => loadDatabase().questions,
  getAttempts: () => loadDatabase().attempts,

  addEmployee: (employee: Omit<Employee, 'id' | 'created_at'>) => {
    const data = loadDatabase();
    const newId = data.employees.length > 0 ? Math.max(...data.employees.map(e => e.id)) + 1 : 1;
    const newEmp: Employee = {
      ...employee,
      id: newId,
      created_at: new Date().toISOString()
    };
    data.employees.push(newEmp);
    saveDatabase(data);
    return newEmp;
  },

  updateEmployeePerformance: (employeeId: number, category: string) => {
    const data = loadDatabase();
    const emp = data.employees.find(e => e.id === employeeId);
    if (emp) {
      emp.previous_performance = category;
      saveDatabase(data);
    }
  },

  addQuiz: (quiz: Omit<Quiz, 'id' | 'created_at'>) => {
    const data = loadDatabase();
    const newId = data.quizzes.length > 0 ? Math.max(...data.quizzes.map(q => q.id)) + 1 : 1;
    const newQuiz: Quiz = {
      ...quiz,
      id: newId,
      created_at: new Date().toISOString()
    };
    data.quizzes.push(newQuiz);
    saveDatabase(data);
    return newQuiz;
  },

  updateQuiz: (quizId: number, updated: { title: string; description: string; time_limit_minutes: number }) => {
    const data = loadDatabase();
    const quizIdx = data.quizzes.findIndex(q => q.id === quizId);
    if (quizIdx !== -1) {
      data.quizzes[quizIdx] = { ...data.quizzes[quizIdx], ...updated };
      saveDatabase(data);
      return data.quizzes[quizIdx];
    }
    return null;
  },

  deleteQuiz: (quizId: number) => {
    const data = loadDatabase();
    data.quizzes = data.quizzes.filter(q => q.id !== quizId);
    data.questions = data.questions.filter(q => q.quiz_id !== quizId);
    data.attempts = data.attempts.filter(a => a.quiz_id !== quizId);
    saveDatabase(data);
  },

  addQuestion: (q: Omit<Question, 'id'>) => {
    const data = loadDatabase();
    const newId = data.questions.length > 0 ? Math.max(...data.questions.map(qu => qu.id)) + 1 : 1;
    const newQuestion: Question = { ...q, id: newId };
    data.questions.push(newQuestion);
    saveDatabase(data);
    return newQuestion;
  },

  updateQuestion: (questionId: number, q: Omit<Question, 'id' | 'quiz_id'>) => {
    const data = loadDatabase();
    const index = data.questions.findIndex(qu => qu.id === questionId);
    if (index !== -1) {
      data.questions[index] = { ...data.questions[index], ...q };
      saveDatabase(data);
      return data.questions[index];
    }
    return null;
  },

  deleteQuestion: (questionId: number) => {
    const data = loadDatabase();
    data.questions = data.questions.filter(q => q.id !== questionId);
    saveDatabase(data);
  },

  addAttempt: (attempt: Omit<Attempt, 'id' | 'submission_date'>) => {
    const data = loadDatabase();
    const newId = data.attempts.length > 0 ? Math.max(...data.attempts.map(a => a.id)) + 1 : 1;
    const newAttempt: Attempt = {
      ...attempt,
      id: newId,
      submission_date: new Date().toISOString()
    };
    data.attempts.push(newAttempt);
    saveDatabase(data);
    return newAttempt;
  },

  saveAttemptWithAI: (attemptId: number, predictedCategory: string, prob: number, feedback: any) => {
    const data = loadDatabase();
    const index = data.attempts.findIndex(a => a.id === attemptId);
    if (index !== -1) {
      data.attempts[index].prediction_category = predictedCategory;
      data.attempts[index].prediction_probability = prob;
      data.attempts[index].feedback = feedback;
      saveDatabase(data);
      return data.attempts[index];
    }
    return null;
  }
};
