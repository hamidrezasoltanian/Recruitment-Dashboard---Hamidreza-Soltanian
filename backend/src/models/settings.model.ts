import mongoose, { Document, Schema, Model } from 'mongoose';

// --- Interfaces for Sub-documents ---
interface IJobPosition {
    id: string;
    title: string;
}

interface ICompanyProfile {
    name: string;
    website: string;
    address: string;
    jobPositions: IJobPosition[];
}

interface IKanbanStage {
    id: string;
    title: string;
    isCore?: boolean;
}

interface ITestLibraryItem {
    id: string;
    name: string;
    url: string;
}

// --- Main Settings Interface ---
interface SettingsProperties {
    sources: string[];
    stages: IKanbanStage[];
    companyProfile: ICompanyProfile;
    testLibrary: ITestLibraryItem[];
}

export interface ISettings extends SettingsProperties, Document {}


// --- Mongoose Schemas ---
const JobPositionSchema = new Schema<IJobPosition>({
    id: { type: String, required: true },
    title: { type: String, required: true },
}, { _id: false });

const CompanyProfileSchema = new Schema<ICompanyProfile>({
    name: { type: String, required: true },
    website: { type: String, required: true },
    address: { type: String, required: true },
    jobPositions: { type: [JobPositionSchema], default: [] },
}, { _id: false });

const KanbanStageSchema = new Schema<IKanbanStage>({
    id: { type: String, required: true },
    title: { type: String, required: true },
    isCore: { type: Boolean, default: false },
}, { _id: false });

const TestLibraryItemSchema = new Schema<ITestLibraryItem>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
}, { _id: false });

const SettingsSchema = new Schema<ISettings>({
    sources: { type: [String], required: true },
    stages: { type: [KanbanStageSchema], required: true },
    companyProfile: { type: CompanyProfileSchema, required: true },
    testLibrary: { type: [TestLibraryItemSchema], required: true },
}, {
    versionKey: false
});

const SettingsModel: Model<ISettings> = mongoose.model<ISettings>('Setting', SettingsSchema);

export default SettingsModel;
