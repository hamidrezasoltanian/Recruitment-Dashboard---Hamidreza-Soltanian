// This file contains default settings values used by the backend,
// especially when initializing the settings collection for the first time.
// It decouples the backend from the frontend's source code.

// --- KanbanStage ---
interface KanbanStage {
  id: string;
  title: string;
  isCore?: boolean;
}

export const DEFAULT_STAGES: KanbanStage[] = [
  { id: 'inbox', title: 'صندوق ورودی', isCore: true },
  { id: 'review', title: 'در حال بررسی', isCore: false },
  { id: 'interview-1', title: 'مصاحبه اول', isCore: false },
  { id: 'interview-2', title: 'مصاحبه دوم', isCore: false },
  { id: 'test', title: 'آزمون', isCore: false },
  { id: 'hired', title: 'استخدام شده', isCore: true },
  { id: 'rejected', title: 'رد شده', isCore: true },
];

// --- Sources ---
export const DEFAULT_SOURCES: string[] = ['لینکدین', 'جابینجا', 'ای-استخدام', 'سایت شرکت', 'معرفی‌شده', 'سایر'];

// --- Company Profile ---
interface JobPosition {
  id: string;
  title: string;
}

interface CompanyProfile {
  name: string;
  website: string;
  address: string;
  jobPositions: JobPosition[];
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: "شرکت شما",
  website: "https://yourcompany.com",
  address: "آدرس شرکت شما",
  jobPositions: [
    { id: 'job_1', title: 'توسعه‌دهنده ارشد React' },
    { id: 'job_2', title: 'مدیر محصول' },
    { id: 'job_3', title: 'کارشناس بازاریابی دیجیتال' }
  ],
};

// --- Test Library ---
interface TestLibraryItem {
  id: string;
  name: string;
  url: string;
}

export const DEFAULT_TEST_LIBRARY: TestLibraryItem[] = [
  { id: 'test-1', name: "تست کهن‌الگو", url: "https://socianttest.com/archetype/" },
  { id: 'test-2', name: "تست MBTI", url: "https://socianttest.com/mbti/" },
  { id: 'test-3', name: "تست هوش هیجانی EQ", url: "https://socianttest.com/emotional-intelligence-eq/" },
  { id: 'test-4', name: "تست هوش IQ RAVEN", url: "https://socianttest.com/raven-intelligence/" },
  { id: 'test-5', name: "تست طرحواره", url: "https://socianttest.com/tarhvare/" },
  { id: 'test-6', name: "تست DISC", url: "https://socianttest.com/disc/" },
  { id: 'test-7', name: "تست سبک حل تعارض", url: "https://socianttest.com/thomas-kilman-conflict-resolution-styles/" },
  { id: 'test-8', name: "تست شخصیت فروشنده", url: "https://socianttest.com/identification-of-the-personality-of-the-seller/" },
  { id: 'test-9', name: "تست تحلیل رفتار متقابل", url: "https://socianttest.com/interaction-analysis/" },
  { id: 'test-10', name: "تست نئو", url: "https://socianttest.com/neo/" }
];
