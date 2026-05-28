

export type StageId = string;
export type KanbanViewMode = 'kanban' | 'list' | 'table';

export interface KanbanStage {
  id: StageId;
  title: string;
  isCore?: boolean;
  sla?: number; // max days a candidate should stay in this stage
}

export interface ScorecardCriteria {
  id: string;
  name: string;
  weight: number; // 0-100 percentage
}

export interface ScorecardScore {
  criteriaId: string;
  score: number; // 1-5
}

export interface ScorecardEntry {
  stageId: StageId;
  scores: ScorecardScore[];
  notes?: string;
  evaluatedAt: string;
  evaluatedBy: string;
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
  testId: string;
  status: 'not_sent' | 'pending' | 'passed' | 'failed' | 'review';
  score?: number;
  notes?: string;
  sentDate?: string;
  deadlineHours?: number;
  file?: {
    name: string;
    type: string;
  };
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  stage: StageId;
  source: string;
  rating: number; // 0-5
  createdAt: string;
  stageEnteredAt?: string; // ISO timestamp when candidate entered current stage
  interviewDate?: string; // Format: YYYY/MM/DD
  interviewTime?: string; // Format: HH:MM
  interviewTimeChanged?: boolean;
  history: HistoryEntry[];
  comments: Comment[];
  hasResume?: boolean;
  testResults?: TestResult[];
  scorecards?: ScorecardEntry[];
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

export type View = 'dashboard' | 'calendar' | 'archive' | 'tests' | 'reports';

export interface Template {
  id: string;
  name: string;
  content: string;
  type: 'email' | 'whatsapp';
  stageId?: StageId;
}

export interface JobPosition {
  id: string;
  title: string;
}

export interface CompanyProfile {
  name: string;
  website: string;
  address: string;
  jobPositions: JobPosition[];
}
