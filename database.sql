-- MySQL Database Schema
-- AI-Enhanced Employee Quiz & Assessment Platform

CREATE DATABASE IF NOT EXISTS employee_assessment_db;
USE employee_assessment_db;

-- 1. Employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    previous_performance VARCHAR(50) DEFAULT 'Average Performer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_employee_email (email)
);

-- 2. Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_email (email)
);

-- 3. Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    time_limit_minutes INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Questions table (MCQs only)
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option CHAR(1) NOT NULL, -- 'A', 'B', 'C', or 'D'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_question_quiz (quiz_id)
);

-- 5. Attempts table
CREATE TABLE IF NOT EXISTS attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score INT NOT NULL,
    accuracy_percentage DECIMAL(5, 2) NOT NULL,
    time_taken_seconds INT NOT NULL,
    attempt_count INT NOT NULL DEFAULT 1,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_attempt_employee (employee_id),
    INDEX idx_attempt_quiz (quiz_id)
);

-- 6. Results table (Aggregated scores per quiz per employee)
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    score INT NOT NULL,
    accuracy_percentage DECIMAL(5, 2) NOT NULL,
    time_taken_seconds INT NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'Completed', 'Passed', 'Failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    INDEX idx_result_attempt (attempt_id)
);

-- 7. Predictions table (ML Performance Category Prediction)
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    quiz_id INT NOT NULL,
    quiz_score INT NOT NULL,
    accuracy_percentage DECIMAL(5, 2) NOT NULL,
    time_taken_seconds INT NOT NULL,
    attempts_count INT NOT NULL,
    predicted_category VARCHAR(50) NOT NULL, -- 'High Performer', 'Average Performer', 'Needs Improvement'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_predict_employee (employee_id),
    INDEX idx_predict_quiz (quiz_id)
);

-- 8. Feedbacks table (Gemini AI feedback report)
CREATE TABLE IF NOT EXISTS feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    quiz_id INT NOT NULL,
    strengths TEXT NOT NULL,
    weaknesses TEXT NOT NULL,
    improvement_areas TEXT NOT NULL,
    learning_plan TEXT NOT NULL,
    motivational_feedback TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_feedback_employee (employee_id),
    INDEX idx_feedback_quiz (quiz_id)
);

-- Seed Initial Default Admin (Password: 'admin123' - Hashed value would be stored, but this serves as db schema structure setup)
INSERT INTO admins (name, email, password_hash) 
VALUES ('System Admin', 'admin@platform.com', '$2b$10$7zB3cW9I0T1tGveD4u2/mO4Xw9y6vYVqfD/1U8d.aDkKj9uN97C2y')
ON DUPLICATE KEY UPDATE email=email;
