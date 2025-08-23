import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { aiService } from '../../services/aiService';
import { useToast } from '../../contexts/ToastContext';

interface AiAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    testName: string;
    onSaveSummary: (summary: string) => void;
}

const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({ isOpen, onClose, testName, onSaveSummary }) => {
    const [resultText, setResultText] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleAnalyze = async () => {
        if (!resultText.trim()) {
            addToast('لطفا متن نتیجه آزمون را وارد کنید.', 'error');
            return;
        }
        setIsLoading(true);
        setAnalysis('');
        try {
            const summary = await aiService.analyzeTestResult(testName, resultText);
            setAnalysis(summary);
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (!analysis) {
            addToast('ابتدا باید تحلیلی برای ذخیره کردن وجود داشته باشد.', 'error');
            return;
        }
        onSaveSummary(analysis);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`تحلیل نتیجه آزمون "${testName}" با هوش مصنوعی`}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="test-result-text" className="block text-sm font-medium text-gray-700">متن نتیجه آزمون</label>
                    <p className="text-xs text-gray-500 mb-2">به دلیل محدودیت‌های امنیتی، لطفاً لینک نتیجه را باز کرده و متن کامل آن را در کادر زیر کپی کنید.</p>
                    <textarea 
                        id="test-result-text"
                        rows={10}
                        value={resultText}
                        onChange={e => setResultText(e.target.value)}
                        placeholder="متن کامل نتیجه آزمون را اینجا جای‌گذاری کنید..."
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                
                <div className="text-center">
                    <button onClick={handleAnalyze} disabled={isLoading} className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                        {isLoading ? 'در حال تحلیل...' : 'شروع تحلیل'}
                    </button>
                </div>

                {analysis && (
                    <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-bold text-gray-800">خلاصه تحلیل AI:</h4>
                        <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap text-sm text-gray-700 max-h-60 overflow-y-auto">{analysis}</div>
                        <div className="flex justify-end pt-2">
                             <button onClick={handleSave} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                                ذخیره تحلیل به عنوان یادداشت
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AiAnalysisModal;
