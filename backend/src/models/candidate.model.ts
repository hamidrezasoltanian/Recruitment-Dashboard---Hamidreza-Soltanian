import mongoose, { Document, Schema, Model } from 'mongoose';

// --- Interfaces for Sub-documents ---
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

interface ITestResultFile {
    name: string;
    type: string;
}

interface ITestResult {
  testId: string;
  status: 'not_sent' | 'pending' | 'passed' | 'failed' | 'review' | 'submitted';
  score?: number;
  notes?: string;
  sentDate?: string;
  deadlineHours?: number;
  file?: ITestResultFile;
  resultUrl?: string;
}

// --- Main Candidate Interface ---
// This interface defines the properties of a candidate document, excluding Mongoose-specific fields.
interface CandidateProperties {
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

// This interface represents a Mongoose Document, including its methods and a typed `_id`.
export interface ICandidate extends CandidateProperties, Document {
    _id: string;
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

const TestResultFileSchema = new Schema<ITestResultFile>({
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
    _id: { type: String, required: true }, // Use frontend 'id' as MongoDB's '_id'
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
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

// Transform the output to match frontend expectations (id instead of _id)
// The ': any' types are a necessary evil for this specific Mongoose feature
// to work smoothly with TypeScript's strict mode.
CandidateSchema.set('toJSON', {
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
  }
});

// Create and export the strongly-typed model
const CandidateModel: Model<ICandidate> = mongoose.model<ICandidate>('Candidate', CandidateSchema);

export default CandidateModel;