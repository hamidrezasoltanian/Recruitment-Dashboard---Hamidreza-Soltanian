
import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// --- Main User Interface ---
interface UserProperties {
  username: string;
  name: string;
  email?: string;
  password?: string;
  isAdmin: boolean;
  settings?: {
    kanbanBackground?: string;
  };
}

export interface IUser extends UserProperties, Document {
    _id: any;
    comparePassword(password: string): Promise<boolean>;
}

// --- Mongoose Schema ---
const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true, select: false }, // 'select: false' prevents password from being returned by default
    isAdmin: { type: Boolean, default: false },
    settings: {
        kanbanBackground: { type: String, default: '' }
    }
}, {
    versionKey: false,
    timestamps: true
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

// Transform output to remove password and use 'id'
UserSchema.set('toJSON', {
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.password;
  }
});


const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default UserModel;