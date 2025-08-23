import mongoose from 'mongoose';
import process from 'process';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('❌ MONGODB_URI is not defined in .env file.');
            process.exit(1);
        }
        
        await mongoose.connect(mongoURI);
        
        console.log('✅ Connected to MongoDB successfully.');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};