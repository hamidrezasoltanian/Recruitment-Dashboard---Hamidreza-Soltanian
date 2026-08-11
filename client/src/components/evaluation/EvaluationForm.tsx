import React, { useEffect, useMemo, useState } from 'react';
import { Candidate } from '../../types';
import StarRating from '../ui/StarRating';
import {
  DocsChecklist,
  EMPTY_ANSWERS,
  EvaluationAnswers,
  EvaluationHistoryEntry,
  JobCategory,
  buildPrintHtml,
  computeEvaluationProgress,
  computeEvaluationScore,
  detectJobCategory,
  getCategoryLabel,
  getExperienceLabel,
  getPhoneScenarioLabel,
  getPhoneScenarioOptions,
  getRoleFitLabel,
  getRolePlayLabel,
  getTeamworkLabel,
  mergeAnswers,
  scoreColor,
} from '../../utils/evaluationUtils';

interface EvaluationFormProps {
  candidate: Candidate;
  user: { name: string; username: string } | null;
  testLibrary: { id: string; name: string }[];
  formatTimestamp: (iso: string) => string;
  onSave: (payload: {
    evaluationJson: string;
    historyNote: string;
  }) => Promise<void>;
  onAnalyzeResume: () => Promise<Partial<EvaluationAnswers> | null>;
  isAnalyzing: boolean;
}

const fieldClass =
  'w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';
const labelClass = 'block text-sm font-semibold text-slate-700';
const sectionClass = 'p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm';

const DOC_ITEMS: { key: keyof DocsChecklist; label: string; forAccounting?: boolean }[] = [
  { key: 'nationalId', label: 'کارت ملی / شناسنامه' },
  { key: 'resumeVerified', label: 'تأیید اصالت رزومه' },
  { key: 'certificates', label: 'مدارک تحصیلی / گواهینامه' },
  { key: 'insurance', label: 'سوابق بیمه' },
  { key: 'military', label: 'وضعیت نظام وظیفه (در صورت لزوم)' },
  { key: 'portfolio', label: 'نمونه کار / پورتفولیو', forAccounting: false },
];

const PolicyRadios: React.FC<{
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ name, value, onChange, options }) => (
  <div className="space-y-2">
    {options.map((opt) => (
      <label key={opt.value} className="flex items-start gap-3 cursor-pointer text-sm font-medium text-slate-700">
        <input
          type="radio"
          name={name}
          value={opt.value}
          checked={value === opt.value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1"
        />
        <span>{opt.label}</span>
      </label>
    ))}
  </div>
);

const EvaluationForm: React.FC<EvaluationFormProps> = ({
  candidate,
  user,
  testLibrary,
  formatTimestamp,
  onSave,
  onAnalyzeResume,
  isAnalyzing,
}) => {
  const [answers, setAnswers] = useState<EvaluationAnswers>(EMPTY_ANSWERS);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>('other');
  const [history, setHistory] = useState<EvaluationHistoryEntry[]>([]);
  const [meta, setMeta] = useState<{ evaluatorName?: string; updatedAt?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const setField = <K extends keyof EvaluationAnswers>(key: K, value: EvaluationAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDoc = (key: keyof DocsChecklist) => {
    setAnswers((prev) => ({
      ...prev,
      docsChecklist: { ...prev.docsChecklist, [key]: !prev.docsChecklist[key] },
    }));
  };

  useEffect(() => {
    if (!candidate) return;
    const detected = detectJobCategory(candidate.position);
    if (candidate.evaluation) {
      try {
        const parsed = JSON.parse(candidate.evaluation);
        setAnswers(mergeAnswers(parsed.answers));
        const savedCat = parsed.category as JobCategory | undefined;
        // migrate old categories; prefer detected for known roles
        const nextCat =
          detected !== 'other'
            ? detected
            : savedCat === 'sales' || savedCat === 'tech' || savedCat === 'product' || savedCat === 'accounting' || savedCat === 'sales_support'
              ? savedCat
              : detected;
        setSelectedCategory(nextCat);
        setHistory(Array.isArray(parsed.history) ? parsed.history : []);
        setMeta({ evaluatorName: parsed.evaluatorName, updatedAt: parsed.updatedAt });
      } catch {
        setAnswers(EMPTY_ANSWERS);
        setSelectedCategory(detected);
        setHistory([]);
        setMeta({});
      }
    } else {
      setAnswers(EMPTY_ANSWERS);
      setSelectedCategory(detected);
      setHistory([]);
      setMeta({});
    }
  }, [candidate?.id, candidate?.evaluation, candidate?.position]);

  const { score, filled, hardFlags } = useMemo(
    () => computeEvaluationScore(answers, selectedCategory),
    [answers, selectedCategory]
  );
  const progress = useMemo(
    () => computeEvaluationProgress(answers, selectedCategory),
    [answers, selectedCategory]
  );

  const scenarioOptions = getPhoneScenarioOptions(selectedCategory);
  const activeTests = (candidate.testResults || []).filter((t: any) => t.status && t.status !== 'not_sent');
  const hasDiscTest = useMemo(() => {
    const discTests = testLibrary.filter((t) => /disc/i.test(t.name));
    if (discTests.length === 0) return false;
    return discTests.some((t) => {
      const result = candidate.testResults?.find((r) => r.testId === t.id);
      return result && result.status && result.status !== 'not_sent';
    });
  }, [testLibrary, candidate.testResults]);
  const visibleDocs = DOC_ITEMS.filter((d) => {
    if (d.key === 'portfolio' && (selectedCategory === 'accounting' || selectedCategory === 'sales_support')) {
      return false;
    }
    return true;
  });

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const entry: EvaluationHistoryEntry = {
        evaluatorName: user.name,
        evaluatorUsername: user.username,
        updatedAt: new Date().toISOString(),
        totalScore: score,
        finalDecision: answers.finalDecision || undefined,
        summary: answers.finalNotes?.slice(0, 120) || answers.strengths?.slice(0, 120) || undefined,
      };
      const nextHistory = [entry, ...history].slice(0, 20);
      const evaluationData = {
        evaluatorName: user.name,
        evaluatorUsername: user.username,
        candidateName: candidate.name,
        updatedAt: entry.updatedAt,
        category: selectedCategory,
        totalScore: score,
        answers: { ...answers, supportFit: answers.roleFit },
        history: nextHistory,
      };
      await onSave({
        evaluationJson: JSON.stringify(evaluationData),
        historyNote: `ارزیابی عمومی ثبت/ویرایش شد (توسط ${user.name}) — امتیاز عمومی ${score}`,
      });
      setHistory(nextHistory);
      setMeta({ evaluatorName: user.name, updatedAt: entry.updatedAt });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    const partial = await onAnalyzeResume();
    if (partial) {
      setAnswers((prev) => mergeAnswers({ ...prev, ...partial }));
    }
  };

  const handlePrint = () => {
    const html = buildPrintHtml({
      candidateName: candidate.name,
      position: candidate.position,
      evaluatorName: user?.name || '—',
      updatedAt: new Date().toLocaleString('fa-IR'),
      category: getCategoryLabel(selectedCategory),
      score,
      answers,
    });
    const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-l from-sky-50 to-blue-50 border border-sky-100 text-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
          <div>
            <strong>متقاضی:</strong> <span className="font-semibold text-slate-900">{candidate.name}</span>
            <span className="text-slate-500"> ({candidate.position})</span>
            <span className="mr-2 text-xs px-2 py-0.5 rounded-md bg-white border border-sky-100 text-sky-800 font-bold">
              {getCategoryLabel(selectedCategory)}
            </span>
          </div>
          <div>
            <strong>ارزیاب:</strong> <span className="font-semibold">{user?.name}</span>
          </div>
          {meta.updatedAt && (
            <div className="text-xs text-slate-500">
              آخرین ویرایش: {meta.evaluatorName} · {formatTimestamp(meta.updatedAt)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className={`px-4 py-2 rounded-xl border font-black text-lg ${scoreColor(score)}`}>
            امتیاز عمومی: {score}
            <span className="text-xs font-semibold opacity-70 mr-1"> / ۱۰۰</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>پیشرفت فرم عمومی</span>
              <span>
                {progress.done} از {progress.sections.length} بخش · {progress.percent}%
              </span>
            </div>
            <div className="h-2.5 bg-white/80 rounded-full overflow-hidden border border-sky-100">
              <div
                className="h-full rounded-full bg-gradient-to-l from-sky-500 to-blue-600 transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {progress.sections.map((s) => (
                <span
                  key={s.id}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    s.done ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
            {filled > 0 && (
              <p className="text-[11px] text-slate-500 mt-2">
                تمرکز این فرم روی باید/نباید سازمان و ردفلگ‌هاست؛ ارزیابی تخصصی در تب مصاحبه تخصصی است.
              </p>
            )}
            {hardFlags.length > 0 && (
              <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2 space-y-0.5">
                <p className="font-bold">ردفلگ سازمانی فعال ({hardFlags.length}):</p>
                {hardFlags.map((f) => (
                  <p key={f}>• {f}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl p-4 text-sm leading-7">
        این فرم برای غربالگری عمومی، <strong>باید و نبایدهای سازمان</strong> و تشخیص ردفلگ است.
        جزئیات تخصصی هر شغل را در تب <strong className="mx-1">«مصاحبه تخصصی»</strong> ثبت کنید.
      </div>

      {/* 1 Resume */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between gap-3">
          <span>۱. ارزیابی اولیه رزومه</span>
          {candidate.hasResume && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isAnalyzing ? 'در حال آنالیز...' : 'آنالیز هوشمند رزومه'}
            </button>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>ثبات شغلی:</label>
            <div className="space-y-2">
              {[
                { value: 'hopping_red', label: 'جابجایی مکرر (کمتر از ۱ سال در چند شغل اخیر)' },
                { value: 'hopping_yellow', label: 'ثبات متوسط (حدود ۱ تا ۳ سال)' },
                { value: 'hopping_green', label: 'ثبات بالا (بیش از ۳ سال ماندگاری)' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-start gap-3 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="jobHopping" value={opt.value} checked={answers.jobHopping === opt.value} onChange={(e) => setField('jobHopping', e.target.value)} className="mt-1" />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>{getExperienceLabel(selectedCategory)}</label>
            <select value={answers.relevantExperience} onChange={(e) => setField('relevantExperience', e.target.value)} className={fieldClass}>
              <option value="">-- انتخاب کنید --</option>
              <option value="exp_red">بدون سابقه مرتبط</option>
              <option value="exp_yellow">۱ تا ۳ سال</option>
              <option value="exp_green">بیشتر از ۳ سال</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>کیفیت و دقت رزومه:</label>
            <div className="flex gap-6">
              {['ضعیف', 'متوسط', 'عالی'].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="resumeAccuracy" value={val} checked={answers.resumeAccuracy === val} onChange={(e) => setField('resumeAccuracy', e.target.value)} />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2 Phone */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">۲. مصاحبه تلفنی / غربالگری</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>انرژی، فن بیان و لحن:</label>
            <StarRating rating={answers.phoneEnergy} onRatingChange={(v) => setField('phoneEnergy', v)} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>حقوق درخواستی (تومان):</label>
            <input type="text" value={answers.requestedSalary} onChange={(e) => setField('requestedSalary', e.target.value)} placeholder="مثلا ۵۰,۰۰۰,۰۰۰" className={fieldClass} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>انطباق با بودجه شرکت:</label>
            <select value={answers.salaryFit} onChange={(e) => setField('salaryFit', e.target.value)} className={fieldClass}>
              <option value="">-- انتخاب کنید --</option>
              <option value="in_budget">در بودجه است</option>
              <option value="negotiable">قابل مذاکره</option>
              <option value="out_of_budget">خارج از بودجه</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>خلاصه روتین کاری گذشته:</label>
            <textarea rows={2} value={answers.phoneRoutine} onChange={(e) => setField('phoneRoutine', e.target.value)} className={fieldClass} placeholder="توضیح کوتاه..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>{getPhoneScenarioLabel(selectedCategory)}</label>
            <div className="space-y-2">
              {scenarioOptions.map((opt) => (
                <label key={opt.value} className="flex items-start gap-3 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="phoneScenario" value={opt.value} checked={answers.phoneScenario === opt.value} onChange={(e) => setField('phoneScenario', e.target.value)} className="mt-1" />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>نتیجه غربالگری تلفنی:</label>
            <div className="flex flex-wrap gap-6">
              {[
                { value: 'reject', label: 'رد در این مرحله' },
                { value: 'invite_test', label: 'دعوت به مرحله بعد / مصاحبه تخصصی' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="phoneResult" value={opt.value} checked={answers.phoneResult === opt.value} onChange={(e) => setField('phoneResult', e.target.value)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">این نتیجه فقط وضعیت فرآیند است و در امتیاز عمومی محاسبه نمی‌شود.</p>
          </div>
        </div>
      </div>

      {/* 3 Org policy / red flags */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">۳. باید و نبایدهای سازمان و ردفلگ‌ها</h3>
        <p className="text-sm text-slate-500 -mt-2">
          این بخش قلب ارزیابی عمومی است. پاسخ‌های پرریسک به‌صورت ردفلگ ثبت و از امتیاز کم می‌شود.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>در دوران بحران / جنگ آیا سر کار بوده؟</label>
            <PolicyRadios
              name="crisisWorkPresence"
              value={answers.crisisWorkPresence}
              onChange={(v) => setField('crisisWorkPresence', v)}
              options={[
                { value: 'crisis_yes', label: 'بله؛ حضور مستمر داشته' },
                { value: 'crisis_partial', label: 'نسبی / با وقفه' },
                { value: 'crisis_no', label: 'خیر؛ غایب بوده (ردفلگ)' },
                { value: 'crisis_na', label: 'موضوعیت نداشته / قابل بررسی نیست' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>با امانت‌ماندن یک‌ماه حقوق موافق است؟</label>
            <PolicyRadios
              name="unpaidTrustMonthOk"
              value={answers.unpaidTrustMonthOk}
              onChange={(v) => setField('unpaidTrustMonthOk', v)}
              options={[
                { value: 'trust_yes', label: 'بله؛ اوکی است' },
                { value: 'trust_negotiable', label: 'با شرط / مذاکره' },
                { value: 'trust_no', label: 'خیر (ردفلگ)' },
              ]}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>علت خروج از شغل قبلی چیست؟</label>
            <input
              type="text"
              value={answers.leaveReason}
              onChange={(e) => setField('leaveReason', e.target.value)}
              className={fieldClass}
              placeholder="دلیل بیان‌شده توسط متقاضی..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>آیا علت خروج منطقی است؟</label>
            <PolicyRadios
              name="leaveReasonLogic"
              value={answers.leaveReasonLogic}
              onChange={(v) => setField('leaveReasonLogic', v)}
              options={[
                { value: 'leave_logical', label: 'بله؛ منطقی و قابل دفاع' },
                { value: 'leave_questionable', label: 'مشکوک / نیاز به بررسی بیشتر' },
                { value: 'leave_red_flag', label: 'غیرمنطقی یا پرریسک (ردفلگ)' },
              ]}
            />
          </div>

          {selectedCategory === 'sales' && (
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass}>آیا ماموریت خارج از سازمان را می‌پذیرد؟ (ویژه فروش)</label>
              <PolicyRadios
                name="externalMissionOk"
                value={answers.externalMissionOk}
                onChange={(v) => setField('externalMissionOk', v)}
                options={[
                  { value: 'mission_yes', label: 'بله' },
                  { value: 'mission_conditional', label: 'با شرط (مسافت/روز/هزینه)' },
                  { value: 'mission_no', label: 'خیر (ردفلگ برای فروش)' },
                ]}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className={labelClass}>انعطاف برای فشار کاری / اضافه‌کاری موردی:</label>
            <PolicyRadios
              name="overtimeFlexibility"
              value={answers.overtimeFlexibility}
              onChange={(v) => setField('overtimeFlexibility', v)}
              options={[
                { value: 'overtime_yes', label: 'منعطف است' },
                { value: 'overtime_limited', label: 'محدود / موردی' },
                { value: 'overtime_no', label: 'خیر' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>تعهد به محرمانگی و امانت اطلاعات:</label>
            <PolicyRadios
              name="confidentialityCommitment"
              value={answers.confidentialityCommitment}
              onChange={(v) => setField('confidentialityCommitment', v)}
              options={[
                { value: 'conf_yes', label: 'متعهد و شفاف' },
                { value: 'conf_hesitant', label: 'مردد' },
                { value: 'conf_no', label: 'عدم تعهد (ردفلگ)' },
              ]}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>احترام به ساختار و سلسله‌مراتب سازمان:</label>
            <PolicyRadios
              name="hierarchyRespect"
              value={answers.hierarchyRespect}
              onChange={(v) => setField('hierarchyRespect', v)}
              options={[
                { value: 'hierarchy_yes', label: 'بله' },
                { value: 'hierarchy_partial', label: 'نسبی' },
                { value: 'hierarchy_no', label: 'خیر (ردفلگ)' },
              ]}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>سایر ردفلگ‌ها / نکات سیاست سازمانی:</label>
            <textarea
              rows={3}
              value={answers.orgPolicyNotes}
              onChange={(e) => setField('orgPolicyNotes', e.target.value)}
              className={fieldClass}
              placeholder="هر باید/نباید دیگری که مشاهده کردید..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>جمع‌بندی آزاد ردفلگ‌ها:</label>
            <textarea
              rows={2}
              value={answers.redFlags}
              onChange={(e) => setField('redFlags', e.target.value)}
              className={`${fieldClass} border-red-100 focus:border-red-300`}
              placeholder="تناقض رزومه، رفتار نامناسب، ادعای غیرواقعی، ..."
            />
          </div>
        </div>
      </div>

      {/* 4 Logistics */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">۴. شرایط همکاری</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className={labelClass}>سطح زبان انگلیسی:</label>
            <select value={answers.englishLevel} onChange={(e) => setField('englishLevel', e.target.value)} className={fieldClass}>
              <option value="">-- انتخاب کنید --</option>
              <option value="beginner">مبتدی</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">پیشرفته</option>
              <option value="fluent">فصیح</option>
              <option value="native">در حد زبان مادری</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>سایر زبان‌ها:</label>
            <input type="text" value={answers.otherLanguages} onChange={(e) => setField('otherLanguages', e.target.value)} className={fieldClass} placeholder="مثلا آلمانی متوسط" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>نوع همکاری:</label>
            <select value={answers.workArrangement} onChange={(e) => setField('workArrangement', e.target.value)} className={fieldClass}>
              <option value="">-- انتخاب کنید --</option>
              <option value="onsite">حضوری</option>
              <option value="hybrid">هیبرید</option>
              <option value="remote">دورکاری</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>شهر محل سکونت:</label>
            <input type="text" value={answers.city} onChange={(e) => setField('city', e.target.value)} className={fieldClass} placeholder="تهران، اصفهان، ..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>زمان شروع به‌کار:</label>
            <select value={answers.noticePeriod} onChange={(e) => setField('noticePeriod', e.target.value)} className={fieldClass}>
              <option value="">-- انتخاب کنید --</option>
              <option value="immediate">فوری</option>
              <option value="1week">۱ هفته</option>
              <option value="2weeks">۲ هفته</option>
              <option value="1month">۱ ماه</option>
              <option value="2months">۲ ماه یا بیشتر</option>
              <option value="negotiable">قابل مذاکره</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5 Soft skills / culture */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">۵. رفتار حرفه‌ای و انطباق</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasDiscTest && (
            <div className="space-y-2">
              <label className={labelClass}>تیپ DISC غالب (حداکثر ۲ مورد):</label>
              <div className="flex gap-3 flex-wrap">
                {['D', 'I', 'S', 'C'].map((type) => {
                  const isChecked = answers.discDominant.includes(type);
                  return (
                    <label key={type} className={`flex items-center gap-2 cursor-pointer text-sm font-bold px-3 py-1.5 border rounded-xl ${isChecked ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setField('discDominant', answers.discDominant.filter((t) => t !== type));
                          } else if (answers.discDominant.length < 2) {
                            setField('discDominant', [...answers.discDominant, type]);
                          }
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">فقط چون تست DISC برای این فرد ارسال/ثبت شده نمایش داده می‌شود.</p>
            </div>
          )}
          <div className="space-y-2">
            <label className={labelClass}>{getRoleFitLabel(selectedCategory)}</label>
            <select
              value={answers.roleFit}
              onChange={(e) => {
                setField('roleFit', e.target.value);
                setField('supportFit', e.target.value);
              }}
              className={fieldClass}
            >
              <option value="">-- انتخاب کنید --</option>
              <option value="fit_green">انطباق بالا</option>
              <option value="fit_yellow">انطباق متوسط</option>
              <option value="fit_red">پرریسک</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>صداقت و دقت (با مثال):</label>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <StarRating rating={answers.starHonesty} onRatingChange={(v) => setField('starHonesty', v)} />
              <input type="text" value={answers.starHonestyExample} onChange={(e) => setField('starHonestyExample', e.target.value)} placeholder="مثال ذکرشده توسط متقاضی..." className={`flex-grow ${fieldClass}`} />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>مدیریت استرس:</label>
            <StarRating rating={answers.starStress} onRatingChange={(v) => setField('starStress', v)} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>{getTeamworkLabel(selectedCategory)}</label>
            <StarRating rating={answers.starTeamwork} onRatingChange={(v) => setField('starTeamwork', v)} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>انطباق فرهنگی:</label>
            <StarRating rating={answers.cultureFit} onRatingChange={(v) => setField('cultureFit', v)} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>یادداشت انطباق فرهنگی:</label>
            <input type="text" value={answers.cultureFitNote} onChange={(e) => setField('cultureFitNote', e.target.value)} className={fieldClass} placeholder="توضیح کوتاه..." />
          </div>
          <div className="space-y-2 md:col-span-2 border-t border-slate-100 pt-4">
            <label className="block text-sm font-bold text-slate-800 mb-2">{getRolePlayLabel(selectedCategory)}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className={labelClass}>دقت در جزئیات:</span>
                <div className="flex flex-wrap gap-4">
                  {['ضعیف', 'دارای خطای جزئی', 'بدون نقص'].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input type="radio" name="rolePlayAccuracy" value={val} checked={answers.rolePlayAccuracy === val} onChange={(e) => setField('rolePlayAccuracy', e.target.value)} />
                      <span>{val}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className={labelClass}>سرعت اجرا:</span>
                <div className="flex flex-wrap gap-4">
                  {['کند', 'متوسط', 'سریع'].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input type="radio" name="rolePlaySpeed" value={val} checked={answers.rolePlaySpeed === val} onChange={(e) => setField('rolePlaySpeed', e.target.value)} />
                      <span>{val}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tests */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">۶. خلاصه آزمون‌ها</h3>
        {activeTests.length === 0 ? (
          <p className="text-sm text-slate-500">هنوز آزمونی ارسال یا ثبت نشده است. مدیریت آزمون‌ها در تب جداگانه است.</p>
        ) : (
          <div className="space-y-2">
            {activeTests.map((tr: any) => {
              const testItem = testLibrary.find((t) => t.id === tr.testId);
              const statusMap: Record<string, string> = {
                pending: 'در انتظار',
                passed: 'قبول',
                failed: 'مردود',
                review: 'نیاز به بررسی',
              };
              return (
                <div key={tr.testId} className="flex flex-wrap items-center justify-between gap-2 text-sm bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <span className="font-semibold text-slate-800">{testItem?.name || tr.testId}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-600">{statusMap[tr.status] || tr.status}</span>
                    {tr.score !== undefined && tr.score !== '' && tr.score !== null && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold">نمره: {tr.score}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Final */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">۷. جمع‌بندی مدیریتی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>یادداشت کوتاه از ارزیابی تخصصی (اختیاری):</label>
            <textarea
              rows={2}
              value={answers.specializedNotes}
              onChange={(e) => setField('specializedNotes', e.target.value)}
              className={fieldClass}
              placeholder="جزئیات و نمره‌های تخصصی را در تب مصاحبه تخصصی ثبت کنید؛ اینجا فقط جمع‌بندی آزاد است."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>نقاط قوت:</label>
            <textarea rows={2} value={answers.strengths} onChange={(e) => setField('strengths', e.target.value)} className={fieldClass} placeholder="۳ نقطه قوت اصلی..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>نقاط ضعف / نیاز به آموزش:</label>
            <textarea rows={2} value={answers.weaknesses} onChange={(e) => setField('weaknesses', e.target.value)} className={fieldClass} />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>بررسی معرف (Reference):</label>
            <div className="space-y-2">
              {[
                { value: 'yes_confirmed', label: 'انجام شد و تأیید شد' },
                { value: 'no_check', label: 'هنوز انجام نشده' },
                { value: 'negative_feedback', label: 'انجام شد؛ بازخورد منفی' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="referenceCheck" value={opt.value} checked={answers.referenceCheck === opt.value} onChange={(e) => setField('referenceCheck', e.target.value)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>تصمیم نهایی:</label>
            <select value={answers.finalDecision} onChange={(e) => setField('finalDecision', e.target.value)} className={fieldClass}>
              <option value="">-- انتخاب کنید --</option>
              <option value="offer">استخدام قطعی (Offer)</option>
              <option value="standby">لیست ذخیره</option>
              <option value="reject">رد</option>
            </select>
            <p className="text-xs text-slate-500">تصمیم در امتیاز عمومی محاسبه نمی‌شود.</p>
          </div>

          {answers.finalDecision === 'offer' && (
            <>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass}>پیشنهاد حقوق Offer (تومان):</label>
                <input type="text" value={answers.offerSalary} onChange={(e) => setField('offerSalary', e.target.value)} className={fieldClass} placeholder="مبلغ پیشنهادی" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass}>چک‌لیست مدارک (مرحله Offer):</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {visibleDocs.map((item) => (
                    <label key={item.key} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border cursor-pointer ${answers.docsChecklist[item.key] ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      <input type="checkbox" checked={answers.docsChecklist[item.key]} onChange={() => toggleDoc(item.key)} />
                      <span className="font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>یادداشت نهایی مدیر ارزیاب:</label>
            <textarea rows={4} value={answers.finalNotes} onChange={(e) => setField('finalNotes', e.target.value)} className={fieldClass} />
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className={sectionClass}>
          <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">تاریخچه ارزیاب‌ها</h3>
          <div className="space-y-2">
            {history.map((h, idx) => (
              <div key={`${h.updatedAt}-${idx}`} className="flex flex-wrap items-center justify-between gap-2 text-sm bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <div>
                  <span className="font-bold text-slate-800">{h.evaluatorName}</span>
                  <span className="text-slate-400 text-xs mr-2">({h.evaluatorUsername})</span>
                  {h.summary && <p className="text-xs text-slate-500 mt-0.5">{h.summary}</p>}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {typeof h.totalScore === 'number' && (
                    <span className={`px-2 py-0.5 rounded-md border font-bold ${scoreColor(h.totalScore)}`}>{h.totalScore}</span>
                  )}
                  <span className="text-slate-400">{formatTimestamp(h.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={handlePrint} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-5 rounded-xl text-sm transition-all">
          چاپ / خروجی PDF
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
        >
          {isSaving ? 'در حال ذخیره...' : 'ثبت ارزیابی عمومی'}
        </button>
      </div>
    </div>
  );
};

export default EvaluationForm;
