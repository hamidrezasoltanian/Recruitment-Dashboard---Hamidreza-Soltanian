import mongoose, { Document, Schema, Model } from 'mongoose';

// --- Interfaces for Mongoose Data Structures ---

// Note: These interfaces define the shape of the data. Mongoose adds its own properties.

interface IHistoryEntry {
  user: string;
  action: string;
  details?: string;
  timestamp: string;
}

interface IComment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

interface ITestResult {
  testId: string;
  status: 'not_sent' | 'pending' | 'passed' | 'failed' | 'review' | 'submitted';
  score?: number;
  notes?: string;
  sentDate?: string;
  deadlineHours?: number;
  file?: {
    name: string;
    type: string;
  };
  resultUrl?: string;
}

// Interface for the Candidate Mongoose Document, which includes Mongoose's Document properties
export interface ICandidate extends Document {
  _id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  stage: string;
  source: string;
  rating: number;
  createdAt: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewTimeChanged?: boolean;
  history: IHistoryEntry[];
  comments: IComment[];
  hasResume?: boolean;
  testResults?: ITestResult[];
  portalToken?: string;
}


// --- Mongoose Schemas ---

const HistoryEntrySchema = new Schema<IHistoryEntry>({
  user: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: String, required: true },
}, { _id: false });

const CommentSchema = new Schema<IComment>({
  id: { type: String, required: true },
  user: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
}, { _id: false });

const TestResultFileSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
}, { _id: false });

const TestResultSchema = new Schema<ITestResult>({
  testId: { type: String, required: true },
  status: { type: String, required: true, enum: ['not_sent', 'pending', 'passed', 'failed', 'review', 'submitted'] },
  score: { type: Number },
  notes: { type: String },
  sentDate: { type: String },
  deadlineHours: { type: Number },
  file: { type: TestResultFileSchema },
  resultUrl: { type: String },
}, { _id: false });

const CandidateSchema = new Schema<ICandidate>({
    _id: { type: String, required: true }, // The frontend 'id' is used as MongoDB's '_id'
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    stage: { type: String, required: true },
    source: { type: String, required: true },
    rating: { type: Number, default: 0, required: true },
    createdAt: { type: String, required: true },
    interviewDate: { type: String },
    interviewTime: { type: String },
    interviewTimeChanged: { type: Boolean, default: false },
    history: { type: [HistoryEntrySchema], default: [] },
    comments: { type: [CommentSchema], default: [] },
    hasResume: { type: Boolean, default: false },
    testResults: { type: [TestResultSchema], default: [] },
    portalToken: { type: String },
}, {
    versionKey: false // Disable the __v field
});

// The ': any' types here are a known workaround for a Mongoose TypeScript issue.
CandidateSchema.set('toJSON', {
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
  }
});
CandidateSchema.set('toObject', {
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
  }
});

// Create and export the strongly-typed model
export const CandidateModel: Model<ICandidate> = mongoose.model<ICandidate>('Candidate', CandidateSchema);
