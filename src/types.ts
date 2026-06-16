export interface Quiz {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  question_count?: number;
}

export interface Question {
  id?: number;
  quiz_id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

export interface Attempt {
  id: number;
  employee_id: number;
  employee_name: string;
  quiz_id: number;
  quiz_title: string;
  score: number;
  accuracy_percentage: number;
  time_taken_seconds: number;
  attempt_count: number;
  submission_date: string;
  prediction_category?: string;
  prediction_probability?: number;
  feedback?: {
    strengths: string;
    weaknesses: string;
    improvement_areas: string;
    learning_plan: string;
    learning_recommendations?: string; // mapping to learning recommendations
    career_suggestions?: string; // mapping to career development suggestions
    motivational_feedback: string;
  };
}

export interface EmployeeStat {
  id: number;
  name: string;
  email: string;
  previous_performance: string;
  total_quizzes_taken: number;
  avg_score: number;
  avg_accuracy: number;
  avg_time: number;
}

export interface ModelInfo {
  accuracy: number;
  confusionMatrix: { [key: string]: { [key: string]: number } };
  classes: string[];
}
