import React from 'react';
import { Candidate } from '../../types';
import { UserIcon, CalendarIcon, BriefcaseIcon, SparklesIcon } from '../ui/Icons';

interface DashboardSummaryProps {
  candidates: Candidate[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  textColor: string;
}

declare const persianDate: any;

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, textColor }) => (
  <div className={`relative overflow-hidden rounded-2xl p-4 shadow-sm border border-white/60 ${color}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-2xl sm:text-3xl font-extrabold leading-none ${textColor}`}>{value}</p>
        <p className={`text-xs sm:text-sm font-medium mt-1.5 opacity-80 ${textColor}`}>{label}</p>
      </div>
      <div className={`p-2 rounded-xl bg-white/30 ${textColor}`}>
        <div className="h-5 w-5 sm:h-6 sm:w-6">{icon}</div>
      </div>
    </div>
  </div>
);

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ candidates }) => {
  const stats = React.useMemo(() => {
    const active = candidates.filter(c => !['hired', 'rejected', 'archived'].includes(c.stage));
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newThisWeek = active.filter(c => new Date(c.createdAt) >= oneWeekAgo).length;

    const today = new persianDate();
    const startOfWeek = today.clone().startOf('week');
    const endOfWeek = today.clone().endOf('week');
    const interviewsThisWeek = candidates.filter(c => {
      if (!c.interviewDate) return false;
      try {
        const d = new persianDate(c.interviewDate.split('/').map(Number));
        return d.isBetween(startOfWeek, endOfWeek, 'day', '[]');
      } catch { return false; }
    }).length;

    const offersExtended = candidates.filter(c => c.stage === 'hired').length;

    const sourceCounts = active.reduce((acc, c) => {
      acc[c.source] = (acc[c.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(sourceCounts).sort(([, a], [, b]) => b - a);
    const top = sorted.slice(0, 5);
    const otherCount = sorted.slice(5).reduce((sum, [, n]) => sum + n, 0);
    if (otherCount > 0) top.push(['سایر', otherCount]);
    const maxCount = top.length > 0 ? Math.max(...top.map(([, n]) => n)) : 0;

    return {
      activeCount: active.length,
      newThisWeek,
      interviewsThisWeek,
      offersExtended,
      sourceData: top.map(([name, count]) => ({ name, count, percentage: maxCount > 0 ? (count / maxCount) * 100 : 0 })),
    };
  }, [candidates]);

  if (candidates.length === 0) return null;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard label="متقاضیان فعال" value={stats.activeCount} color="bg-gradient-to-br from-blue-50 to-blue-100" textColor="text-blue-700" icon={<UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />} />
        <StatCard label="جدید این هفته" value={stats.newThisWeek} color="bg-gradient-to-br from-emerald-50 to-emerald-100" textColor="text-emerald-700" icon={<SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6" />} />
        <StatCard label="مصاحبه این هفته" value={stats.interviewsThisWeek} color="bg-gradient-to-br from-amber-50 to-amber-100" textColor="text-amber-700" icon={<CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />} />
        <StatCard label="استخدام شده" value={stats.offersExtended} color="bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-primary-100)]" textColor="text-[var(--color-primary-700)]" icon={<BriefcaseIcon className="h-5 w-5 sm:h-6 sm:w-6" />} />
      </div>

      {stats.sourceData.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm sm:text-base font-bold text-gray-700 mb-3 sm:mb-4">متقاضیان بر اساس منبع</h3>
          <div className="space-y-2.5 sm:space-y-3">
            {stats.sourceData.map(source => (
              <div key={source.name} className="flex items-center gap-3">
                <p className="w-20 sm:w-28 text-xs font-semibold text-gray-600 truncate flex-shrink-0">{source.name}</p>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-[var(--color-primary-400)] to-[var(--color-primary-600)] h-2.5 rounded-full report-bar" style={{ width: `${source.percentage}%` }} />
                </div>
                <p className="w-7 text-right text-xs font-bold text-gray-700 flex-shrink-0">{source.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSummary;
