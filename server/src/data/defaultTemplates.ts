export type SeedTemplate = {
  id: string;
  name: string;
  type: string;
  stageId?: string | null;
  content: string;
};

const contactSign =
  `\n\nبا آرزوی بهترین‌ها،\nتیم جذب و استخدام {{companyName}}\nوب‌سایت: {{companyWebsite}}\nآدرس: {{companyAddress}}\nتلفن: {{companyPhone}}`;

export const DEFAULT_TEMPLATES: SeedTemplate[] = [
  {
    id: 'tpl_inbox_email',
    name: 'ایمیل تأیید دریافت رزومه',
    type: 'email',
    stageId: 'inbox',
    content:
`سلام {{candidateName}} عزیز،

از اینکه برای موقعیت «{{position}}» به ما اعتماد کردید و رزومه‌تان را ارسال کردید، صمیمانه ممنونیم.

رزومه شما را دریافت کردیم و در صف بررسی تیم جذب قرار گرفته است. به‌محض تکمیل بررسی اولیه، نتیجه را از همین طریق به شما اطلاع می‌دهیم.

اگر سوالی داشتید، خوشحال می‌شویم از طریق همین ایمیل با ما در ارتباط باشید.` + contactSign,
  },
  {
    id: 'tpl_review_email',
    name: 'ایمیل اطلاع بررسی رزومه',
    type: 'email',
    stageId: 'review',
    content:
`سلام {{candidateName}} عزیز،

امیدواریم حالتان خوب باشد.

رزومه شما برای موقعیت «{{position}}» وارد مرحله بررسی دقیق‌تر شده است. به‌محض مشخص شدن نتیجه این مرحله، حتماً خبر می‌دهیم.

ممنون از صبر و همراهی‌تان.` + contactSign,
  },
  {
    id: 'tpl_interview-1_email',
    name: 'ایمیل دعوت به مصاحبه اول',
    type: 'email',
    stageId: 'interview-1',
    content:
`سلام {{candidateName}} عزیز،

خبر خوبی داریم؛ رزومه شما برای موقعیت «{{position}}» بررسی شد و مایلیم شما را به مصاحبه اول دعوت کنیم.

زمان پیشنهادی مصاحبه:
📅 تاریخ: {{interviewDate}}
🕐 ساعت: {{interviewTime}}

اگر این زمان برای شما مناسب است، لطفاً حضور خود را تأیید کنید. در غیر این صورت، چند بازه جایگزین پیشنهاد دهید تا هماهنگ کنیم.` + contactSign,
  },
  {
    id: 'tpl_interview-2_email',
    name: 'ایمیل دعوت به مصاحبه دوم',
    type: 'email',
    stageId: 'interview-2',
    content:
`سلام {{candidateName}} عزیز،

از گفت‌وگوی مرحله قبل ممنونیم.

مایلیم شما را به مصاحبه دوم دعوت کنیم تا جزئیات بیشتری از همکاری را با هم مرور کنیم.

زمان پیشنهادی:
📅 تاریخ: {{interviewDate}}
🕐 ساعت: {{interviewTime}}

لطفاً حضور خود را تأیید بفرمایید یا در صورت تداخل زمانی، جایگزین پیشنهاد دهید.` + contactSign,
  },
  {
    id: 'tpl_test_email',
    name: 'ایمیل دعوت به آزمون',
    type: 'email',
    stageId: 'test',
    content:
`سلام {{candidateName}} عزیز،

از همراهی شما در مراحل قبلی سپاسگزاریم.

برای ادامه فرایند جذب در موقعیت «{{position}}»، مایلیم شما را به مرحله آزمون دعوت کنیم. جزئیات آزمون (لینک، مهلت و راهنما) به‌زودی برای شما ارسال می‌شود.

لطفاً آزمون را در بازه اعلام‌شده تکمیل کنید. اگر سوالی داشتید، همین‌جا بپرسید.` + contactSign,
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

اگر آماده‌اید وارد مرحله هماهنگی شوید، لطفاً همین پیام را پاسخ دهید تا زمان گفت‌وگوی پیشنهاد همکاری را تنظیم کنیم.` + contactSign,
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

برای شما بهترین‌ها را آرزو می‌کنیم.` + contactSign,
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

ممنون از علاقه‌مندی‌تان.` + contactSign,
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

منتظر دیدار شما هستیم. اگر نیاز به تغییر زمان داشتید، لطفاً زودتر خبر دهید.` + contactSign,
  },

  {
    id: 'tpl_inbox_whatsapp',
    name: 'واتساپ تأیید دریافت رزومه',
    type: 'whatsapp',
    stageId: 'inbox',
    content:
`سلام {{candidateName}} عزیز 👋

رزومه شما برای موقعیت «{{position}}» در {{companyName}} دریافت شد و در صف بررسی قرار گرفت.

به‌محض مشخص شدن نتیجه بررسی اولیه، خبر می‌دهیم.` + contactSign,
  },
  {
    id: 'tpl_review_whatsapp',
    name: 'واتساپ اطلاع بررسی رزومه',
    type: 'whatsapp',
    stageId: 'review',
    content:
`سلام {{candidateName}} عزیز

رزومه شما برای «{{position}}» الان در مرحله بررسی است و توسط تیم بررسی می‌شود. به‌زودی نتیجه را به شما می‌گوییم.` + contactSign,
  },
  {
    id: 'tpl_interview-1_whatsapp',
    name: 'واتساپ دعوت به مصاحبه اول',
    type: 'whatsapp',
    stageId: 'interview-1',
    content:
`سلام {{candidateName}} عزیز 🌟

خبر خوب: برای موقعیت «{{position}}» به مصاحبه اول دعوت شدید.

📅 {{interviewDate}}
🕐 {{interviewTime}}

لطفاً حضور خود را تأیید کنید. اگر زمان مناسب نبود، جایگزین پیشنهاد دهید.` + contactSign,
  },
  {
    id: 'tpl_interview-2_whatsapp',
    name: 'واتساپ دعوت به مصاحبه دوم',
    type: 'whatsapp',
    stageId: 'interview-2',
    content:
`سلام {{candidateName}} عزیز

از مصاحبه قبلی ممنونیم. مایلیم شما را به مصاحبه دوم دعوت کنیم.

📅 {{interviewDate}}
🕐 {{interviewTime}}

لطفاً تأیید حضور بدهید یا زمان جایگزین پیشنهاد کنید.` + contactSign,
  },
  {
    id: 'tpl_test_whatsapp',
    name: 'واتساپ دعوت به آزمون',
    type: 'whatsapp',
    stageId: 'test',
    content:
`سلام {{candidateName}} عزیز

برای ادامه فرایند «{{position}}»، وارد مرحله آزمون می‌شوید. جزئیات آزمون به‌زودی ارسال می‌شود؛ لطفاً در مهلت اعلام‌شده تکمیل کنید.

اگر سوالی بود بپرسید.` + contactSign,
  },
  {
    id: 'tpl_hired_whatsapp',
    name: 'واتساپ پیشنهاد همکاری (Offer)',
    type: 'whatsapp',
    stageId: 'hired',
    content:
`سلام {{candidateName}} عزیز 🎉

خوشحالیم بگوییم برای موقعیت «{{position}}» در {{companyName}} پیشنهاد همکاری داریم.

به‌زودی جزئیات پیشنهاد همکاری را هماهنگ می‌کنیم. اگر آماده‌اید، همین پیام را پاسخ دهید.` + contactSign,
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

برای شما بهترین‌ها را آرزو می‌کنیم.` + contactSign,
  },
  {
    id: 'tpl_archived_whatsapp',
    name: 'واتساپ نگهداری در بانک استعداد',
    type: 'whatsapp',
    stageId: 'archived',
    content:
`سلام {{candidateName}} عزیز

رزومه شما برای «{{position}}» در بانک استعدادهای {{companyName}} نگهداری شد. اگر فرصت مناسبی باز شد، خبر می‌دهیم.` + contactSign,
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

منتظر شما هستیم. اگر نیاز به تغییر زمان دارید، زودتر بگویید.` + contactSign
  },
];
