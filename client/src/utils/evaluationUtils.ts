export type JobCategory = 'tech' | 'sales' | 'sales_support' | 'accounting' | 'product' | 'other';

export interface DocsChecklist {
  nationalId: boolean;
  resumeVerified: boolean;
  portfolio: boolean;
  certificates: boolean;
  insurance: boolean;
  military: boolean;
}

export interface EvaluationHistoryEntry {
  evaluatorName: string;
  evaluatorUsername: string;
  updatedAt: string;
  totalScore?: number;
  finalDecision?: string;
  summary?: string;
}

export interface EvaluationAnswers {
  jobHopping: string;
  relevantExperience: string;
  resumeAccuracy: string;
  phoneEnergy: number;
  phoneRoutine: string;
  phoneScenario: string;
  requestedSalary: string;
  phoneResult: string;
  discDominant: string[];
  roleFit: string;
  starHonesty: number;
  starHonestyExample: string;
  starStress: number;
  starTeamwork: number;
  rolePlayAccuracy: string;
  rolePlaySpeed: string;
  referenceCheck: string;
  finalDecision: string;
  finalNotes: string;

  englishLevel: string;
  otherLanguages: string;
  workArrangement: string;
  city: string;
  noticePeriod: string;
  cultureFit: number;
  cultureFitNote: string;
  leaveReason: string;
  leaveReasonLogic: string;
  salaryFit: string;
  strengths: string;
  weaknesses: string;
  redFlags: string;
  docsChecklist: DocsChecklist;
  offerSalary: string;

  /** Optional free-text note; specialized scoring lives in interview panel */
  specializedNotes: string;

  // Organizational must / must-not & red-flag checks
  crisisWorkPresence: string;
  unpaidTrustMonthOk: string;
  externalMissionOk: string;
  overtimeFlexibility: string;
  confidentialityCommitment: string;
  hierarchyRespect: string;
  orgPolicyNotes: string;

  // legacy specialized fields kept for backward-compatible saved JSON
  supportFit: string;
  techKnowledge: number;
  techCodingQuality: number;
  techSystemDesign: number;
  techGitCollaboration: number;
  techProblemSolving: string;
  techTaskScore: string;
  salesNegotiation: number;
  salesMarketAnalysis: number;
  salesGoalOrientation: number;
  salesCustomerEmpathy: number;
  salesClosingAbility: number;
  salesScenarioPlay: string;
  productStrategy: number;
  productDesignSense: number;
  productLeadership: number;
  productDataAnalysis: number;
  productTechnicalUnderstanding: number;
  productCaseStudy: string;
  otherSkills: number;
  otherLearningSpeed: number;
  otherDetailOrientation: number;
  otherWrittenCommunication: number;
  otherProblemHandling: number;
  otherTaskResult: string;
}

export const EMPTY_DOCS: DocsChecklist = {
  nationalId: false,
  resumeVerified: false,
  portfolio: false,
  certificates: false,
  insurance: false,
  military: false,
};

export const EMPTY_ANSWERS: EvaluationAnswers = {
  jobHopping: '',
  relevantExperience: '',
  resumeAccuracy: '',
  phoneEnergy: 0,
  phoneRoutine: '',
  phoneScenario: '',
  requestedSalary: '',
  phoneResult: '',
  discDominant: [],
  roleFit: '',
  starHonesty: 0,
  starHonestyExample: '',
  starStress: 0,
  starTeamwork: 0,
  rolePlayAccuracy: '',
  rolePlaySpeed: '',
  referenceCheck: '',
  finalDecision: '',
  finalNotes: '',
  englishLevel: '',
  otherLanguages: '',
  workArrangement: '',
  city: '',
  noticePeriod: '',
  cultureFit: 0,
  cultureFitNote: '',
  leaveReason: '',
  leaveReasonLogic: '',
  salaryFit: '',
  strengths: '',
  weaknesses: '',
  redFlags: '',
  docsChecklist: { ...EMPTY_DOCS },
  offerSalary: '',
  specializedNotes: '',
  crisisWorkPresence: '',
  unpaidTrustMonthOk: '',
  externalMissionOk: '',
  overtimeFlexibility: '',
  confidentialityCommitment: '',
  hierarchyRespect: '',
  orgPolicyNotes: '',
  supportFit: '',
  techKnowledge: 0,
  techCodingQuality: 0,
  techSystemDesign: 0,
  techGitCollaboration: 0,
  techProblemSolving: '',
  techTaskScore: '',
  salesNegotiation: 0,
  salesMarketAnalysis: 0,
  salesGoalOrientation: 0,
  salesCustomerEmpathy: 0,
  salesClosingAbility: 0,
  salesScenarioPlay: '',
  productStrategy: 0,
  productDesignSense: 0,
  productLeadership: 0,
  productDataAnalysis: 0,
  productTechnicalUnderstanding: 0,
  productCaseStudy: '',
  otherSkills: 0,
  otherLearningSpeed: 0,
  otherDetailOrientation: 0,
  otherWrittenCommunication: 0,
  otherProblemHandling: 0,
  otherTaskResult: '',
};

const TRAFFIC: Record<string, number> = {
  hopping_green: 100,
  hopping_yellow: 55,
  hopping_red: 15,
  exp_green: 100,
  exp_yellow: 55,
  exp_red: 15,
  scen_green: 100,
  scen_yellow: 55,
  scen_red: 15,
  fit_green: 100,
  fit_yellow: 55,
  fit_red: 15,
  عالی: 100,
  متوسط: 55,
  ضعیف: 20,
  'بدون نقص': 100,
  'دارای خطای جزئی': 60,
  سریع: 100,
  کند: 30,
  in_budget: 100,
  negotiable: 60,
  out_of_budget: 25,
  beginner: 30,
  intermediate: 55,
  advanced: 80,
  fluent: 95,
  native: 100,
  yes_confirmed: 100,
  no_check: 50,
  negative_feedback: 10,
  // org policy
  crisis_yes: 100,
  crisis_partial: 45,
  crisis_no: 5,
  crisis_na: 70,
  trust_yes: 100,
  trust_negotiable: 40,
  trust_no: 5,
  mission_yes: 100,
  mission_conditional: 55,
  mission_no: 10,
  overtime_yes: 100,
  overtime_limited: 55,
  overtime_no: 15,
  conf_yes: 100,
  conf_hesitant: 35,
  conf_no: 0,
  hierarchy_yes: 100,
  hierarchy_partial: 50,
  hierarchy_no: 10,
  leave_logical: 100,
  leave_questionable: 40,
  leave_red_flag: 5,
};

function starScore(n: number): number | null {
  if (!n || n <= 0) return null;
  return Math.min(5, n) * 20;
}

function trafficScore(v: string): number | null {
  if (!v) return null;
  return TRAFFIC[v] ?? null;
}

export function detectJobCategory(position: string = ''): JobCategory {
  const p = position.toLowerCase();

  if (/حسابدار|حسابداری|مالی|خزانه‌?دار|auditor|account|finance|مالیات|مودیان/.test(p)) {
    return 'accounting';
  }
  if (/پشتیبان\s*فروش|پشتیبانی\s*فروش|هماهنگ.?کننده\s*فروش|اداری\s*فروش|sales\s*support|order\s*desk/.test(p)) {
    return 'sales_support';
  }
  if (/sales|marketing|بازاریابی|کارشناس\s*فروش|ویزیتور|مارکتینگ|مذاکره/.test(p)) {
    return 'sales';
  }
  if (/react|developer|frontend|backend|\bit\b|tech|برنامه.?نویس|توسعه.?دهنده|نرم.?افزار|devops|qa/.test(p)) {
    return 'tech';
  }
  if (/product\s*manager|مدیر\s*محصول|طراح\s*محصول|ui\/?ux|گرافیک|دیزاینر/.test(p)) {
    return 'product';
  }
  return 'other';
}

export function getCategoryLabel(category: JobCategory | ''): string {
  switch (category) {
    case 'tech':
      return 'فنی';
    case 'sales':
      return 'فروش';
    case 'sales_support':
      return 'پشتیبان فروش';
    case 'accounting':
      return 'حسابداری / مالی';
    case 'product':
      return 'محصول';
    default:
      return 'عمومی';
  }
}

/** Critical org answers that count as hard red flags */
export function countOrgHardRedFlags(a: EvaluationAnswers, category: JobCategory | ''): string[] {
  const flags: string[] = [];
  if (a.crisisWorkPresence === 'crisis_no') flags.push('در بحران/جنگ سر کار نبوده');
  if (a.unpaidTrustMonthOk === 'trust_no') flags.push('با امانت‌ماندن یک‌ماه حقوق موافق نیست');
  if (category === 'sales' && a.externalMissionOk === 'mission_no') flags.push('ماموریت خارج سازمان را نمی‌پذیرد');
  if (a.confidentialityCommitment === 'conf_no') flags.push('تعهد محرمانگی ندارد');
  if (a.hierarchyRespect === 'hierarchy_no') flags.push('احترام به ساختار سازمانی ضعیف است');
  if (a.leaveReasonLogic === 'leave_red_flag') flags.push('علت خروج از شغل قبلی پرریسک است');
  return flags;
}

/**
 * Score emphasizes organizational fit / red flags.
 * Soft skills still count, but policy answers weigh more (duplicated push).
 */
export function computeEvaluationScore(a: EvaluationAnswers, category: JobCategory | ''): {
  score: number;
  filled: number;
  total: number;
  hardFlags: string[];
} {
  const scores: number[] = [];
  const push = (v: number | null, weight = 1) => {
    if (v !== null && !Number.isNaN(v)) {
      for (let i = 0; i < weight; i++) scores.push(v);
    }
  };

  // Resume / screening (lighter)
  push(trafficScore(a.jobHopping));
  push(trafficScore(a.relevantExperience));
  push(trafficScore(a.resumeAccuracy));
  push(starScore(a.phoneEnergy));
  push(trafficScore(a.phoneScenario));
  push(trafficScore(a.salaryFit));

  // Soft skills (lighter)
  push(trafficScore(a.roleFit || a.supportFit));
  push(starScore(a.starHonesty));
  push(starScore(a.starStress));
  push(starScore(a.starTeamwork));
  push(starScore(a.cultureFit));

  // Organizational must / must-not (heavier weight)
  push(trafficScore(a.crisisWorkPresence), 2);
  push(trafficScore(a.unpaidTrustMonthOk), 2);
  push(trafficScore(a.leaveReasonLogic), 2);
  push(trafficScore(a.confidentialityCommitment), 2);
  push(trafficScore(a.hierarchyRespect), 2);
  push(trafficScore(a.overtimeFlexibility));
  if (category === 'sales') {
    push(trafficScore(a.externalMissionOk), 2);
  }

  if (a.referenceCheck === 'yes_confirmed' || a.referenceCheck === 'negative_feedback') {
    push(trafficScore(a.referenceCheck));
  }

  const filled = scores.length;
  let score = filled === 0 ? 0 : Math.round(scores.reduce((s, n) => s + n, 0) / filled);

  const hardFlags = countOrgHardRedFlags(a, category);
  if (a.redFlags.trim()) {
    score = Math.max(0, score - 10);
  }
  if (hardFlags.length > 0) {
    score = Math.max(0, score - hardFlags.length * 12);
  }

  return { score, filled, total: Math.max(filled, 1), hardFlags };
}

export function computeEvaluationProgress(a: EvaluationAnswers, category: JobCategory | ''): {
  percent: number;
  done: number;
  sections: { id: string; label: string; done: boolean }[];
} {
  const orgDone = !!(
    a.crisisWorkPresence &&
    a.unpaidTrustMonthOk &&
    a.leaveReasonLogic &&
    a.confidentialityCommitment &&
    a.hierarchyRespect &&
    (category !== 'sales' || a.externalMissionOk)
  );

  const sections = [
    {
      id: 'pre',
      label: 'رزومه',
      done: !!(a.jobHopping && a.relevantExperience && a.resumeAccuracy),
    },
    {
      id: 'phone',
      label: 'تلفنی',
      done: !!(a.phoneEnergy && a.phoneScenario && a.phoneResult),
    },
    {
      id: 'org',
      label: 'باید/نباید سازمان',
      done: orgDone,
    },
    {
      id: 'logistics',
      label: 'شرایط',
      done: !!(a.workArrangement && a.noticePeriod && (a.city || a.leaveReason)),
    },
    {
      id: 'soft',
      label: 'رفتار',
      done: !!(a.starHonesty || a.starStress || a.starTeamwork || a.cultureFit || a.roleFit || a.supportFit),
    },
    {
      id: 'final',
      label: 'جمع‌بندی',
      done: !!(a.finalDecision && (a.strengths || a.finalNotes || a.redFlags)),
    },
  ];

  const done = sections.filter((s) => s.done).length;
  return { percent: Math.round((done / sections.length) * 100), done, sections };
}

export function getPhoneScenarioOptions(category: JobCategory | ''): { value: string; label: string }[] {
  if (category === 'tech') {
    return [
      { value: 'scen_red', label: 'تدافعی، مبهم یا بدون رویکرد سیستماتیک' },
      { value: 'scen_yellow', label: 'متوسط؛ ایده کلی دارد اما عمق فنی کم است' },
      { value: 'scen_green', label: 'حرفه‌ای، شفاف و با رویکرد حل‌مسئله' },
    ];
  }
  if (category === 'product') {
    return [
      { value: 'scen_red', label: 'بدون اولویت‌بندی، احساسی یا پراکنده' },
      { value: 'scen_yellow', label: 'متوسط؛ درک کلی دارد اما داده/معیار کم است' },
      { value: 'scen_green', label: 'ساختاریافته، کاربرمحور و داده‌محور' },
    ];
  }
  if (category === 'accounting') {
    return [
      { value: 'scen_red', label: 'پاسخ کلی؛ بدون مسیر کنترل یا اولویت‌بندی' },
      { value: 'scen_yellow', label: 'متوسط؛ چند مورد را می‌گوید اما ناقص است' },
      { value: 'scen_green', label: 'کنترل‌محور؛ اولویت و مسیر رسیدگی روشن دارد' },
    ];
  }
  if (category === 'sales') {
    return [
      { value: 'scen_red', label: 'تدافعی، استرسی یا حق‌به‌جانب' },
      { value: 'scen_yellow', label: 'متوسط؛ تلاش برای آرام کردن اما بدون راهکار' },
      { value: 'scen_green', label: 'حرفه‌ای، صبور و راه‌حل‌محور' },
    ];
  }
  if (category === 'sales_support') {
    return [
      { value: 'scen_red', label: 'سردرگم؛ مسئولیت را گردن دیگران می‌اندازد' },
      { value: 'scen_yellow', label: 'متوسط؛ پیگیری می‌کند اما اولویت‌بندی ضعیف است' },
      { value: 'scen_green', label: 'منظم؛ بین فروش/انبار/مالی هماهنگ می‌کند' },
    ];
  }
  return [
    { value: 'scen_red', label: 'تدافعی یا بدون راهکار مشخص' },
    { value: 'scen_yellow', label: 'متوسط؛ تلاش می‌کند اما عمق کافی ندارد' },
    { value: 'scen_green', label: 'حرفه‌ای، شفاف و راه‌حل‌محور' },
  ];
}

export function getPhoneScenarioLabel(category: JobCategory | ''): string {
  if (category === 'tech') {
    return 'واکنش به سناریوی باگ بحرانی در پروداکشن:';
  }
  if (category === 'product') {
    return 'واکنش به تعارض اولویت بین فروش و توسعه:';
  }
  if (category === 'accounting') {
    return 'واکنش به مغایرت هم‌زمان طلب معوق، موجودی انبار و موعد ارزش افزوده:';
  }
  if (category === 'sales') {
    return 'واکنش به مشتری ناراضی از قیمت / تأخیر تحویل:';
  }
  if (category === 'sales_support') {
    return 'واکنش به سفارش فوری + شکایت تأخیر + درخواست اصلاح فاکتور هم‌زمان:';
  }
  return 'واکنش به یک سناریوی فشار عملیاتی فرضی:';
}

export function getRolePlayLabel(category: JobCategory | ''): string {
  if (category === 'tech') return 'نتیجه تست عملی فنی (در صورت انجام):';
  if (category === 'product') return 'نتیجه Case Study محصول (در صورت انجام):';
  if (category === 'accounting') return 'نتیجه تمرین عملی مالی / اکسل (در صورت انجام):';
  if (category === 'sales') return 'نتیجه رول‌پلی فروش (در صورت انجام):';
  if (category === 'sales_support') return 'نتیجه تمرین پیگیری سفارش (در صورت انجام):';
  return 'نتیجه تست عملی (در صورت انجام):';
}

export function getTeamworkLabel(category: JobCategory | ''): string {
  if (category === 'tech') return 'کار تیمی فنی:';
  if (category === 'product') return 'هماهنگی بین‌تیمی:';
  if (category === 'accounting') return 'هماهنگی با فروش، انبار و مدیریت:';
  if (category === 'sales') return 'کار تیمی با پشتیبانی و عملیات:';
  if (category === 'sales_support') return 'هماهنگی با فروش، انبار و مالی:';
  return 'کار تیمی و ارتباط حرفه‌ای:';
}

export function getExperienceLabel(category: JobCategory | ''): string {
  if (category === 'tech') return 'سابقه کار مرتبط فنی:';
  if (category === 'product') return 'سابقه کار مرتبط محصول / مدیریت:';
  if (category === 'accounting') return 'سابقه کار مرتبط حسابداری / مالی:';
  if (category === 'sales') return 'سابقه کار مرتبط فروش:';
  if (category === 'sales_support') return 'سابقه کار مرتبط پشتیبانی / عملیات فروش:';
  return 'سابقه کار مرتبط با این نقش:';
}

export function getRoleFitLabel(category: JobCategory | ''): string {
  if (category === 'accounting') return 'انطباق با نقش (دقت، کنترل و نظم):';
  if (category === 'sales') return 'انطباق با نقش (انرژی فروش و پیگیری):';
  if (category === 'sales_support') return 'انطباق با نقش (دقت عملیاتی و پیگیری):';
  if (category === 'tech') return 'انطباق با نقش (دقت فنی و یادگیری):';
  return 'انطباق کلی با نقش:';
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

export function mergeAnswers(partial: Partial<EvaluationAnswers> | undefined): EvaluationAnswers {
  const docs = { ...EMPTY_DOCS, ...(partial?.docsChecklist || {}) };
  const merged = {
    ...EMPTY_ANSWERS,
    ...(partial || {}),
    discDominant: Array.isArray(partial?.discDominant) ? partial!.discDominant : [],
    docsChecklist: docs,
  };
  // migrate legacy supportFit → roleFit
  if (!merged.roleFit && merged.supportFit) {
    merged.roleFit = merged.supportFit;
  }
  return merged;
}

export function buildPrintHtml(opts: {
  candidateName: string;
  position: string;
  evaluatorName: string;
  updatedAt: string;
  category: string;
  score: number;
  answers: EvaluationAnswers;
}): string {
  const a = opts.answers;
  const decisionLabel: Record<string, string> = {
    offer: 'استخدام قطعی',
    standby: 'لیست ذخیره',
    reject: 'رد',
  };
  const row = (label: string, value: string | number) =>
    value !== '' && value !== 0
      ? `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:600;width:40%">${label}</td><td style="padding:6px 10px;border:1px solid #e2e8f0">${value}</td></tr>`
      : '';

  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><title>ارزیابی ${opts.candidateName}</title>
  <style>body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#0f172a}h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:20px 0 8px;color:#1d4ed8}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}.meta{color:#64748b;font-size:12px;margin-bottom:16px}
  .score{display:inline-block;padding:6px 14px;border-radius:8px;font-weight:700;border:1px solid #cbd5e1}</style></head><body>
  <h1>فرم ارزیابی عمومی: ${opts.candidateName}</h1>
  <div class="meta">${opts.position} · ارزیاب: ${opts.evaluatorName} · ${opts.updatedAt} · دسته: ${opts.category}</div>
  <div class="score">امتیاز عمومی: ${opts.score} از ۱۰۰</div>
  <p style="font-size:12px;color:#64748b">توجه: امتیاز تخصصی مصاحبه در تب «مصاحبه تخصصی» ثبت می‌شود.</p>
  <h2>جمع‌بندی</h2>
  <table>
  ${row('تصمیم نهایی', decisionLabel[a.finalDecision] || a.finalDecision)}
  ${row('نقاط قوت', a.strengths)}
  ${row('نقاط ضعف', a.weaknesses)}
  ${row('پرچم قرمز', a.redFlags)}
  ${row('حقوق درخواستی', a.requestedSalary)}
  ${row('انطباق بودجه', a.salaryFit)}
  ${row('حضور در بحران/جنگ', a.crisisWorkPresence)}
  ${row('امانت‌ماندن یک‌ماه حقوق', a.unpaidTrustMonthOk)}
  ${row('ماموریت خارج سازمان', a.externalMissionOk)}
  ${row('منطقی بودن علت خروج', a.leaveReasonLogic)}
  ${row('علت خروج', a.leaveReason)}
  ${row('محرمانگی', a.confidentialityCommitment)}
  ${row('احترام به ساختار', a.hierarchyRespect)}
  ${row('انعطاف اضافه‌کاری', a.overtimeFlexibility)}
  ${row('یادداشت سیاست سازمانی', a.orgPolicyNotes)}
  ${row('پیشنهاد Offer', a.offerSalary)}
  ${row('زبان انگلیسی', a.englishLevel)}
  ${row('نوع همکاری', a.workArrangement)}
  ${row('شهر', a.city)}
  ${row('زمان شروع', a.noticePeriod)}
  ${row('Culture Fit', a.cultureFit)}
  ${row('یادداشت تخصصی', a.specializedNotes)}
  ${row('یادداشت نهایی', a.finalNotes)}
  </table>
  <script>window.onload=()=>window.print()</script>
  </body></html>`;
}
