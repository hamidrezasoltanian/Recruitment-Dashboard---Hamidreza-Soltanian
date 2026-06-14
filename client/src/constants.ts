import { KanbanStage, Template, CompanyProfile, TestLibraryItem } from './types';

export const DEFAULT_STAGES: KanbanStage[] = [
  { id: 'inbox', title: 'صندوق ورودی', isCore: true },
  { id: 'review', title: 'در حال بررسی', isCore: false },
  { id: 'interview-1', title: 'مصاحبه اول', isCore: false },
  { id: 'interview-2', title: 'مصاحبه دوم', isCore: false },
  { id: 'test', title: 'آزمون', isCore: false },
  { id: 'hired', title: 'استخدام شده', isCore: true },
  { id: 'rejected', title: 'رد شده', isCore: true },
];

export const ARCHIVE_STAGE_ID = 'archived';

export const DEFAULT_SOURCES: string[] = ['لینکدین', 'جابینجا', 'ای-استخدام', 'سایت شرکت', 'معرفی‌شده', 'سایر'];

export const SETTINGS_KEY_SOURCES = 'recruitment_sources_v1';
export const STAGES_KEY = 'recruitment_stages_v1';
export const TEMPLATES_KEY = 'recruitment_templates_v1';
export const COMPANY_PROFILE_KEY = 'recruitment_company_profile_v1';
export const TEST_LIBRARY_KEY = 'recruitment_test_library_v1';

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


const emailFooter = `\n\nبا احترام،\nتیم استخدام {{companyName}}\n{{companyWebsite}}`;
const whatsappFooter = `\n\nبا احترام،\nتیم استخدام {{companyName}}`;

export const DEFAULT_TEMPLATES: Template[] = [
    // --- Email Templates ---
    {
        id: 'tpl_inbox_email',
        name: 'ایمیل دریافت رزومه (صندوق ورودی)',
        type: 'email',
        stageId: 'inbox',
        content: `سلام {{candidateName}} عزیز،\n\nرزومه شما برای موقعیت شغلی «{{position}}» در شرکت {{companyName}} دریافت شد.\n\nرزومه شما در حال بررسی است و به زودی نتیجه را به شما اطلاع خواهیم داد.\n\nاز صبر و شکیبایی شما متشکریم.` + emailFooter
    },
    {
        id: 'tpl_review_email',
        name: 'ایمیل اطلاع‌رسانی انتقال به بررسی',
        type: 'email',
        stageId: 'review',
        content: `سلام {{candidateName}} عزیز،\n\nجهت اطلاع، رزومه شما برای موقعیت شغلی «{{position}}» دریافت شد و در حال حاضر در مرحله «{{stageName}}» قرار دارد.\n\nبه زودی نتیجه بررسی را به شما اطلاع خواهیم داد.` + emailFooter
    },
    {
        id: 'tpl_interview-1_email',
        name: 'ایمیل دعوت به مصاحبه اول',
        type: 'email',
        stageId: 'interview-1',
        content: `سلام {{candidateName}} عزیز،\n\nخبر خوبی داریم! رزومه شما برای موقعیت «{{position}}» بررسی شد و مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم.\n\nزمان مصاحبه شما برای تاریخ {{interviewDate}} ساعت {{interviewTime}} در محل شرکت به آدرس زیر تنظیم شده است:\n{{companyAddress}}\n\nلطفا در صورت امکان، حضور خود را تایید بفرمایید.` + emailFooter
    },
    {
        id: 'tpl_interview-2_email',
        name: 'ایمیل دعوت به مصاحبه دوم (فنی/نهایی)',
        type: 'email',
        stageId: 'interview-2',
        content: `سلام {{candidateName}} عزیز،\n\nممنون از حضور شما در مصاحبه اولیه. مایلیم شما را برای مرحله بعدی، «{{stageName}}»، دعوت کنیم.\n\nزمان مصاحبه بعدی شما برای تاریخ {{interviewDate}} ساعت {{interviewTime}} در محل شرکت به آدرس زیر تنظیم شده است:\n{{companyAddress}}\n\nلطفا در صورت امکان، حضور خود را تایید بفرمایید.` + emailFooter
    },
    {
        id: 'tpl_test_email',
        name: 'ایمیل دعوت به آزمون',
        type: 'email',
        stageId: 'test',
        content: `سلام {{candidateName}} عزیز،\n\nممنون از حضور شما در مصاحبه‌ها. حالا مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم.\n\nلطفا آزمون‌های مربوطه را در زمان مشخص شده تکمیل کنید. اطلاعات آزمون به زودی برای شما ارسال خواهد شد.\n\nموفق باشید!` + emailFooter
    },
    {
        id: 'tpl_hired_email',
        name: 'ایمیل استخدام (پیشنهاد شغلی)',
        type: 'email',
        stageId: 'hired',
        content: `سلام {{candidateName}} عزیز،\n\nامیدوارم حالت عالی باشه.\n\nبا خوشحالی بهت اطلاع می‌دیم که مراحل مصاحبه رو با موفقیت پشت سر گذاشتی و مایلیم موقعیت شغلی «{{position}}» رو در شرکت {{companyName}} به شما پیشنهاد بدیم.\n\nبه زودی برای هماهنگی جزئیات بیشتر با شما تماس می‌گیریم.` + emailFooter
    },
    {
        id: 'tpl_rejected_email',
        name: 'ایمیل رد درخواست',
        type: 'email',
        stageId: 'rejected',
        content: `سلام {{candidateName}} عزیز،\n\nاز ارسال رزومه شما برای موقعیت شغلی «{{position}}» در شرکت {{companyName}} متشکریم.\n\nمتاسفانه در این مرحله امکان همکاری با شما وجود ندارد. اما رزومه شما در آرشیو ما نگهداری می‌شود و در صورت وجود فرصت‌های مناسب در آینده، با شما تماس خواهیم گرفت.\n\nموفق باشید.` + emailFooter
    },
    {
        id: 'tpl_archived_email',
        name: 'ایمیل آرشیو شدن',
        type: 'email',
        stageId: 'archived',
        content: `سلام {{candidateName}} عزیز،\n\nرزومه شما برای موقعیت شغلی «{{position}}» در آرشیو ما قرار گرفت.\n\nدر صورت وجود فرصت‌های شغلی مناسب در آینده، با شما تماس خواهیم گرفت.\n\nموفق باشید.` + emailFooter
    },
    {
        id: 'tpl_email_invite_reminder',
        name: 'ایمیل یادآوری مصاحبه',
        type: 'email',
        content: `سلام {{candidateName}} عزیز،\n\nاین یک پیام یادآوری برای جلسه مصاحبه شما برای موقعیت شغلی «{{position}}» است.\n\nزمان مصاحبه: {{interviewDate}} ساعت {{interviewTime}}\nمکان: {{companyAddress}}\n\nمنتظر دیدار شما هستیم.` + emailFooter
    },
    // --- WhatsApp Templates ---
    {
        id: 'tpl_inbox_whatsapp',
        name: 'واتسپ دریافت رزومه (صندوق ورودی)',
        type: 'whatsapp',
        stageId: 'inbox',
        content: `سلام {{candidateName}} عزیز 👋\n\nرزومه شما برای موقعیت «{{position}}» در شرکت {{companyName}} دریافت شد.\n\nرزومه شما در حال بررسی است و به زودی نتیجه را به شما اطلاع می‌دهیم.\n\nاز صبر و شکیبایی شما متشکریم.` + whatsappFooter
    },
    {
        id: 'tpl_review_whatsapp',
        name: 'واتسپ اطلاع‌رسانی انتقال به بررسی',
        type: 'whatsapp',
        stageId: 'review',
        content: `سلام {{candidateName}} عزیز. جهت اطلاع، رزومه شما برای موقعیت «{{position}}» در شرکت {{companyName}} دریافت شد و در مرحله «{{stageName}}» قرار دارد. به زودی نتیجه را به شما اطلاع می‌دهیم.` + whatsappFooter
    },
    {
        id: 'tpl_interview-1_whatsapp',
        name: 'واتسپ دعوت به مصاحبه اول',
        type: 'whatsapp',
        stageId: 'interview-1',
        content: `سلام {{candidateName}} عزیز. خبر خوبی داریم! 🎉\n\nرزومه شما برای موقعیت «{{position}}» بررسی شد و مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم.\n\nزمان مصاحبه شما: {{interviewDate}} ساعت {{interviewTime}}\nمکان: {{companyAddress}}\n\nلطفا حضور خود را تایید بفرمایید.` + whatsappFooter
    },
    {
        id: 'tpl_interview-2_whatsapp',
        name: 'واتسپ دعوت به مصاحبه دوم',
        type: 'whatsapp',
        stageId: 'interview-2',
        content: `سلام {{candidateName}} عزیز. ممنون از حضور شما در مصاحبه اولیه. مایلیم شما را برای مرحله بعدی، «{{stageName}}»، دعوت کنیم.\n\nزمان مصاحبه بعدی: {{interviewDate}} ساعت {{interviewTime}}\nمکان: {{companyAddress}}\n\nلطفا حضور خود را تایید بفرمایید.` + whatsappFooter
    },
    {
        id: 'tpl_test_whatsapp',
        name: 'واتسپ دعوت به آزمون',
        type: 'whatsapp',
        stageId: 'test',
        content: `سلام {{candidateName}} عزیز. ممنون از حضور شما در مصاحبه‌ها.\n\nحالا مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم.\n\nلطفا آزمون‌های مربوطه را در زمان مشخص شده تکمیل کنید. اطلاعات آزمون به زودی برای شما ارسال خواهد شد.\n\nموفق باشید! 🍀` + whatsappFooter
    },
    {
        id: 'tpl_hired_whatsapp',
        name: 'واتسپ پیشنهاد شغلی',
        type: 'whatsapp',
        stageId: 'hired',
        content: `سلام {{candidateName}} عزیز. تبریک! 🎉\n\nشما در فرایند استخدام ما در شرکت {{companyName}} برای موقعیت شغلی «{{position}}» پذیرفته شدید.\n\nبرای هماهنگی جزئیات بیشتر به زودی با شما تماس می‌گیریم.` + whatsappFooter
    },
    {
        id: 'tpl_rejected_whatsapp',
        name: 'واتسپ رد درخواست',
        type: 'whatsapp',
        stageId: 'rejected',
        content: `سلام {{candidateName}} عزیز.\n\nاز ارسال رزومه شما برای موقعیت «{{position}}» در شرکت {{companyName}} متشکریم.\n\nمتاسفانه در این مرحله امکان همکاری با شما وجود ندارد. اما رزومه شما در آرشیو ما نگهداری می‌شود.\n\nموفق باشید.` + whatsappFooter
    },
    {
        id: 'tpl_archived_whatsapp',
        name: 'واتسپ آرشیو شدن',
        type: 'whatsapp',
        stageId: 'archived',
        content: `سلام {{candidateName}} عزیز.\n\nرزومه شما برای موقعیت «{{position}}» در آرشیو ما قرار گرفت.\n\nدر صورت وجود فرصت‌های شغلی مناسب در آینده، با شما تماس خواهیم گرفت.\n\nموفق باشید.` + whatsappFooter
    },
    {
        id: 'tpl_whatsapp_invite_reminder',
        name: 'واتسپ یادآوری مصاحبه',
        type: 'whatsapp',
        content: `یادآوری مصاحبه: سلام {{candidateName}} عزیز. جلسه مصاحبه شما برای موقعیت «{{position}}» در تاریخ {{interviewDate}} ساعت {{interviewTime}} است. منتظر دیدار شما هستیم.` + whatsappFooter
    }
];