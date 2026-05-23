import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization helper for Gemini to prevent startup crashes when key is missing
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// API endpoint to check backend health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Post endpoint for study plan generation
app.post("/api/generate-plan", async (req: express.Request, res: express.Response) => {
  try {
    const { examName, examDate, startDate, subjects, customNotes } = req.body;

    if (!examName || !examDate || !startDate || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      res.status(400).json({ error: "Missing required parameters (examName, examDate, startDate, subjects array)" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(examDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
      return;
    }

    if (start >= end) {
      res.status(400).json({ error: "시험 준비 시작일은 시험 전날 이전이어야 합니다." });
      return;
    }

    // Calculate dates list between startDate and examDate (excluding examDate itself)
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.floor(timeDiff / (1000 * 3600 * 24));

    if (totalDays > 100) {
      res.status(400).json({ error: "계획 생성은 최대 100일까지 원활하게 지원됩니다. 범위를 줄여 지정해주세요." });
      return;
    }

    const datesList: { dayNumber: number; dateString: string }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const current = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      datesList.push({
        dayNumber: i + 1,
        dateString: `${yyyy}-${mm}-${dd}`
      });
    }

    const ai = getAI();
    const dateMappingGuide = datesList.map(item => `Day ${item.dayNumber}: ${item.dateString}`).join(", ");
    
    const prompt = `당신은 중학교 3학년 여학생을 위해 가장 친절하고 아기자기하며 완벽한 내신 만점 로드맵을 설계해주는 최고의 AI 학습 멘토이자 친언니 같은 언니 플래너입니다.
여중생의 눈높이에 맞춰 친밀하고 귀여운 말투, 신나는 느낌의 이모티콘(🌸, 🍒, ✨, 🧸, 🍀, 🐾, 💗)을 듬뿍 사용해서 한국어로 답변을 정성껏 작성해주세요.

[학생 및 시험 정보]
- 시험 명칭: ${examName} (예: 중3 1학기 기말고사)
- 시험일(D-Day): ${examDate}
- 준비 시작일: ${startDate}
- 총 공부 기간: ${totalDays}일 (시험 당일 제외)
- 공부할 과목 목록: ${subjects.join(", ")}
- 개인 맞춤 요청사항: ${customNotes || "없음"}

[계획 수립 필수 가이드라인]
1. 사용자 나이 맞춤: 16세 중학교 3학년 여학생이 흥미를 잃지 않고 매일매일 성취감을 느끼며 아기자기하게 따라갈 수 있는 분량으로 하루 일정을 채워주세요. (강압적이거나 피로감을 주는 전문 용어 대신 친절하고 명쾌하게)
2. 총 기간(${totalDays}일)을 체계적이고 사랑스러운 공부 단계(예: "1단계: 개념 뽀개기 🫧", "2단계: 기출 뿌시기 👊", "3단계: 단권화&막판 암기 스퍼트 🏃‍♀️💨") 3~4개로 나누어 수립하세요.
3. 매일매일 누락 없이 Day 1부터 Day ${totalDays}까지 아래 매핑 가이드에 대응하는 학습 테마와 구체적인 공부 액션을 정해주십시오:
   - 공부 가이드 일자 매핑: [${dateMappingGuide}]
4. 'taskName'은 단순히 "교과서 읽기", "수학 풀기" 대신 중3 여학생이 플래너를 보며 즐겁게 참여할 수 있도록 깜찍하고 선명하게 작성해야 합니다:
   - 예: "국어: 1단원 소설의 갈등 양상 교과서 2번 정독하고 핑키 노트에 핵심 정리하기 💘"
   - 예: "과학: 화학 반응의 규칙성 마인드맵 그리고 교과서 뒤쪽 대단원 문제 풀며 약점 체크! 🧪"
   - 예: "역사: 조선 후기 정치 변동 흐름 예쁜 형광펜으로 칠해가며 암기 카드 채우기 📝🌸"
5. 하루 평균 총 권장 시간은 학업 스트레스를 낮추고 집중도를 극대화하도록 60분~180분 사이로 쾌적하게 지정해주세요.
6. 과목 간 밸런스를 고려하고, 일요일이나 주말은 가벼운 복습 또는 리프레시 타임으로 세심하게 조절하는 친화적 전략을 포함해주세요.

반드시 아래에 명시된 responseSchema 구조에 맞춰 올바른 JSON 형식으로만 최종 응답하십시오.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy and encouraging Korean title for the study plan. (e.g. '정보처리기사 동차합격 30일 마스터 플랜')" },
            summary: { type: Type.STRING, description: "A high-level overview of the personalized strategy and timeline structure in Korean" },
            totalDays: { type: Type.INTEGER, description: "Total study duration in days" },
            subjects: {
              type: Type.ARRAY,
              description: "Brief analysis/overview of each subject as customized for this plan",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Subject name" },
                  difficulty: { type: Type.STRING, description: "Difficulty level specific to user/plan (상, 중, 하)" },
                  recommendedHours: { type: Type.INTEGER, description: "Recommended daily study minutes for this subject when active" },
                  focusAreas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "2-3 primary focus topics or keywords to study"
                  }
                },
                required: ["name", "difficulty", "recommendedHours", "focusAreas"]
              }
            },
            phases: {
              type: Type.ARRAY,
              description: "Chronological sequence of study phases spanning the entire duration",
              items: {
                type: Type.OBJECT,
                properties: {
                  phaseName: { type: Type.STRING, description: "Phase name (e.g., '1단계: 핵심 개념 학습')" },
                  durationDays: { type: Type.INTEGER, description: "Number of days in this phase" },
                  description: { type: Type.STRING, description: "Overview of instructions for this phase in Korean" },
                  dailyTasks: {
                    type: Type.ARRAY,
                    description: "Chronological study tasks allocated to days in this phase",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dayNumber: { type: Type.INTEGER, description: "Objective day count of the plan (1-based global index like 1, 2, 3..)" },
                        dateString: { type: Type.STRING, description: "YYYY-MM-DD matching the actual date for this day" },
                        subject: { type: Type.STRING, description: "Relevant subject name, '전체 과목', or '공통'" },
                        taskName: { type: Type.STRING, description: "Specific learning action for this day in Korean (concrete & milestone-driven)" },
                        priority: { type: Type.STRING, description: "Priority level (상, 중, 하)" },
                        estimatedMinutes: { type: Type.INTEGER, description: "Estimated active study minutes needed" }
                      },
                      required: ["dayNumber", "dateString", "subject", "taskName", "priority", "estimatedMinutes"]
                    }
                  }
                },
                required: ["phaseName", "durationDays", "description", "dailyTasks"]
              }
            }
          },
          required: ["title", "summary", "totalDays", "subjects", "phases"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No output generated from Gemini. Please try again.");
    }

    const parsedPlan = JSON.parse(textOutput);
    res.json(parsedPlan);
  } catch (error: any) {
    console.error("Error generating plan:", error);
    res.status(500).json({ error: error.message || "공부 계획 생성 중 서버 및 AI 서비스 오류가 발생했습니다." });
  }
});

// Setup Vite and Static resource middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
