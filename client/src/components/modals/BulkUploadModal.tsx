import React, { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import { useCandidates } from '../../contexts/CandidatesContext';
import { apiService } from '../../services/apiService';
import { useToast } from '../../contexts/ToastContext';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadResult {
  addedCount: number;
  addedCandidates: { name: string; position: string; email: string; phone: string }[];
  skippedCandidates: { filename: string; name: string; reason: string }[];
  errors: { filename: string; error: string }[];
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose }) => {
  const { refreshCandidates } = useCandidates();
  const { addToast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).filter(file => 
        file.type === 'application/pdf' || file.name.endsWith('.pdf')
      );
      if (filesArray.length === 0) {
        addToast('لطفا فقط فایل‌های PDF انتخاب کنید.', 'error');
        return;
      }
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/pdf' || file.name.endsWith('.pdf')
      );
      if (filesArray.length === 0) {
        addToast('لطفا فقط فایل‌های PDF انتخاب کنید.', 'error');
        return;
      }
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setUploadResult(null);

    try {
      const res = await apiService.bulkUploadResumes(selectedFiles);
      if (res.success) {
        setUploadResult({
          addedCount: res.addedCount || 0,
          addedCandidates: res.addedCandidates || [],
          skippedCandidates: res.skippedCandidates || [],
          errors: res.errors || []
        });
        addToast(`پردازش رزومه‌ها با موفقیت پایان یافت. ${res.addedCount} متقاضی جدید افزوده شد.`, 'success');
        await refreshCandidates();
      } else {
        throw new Error(res.error || 'خطا در آپلود');
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'خطا در آپلود گروهی رزومه‌ها', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="آپلود گروهی رزومه‌ها" size="large">
      <div className="space-y-6 text-right" dir="rtl">
        {!uploadResult && (
          <>
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] transition-all duration-200"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                multiple 
                accept=".pdf"
                className="hidden" 
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-bold text-gray-700">فایل‌های رزومه را اینجا بکشید یا کلیک کنید</p>
              <p className="text-xs text-gray-400 mt-2">تنها فایل‌های با فرمت PDF مجاز هستند</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-700">فایل‌های انتخاب شده ({selectedFiles.length} فایل)</h4>
                  <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-700">حذف همه</button>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{file.name}</span>
                        <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700 text-sm">حذف</button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={onClose} 
                    disabled={isProcessing}
                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    انصراف
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:bg-gray-400"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        <span>در حال پردازش و استخراج اطلاعات...</span>
                      </>
                    ) : (
                      <span>شروع پردازش و افزودن متقاضیان</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {uploadResult && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-bold text-green-800">گزارش پردازش گروهی رزومه‌ها</h4>
                <p className="text-sm text-green-700">{uploadResult.addedCount} متقاضی با موفقیت اضافه شدند و در مرحله ۱ ( Inbox ) قرار گرفتند.</p>
              </div>
            </div>

            {uploadResult.addedCandidates.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-bold text-gray-700">متقاضیان جدید ({uploadResult.addedCandidates.length})</h5>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs font-bold border-b border-gray-200">
                        <th className="p-3">نام</th>
                        <th className="p-3">موقعیت شغلی</th>
                        <th className="p-3">ایمیل</th>
                        <th className="p-3">تلفن</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700">
                      {uploadResult.addedCandidates.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-3 font-bold">{c.name}</td>
                          <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">{c.position}</span></td>
                          <td className="p-3 text-left font-mono">{c.email}</td>
                          <td className="p-3 text-left font-mono">{c.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {uploadResult.skippedCandidates.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-bold text-amber-700">رد شده به دلیل تکراری بودن ({uploadResult.skippedCandidates.length})</h5>
                <div className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50/30">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-amber-100/50 text-amber-800 text-xs font-bold border-b border-amber-200">
                        <th className="p-3">نام فایل</th>
                        <th className="p-3">نام متقاضی</th>
                        <th className="p-3">علت رد شدن</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 text-sm text-gray-700">
                      {uploadResult.skippedCandidates.map((c, i) => (
                        <tr key={i} className="hover:bg-amber-50/50">
                          <td className="p-3 font-mono text-xs">{c.filename}</td>
                          <td className="p-3 font-bold">{c.name}</td>
                          <td className="p-3 text-amber-700">{c.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-bold text-red-700">فایل‌های دارای خطا ({uploadResult.errors.length})</h5>
                <div className="border border-red-200 rounded-lg overflow-hidden bg-red-50/30">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-red-100/50 text-red-800 text-xs font-bold border-b border-red-200">
                        <th className="p-3">نام فایل</th>
                        <th className="p-3">خطا</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100 text-sm text-gray-700">
                      {uploadResult.errors.map((e, i) => (
                        <tr key={i} className="hover:bg-red-50/50">
                          <td className="p-3 font-mono text-xs">{e.filename}</td>
                          <td className="p-3 text-red-700">{e.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={clearAll}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                آپلود مجدد فایل‌ها
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold rounded-lg transition-colors shadow-md"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkUploadModal;
