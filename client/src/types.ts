

export type StageId = string;

export type Source = string;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface KanbanStage {
  id: StageId;
  title: string;
  isCore?: boolean; // Core stages cannot be deleted
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HistoryEntry {
  user: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface TestLibraryItem {
  id: string;
  name: string;
  url: string;
}

export interface TestResult {
  testId: string; // From TestLibraryItem.id
  status: 'not_sent' | 'pending' | 'passed' | 'failed' | 'review';
  score?: number;
  notes?: string;
  sentDate?: string;
  deadlineHours?: number;
  file?: {           // Uploaded result file (optional)
    name: string;
    type: string;
  };
}


export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string; // New field for the job position
  stage: StageId;
  source: string;
  rating: number; // 0-5
  createdAt: string;
  interviewDate?: string; // Format: YYYY/MM/DD
  interviewTime?: string; // Format: HH:MM
  interviewTimeChanged?: boolean; // New field
  interviewer?: string; // Username/Name of the interviewer
  history: HistoryEntry[];
  comments: Comment[];
  hasResume?: boolean;
  testResults?: TestResult[]; // Comprehensive test results
  evaluation?: string;
}

export interface StageChangeInfo {
  candidate: Candidate;
  newStage: KanbanStage;
}

export interface User {
  username: string;
  name: string;
  isAdmin: boolean;
}

export interface UserWithPassword extends User {
    password?: string;
}

export type View = 'dashboard' | 'calendar' | 'archive' | 'tests';

export interface Template {
  id: string;
  name: string;
  content: string;
  type: 'email' | 'whatsapp';
  stageId?: StageId; // For stage change notifications
}

export interface InterviewScriptQuestion {
  id: string;
  text: string;
  maxScore: number;
  order: number;
  sectionId: string;
  score?: number | null;
  comment?: string;
}

export interface InterviewSection {
  id: string;
  title: string;
  durationMinutes: number;
  order: number;
  jobPositionId: string;
  questions?: InterviewScriptQuestion[];
}

export interface EvaluationCriterion {
  id: string;
  title: string;
  description?: string | null;
  maxScore: number;
  order: number;
  jobPositionId: string;
}

export interface CandidateInterviewEvaluation {
  positionId: string | null;
  positionTitle: string;
  interviewDurationMinutes: number | null;
  scoreGuide: Record<string, string>;
  sections: InterviewSection[];
}

export interface JobPosition {
  id: string;
  title: string;
  interviewDurationMinutes?: number | null;
  scoreGuide?: string | null;
  sections?: InterviewSection[];
  criteria?: EvaluationCriterion[];
}

export interface CompanyProfile {
  name: string;
  website: string;
  address: string;
  jobPositions: JobPosition[];
}