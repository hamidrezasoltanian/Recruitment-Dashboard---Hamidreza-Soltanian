export interface User {
  id: string;
  username: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  stage: string;
  source: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
  interviewDate?: string;
  interviewTime?: string;
  interviewTimeChanged: boolean;
  interviewer?: string;
  hasResume: boolean;
  userId: string;
  user: User;
  comments: Comment[];
  history: HistoryEntry[];
  testResults: TestResult[];
  resumeFiles: ResumeFile[];
  testFiles: TestFile[];
}

export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  candidateId: string;
  userId: string;
  user: User;
}

export interface HistoryEntry {
  id: string;
  action: string;
  details?: string;
  createdAt: Date;
  candidateId: string;
  userId: string;
  user: User;
}

export interface TestResult {
  id: string;
  testId: string;
  status: 'not_sent' | 'pending' | 'passed' | 'failed' | 'review';
  score?: number;
  notes?: string;
  sentDate?: Date;
  deadlineHours?: number;
  createdAt: Date;
  updatedAt: Date;
  candidateId: string;
}

export interface ResumeFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
  candidateId: string;
}

export interface TestFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  testId: string;
  createdAt: Date;
  candidateId: string;
}

export interface KanbanStage {
  id: string;
  title: string;
  isCore: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  type: 'email' | 'whatsapp';
  stageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyProfile {
  id: string;
  name: string;
  website: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  jobPositions: JobPosition[];
}

export interface JobPosition {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  companyProfileId: string;
}

export interface TestLibraryItem {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Source {
  id: string;
  name: string;
  createdAt: Date;
}

export interface JwtPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

