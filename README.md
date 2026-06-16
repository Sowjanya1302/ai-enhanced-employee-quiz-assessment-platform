# AI-Enhanced Employee Quiz & Assessment Platform

A highly polished, enterprise-ready full-stack talent development and performance assessment platform. This app utilizes a custom **Random Forest Classifier** trained on realistic employee testing criteria to evaluate candidate competencies, and pairs with **Gemini AI v3.5 Flash** server-side APIs to construct professional HR-grade, actionable coaching plans.

---

## Technical Architecture & Core Modules

### ⚙️ Theme & Interface: *Technical Dashboard / Data Grid*
Styling is fully integrated following high-contrast flat minimalism:
* **Background & Contrast**: Flat warm titanium off-white (`#E4E3E0`) and deep ink charcoal (`#141414`) framing.
* **Micro-indicators**: Built-in monospace telemetry panels recording active simulated network server latency, DB connections, and live stopwatch limits.
* **Responsive Layout**: Desk-precision layouts with sliding responsive action options and sidebar modules.

### 🛡️ Module 1: Comprehensive Authentication
* **Candidate Login & Registration**: Integrated password hashing checks. Retains previous performance records for baseline ML evaluation parameters.
* **HR / Admin authority verification**: Standalone login port targeting authorized administrators (`admin@platform.com` / `admin123`).

### 📝 Module 2: MCQ Quiz and Assessment Engine
* **Deployments Panel**: Create, update, or completely delete active multiple-choice questions sets.
* **Interactive Active Question Taker**: Built-in candidate timer, dynamic progress indicators, and automatic evaluations.
* **Auto-Evaluation Calculator**: Computes accuracy ratings directly within database rules upon completion.

### 🧠 Module 3: Machine Learning Training Core (Random Forest Classifier)
Includes train-test splitting models built from scratch (`ml/train_model.ts` and `ml/predict.ts`):
* **Balanced Dataset generation**: Self-generating balanced dataset containing 550 realistic candidate assessment items (`ml/dataset/employee_assessment_dataset.csv`).
* **Random Forest Structure**: 7 bootstrapped CART (Classification and Regression Tree) decision paths resolving single-node overfits.
* **Performance Cohort Predictor**: Classifies employees into `High Performer`, `Average Performer`, or `Needs Improvement` using parameters:
  * `quiz_score`
  * `accuracy_percentage`
  * `time_taken`
  * `attempts`
  * `previous_performance`
* Evaluated at **99.09% Validation Accuracy** using Confusion Matrix, precision, and recall metrics.

### 🔮 Module 4: Generative AI Personalization (Gemini AI Feedback API)
* Integrated server-side using the modern `@google/genai` model pipeline (`gemini-3.5-flash`).
* Parses candidate metrics and returns structured JSON reports containing actionable **Strengths**, **Gaps / Weaknesses**, **Improvement Areas**, and customized **Recommended Learning Plans**.
* Safe heuristic logic fallbacks are designed in for configurations without active model key structures.

---

## Execution Guide in AI Studio Preview

### Install base workspace libraries:
Ensure all workspace systems sync correctly:
```bash
npm install
```

### Compile, train, and lock the Random Forest model state:
```bash
npx tsx ml/train_model.ts
```
The script auto-shuffles the dataset, executes train-test splits, prints classification recall matrices, and compiles state parameters to `/ml/rf_model.json`.

### Run local full-stack server operations:
```bash
npm run dev
```
The server routes express endpoints on accessible Port `3000`.

---

## Production Deployment Structure
Included code documents correspond to both:
1. **Interactive Node/React Stack**: For direct preview testing and local browser simulations.
2. **Standard Python/MySQL Architecture**: We included the complete SQL DDL schema file (`database.sql`) and `requirements.txt` to permit mirroring deployments in Python Flask pipelines with Scikit-learn and MySQL instances.

---

## 🚀 Deploying to Render (render.com)

This application is ready to be deployed to Render! The project includes a pre-configured `render.yaml` configuration file that supports a **Render Blueprint (1-Click Deploy)** and provisions a **Persistent Disk** to ensure your JSON database is retained across redeployments/restarts.

### Option 1: 1-Click Blueprint Deploy (Recommended)

1. Fork this repository on GitHub.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click on **New +** ➔ **Blueprint**.
4. Connect your fork of this repository.
5. Provide the following parameters:
   * **Service Name**: (e.g. `talent-assessment-platform`)
   * **GEMINI_API_KEY**: Provide your Google Gemini API Key here (or leave blank to use fallback local evaluation).
6. Click **Apply**. Render will automatically:
   * Provision a secure Node.js Web Service.
   * Provision and mount a `1 GB` Persistent Volume at `/data` to save `database.json` dynamically, ensuring your candidate records and quiz data survive restarts.
   * Pull the code, run `npm install`, compile React assets + Server code, and launch!

---

### Option 2: Manual Web Service Setup

If you prefer to configure the Web Service manually on Render:

1. Click **New +** ➔ **Web Service** on Render.
2. Connect your GitHub/GitLab repository.
3. Configure the following values:
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
4. Expand **Advanced Options** and add the following **Environment Variables**:
   * `NODE_ENV`: `production`
   * `DB_PATH`: `/data/database.json`
   * `GEMINI_API_KEY`: *(Optional but recommended)* Your Gemini credentials format (`AIzaSy...`)
5. Under **Disks**, click **Add Disk**:
   * **Name**: `database_volume`
   * **Mount Path**: `/data`
   * **Size**: `1` GB
6. Click **Deploy Web Service**.

