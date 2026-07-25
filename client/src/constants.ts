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

const emailSign =
  `\n\nبا آرزوی بهترین‌ها،\nتیم جذب و استخدام {{companyName}}\nوب‌سایت: {{companyWebsite}}`;

const waSign =
  `\n\nبا آرزوی بهترین‌ها\nتیم جذب و استخدام {{companyName}}\n{{companyWebsite}}`;

export const DEFAULT_TEMPLATES: Template[] = [
  // --- Email ---
  {
    id: 'tpl_inbox_email',
    name: 'ایمیل تأیید دریافت رزومه',
    type: 'email',
    stageId: 'inbox',
    content:
`سلام {{candidateName}} عزیز،

از اینکه برای موقعیت «{{position}}» به ما اعتماد کردید و رزومه‌تان را ارسال کردید، صمیمانه ممنونیم.

رزومه شما را دریافت کردیم و در صف بررسی تیم جذب قرار گرفته است. به‌محض تکمیل بررسی اولیه، نتیجه را از همین طریق به شما اطلاع می‌دهیم.

اگر سوالی داشتید، خوشحال می‌شویم از طریق همین ایمیل یا وب‌سایت شرکت با ما در ارتباط باشید:
{{companyWebsite}}` + emailSign,
  },
  {
    id: 'tpl_review_email',
    name: 'ایمیل اطلاع بررسی رزومه',
    type: 'email',
    stageId: 'review',
    content:
`سلام {{candidateName}} عزیز،

امیدواریم حالتان خوب باشد.

رزومه شما برای موقعیت «{{position}}» وارد مرحله «{{stageName}}» شده و در حال بررسی دقیق‌تر توسط تیم ماست. به‌محض مشخص شدن نتیجه این مرحله، حتماً خبر می‌دهیم.

ممنون از صبر و همراهی‌تان.
اطلاعات بیشتر درباره ما: {{companyWebsite}}` + emailSign,
  },
  {
    id: 'tpl_interview-1_email',
    name: 'ایمیل دعوت به مصاحبه اول',
    type: 'email',
    stageId: 'interview-1',
    content:
`سلام {{candidateName}} عزیز،

خبر خوبی داریم؛ رزومه شما برای موقعیت «{{position}}» بررسی شد و مایلیم شما را به «{{stageName}}» دعوت کنیم.

زمان پیشنهادی مصاحبه:
📅 تاریخ: {{interviewDate}}
🕐 ساعت: {{interviewTime}}
📍 محل: {{companyAddress}}

اگر این زمان برای شما مناسب است، لطفاً حضور خود را تأیید کنید. در غیر این صورت، چند بازه جایگزین پیشنهاد دهید تا هماهنگ کنیم.

آشنایی بیشتر با ما: {{companyWebsite}}` + emailSign,
  },
  {
    id: 'tpl_interview-2_email',
    name: 'ایمیل دعوت به مصاحبه دوم',
    type: 'email',
    stageId: 'interview-2',
    content:
`سلام {{candidateName}} عزیز،

از گفت‌وگوی مرحله قبل ممنونیم؛ بازخورد خوبی از مصاحبه اولیه داشتیم.

مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم تا جزئیات بیشتری از همکاری را با هم مرور کنیم.

زمان پیشنهادی:
📅 تاریخ: {{interviewDate}}
🕐 ساعت: {{interviewTime}}
📍 محل: {{companyAddress}}

لطفاً حضور خود را تأیید بفرمایید یا در صورت تداخل زمانی، جایگزین پیشنهاد دهید.

{{companyWebsite}}` + emailSign,
  },
  {
    id: 'tpl_test_email',
    name: 'ایمیل دعوت به آزمون',
    type: 'email',
    stageId: 'test',
    content:
`سلام {{candidateName}} عزیز،

از همراهی شما در مراحل قبلی سپاسگزاریم.

برای ادامه فرایند جذب در موقعیت «{{position}}»، مایلیم شما را به مرحله «{{stageName}}» دعوت کنیم. جزئیات آزمون (لینک، مهلت و راهنما) به‌زودی برای شما ارسال می‌شود.

لطفاً آزمون را در بازه اعلام‌شده تکمیل کنید. اگر سوالی داشتید، همین‌جا بپرسید.

{{companyWebsite}}` + emailSign,
  },
  {
    id: 'tpl_hired_email',
    name: 'ایمیل پیشنهاد همکاری (Offer)',
    type: 'email',
    stageId: 'hired',
    content:
`سلام {{candidateName}} عزیز،

خوشحالیم که این خبر را با شما در میان می‌گذاریم.

پس از طی مراحل جذب برای موقعیت «{{position}}»، مایلیم پیشنهاد همکاری رسمی در {{companyName}} را به شما ارائه کنیم. جزئیات پیشنهاد (شروع همکاری، شرایط و هماهنگی‌های بعدی) را به‌زودی با شما نهایی می‌کنیم.

اگر آماده‌اید وارد مرحله هماهنگی شوید، لطفاً همین پیام را پاسخ دهید تا زمان گفت‌وگوی Offer را تنظیم کنیم.

وب‌سایت ما: {{companyWebsite}}` + emailSign,
  },
  {
    id: 'tpl_rejected_email',
    name: 'ایمیل اعلام نتیجه منفی',
    type: 'email',
    stageId: 'rejected',
    content:
`سلام {{candidateName}} عزیز،

از وقتی که برای فرایند جذب موقعیت «{{position}}» گذاشتید، صمیمانه سپاسگزاریم.

پس از بررسی، در این مرحله امکان ادامه همکاری برای این موقعیت فراهم نشد. این تصمیم لزوماً به‌معنای ارزیابی منفی از توانمندی شما نیست؛ گاهی انتخاب بر اساس تناسب دقیق‌تر با نیاز فعلی تیم انجام می‌شود.

رزومه شما در بانک استعدادهای ما می‌ماند و اگر فرصت مناسب‌تری پیش آمد، خوشحال می‌شویم دوباره در تماس باشیم.

برای شما بهترین‌ها را آرزو می‌کنیم.
{{companyWebsite}}` + emailSign,
  },
  {
    id: 'tpl_archived_email',
    name: 'ایمیل نگهداری در بانک استعداد',
    type: 'email',
    stageId: 'archived',
    content:
`سلام {{candidateName}} عزیز،

رزومه شما برای موقعیت «{{position}}» در بانک استعدادهای {{companyName}} نگهداری شد.

اگر در آینده فرصت شغلی متناسبی باز شد، از همین مسیر با شما در ارتباط خواهیم بود.

ممنون از علاقه‌مندی‌تان.
{{companyWebsite}}` + emailSign,
  },
  {
    id: 'tpl_email_invite_reminder',
    name: 'ایمیل یادآوری مصاحبه',
    type: 'email',
    content:
`سلام {{candidateName}} عزیز،

این پیام فقط یک یادآوری دوستانه برای جلسه مصاحبه شماست.

موقعیت: «{{position}}»
📅 تاریخ: {{interviewDate}}
🕐 ساعت: {{interviewTime}}
📍 محل: {{companyAddress}}

منتظر دیدار شما هستیم. اگر نیاز به تغییر زمان داشتید، لطفاً زودتر خبر دهید.

{{companyWebsite}}` + emailSign,
  },

  // --- WhatsApp ---
  {
    id: 'tpl_inbox_whatsapp',
    name: 'واتساپ تأیید دریافت رزومه',
    type: 'whatsapp',
    stageId: 'inbox',
    content:
`سلام {{candidateName}} عزیز 👋

رزومه شما برای موقعیت «{{position}}» در {{companyName}} دریافت شد و در صف بررسی قرار گرفت.

به‌محض مشخص شدن نتیجه بررسی اولیه، خبر می‌دهیم.
وب‌سایت: {{companyWebsite}}` + waSign,
  },
  {
    id: 'tpl_review_whatsapp',
    name: 'واتساپ اطلاع بررسی رزومه',
    type: 'whatsapp',
    stageId: 'review',
    content:
`سلام {{candidateName}} عزیز

رزومه شما برای «{{position}}» الان در مرحله «{{stageName}}» است و توسط تیم بررسی می‌شود. به‌زودی نتیجه را بهتان می‌گوییم.

{{companyWebsite}}` + waSign,
  },
  {
    id: 'tpl_interview-1_whatsapp',
    name: 'واتساپ دعوت به مصاحبه اول',
    type: 'whatsapp',
    stageId: 'interview-1',
    content:
`سلام {{candidateName}} عزیز 🌟

خبر خوب: برای موقعیت «{{position}}» به «{{stageName}}» دعوت شدید.

📅 {{interviewDate}}
🕐 {{interviewTime}}
📍 {{companyAddress}}

لطفاً حضور خود را تأیید کنید. اگر زمان مناسب نبود، جایگزین پیشنهاد دهید.
{{companyWebsite}}` + waSign,
  },
  {
    id: 'tpl_interview-2_whatsapp',
    name: 'واتساپ دعوت به مصاحبه دوم',
    type: 'whatsapp',
    stageId: 'interview-2',
    content:
`سلام {{candidateName}} عزیز

از مصاحبه قبلی ممنونیم. مایلیم شما را به «{{stageName}}» دعوت کنیم.

📅 {{interviewDate}}
🕐 {{interviewTime}}
📍 {{companyAddress}}

لطفاً تأیید حضور بدهید یا زمان جایگزین پیشنهاد کنید.
{{companyWebsite}}` + waSign,
  },
  {
    id: 'tpl_test_whatsapp',
    name: 'واتساپ دعوت به آزمون',
    type: 'whatsapp',
    stageId: 'test',
    content:
`سلام {{candidateName}} عزیز

برای ادامه فرایند «{{position}}»، وارد مرحله «{{stageName}}» می‌شوید. جزئیات آزمون به‌زودی ارسال می‌شود؛ لطفاً در مهلت اعلام‌شده تکمیلش کنید.

سوالی بود بپرسید 🙂
{{companyWebsite}}` + waSign,
  },
  {
    id: 'tpl_hired_whatsapp',
    name: 'واتساپ پیشنهاد همکاری (Offer)',
    type: 'whatsapp',
    stageId: 'hired',
    content:
`سلام {{candidateName}} عزیز 🎉

خوشحالیم بگوییم برای موقعیت «{{position}}» در {{companyName}} پیشنهاد همکاری داریم.

به‌زودی جزئیات Offer را هماهنگ می‌کنیم. اگر آماده‌اید، همین پیام را پاسخ دهید.

{{companyWebsite}}` + waSign,
  },
  {
    id: 'tpl_rejected_whatsapp',
    name: 'واتساپ اعلام نتیجه منفی',
    type: 'whatsapp',
    stageId: 'rejected',
    content:
`سلام {{candidateName}} عزیز

از وقتی که برای موقعیت «{{position}}» گذاشتید ممنونیم.

متأسفانه در این مرحله امکان ادامه همکاری برای این موقعیت فراهم نشد. رزومه شما در بانک استعدادهای ما می‌ماند و اگر فرصت مناسب‌تری پیش آمد، دوباره در تماس خواهیم بود.

براتون بهترین‌ها رو آرزو می‌کنیم.
{{companyWebsite}}` + waSign,
  },
  {
    id: 'tpl_archived_whatsapp',
    name: 'واتساپ نگهداری در بانک استعداد',
    type: 'whatsapp',
    stageId: 'archived',
    content:
`سلام {{candidateName}} عزیز

رزومه شما برای «{{position}}» در بانک استعدادهای {{companyName}} نگهداری شد. اگر فرصت مناسبی باز شد، خبر می‌دهیم.

{{companyWebsite}}` + waSign,
  },
  {
    id: 'tpl_whatsapp_invite_reminder',
    name: 'واتساپ یادآوری مصاحبه',
    type: 'whatsapp',
    content:
`سلام {{candidateName}} عزیز ⏰

یادآوری مصاحبه «{{position}}»:
📅 {{interviewDate}}
🕐 {{interviewTime}}
📍 {{companyAddress}}

منتظر شما هستیم. اگر نیاز به تغییر زمان دارید، زودتر بگویید.
{{companyWebsite}}` + waSign,
  },
];
