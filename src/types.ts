export interface SubjectAnalysis {
  name: string;
  difficulty: string; // '상' | '중' | '하'
  recommendedHours: number; // minutes
  focusAreas: string[];
}

export interface DailyTask {
  dayNumber: number;
  dateString: string;
  subject: string;
  taskName: string;
  priority: string; // '상' | '중' | '하'
  estimatedMinutes: number;
  completed?: boolean; // Client-side check status
  completedMinutes?: number; // Client-side actual study minutes
}

export interface StudyPhase {
  phaseName: string;
  durationDays: number;
  description: string;
  dailyTasks: DailyTask[];
}

export interface StudyPlan {
  id: string; // Local storage identifier
  title: string;
  summary: string;
  totalDays: number;
  subjects: SubjectAnalysis[];
  phases: StudyPhase[];
  createdAt: string;
  examName: string;
  examDate: string;
  startDate: string;
}
