import React, { useState, useRef } from 'react';
import { Candidate } from '../../types';
import { useCandidates } from '../../contexts/CandidatesContext';
import { useToast } from '../../contexts/ToastContext';
import { generateId } from '../../utils/idUtils';
import { isLocalServerMode, localApiImport, localApiCandidates } from '../../services/localApiService';

interface Props {
  onClose: () => void;
}

type Step = 'upload' | 'map' | 'preview' | 'done';

const CANDIDATE_FIELDS: { key: keyof Candidate | '_skip'; label: string }[] = [
  { key: '_skip', label: '— نادیده بگیر —' },
  { key: 'name', label: 'نام' },
  { key: 'email', label: 'ایمیل' },
  { key: 'phone', label: 'تلفن' },
  { key: 'position', label: 'موقعیت شغلی' },
  { key: 'source', label: 'منبع' },
  { key: 'rating', label: 'امتیاز' },
  { key: 'interviewDate', label: 'تاریخ مصاحبه' },
];

const CSVImportModal: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [total, setTotal] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addCandidate, setCandidates, candidates } = useCandidates();
  const { addToast } = useToast();

  const handleFile = async (file: File) => {
    try {
      if (isLocalServerMode()) {
        const result = await localApiImport.parseCSV(file);
        setHeaders(result.headers);
        setRows(result.rows);
        setTotal(result.total);
      } else {
        // Local CSV parsing fallback
        const text = await file.text();
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
        if (lines.length < 2) { addToast('فایل CSV خالی است.', 'error'); return; }
        const parseRow = (line: string) => {
          const result: string[] = [];
          let cur = '';
          let inQ = false;
          for (const ch of line) {
            if (ch === '"') { inQ = !inQ; continue; }
            if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; continue; }
            cur += ch;
          }
          result.push(cur.trim());
          return result;
        };
        const hdrs = parseRow(lines[0]);
        const data = lines.slice(1, 101).map(line => {
          const vals = parseRow(line);
          const obj: Record<string, string> = {};
          hdrs.forEach((h, i) => { obj[h] = vals[i] || ''; });
          return obj;
        });
        setHeaders(hdrs);
        setRows(data);
        setTotal(lines.length - 1);
      }
      // Auto-map headers
      const autoMap: Record<string, string> = {};
      headers.forEach(h => { autoMap[h] = '_skip'; });
      setMapping(autoMap);
      setStep('map');
    } catch (e: any) {
      addToast('خطا در پردازش فایل: ' + e.message, 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    const nameCol = Object.entries(mapping).find(([, v]) => v === 'name')?.[0];
    if (!nameCol) { addToast('ستون «نام» باید مشخص شود.', 'error'); return; }

    setImporting(true);
    const now = new Date().toISOString();

    const newCandidates: Candidate[] = rows.map(row => {
      const c: Partial<Candidate> = {
        id: generateId('csv'),
        stage: 'inbox',
        createdAt: now,
        stageEnteredAt: now,
        history: [{ user: 'سیستم', action: 'از CSV وارد شد', timestamp: now }],
        comments: [],
        testResults: [],
        rating: 0,
      };
      Object.entries(mapping).forEach(([col, field]) => {
        if (field === '_skip' || !row[col]) return;
        if (field === 'rating') { (c as any)[field] = parseInt(row[col]) || 0; }
        else { (c as any)[field] = row[col]; }
      });
      return c as Candidate;
    }).filter(c => c.name?.trim());

    try {
      if (isLocalServerMode()) {
        await localApiCandidates.bulkSave(newCandidates);
        // Reload via setCandidates is not needed — we just append
        // but we need to update local state; use addCandidate is too slow for bulk
        // Instead trigger a reload by closing and reopening — or update state directly
        await setCandidates([...candidates, ...newCandidates], true);
      } else {
        for (const c of newCandidates) await addCandidate(c);
      }
      setImported(newCandidates.length);
      setStep('done');
    } catch (e: any) {
      addToast('خطا در وارد کردن داده‌ها: ' + e.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">وارد کردن از CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">

          {step === 'upload' && (
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-400 transition-colors"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-5xl mb-4">📂</div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">فایل CSV را اینجا رها کنید یا کلیک کنید</p>
              <p className="text-sm text-gray-400 mt-2">فرمت: UTF-8، جداکننده: کاما</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{total} ردیف در فایل یافت شد. ستون‌های CSV را به فیلدهای برنامه نگاشت دهید:</p>
              <div className="space-y-2">
                {headers.map(h => (
                  <div key={h} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{h}</span>
                    <span className="text-gray-400">←</span>
                    <select
                      value={mapping[h] || '_skip'}
                      onChange={e => setMapping(prev => ({ ...prev, [h]: e.target.value }))}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      {CANDIDATE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {rows.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">پیش‌نمایش (۳ ردیف اول):</p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="text-xs w-full">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>{headers.map(h => <th key={h} className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                            {headers.map(h => <td key={h} className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{row[h]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{imported} متقاضی وارد شد</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">می‌توانید این پنجره را ببندید.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-3">
          {step === 'map' && (
            <>
              <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                بازگشت
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50"
              >
                {importing ? 'در حال وارد کردن...' : `وارد کردن ${total} ردیف`}
              </button>
            </>
          )}
          {(step === 'upload' || step === 'done') && (
            <button onClick={onClose} className="mr-auto px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              بستن
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;
