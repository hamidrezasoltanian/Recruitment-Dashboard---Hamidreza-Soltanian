import React, { useState, useEffect } from 'react';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useSettings } from '../../contexts/SettingsContext';
import { TestResult, TestLibraryItem, Candidate } from '../../types';
import { dbService } from '../../services/dbService';
import { useToast } from '../../contexts/ToastContext';
import AiAnalysisModal from '../modals/AiAnalysisModal';

interface TestViewProps {
  selectedCandidateId: string | null;
  onSelectCandidateClick: () => void;
  onSendTestClick: () => void;
}

const TestResultGroup: React.FC<{
  test: TestLibraryItem;
  result: TestResult | undefined;
  candidateId: string;
}> = ({ test, result, candidateId }) => {
    const { updateTestResult } = useCandidates();
    const { addToast } = useToast();

    const [score, setScore] = useState(result?.score || '');
    const [notes, setNotes] = useState(result?.notes || '');
    const [status, setStatus] = useState(result?.status || 'not_sent');
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    const testFileId = `${candidateId}_${test.id}`;

    useEffect(() => {
        setScore(result?.score || '');
        setNotes(result?.notes || '');
        setStatus(result?.status || 'not_sent');

        const loadPreview = async () => {
            if (result?.file) {
                try {
                    const fileBlob = await dbService.getTestFile(testFileId);
                    if (fileBlob) {
                        setFilePreview(URL.createObjectURL(fileBlob));
                    }
                } catch (e) {
                    console.error("Failed to load test file preview", e);
                }
            } else {
                setFilePreview(null);
            }
        };
        loadPreview();
        
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        }
    }, [result, testFileId]);


    const handleSave = () => {
        const resultData: Partial<TestResult> = {
            score: score ? Number(score) : undefined,
            notes,
            status,
        };
        updateTestResult(candidateId, test.id, resultData);
        addToast(`نتیجه آزمون ${test.name} ذخیره شد.`, 'success');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                await dbService.saveTestFile(testFileId, file);
                await updateTestResult(candidateId, test.id, {
                    file: { name: file.name, type: file.type }
                });
                addToast(`فایل برای آزمون ${test.name} آپلود شد.`, 'success');
                if (filePreview) URL.revokeObjectURL(filePreview);
                setFilePreview(URL.createObjectURL(file));
            } catch (err) {
                addToast('خطا در ذخیره فایل آزمون.', 'error');
            }
        }
    };
    
    const statusClasses: Record<string, string> = {
        not_sent: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800',
        submitted: 'bg-blue-100 text-blue-800',
        passed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        review: 'bg-purple-100 text-purple-800',
    };

    const statusText: Record<string, string> = {
        not_sent: 'ارسال نشده',
        pending: 'در انتظار نتیجه',
        submitted: 'نتیجه ارسال شد',
        passed: 'قبول',
        failed: 'مردود',
        review: 'نیاز به بررسی',
    };

    return (
        <>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-3">{test.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">وضعیت</label>
                        <select value={status} onChange={e => setStatus(e.target.value as TestResult['status'])} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${statusClasses[status]}`}>
                            {Object.entries(statusText).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>

                    {/* Score */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نمره</label>
                        <input type="number" value={score} onChange={e => setScore(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                    </div>
                    
                    {/* File Upload / Preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">فایل نتیجه</label>
                        {filePreview ? (
                            <div className="mt-2">
                                <a href={filePreview} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate block">
                                    {result?.file?.name}
                                </a>
                            </div>
                        ) : (
                            <input type="file" onChange={handleFileChange} className="mt-2 text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                        )}
                    </div>
                    
                    {result?.resultUrl && (
                        <div className="md:col-span-2 lg:col-span-3 bg-gray-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-gray-700">لینک ارسالی متقاضی:</p>
                            <div className="flex items-center justify-between gap-4 mt-1">
                                <a href={result.resultUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate block">{result.resultUrl}</a>
                                <button onClick={() => setIsAiModalOpen(true)} className="flex-shrink-0 bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-bold py-2 px-3 rounded-lg">تحلیل با AI ✨</button>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">یادداشت</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="تحلیل یا نکات کلیدی..." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm h-24" />
                    </div>

                    {/* Save Button */}
                    <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                        <button onClick={handleSave} className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700">ذخیره نتیجه</button>
                    </div>
                </div>
            </div>
            {isAiModalOpen && (
                <AiAnalysisModal 
                    isOpen={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    testName={test.name}
                    onSaveSummary={(summary) => {
                        setNotes(prev => prev ? `${prev}\n\n--- تحلیل AI ---\n${summary}` : summary);
                        setStatus('review');
                        updateTestResult(candidateId, test.id, { 
                            notes: notes ? `${notes}\n\n--- تحلیل AI ---\n${summary}` : summary, 
                            status: 'review' 
                        });
                    }}
                />
            )}
        </>
    )
}

const TestView: React.FC<TestViewProps> = ({ selectedCandidateId, onSelectCandidateClick, onSendTestClick }) => {
  const { candidates } = useCandidates();
  const { testLibrary } = useSettings();
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    if (selectedCandidateId) {
      const found = candidates.find(c => c.id === selectedCandidateId);
      setCandidate(found || null);
    } else {
      setCandidate(null);
    }
  }, [selectedCandidateId, candidates]);

  if (!candidate) {
    return (
      <div className="text-center p-10 bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-bold text-gray-700">مدیریت آزمون‌ها</h3>
        <p className="mt-2 text-gray-500">برای مشاهده، ارسال یا ثبت نتایج آزمون، لطفا ابتدا یک متقاضی را انتخاب کنید.</p>
        <button onClick={onSelectCandidateClick} className="mt-4 bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700">
          انتخاب متقاضی
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">مدیریت آزمون: {candidate.name}</h2>
            <p className="text-sm text-gray-500">{candidate.position}</p>
        </div>
        <div>
          <button onClick={onSelectCandidateClick} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 mr-2">تغییر متقاضی</button>
          <button onClick={onSendTestClick} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">ارسال آزمون جدید</button>
        </div>
      </div>

      <div className="space-y-4">
        {testLibrary.map(test => (
          <TestResultGroup 
            key={test.id} 
            test={test} 
            result={(candidate.testResults || []).find(r => r.testId === test.id)}
            candidateId={candidate.id}
          />
        ))}
        {testLibrary.length === 0 && (
            <div className="text-center p-10 bg-white rounded-lg shadow-sm border">
                <p className="text-gray-500">هیچ آزمونی در کتابخانه آزمون شما وجود ندارد.</p>
                <p className="text-sm text-gray-400 mt-1">برای افزودن آزمون به تنظیمات {' > '} کتابخانه آزمون مراجعه کنید.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default TestView;