import React, { useEffect, useMemo, useState } from 'react';
import { Candidate, CandidateInterviewEvaluation, InterviewSection, InterviewScriptQuestion } from '../../types';
import { apiService } from '../../services/apiService';
import { useToast } from '../../contexts/ToastContext';

interface InterviewEvaluationPanelProps {
  candidate: Candidate;
  compact?: boolean;
}

type QuestionState = InterviewScriptQuestion & { score: number | null; comment: string };
type SectionState = Omit<InterviewSection, 'questions'> & { questions: QuestionState[] };

const InterviewEvaluationPanel: React.FC<InterviewEvaluationPanelProps> = ({ candidate }) => {
  const [evaluation, setEvaluation] = useState<CandidateInterviewEvaluation | null>(null);
  const [sections, setSections] = useState<SectionState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    apiService.getCandidateInterviewEvaluation(candidate.id)
      .then((data) => {
        if (cancelled) return;
        setEvaluation(data);
        setSections(
          (data.sections || []).map((section) => ({
            ...section,
            questions: (section.questions || []).map((q) => ({
              ...q,
              maxScore: q.maxScore || 4,
              score: typeof q.score === 'number' ? q.score : null,
              comment: q.comment || '',
            })),
          }))
        );
      })
      .catch(() => {
        if (cancelled) return;
        setEvaluation(null);
        setSections([]);
        addToast('خطا در بارگذاری سناریوی مصاحبه.', 'error');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [candidate.id, candidate.position, addToast]);

  const allQuestions = useMemo(
    () => sections.flatMap((s) => s.questions),
    [sections]
  );

  const totalScore = useMemo(() => {
    const scored = allQuestions.filter((q) => typeof q.score === 'number');
    if (scored.length === 0) return null;
    const earned = scored.reduce((sum, q) => sum + (q.score || 0), 0);
    const max = scored.reduce((sum, q) => sum + (q.maxScore || 4), 0);
    return { earned, max, answered: scored.length, total: allQuestions.length };
  }, [allQuestions]);

  const updateQuestion = (questionId: string, patch: Partial<Pick<QuestionState, 'score' | 'comment'>>) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        questions: section.questions.map((q) =>
          q.id === questionId ? { ...q, ...patch } : q
        ),
      }))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiService.saveCandidateInterviewEvaluation(
        candidate.id,
        allQuestions.map((q) => ({
          questionId: q.id,
          score: q.score,
          comment: q.comment || '',
        }))
      );
      addToast('ارزیابی مصاحبه ذخیره شد.', 'success');
    } catch {
      addToast('خطا در ذخیره ارزیابی.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const scoreGuide = evaluation?.scoreGuide || {};

  if (isLoading) {
    return <p className="text-sm text-slate-500 text-center py-10">در حال بارگذاری سناریوی مصاحبه...</p>;
  }

  if (!evaluation || sections.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-sm text-slate-700 font-medium">
          برای پوزیشن «{candidate.position}» هنوز سناریوی مصاحبه تعریف نشده است.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          از تنظیمات ← پروفایل شرکت، سناریو را اضافه یا «اعمال سناریوهای پیش‌فرض» را بزنید.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div>
          <h3 className="font-bold text-slate-800">سناریوی مصاحبه تخصصی</h3>
          <p className="text-sm text-slate-500 mt-1">
            {evaluation.positionTitle}
            {evaluation.interviewDurationMinutes ? ` · ${evaluation.interviewDurationMinutes} دقیقه` : ''}
          </p>
          {totalScore && (
            <p className="text-sm text-[var(--color-primary-700)] mt-1 font-semibold">
              امتیاز: {totalScore.earned} از {totalScore.max}
              <span className="text-slate-500 font-normal mr-2">
                ({totalScore.answered}/{totalScore.total} سوال)
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--color-primary-600)] text-white font-bold py-2.5 px-5 rounded-lg hover:bg-[var(--color-primary-700)] disabled:opacity-60"
        >
          {isSaving ? 'در حال ذخیره...' : 'ذخیره ارزیابی'}
        </button>
      </div>

      {Object.keys(scoreGuide).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs sm:text-sm text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-semibold text-amber-900">راهنمای نمره:</span>
          {Object.entries(scoreGuide)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([k, v]) => (
              <span key={k}>
                <span className="font-bold">{k}</span> {v}
              </span>
            ))}
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section, sIndex) => (
          <div key={section.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-sm font-bold text-slate-800">
                {sIndex + 1}. {section.title}
              </p>
              <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                {section.durationMinutes} دقیقه
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {section.questions.map((q, qIndex) => (
                <div key={q.id} className="p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <p className="flex-1 text-sm text-slate-800 leading-7 min-w-0">
                      <span className="text-slate-400 ml-1">{qIndex + 1}.</span>
                      {q.text}
                    </p>

                    <div className="flex-shrink-0 sm:pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-500 ml-1">نمره:</span>
                        {Array.from({ length: q.maxScore || 4 }, (_, i) => i + 1).map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => updateQuestion(q.id, { score })}
                            className={`w-8 h-8 rounded-md text-sm font-semibold border transition-colors ${
                              q.score === score
                                ? 'bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-[var(--color-primary-400)]'
                            }`}
                            title={`نمره ${score}`}
                          >
                            {score}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => updateQuestion(q.id, { score: null })}
                          className={`px-2 h-8 rounded-md text-xs border ${
                            q.score === null
                              ? 'bg-slate-700 text-white border-slate-700'
                              : 'bg-white text-slate-500 border-slate-200'
                          }`}
                          title="بدون نمره"
                        >
                          —
                        </button>
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.comment}
                    onChange={(e) => updateQuestion(q.id, { comment: e.target.value })}
                    placeholder="کامنت کوتاه برای این سوال..."
                    className="w-full border border-slate-200 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 py-3 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--color-primary-600)] text-white font-bold py-2.5 px-6 rounded-lg hover:bg-[var(--color-primary-700)] disabled:opacity-60"
        >
          {isSaving ? 'در حال ذخیره...' : 'ذخیره ارزیابی مصاحبه'}
        </button>
      </div>
    </div>
  );
};

export default InterviewEvaluationPanel;
