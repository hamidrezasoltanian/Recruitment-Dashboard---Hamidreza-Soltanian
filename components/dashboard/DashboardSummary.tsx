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
  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm flex items-center gap-3">
    <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${color} ${textColor}`}>
      <div className="h-5 w-5 sm:h-6 sm:w-6">{icon}</div>
    </div>
    <div className="min-w-0">
      <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{value}</p>
      <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5 truncate">{label}</p>
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
        <StatCard label="متقاضیان فعال" value={stats.activeCount} color="bg-blue-100" textColor="text-blue-600" icon={<UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />} />
        <StatCard label="جدید این هفته" value={stats.newThisWeek} color="bg-green-100" textColor="text-green-600" icon={<SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6" />} />
        <StatCard label="مصاحبه این هفته" value={stats.interviewsThisWeek} color="bg-amber-100" textColor="text-amber-600" icon={<CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />} />
        <StatCard label="استخدام شده" value={stats.offersExtended} color="bg-[var(--color-primary-100)]" textColor="text-[var(--color-primary-600)]" icon={<BriefcaseIcon className="h-5 w-5 sm:h-6 sm:w-6" />} />
      </div>

      {stats.sourceData.length > 0 && (
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">متقاضیان بر اساس منبع</h3>
          <div className="space-y-2 sm:space-y-3">
            {stats.sourceData.map(source => (
              <div key={source.name} className="flex items-center gap-2 sm:gap-3">
                <p className="w-20 sm:w-32 text-xs sm:text-sm font-medium text-gray-600 truncate flex-shrink-0">{source.name}</p>
                <div className="flex-1 bg-gray-200 rounded-full h-3 sm:h-4">
                  <div className="bg-[var(--color-primary-500)] h-3 sm:h-4 rounded-full transition-all" style={{ width: `${source.percentage}%` }} />
                </div>
                <p className="w-8 sm:w-10 text-right text-xs sm:text-sm font-bold text-gray-700 flex-shrink-0">{source.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSummary;
