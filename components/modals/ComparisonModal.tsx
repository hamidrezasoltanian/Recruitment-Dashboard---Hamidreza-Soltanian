import React from 'react';
import Modal from '../ui/Modal';
import { Candidate } from '../../types';
import StarRating from '../ui/StarRating';
import { calcCompleteness } from '../../utils/completenessUtils';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  onViewDetails: (candidate: Candidate) => void;
}

const Row: React.FC<{ label: string; values: (string | React.ReactNode)[] }> = ({ label, values }) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-3 px-4 text-sm font-semibold text-gray-500 bg-gray-50 border-l border-gray-100 w-28">{label}</td>
    {values.map((v, i) => (
      <td key={i} className="py-3 px-4 text-sm text-gray-800 text-center">{v ?? '—'}</td>
    ))}
  </tr>
);

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, candidates, onViewDetails }) => {
  if (candidates.length < 2) return null;

  const rows: { label: string; getValue: (c: Candidate) => string | React.ReactNode }[] = [
    { label: 'موقعیت شغلی', getValue: c => c.position || '—' },
    { label: 'منبع', getValue: c => c.source || '—' },
    { label: 'مرحله', getValue: c => c.stage },
    { label: 'امتیاز', getValue: c => <StarRating rating={c.rating} readOnly /> },
    { label: 'تاریخ مصاحبه', getValue: c => c.interviewDate || '—' },
    { label: 'رزومه', getValue: c => c.hasResume ? '✓ دارد' : '✗ ندارد' },
    {
      label: 'تکمیل پروفایل',
      getValue: c => {
        const { score } = calcCompleteness(c);
        return (
          <div className="flex flex-col items-center gap-1">
            <span className={`font-bold ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{score}٪</span>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      label: 'آزمون‌ها',
      getValue: c => {
        const passed = (c.testResults || []).filter(r => r.status === 'passed').length;
        const total = (c.testResults || []).length;
        return total > 0 ? `${passed}/${total} قبول` : '—';
      },
    },
    {
      label: 'امتیاز سکورکارد',
      getValue: c => {
        const cards = c.scorecards || [];
        if (cards.length === 0) return '—';
        let totalWeighted = 0;
        let totalWeight = 0;
        cards.forEach(card => {
          card.scores.forEach(s => {
            totalWeighted += s.score;
            totalWeight++;
          });
        });
        const avg = totalWeight > 0 ? (totalWeighted / totalWeight).toFixed(1) : null;
        return avg ? `${avg}/5` : '—';
      },
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="مقایسه متقاضیان" size="xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 px-4 text-right text-sm font-bold text-gray-500 bg-gray-50 w-28" />
              {candidates.map(c => (
                <th key={c.id} className="py-3 px-4 text-center">
                  <button
                    onClick={() => { onClose(); onViewDetails(c); }}
                    className="font-bold text-[var(--color-primary-700)] hover:underline text-sm"
                  >
                    {c.name}
                  </button>
                  <p className="text-xs text-gray-400 font-normal mt-0.5">{c.email}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <Row key={row.label} label={row.label} values={candidates.map(c => row.getValue(c))} />
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default ComparisonModal;
