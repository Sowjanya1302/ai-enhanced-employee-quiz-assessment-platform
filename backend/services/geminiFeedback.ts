import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// We use process.env.GEMINI_API_KEY as the core server secret
const apiKey = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && apiKey) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize Gemini AI Client:", e);
    }
  }
  return aiClient;
}

export interface QuizFeedback {
  strengths: string;
  weaknesses: string;
  improvement_areas: string;
  learning_plan: string;
  motivational_feedback: string;
}

/**
 * Request real-time corporate feedback from Gemini AI model based on test results
 */
export async function generateGeminiFeedback(params: {
  employeeName: string;
  quizTitle: string;
  score: number;
  accuracy: number;
  timeTakenMinutes: number;
  predictionCategory: string;
}): Promise<QuizFeedback> {
  const client = getAiClient();
  
  const systemInstruction = 
    "You are a Senior Corporate Trainer, Human Resources Specialist and Talent Development Manager. " +
    "Analyze the provided employee assessment metrics and generate precise, highly constructive, professional " +
    "HR feedback formatted in clear JSON schema containing: strengths, weaknesses, improvement_areas, " +
    "learning_plan, and motivational_feedback.";

  const prompt = `
    Employee Name: ${params.employeeName}
    Assessment Quiz: ${params.quizTitle}
    Automatic Quiz Score: ${params.score}/100
    Accuracy Rating: ${params.accuracy}%
    Time Duration Taken: ${params.timeTakenMinutes.toFixed(1)} minutes
    ML predicted Performance Cohort: ${params.predictionCategory}

    Please construct a professional human capital development review report. Speak directly to the employee in an encouraging, growth-oriented, professional corporate tone. Keep descriptions actionable.
  `;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              strengths: { type: "STRING" },
              weaknesses: { type: "STRING" },
              improvement_areas: { type: "STRING" },
              learning_plan: { type: "STRING" },
              motivational_feedback: { type: "STRING" }
            },
            required: ["strengths", "weaknesses", "improvement_areas", "learning_plan", "motivational_feedback"]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const feedbackObj = JSON.parse(responseText);
        return {
          strengths: feedbackObj.strengths || "Strong performance and execution.",
          weaknesses: feedbackObj.weaknesses || "Some margins of error can be improved.",
          improvement_areas: feedbackObj.improvement_areas || "Focus on reviewing quiz core content.",
          learning_plan: feedbackObj.learning_plan || "Enroll in advanced study tracks.",
          motivational_feedback: feedbackObj.motivational_feedback || "Keep learning and improving!"
        };
      }
    } catch (err) {
      console.warn("Gemini Live API error, executing heuristic fallback:", err);
    }
  }

  // Pure corporate heuristic fallback block for offline/no-key usage
  return getHeuristicFallbackFeedback(params.predictionCategory, params.score, params.accuracy, params.quizTitle);
}

function getHeuristicFallbackFeedback(category: string, score: number, accuracy: number, quizTitle: string): QuizFeedback {
  if (category === 'High Performer') {
    return {
      strengths: `Demonstrated exceptional comprehension of ${quizTitle} with a high score of ${score}% and solid accuracy (${accuracy}%). Strong time management skills and analytical consistency.`,
      weaknesses: `Identified minor optimization gaps under rapid decision making constraints. Highly proficient overall.`,
      improvement_areas: `Perfecting complex edge cases in advanced subject matters. Mentor junior teammates by sharing your tactical study patterns.`,
      learning_plan: `Recommend moving forward to advanced certifications in ${quizTitle}. Complete advanced modules in active engineering, modern system architecture, and system design pipelines.`,
      motivational_feedback: "Outstanding work! Your performance ranks among top cohorts. Continue pushing boundaries and championing knowledge sharing across the department."
    };
  } else if (category === 'Average Performer') {
    return {
      strengths: `Good foundational understanding displayed for ${quizTitle}. Consistent test-taking pace, scoring ${score}% with reliable precision.`,
      weaknesses: `Occasional lack of precision in core definitions other than basic concepts. Tends to score lower on complex logic.`,
      improvement_areas: `Improve active recall for deep and specific edge-cases. Strive to elevate overall quiz scores and accuracy above 80% with supplementary review cycles.`,
      learning_plan: `Complete mid-tier training courses in this subject. Participate in weekly office hours and dedicate 2 hours to practical mock exercises.`,
      motivational_feedback: "Stellar effort. You have a solid launchpad to become a high performer. Focus on core knowledge structures and your growth path will accelerate."
    };
  } else {
    return {
      strengths: `Active attempts indicate determination. Showed capabilities under structured review and baseline familiarity with ${quizTitle}.`,
      weaknesses: `Experiencing concept friction and high error rates leading to a score of ${score}%. High attempts indicate the need for standard study material realignments.`,
      improvement_areas: `Target fundamental theories in ${quizTitle}. Prioritize learning foundational definitions, taking slow study tracks, and reviewing explanations post submissions.`,
      learning_plan: `Assigned a 4-week structured Boot Camp series. Weekly 1-on-1 coaching check-ins with our system expert, supported by interactive concept-matching slides.`,
      motivational_feedback: "Growth is a process, not a sprint. We are here to support your upskilling journey fully. Stay persistent, leverage your tools, and your potential will shine on the next round!"
    };
  }
}
