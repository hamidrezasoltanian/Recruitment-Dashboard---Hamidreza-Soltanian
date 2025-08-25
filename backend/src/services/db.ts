import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('❌ MONGODB_URI is not defined in .env file.');
            throw new Error('MONGODB_URI is not defined in the environment variables.');
        }
        
        await mongoose.connect(mongoURI);
        
        console.log('✅ Connected to MongoDB successfully.');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        // Re-throwing the error will cause the startServer promise to reject, stopping the app.
        throw error;
    }
};