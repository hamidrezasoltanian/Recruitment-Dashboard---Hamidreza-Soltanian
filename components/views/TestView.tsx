import React, { useState, useEffect, useMemo } from 'react';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useSettings } from '../../contexts/SettingsContext';
import { TestResult, TestLibraryItem, Candidate } from '../../types';
import { dbService } from '../../services/dbService';
import { useToast } from '../../contexts/ToastContext';
import SelectCandidateModal from '../modals/SelectCandidateModal';
import TestSelectionModal from '../modals/TestSelectionModal';

interface TestResultGroupProps {
  test: TestLibraryItem;
  result: TestResult | undefined;
  candidateId: string;
}

const TestResultGroup: React.FC<TestResultGroupProps> = ({ test, result, candidateId }) => {
    const { updateTestResult } = useCandidates();
    const { addToast } = useToast();

    const [score, setScore] = useState(result?.score || '');
    const [notes, setNotes] = useState(result?.notes || '');
    const [status, setStatus] = useState(result?.status || 'not_sent');
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const testFileId = `${candidateId}_${test.id}`;

    useEffect(() => {
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
        // Clean up object URL
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        }
    }, [result?.file, testFileId]);
    
    // Update local state if result prop changes
    useEffect(() => {
        setScore(result?.score || '');
        setNotes(result?.notes || '');
        setStatus(result?.status || 'not_sent');
    }, [result]);


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
        passed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        review: 'bg-blue-100 text-blue-800',
    };

    const statusText: Record<string, string> = {
        not_sent: 'ارسال نشده',
        pending: 'در انتظار نتیجه',
        passed: 'قبول',
        failed: 'مردود',
        review: 'نیاز به بررسی',
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-3">{test.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">وضعیت</label>
                    <select value={status} onChange={e => setStatus(e.target.value as TestResult['status'])} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] ${statusClasses[status]}`}>
                        <option value="not_sent">{statusText.not_sent}</option>
                        <option value="pending">{statusText.pending}</option>
                        <option value="passed">{statusText.passed}</option>
                        <option value="failed">{statusText.failed}</option>
                        <option value="review">{statusText.review}</option>
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
                        <div className="mt-1">
                            <a href={filePreview} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary-600)] hover:underline truncate block">
                                {result?.file?.name}
                            </a>
                        </div>
                    ) : (
                        <input type="file" onChange={handleFileChange} className="mt-1 text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary-50)] file:text-[var(--color-primary-700)] hover:file:bg-[var(--color-primary-100)]"/>
                    )}
                </div>

                {/* Notes */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">یادداشت</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="تحلیل یا نکات کلیدی..." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                </div>

                {/* Save Button */}
                <div className="lg:col-span-2 flex justify-end">
                    <button onClick={handleSave} className="bg-[var(--color-primary-600)] text-white py-2 px-6 rounded-lg hover:bg-[var(--color-primary-700)]">ذخیره نتیجه</button>
                </div>
            </div>
        </div>
    )
}

interface TestViewProps {
  initialExpandedCandidateId: string | null;
}

const TestView: React.FC<TestViewProps> = ({ initialExpandedCandidateId }) => {
  const { candidates } = useCandidates();
  const { testLibrary } = useSettings();
  
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(initialExpandedCandidateId);
  const [isSelectCandidateModalOpen, setSelectCandidateModalOpen] = useState(false);
  const [candidateToSendTest, setCandidateToSendTest] = useState<string | null>(null);
  
  useEffect(() => {
    setExpandedCandidateId(initialExpandedCandidateId);
  }, [initialExpandedCandidateId]);

  const candidatesWithSentTests = useMemo(() => {
    const activeStages = ['hired', 'rejected', 'archived'];
    return candidates.filter(c =>
      c.testResults && c.testResults.length > 0 && !activeStages.includes(c.stage)
    );
  }, [candidates]);
  
  const handleSelectCandidateForNewTest = (candidateId: string) => {
    setCandidateToSendTest(candidateId);
    setSelectCandidateModalOpen(false);
  };
  
  const toggleExpand = (candidateId: string) => {
    setExpandedCandidateId(prevId => prevId === candidateId ? null : candidateId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">مدیریت آزمون‌ها</h2>
          <p className="text-sm text-gray-500">مشاهده و ثبت نتایج آزمون‌های ارسال شده برای متقاضیان فعال.</p>
        </div>
        <div>
          <button 
            onClick={() => setSelectCandidateModalOpen(true)} 
            className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600"
          >
            ارسال آزمون به متقاضی
          </button>
        </div>
      </div>

      {candidatesWithSentTests.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-gray-700">هیچ آزمونی ارسال نشده است</h3>
          <p className="mt-2 text-gray-500">برای ارسال آزمون به یک متقاضی، از دکمه "ارسال آزمون به متقاضی" استفاده کنید.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidatesWithSentTests.map(candidate => {
            const candidateTests = candidate.testResults?.map(result => ({
                result,
                testDetails: testLibrary.find(t => t.id === result.testId)
            })).filter(item => item.testDetails);

            const pendingCount = candidateTests?.filter(t => t.result.status === 'pending').length || 0;

            return (
              <div key={candidate.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div 
                  onClick={() => toggleExpand(candidate.id)} 
                  className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-lg text-[var(--color-primary-700)]">{candidate.name}</p>
                    <p className="text-sm text-gray-600">{candidate.position}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">
                      {candidateTests?.length || 0} آزمون
                      {pendingCount > 0 && ` (${pendingCount} در انتظار)`}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform ${expandedCandidateId === candidate.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {expandedCandidateId === candidate.id && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                    {candidateTests && candidateTests.length > 0 ? (
                        candidateTests.map(({result, testDetails}) => (
                            <TestResultGroup
                                key={testDetails!.id}
                                test={testDetails!}
                                result={result}
                                candidateId={candidate.id}
                            />
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">آزمونی برای این متقاضی ثبت نشده است.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <SelectCandidateModal
        isOpen={isSelectCandidateModalOpen}
        onClose={() => setSelectCandidateModalOpen(false)}
        onSelect={handleSelectCandidateForNewTest}
      />
      {candidateToSendTest && (
        <TestSelectionModal
          isOpen={!!candidateToSendTest}
          onClose={() => setCandidateToSendTest(null)}
          candidateId={candidateToSendTest}
        />
      )}
    </div>
  );
};

export default TestView;
