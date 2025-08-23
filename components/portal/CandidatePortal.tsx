import React, { useState } from 'react';
import { Candidate, TestResult, TestLibraryItem } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';

interface CandidatePortalProps {
  candidate: Candidate;
  onUpdateTestResult: (candidateId: string, testId: string, resultData: Partial<TestResult>) => Promise<void>;
}

const STAGE_MESSAGES: Record<string, { title: string, message: string }> = {
    'inbox': { title: "دریافت شد", message: "از اینکه برای این موقعیت شغلی اقدام کردید سپاسگزاریم. رزومه شما دریافت شده است." },
    'review': { title: "در حال بررسی", message: "رزومه شما در حال بررسی توسط تیم استخدام ما است. به زودی نتیجه را به شما اطلاع خواهیم داد." },
    'interview-1': { title: "مصاحبه اول", message: "شما به مرحله مصاحبه اول دعوت شده‌اید. لطفاً منتظر تماس یا ایمیل ما برای هماهنگی زمان باشید." },
    'interview-2': { title: "مصاحبه دوم", message: "شما به مرحله مصاحبه فنی/نهایی دعوت شده‌اید. هماهنگی‌های لازم به زودی انجام خواهد شد." },
    'test': { title: "آزمون", message: "از شما درخواست می‌شود تا آزمون‌های مشخص شده را تکمیل فرمایید. لطفاً لینک نتایج را در بخش زیر وارد کنید." },
    'hired': { title: "استخدام", message: "تبریک می‌گوییم! شما در این موقعیت شغلی پذیرفته شده‌اید. به زودی برای مراحل اداری با شما تماس خواهیم گرفت." },
    'rejected': { title: "پایان فرآیند", message: "از علاقه شما به همکاری با شرکت ما سپاسگزاریم. در حال حاضر امکان ادامه همکاری وجود ندارد. برای شما آرزوی موفقیت داریم." },
};

const TestSubmissionItem: React.FC<{
  test: TestLibraryItem;
  result: TestResult | undefined;
  candidateId: string;
  onUpdateTestResult: CandidatePortalProps['onUpdateTestResult'];
}> = ({ test, result, candidateId, onUpdateTestResult }) => {
    const [url, setUrl] = useState(result?.resultUrl || '');
    const { addToast } = useToast();
    const isSubmitted = result?.status === 'submitted' || result?.status === 'review' || result?.status === 'passed' || result?.status === 'failed';

    const handleSubmit = () => {
        if (!url.trim() || !url.startsWith('http')) {
            addToast('لطفا یک لینک معتبر وارد کنید.', 'error');
            return;
        }
        onUpdateTestResult(candidateId, test.id, {
            resultUrl: url,
            status: 'submitted',
        });
        addToast('لینک شما با موفقیت ثبت شد.', 'success');
    };

    return (
        <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold">{test.name}</h4>
            {isSubmitted ? (
                 <div className="mt-2 p-3 bg-green-50 text-green-700 rounded-md">
                    <p className="font-bold">لینک نتیجه ثبت شده است.</p>
                    <p className="text-sm break-all">لینک: <a href={result?.resultUrl} target="_blank" rel="noopener noreferrer" className="underline">{result?.resultUrl}</a></p>
                    <p className="text-xs mt-1">در صورت نیاز به تغییر، لینک جدید را وارد کرده و دوباره ثبت کنید.</p>
                </div>
            ) : (
                 <p className="text-sm text-gray-500 mt-1">لطفا پس از انجام آزمون، لینک صفحه نتیجه را در کادر زیر وارد و ثبت کنید.</p>
            )}
           
            <div className="flex gap-2 mt-3">
                <input 
                    type="url" 
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://... لینک نتیجه آزمون"
                    className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                />
                <button onClick={handleSubmit} className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">
                    {isSubmitted ? 'به‌روزرسانی' : 'ثبت لینک'}
                </button>
            </div>
        </div>
    )
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ candidate, onUpdateTestResult }) => {
  const { testLibrary } = useSettings();
  const assignedTests = candidate.testResults?.filter(r => r.status === 'pending' || r.status === 'submitted' || r.resultUrl) || [];
  const assignedTestItems = testLibrary.filter(t => assignedTests.some(at => at.testId === t.id));
  const currentStageInfo = STAGE_MESSAGES[candidate.stage] || { title: "نامشخص", message: "وضعیت فرآیند استخدام شما در حال حاضر نامشخص است." };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">پورتال متقاضی</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:p-8 bg-white shadow rounded-lg">
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">سلام، {candidate.name}!</h2>
                    <p className="text-md text-gray-600">شما برای موقعیت شغلی <span className="font-semibold text-indigo-600">{candidate.position}</span> اقدام کرده‌اید.</p>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800">وضعیت فعلی شما</h3>
                    <div className="mt-3 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                        <p className="font-bold text-blue-800">{currentStageInfo.title}</p>
                        <p className="text-sm text-blue-700">{currentStageInfo.message}</p>
                    </div>
                </div>

                {assignedTestItems.length > 0 && (
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-800">آزمون‌های شما</h3>
                        <div className="mt-3 space-y-4">
                           {assignedTestItems.map(test => (
                               <TestSubmissionItem 
                                    key={test.id}
                                    test={test}
                                    result={candidate.testResults?.find(r => r.testId === test.id)}
                                    candidateId={candidate.id}
                                    onUpdateTestResult={onUpdateTestResult}
                               />
                           ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default CandidatePortal;