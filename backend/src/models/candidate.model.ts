import { Schema, model } from 'mongoose';

const HistoryEntrySchema = new Schema({
  user: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: String, required: true },
}, { _id: false });

const CommentSchema = new Schema({
  id: { type: String, required: true },
  user: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
}, { _id: false });

const TestResultFileSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
}, { _id: false });

const TestResultSchema = new Schema({
  testId: { type: String, required: true },
  status: { type: String, required: true, enum: ['not_sent', 'pending', 'passed', 'failed', 'review', 'submitted'] },
  score: { type: Number },
  notes: { type: String },
  sentDate: { type: String },
  deadlineHours: { type: Number },
  file: { type: TestResultFileSchema },
  resultUrl: { type: String },
}, { _id: false });

const CandidateSchema = new Schema({
    _id: { type: String, required: true }, // Use 'id' from frontend as '_id'
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    position: { type: String, required: true },
    stage: { type: String, required: true },
    source: { type: String },
    rating: { type: Number, default: 0 },
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
    // Ensure that when converting to JSON, '_id' becomes 'id' to match frontend expectations
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  });

export const CandidateModel = model('Candidate', CandidateSchema);
