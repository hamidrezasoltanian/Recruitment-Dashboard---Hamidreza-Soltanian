
import mongoose from 'mongoose';
import process from 'process';

const getMongoURI = (): string => {
    // اولویت اول: اگر رشته اتصال کامل وجود دارد، از آن استفاده کن.
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }

    // اولویت دوم: رشته اتصال را از متغیرهای جداگانه بساز.
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const dbName = process.env.DB_NAME || 'recruitment_db';
    const user = process.env.DB_USER;
    const pass = process.env.DB_PASS;

    const credentials = user && pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : '';
    
    return `mongodb://${credentials}${host}:${port}/${dbName}`;
};


export const connectDB = async () => {
    try {
        const mongoURI = getMongoURI();
        
        // نمایش آدرس اتصال برای دیباگ (بدون نمایش رمز عبور)
        console.log(`🚀 Attempting to connect to MongoDB at: ${mongoURI.replace(/:([^@]+)@/, ':<password>@')}`);

        await mongoose.connect(mongoURI);
        
        console.log('✅ Connected to MongoDB successfully.');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        // خروج از برنامه در صورت عدم موفقیت در اتصال به دیتابیس
        process.exit(1);
    }
};