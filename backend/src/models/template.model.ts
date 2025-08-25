import mongoose, { Document, Schema, Model } from 'mongoose';

interface TemplateProperties {
    name: string;
    content: string;
    type: 'email' | 'whatsapp';
    stageId?: string;
}

export interface ITemplate extends TemplateProperties, Document {}

const TemplateSchema = new Schema<ITemplate>({
    name: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, required: true, enum: ['email', 'whatsapp'] },
    stageId: { type: String },
}, {
    versionKey: false,
    timestamps: true
});

TemplateSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
    }
});

const TemplateModel: Model<ITemplate> = mongoose.model<ITemplate>('Template', TemplateSchema);

export default TemplateModel;
