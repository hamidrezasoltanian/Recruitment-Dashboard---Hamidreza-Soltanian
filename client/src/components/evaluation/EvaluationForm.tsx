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
  getExperienceLabel,
  getPhoneScenarioLabel,
  getPhoneScenarioOptions,
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

const DOC_ITEMS: { key: keyof DocsChecklist; label: string }[] = [
  { key: 'nationalId', label: 'کارت ملی / شناسنامه' },
  { key: 'resumeVerified', label: 'تأیید اصالت رزومه' },
  { key: 'portfolio', label: 'نمونه کار / پورتفولیو' },
  { key: 'certificates', label: 'مدارک تحصیلی / گواهینامه' },
  { key: 'insurance', label: 'سوابق بیمه' },
  { key: 'military', label: 'وضعیت نظام وظیفه' },
];

const EvaluationForm: React.FC<EvaluationFormProps> = ({
  candidate,
  user,
  testLibrary,
  formatTimestamp,
  onSave,
  onAnalyzeResume,
  isAnalyzing,
}) => {
  const getJobCategory = (position: string = ''): JobCategory => {
    const p = position.toLowerCase();
    if (/react|developer|frontend|backend|\bit\b|tech|برنامه.?نویس|توسعه.?دهنده|فنی|نرم.?افزار/.test(p)) return 'tech';
    if (/sales|marketing|business|بازاریابی|فروش|مارکتینگ|مشتریان|مذاکره/.test(p)) return 'sales';
    if (/product|manager|designer|مدیر|طراحی|محصول|گرافیک|دیزاین/.test(p)) return 'product';
    return 'other';
  };

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
    if (candidate.evaluation) {
      try {
        const parsed = JSON.parse(candidate.evaluation);
        setAnswers(mergeAnswers(parsed.answers));
        setSelectedCategory((parsed.category as JobCategory) || getJobCategory(candidate.position));
        setHistory(Array.isArray(parsed.history) ? parsed.history : []);
        setMeta({ evaluatorName: parsed.evaluatorName, updatedAt: parsed.updatedAt });
      } catch {
        setAnswers(EMPTY_ANSWERS);
        setSelectedCategory(getJobCategory(candidate.position));
        setHistory([]);
        setMeta({});
      }
    } else {
      setAnswers(EMPTY_ANSWERS);
      setSelectedCategory(getJobCategory(candidate.position));
      setHistory([]);
      setMeta({});
    }
  }, [candidate?.id, candidate?.evaluation, candidate?.position]);

  const { score } = useMemo(
    () => computeEvaluationScore(answers, selectedCategory),
    [answers, selectedCategory]
  );
  const progress = useMemo(
    () => computeEvaluationProgress(answers, selectedCategory),
    [answers, selectedCategory]
  );

  const scenarioOptions = getPhoneScenarioOptions(selectedCategory);
  const activeTests = (candidate.testResults || []).filter((t: any) => t.status && t.status !== 'not_sent');

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
        answers,
        history: nextHistory,
      };
      await onSave({
        evaluationJson: JSON.stringify(evaluationData),
        historyNote: `ارزیابی متقاضی ثبت/ویرایش شد (توسط ${user.name}) — امتیاز ${score}`,
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
    const categoryLabel =
      selectedCategory === 'tech'
        ? 'فنی'
        : selectedCategory === 'sales'
          ? 'فروش'
          : selectedCategory === 'product'
            ? 'محصول'
            : 'عمومی';
    const html = buildPrintHtml({
      candidateName: candidate.name,
      position: candidate.position,
      evaluatorName: user?.name || '—',
      updatedAt: new Date().toLocaleString('fa-IR'),
      category: categoryLabel,
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
      {/* Header banner + score + progress */}
      <div className="bg-gradient-to-l from-sky-50 to-blue-50 border border-sky-100 text-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
          <div>
            <strong>متقاضی:</strong> <span className="font-semibold text-slate-900">{candidate.name}</span>
            <span className="text-slate-500"> ({candidate.position})</span>
          </div>
          <div>
            <strong>ارزیاب فعلی:</strong> <span className="font-semibold">{user?.name}</span>
          </div>
          {meta.updatedAt && (
            <div className="text-xs text-slate-500">
              آخرین ویرایش: {meta.evaluatorName} · {formatTimestamp(meta.updatedAt)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className={`px-4 py-2 rounded-xl border font-black text-lg ${scoreColor(score)}`}>
            امتیاز کل: {score}
            <span className="text-xs font-semibold opacity-70 mr-1"> / ۱۰۰</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>پیشرفت تکمیل فرم</span>
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
          </div>
        </div>
      </div>

      {/* SECTION 1 */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between gap-3">
          <span>بخش اول: ارزیابی اولیه رزومه</span>
          {candidate.hasResume && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isAnalyzing ? 'در حال آنالیز...' : 'آنالیز هوشمند رزومه'}
            </button>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>وضعیت ثبات شغلی (Job Hopping):</label>
            <div className="space-y-2">
              {[
                { value: 'hopping_red', label: 'جابجایی‌های مکرر (کمتر از ۱ سال در ۳ شرکت اخیر) 🔴' },
                { value: 'hopping_yellow', label: 'ثبات متوسط (۱ تا ۳ سال ماندگاری) 🟡' },
                { value: 'hopping_green', label: 'ثبات بالا (بیش از ۳ سال ماندگاری) 🟢' },
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
              <option value="exp_red">بدون سابقه مرتبط 🔴</option>
              <option value="exp_yellow">۱ تا ۳ سال 🟡</option>
              <option value="exp_green">بیشتر از ۳ سال 🟢</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>دقت ظاهری رزومه:</label>
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

      {/* SECTION 2 */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">بخش دوم: مصاحبه تلفنی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>انرژی، فن بیان و لحن صدا:</label>
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
              <option value="in_budget">در بودجه است 🟢</option>
              <option value="negotiable">قابل مذاکره 🟡</option>
              <option value="out_of_budget">خارج از بودجه 🔴</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>دلیل ترک کار قبلی / انگیزه جابجایی:</label>
            <input type="text" value={answers.leaveReason} onChange={(e) => setField('leaveReason', e.target.value)} className={fieldClass} placeholder="مثلا رشد شغلی، جابجایی شهر..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>شرح روتین کاری گذشته:</label>
            <textarea rows={3} value={answers.phoneRoutine} onChange={(e) => setField('phoneRoutine', e.target.value)} className={fieldClass} placeholder="توضیحات..." />
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
            <label className={labelClass}>نتیجه مصاحبه تلفنی:</label>
            <div className="flex flex-wrap gap-6">
              {[
                { value: 'reject', label: 'رد 🔴' },
                { value: 'invite_test', label: 'دعوت به مصاحبه حضوری / تست 🟢' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="phoneResult" value={opt.value} checked={answers.phoneResult === opt.value} onChange={(e) => setField('phoneResult', e.target.value)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2.5 Logistics */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">بخش سوم: شرایط همکاری و زبان</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className={labelClass}>سطح زبان انگلیسی:</label>
            <select value={answers.englishLevel} onChange={(e) => setField('englishLevel', e.target.value)} className={fieldClass}>
              <option value="">-- انتخاب کنید --</option>
              <option value="beginner">مبتدی</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">پیشرفته</option>
              <option value="fluent">فصیح / Fluent</option>
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
            <label className={labelClass}>زمان شروع به‌کار (Notice Period):</label>
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

      {/* DISC */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">بخش چهارم: تحلیل رفتارشناسی (DISC)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>تیپ شخصیتی غالب:</label>
            <div className="flex gap-3 flex-wrap">
              {['D', 'I', 'S', 'C'].map((type) => {
                const isChecked = answers.discDominant.includes(type);
                return (
                  <label key={type} className={`flex items-center gap-2 cursor-pointer text-sm font-bold px-3 py-1.5 border rounded-xl ${isChecked ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setField(
                          'discDominant',
                          isChecked ? answers.discDominant.filter((t) => t !== type) : [...answers.discDominant, type]
                        );
                      }}
                    />
                    <span>{type}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>میزان انطباق با نقش (دقت و صبر):</label>
            <select value={answers.supportFit} onChange={(e) => setField('supportFit', e.target.value)} className={fieldClass}>
              <option value="">-- انتخاب کنید --</option>
              <option value="fit_green">انطباق بالا 🟢</option>
              <option value="fit_yellow">انطباق متوسط 🟡</option>
              <option value="fit_red">پرریسک 🔴</option>
            </select>
          </div>
        </div>
      </div>

      {/* STAR + Culture */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">بخش پنجم: ارزیابی حضوری (STAR & Culture Fit)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>سنجش صداقت و دقت (مثال از خطای کاری گذشته):</label>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <StarRating rating={answers.starHonesty} onRatingChange={(v) => setField('starHonesty', v)} />
              <input type="text" value={answers.starHonestyExample} onChange={(e) => setField('starHonestyExample', e.target.value)} placeholder="مثال ذکر شده..." className={`flex-grow ${fieldClass}`} />
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
            <label className={labelClass}>انطباق فرهنگی (Culture Fit):</label>
            <StarRating rating={answers.cultureFit} onRatingChange={(v) => setField('cultureFit', v)} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>یادداشت Culture Fit:</label>
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

      {/* Tests summary */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">خلاصه آزمون‌ها</h3>
        {activeTests.length === 0 ? (
          <p className="text-sm text-slate-500">هنوز آزمونی ارسال یا ثبت نشده است.</p>
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
                    {tr.notes && <span className="text-slate-500 truncate max-w-[200px]">{tr.notes}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Specialized */}
      <div className={`${sectionClass} space-y-6`}>
        <div className="border-b border-slate-100 pb-4 space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="text-md font-bold text-slate-800">بخش ششم: ارزیابی تخصصی ({candidate.position})</h3>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
              {selectedCategory === 'tech' ? 'فنی و مهندسی' : selectedCategory === 'sales' ? 'فروش و بازاریابی' : selectedCategory === 'product' ? 'محصول و مدیریت' : 'عمومی و سایر'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 self-center ml-2 font-medium">قالب:</span>
            {[
              { id: 'tech' as const, label: 'فنی' },
              { id: 'sales' as const, label: 'فروش' },
              { id: 'product' as const, label: 'محصول' },
              { id: 'other' as const, label: 'عمومی' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory === 'tech' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className={labelClass}>دانش فنی / ابزارها:</label><StarRating rating={answers.techKnowledge} onRatingChange={(v) => setField('techKnowledge', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>کیفیت کدنویسی و معماری:</label><StarRating rating={answers.techCodingQuality} onRatingChange={(v) => setField('techCodingQuality', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>System Design:</label><StarRating rating={answers.techSystemDesign} onRatingChange={(v) => setField('techSystemDesign', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>Git / CI-CD و کار تیمی فنی:</label><StarRating rating={answers.techGitCollaboration} onRatingChange={(v) => setField('techGitCollaboration', v)} /></div>
            <div className="space-y-2 md:col-span-2">
              <span className={labelClass}>حل مسئله:</span>
              <div className="flex flex-wrap gap-4 mt-1">
                {['ضعیف', 'متوسط و منطقی', 'عالی و سریع'].map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input type="radio" name="techProblemSolving" value={val} checked={answers.techProblemSolving === val} onChange={(e) => setField('techProblemSolving', e.target.value)} />
                    <span>{val}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass}>نمره / تحلیل تسک فنی:</label>
              <input type="text" value={answers.techTaskScore} onChange={(e) => setField('techTaskScore', e.target.value)} className={fieldClass} />
            </div>
          </div>
        )}

        {selectedCategory === 'sales' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className={labelClass}>مذاکره و متقاعدسازی:</label><StarRating rating={answers.salesNegotiation} onRatingChange={(v) => setField('salesNegotiation', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>درک بازار و نیاز مشتری:</label><StarRating rating={answers.salesMarketAnalysis} onRatingChange={(v) => setField('salesMarketAnalysis', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>هدف‌گرایی و پیگیری:</label><StarRating rating={answers.salesGoalOrientation} onRatingChange={(v) => setField('salesGoalOrientation', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>همدلی و روابط عمومی:</label><StarRating rating={answers.salesCustomerEmpathy} onRatingChange={(v) => setField('salesCustomerEmpathy', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>Closing:</label><StarRating rating={answers.salesClosingAbility} onRatingChange={(v) => setField('salesClosingAbility', v)} /></div>
            <div className="space-y-2 md:col-span-2">
              <span className={labelClass}>نتیجه سناریوی فروش:</span>
              <div className="flex flex-wrap gap-4 mt-1">
                {['ضعیف', 'متوسط (نیاز به آموزش)', 'عالی و مسلط'].map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input type="radio" name="salesScenarioPlay" value={val} checked={answers.salesScenarioPlay === val} onChange={(e) => setField('salesScenarioPlay', e.target.value)} />
                    <span>{val}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedCategory === 'product' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className={labelClass}>تفکر محصولی و اولویت‌بندی:</label><StarRating rating={answers.productStrategy} onRatingChange={(v) => setField('productStrategy', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>درک UI/UX:</label><StarRating rating={answers.productDesignSense} onRatingChange={(v) => setField('productDesignSense', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>رهبری و هماهنگی تیمی:</label><StarRating rating={answers.productLeadership} onRatingChange={(v) => setField('productLeadership', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>تحلیل داده و متریک:</label><StarRating rating={answers.productDataAnalysis} onRatingChange={(v) => setField('productDataAnalysis', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>درک فنی:</label><StarRating rating={answers.productTechnicalUnderstanding} onRatingChange={(v) => setField('productTechnicalUnderstanding', v)} /></div>
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass}>Case Study / پورتفولیو:</label>
              <textarea rows={3} value={answers.productCaseStudy} onChange={(e) => setField('productCaseStudy', e.target.value)} className={fieldClass} />
            </div>
          </div>
        )}

        {selectedCategory === 'other' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className={labelClass}>مهارت تخصصی:</label><StarRating rating={answers.otherSkills} onRatingChange={(v) => setField('otherSkills', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>سرعت یادگیری:</label><StarRating rating={answers.otherLearningSpeed} onRatingChange={(v) => setField('otherLearningSpeed', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>دقت و جزئیات:</label><StarRating rating={answers.otherDetailOrientation} onRatingChange={(v) => setField('otherDetailOrientation', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>نگارش و مستندسازی:</label><StarRating rating={answers.otherWrittenCommunication} onRatingChange={(v) => setField('otherWrittenCommunication', v)} /></div>
            <div className="space-y-2"><label className={labelClass}>حل مسئله و بحران:</label><StarRating rating={answers.otherProblemHandling} onRatingChange={(v) => setField('otherProblemHandling', v)} /></div>
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass}>نتیجه کار عملی:</label>
              <input type="text" value={answers.otherTaskResult} onChange={(e) => setField('otherTaskResult', e.target.value)} className={fieldClass} />
            </div>
          </div>
        )}
      </div>

      {/* Final summary */}
      <div className={sectionClass}>
        <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">بخش هفتم: جمع‌بندی نهایی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>نقاط قوت:</label>
            <textarea rows={2} value={answers.strengths} onChange={(e) => setField('strengths', e.target.value)} className={fieldClass} placeholder="۳ نقطه قوت اصلی..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>نقاط ضعف / نیاز به آموزش:</label>
            <textarea rows={2} value={answers.weaknesses} onChange={(e) => setField('weaknesses', e.target.value)} className={fieldClass} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>پرچم‌های قرمز (Red Flags):</label>
            <textarea rows={2} value={answers.redFlags} onChange={(e) => setField('redFlags', e.target.value)} className={`${fieldClass} border-red-100 focus:border-red-300`} placeholder="تناقض رزومه، رفتار نامناسب، ..." />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Reference Check:</label>
            <div className="space-y-2">
              {[
                { value: 'yes_confirmed', label: 'بله، تایید شد' },
                { value: 'no_check', label: 'خیر' },
                { value: 'negative_feedback', label: 'انجام شد اما نظرات منفی بود' },
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
              <option value="standby">لیست ذخیره (Standby)</option>
              <option value="reject">رد قطعی (Reject)</option>
            </select>
          </div>

          {answers.finalDecision === 'offer' && (
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass}>پیشنهاد حقوق Offer (تومان):</label>
              <input type="text" value={answers.offerSalary} onChange={(e) => setField('offerSalary', e.target.value)} className={fieldClass} placeholder="مبلغ پیشنهادی برای Offer" />
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>چک‌لیست مدارک:</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DOC_ITEMS.map((item) => (
                <label key={item.key} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border cursor-pointer ${answers.docsChecklist[item.key] ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <input type="checkbox" checked={answers.docsChecklist[item.key]} onChange={() => toggleDoc(item.key)} />
                  <span className="font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>یادداشت و تحلیل نهایی مدیر ارزیاب:</label>
            <textarea rows={4} value={answers.finalNotes} onChange={(e) => setField('finalNotes', e.target.value)} className={fieldClass} />
          </div>
        </div>
      </div>

      {/* Evaluator history */}
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
                  {h.finalDecision && <span className="text-slate-600 font-semibold">{h.finalDecision}</span>}
                  <span className="text-slate-400">{formatTimestamp(h.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handlePrint}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-5 rounded-xl text-sm transition-all"
        >
          چاپ / خروجی PDF
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
        >
          {isSaving ? 'در حال ذخیره...' : 'ثبت نهایی ارزیابی'}
        </button>
      </div>
    </div>
  );
};

export default EvaluationForm;
