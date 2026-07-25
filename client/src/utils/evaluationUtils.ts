export type JobCategory = 'tech' | 'sales' | 'product' | 'other';

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
  supportFit: string;
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
  salaryFit: string;
  strengths: string;
  weaknesses: string;
  redFlags: string;
  docsChecklist: DocsChecklist;
  offerSalary: string;

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
  supportFit: '',
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
  salaryFit: '',
  strengths: '',
  weaknesses: '',
  redFlags: '',
  docsChecklist: { ...EMPTY_DOCS },
  offerSalary: '',
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
  hopping_red: 0,
  exp_green: 100,
  exp_yellow: 55,
  exp_red: 0,
  scen_green: 100,
  scen_yellow: 55,
  scen_red: 0,
  fit_green: 100,
  fit_yellow: 55,
  fit_red: 0,
  invite_test: 100,
  reject: 0,
  عالی: 100,
  متوسط: 55,
  ضعیف: 15,
  'بدون نقص': 100,
  'دارای خطای جزئی': 60,
  سریع: 100,
  کند: 25,
  'متوسط و منطقی': 60,
  'عالی و سریع': 100,
  'متوسط (نیاز به آموزش)': 55,
  'عالی و مسلط': 100,
  yes_confirmed: 100,
  no_check: 40,
  negative_feedback: 10,
  offer: 100,
  standby: 55,
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  fluent: 90,
  native: 100,
  in_budget: 100,
  negotiable: 60,
  out_of_budget: 20,
};

function starScore(n: number): number | null {
  if (!n || n <= 0) return null;
  return Math.min(5, n) * 20;
}

function trafficScore(v: string): number | null {
  if (!v) return null;
  return TRAFFIC[v] ?? null;
}

/** Compute 0–100 score from filled evaluation fields only */
export function computeEvaluationScore(a: EvaluationAnswers, category: JobCategory | ''): {
  score: number;
  filled: number;
  total: number;
} {
  const scores: number[] = [];

  const push = (v: number | null) => {
    if (v !== null && !Number.isNaN(v)) scores.push(v);
  };

  push(trafficScore(a.jobHopping));
  push(trafficScore(a.relevantExperience));
  push(trafficScore(a.resumeAccuracy));
  push(starScore(a.phoneEnergy));
  push(trafficScore(a.phoneScenario));
  push(trafficScore(a.phoneResult));
  push(trafficScore(a.supportFit));
  push(starScore(a.starHonesty));
  push(starScore(a.starStress));
  push(starScore(a.starTeamwork));
  push(trafficScore(a.rolePlayAccuracy));
  push(trafficScore(a.rolePlaySpeed));
  push(starScore(a.cultureFit));
  push(trafficScore(a.englishLevel));
  push(trafficScore(a.salaryFit));
  push(trafficScore(a.referenceCheck));
  push(trafficScore(a.finalDecision));

  if (category === 'tech') {
    push(starScore(a.techKnowledge));
    push(starScore(a.techCodingQuality));
    push(starScore(a.techSystemDesign));
    push(starScore(a.techGitCollaboration));
    push(trafficScore(a.techProblemSolving));
  } else if (category === 'sales') {
    push(starScore(a.salesNegotiation));
    push(starScore(a.salesMarketAnalysis));
    push(starScore(a.salesGoalOrientation));
    push(starScore(a.salesCustomerEmpathy));
    push(starScore(a.salesClosingAbility));
    push(trafficScore(a.salesScenarioPlay));
  } else if (category === 'product') {
    push(starScore(a.productStrategy));
    push(starScore(a.productDesignSense));
    push(starScore(a.productLeadership));
    push(starScore(a.productDataAnalysis));
    push(starScore(a.productTechnicalUnderstanding));
  } else if (category === 'other') {
    push(starScore(a.otherSkills));
    push(starScore(a.otherLearningSpeed));
    push(starScore(a.otherDetailOrientation));
    push(starScore(a.otherWrittenCommunication));
    push(starScore(a.otherProblemHandling));
  }

  // Red flags penalty
  if (a.redFlags.trim()) {
    scores.push(35);
  }

  const filled = scores.length;
  const score = filled === 0 ? 0 : Math.round(scores.reduce((s, n) => s + n, 0) / filled);
  return { score, filled, total: Math.max(filled, 1) };
}

/** Progress across 7 logical sections (0–100) */
export function computeEvaluationProgress(a: EvaluationAnswers, category: JobCategory | ''): {
  percent: number;
  done: number;
  sections: { id: string; label: string; done: boolean }[];
} {
  const sections = [
    {
      id: 'pre',
      label: 'رزومه',
      done: !!(a.jobHopping || a.relevantExperience || a.resumeAccuracy),
    },
    {
      id: 'phone',
      label: 'تلفنی',
      done: !!(a.phoneEnergy || a.phoneScenario || a.phoneResult || a.requestedSalary || a.phoneRoutine),
    },
    {
      id: 'logistics',
      label: 'شرایط',
      done: !!(a.englishLevel || a.workArrangement || a.noticePeriod || a.city || a.leaveReason),
    },
    {
      id: 'disc',
      label: 'DISC',
      done: a.discDominant.length > 0 || !!a.supportFit,
    },
    {
      id: 'onsite',
      label: 'حضوری',
      done: !!(a.starHonesty || a.starStress || a.starTeamwork || a.rolePlayAccuracy || a.rolePlaySpeed || a.cultureFit),
    },
    {
      id: 'specialized',
      label: 'تخصصی',
      done:
        category === 'tech'
          ? !!(a.techKnowledge || a.techCodingQuality || a.techProblemSolving || a.techTaskScore)
          : category === 'sales'
            ? !!(a.salesNegotiation || a.salesScenarioPlay)
            : category === 'product'
              ? !!(a.productStrategy || a.productCaseStudy)
              : !!(a.otherSkills || a.otherTaskResult),
    },
    {
      id: 'final',
      label: 'جمع‌بندی',
      done: !!(a.finalDecision || a.finalNotes || a.strengths || a.weaknesses || a.referenceCheck),
    },
  ];

  const done = sections.filter((s) => s.done).length;
  return { percent: Math.round((done / sections.length) * 100), done, sections };
}

export function getPhoneScenarioOptions(category: JobCategory | ''): { value: string; label: string }[] {
  if (category === 'tech') {
    return [
      { value: 'scen_red', label: 'تدافعی، مبهم یا بدون رویکرد سیستماتیک 🔴' },
      { value: 'scen_yellow', label: 'متوسط (ایده کلی دارد اما عمق فنی کم است) 🟡' },
      { value: 'scen_green', label: 'حرفه‌ای، شفاف و با رویکرد حل‌مسئله 🟢' },
    ];
  }
  if (category === 'product') {
    return [
      { value: 'scen_red', label: 'بدون اولویت‌بندی، احساسی یا پراکنده 🔴' },
      { value: 'scen_yellow', label: 'متوسط (درک کلی دارد اما داده/معیار کم است) 🟡' },
      { value: 'scen_green', label: 'ساختاریافته، کاربرمحور و داده‌محور 🟢' },
    ];
  }
  // sales / other / support-oriented default
  return [
    { value: 'scen_red', label: 'تدافعی، استرسی یا حق‌به‌جانب 🔴' },
    { value: 'scen_yellow', label: 'متوسط (تلاش برای آرام کردن اما بدون راهکار) 🟡' },
    { value: 'scen_green', label: 'حرفه‌ای، صبور و راه‌حل‌محور 🟢' },
  ];
}

export function getPhoneScenarioLabel(category: JobCategory | ''): string {
  if (category === 'tech') {
    return 'واکنش به سناریوی فرضی باگ بحرانی در پروداکشن (نیمه‌شب، مشتری ناراضی):';
  }
  if (category === 'product') {
    return 'واکنش به سناریوی تعارض اولویت بین تیم فروش و توسعه برای یک فیچر فوری:';
  }
  if (category === 'sales') {
    return 'واکنش به سناریوی مشتری ناراضی از قیمت / تاخیر تحویل:';
  }
  return 'واکنش به سناریوی فرضی مشتری عصبانی بابت تاخیر ارسال کالا:';
}

export function getRolePlayLabel(category: JobCategory | ''): string {
  if (category === 'tech') return 'نتیجه تست عملی (چالش کدنویسی / دیباگ / توضیح معماری):';
  if (category === 'product') return 'نتیجه تست عملی (Case Study محصول / اولویت‌بندی فیچر):';
  if (category === 'sales') return 'نتیجه تست عملی (رول‌پلی فروش / مذاکره):';
  return 'نتیجه تست عملی (رول‌پلی بررسی کاتالوگ و ثبت سفارش):';
}

export function getTeamworkLabel(category: JobCategory | ''): string {
  if (category === 'tech') return 'سنجش کار تیمی فنی (Code Review، تعارض فنی، همکاری با QA/PM):';
  if (category === 'product') return 'سنجش هماهنگی بین‌تیمی (توسعه، طراحی، فروش):';
  if (category === 'sales') return 'سنجش کار تیمی با پشتیبانی، انبار و تیم فروش:';
  return 'سنجش کار تیمی (حل تعارض با ویزیتورها و تیم فروش):';
}

export function getExperienceLabel(category: JobCategory | ''): string {
  if (category === 'tech') return 'سابقه کار مرتبط فنی (توسعه، زیرساخت، یا سیستم‌های مشابه):';
  if (category === 'product') return 'سابقه کار مرتبط محصول / مدیریت / طراحی:';
  if (category === 'sales') return 'سابقه کار مرتبط فروش / بازاریابی / مشتریان B2B:';
  return 'سابقه کار مرتبط در امور مشتریان B2B یا کار با سیستم:';
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

export function mergeAnswers(partial: Partial<EvaluationAnswers> | undefined): EvaluationAnswers {
  const docs = { ...EMPTY_DOCS, ...(partial?.docsChecklist || {}) };
  return {
    ...EMPTY_ANSWERS,
    ...(partial || {}),
    discDominant: Array.isArray(partial?.discDominant) ? partial!.discDominant : [],
    docsChecklist: docs,
  };
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
  const row = (label: string, value: string | number) =>
    value !== '' && value !== 0
      ? `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:600;width:40%">${label}</td><td style="padding:6px 10px;border:1px solid #e2e8f0">${value}</td></tr>`
      : '';

  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><title>ارزیابی ${opts.candidateName}</title>
  <style>body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#0f172a}h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:20px 0 8px;color:#1d4ed8}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}.meta{color:#64748b;font-size:12px;margin-bottom:16px}
  .score{display:inline-block;padding:6px 14px;border-radius:8px;font-weight:700;border:1px solid #cbd5e1}</style></head><body>
  <h1>فرم ارزیابی متقاضی: ${opts.candidateName}</h1>
  <div class="meta">${opts.position} · ارزیاب: ${opts.evaluatorName} · ${opts.updatedAt} · دسته: ${opts.category}</div>
  <div class="score">امتیاز کل: ${opts.score} از ۱۰۰</div>
  <h2>جمع‌بندی</h2>
  <table>
  ${row('تصمیم نهایی', a.finalDecision)}
  ${row('نقاط قوت', a.strengths)}
  ${row('نقاط ضعف', a.weaknesses)}
  ${row('پرچم قرمز', a.redFlags)}
  ${row('حقوق درخواستی', a.requestedSalary)}
  ${row('انطباق بودجه', a.salaryFit)}
  ${row('پیشنهاد Offer', a.offerSalary)}
  ${row('زبان انگلیسی', a.englishLevel)}
  ${row('نوع همکاری', a.workArrangement)}
  ${row('شهر', a.city)}
  ${row('زمان شروع', a.noticePeriod)}
  ${row('Culture Fit', a.cultureFit)}
  ${row('یادداشت نهایی', a.finalNotes)}
  </table>
  <script>window.onload=()=>window.print()</script>
  </body></html>`;
}
