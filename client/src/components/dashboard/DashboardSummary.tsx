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
    gradient: string;
    accent: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, gradient, accent }) => (
    <div className={`${gradient} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
        <div className={`${accent} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
            {icon}
        </div>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        <p className="text-sm font-medium text-white/80 mt-1">{label}</p>
    </div>
);

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ candidates }) => {

    const stats = React.useMemo(() => {
        const activeCandidates = candidates.filter(c => !['hired', 'rejected', 'archived'].includes(c.stage));
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newThisWeek = activeCandidates.filter(c => new Date(c.createdAt) >= oneWeekAgo).length;

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

        const interviewsThisWeek = candidates.filter(c => {
            if (!c.interviewDate) return false;
            try {
                const d = new Date(c.interviewDate);
                return d >= startOfWeek && d <= endOfWeek;
            } catch { return false; }
        }).length;

        const offersExtended = candidates.filter(c => c.stage === 'hired').length;

        const sourceCounts: { [key: string]: number } = activeCandidates.reduce((acc, c) => {
            acc[c.source] = (acc[c.source] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const sortedSources = Object.entries(sourceCounts).sort(([, a], [, b]) => b - a);
        const topSources = sortedSources.slice(0, 5);
        const otherSourcesCount = sortedSources.slice(5).reduce((sum, [, count]) => sum + count, 0);
        if (otherSourcesCount > 0) topSources.push(['سایر', otherSourcesCount]);
        const maxSourceCount = topSources.length > 0 ? Math.max(...topSources.map(([, count]) => count)) : 0;

        return {
            activeCount: activeCandidates.length,
            newThisWeek,
            interviewsThisWeek,
            offersExtended,
            sourceData: topSources.map(([name, count]) => ({
                name, count,
                percentage: maxSourceCount > 0 ? (count / maxSourceCount) * 100 : 0
            }))
        };
    }, [candidates]);

    if (candidates.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="متقاضیان فعال"
                    value={stats.activeCount}
                    gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                    accent="bg-white/25"
                    icon={<UserIcon className="h-5 w-5 text-white" />}
                />
                <StatCard
                    label="جدید در این هفته"
                    value={stats.newThisWeek}
                    gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
                    accent="bg-white/25"
                    icon={<SparklesIcon className="h-5 w-5 text-white" />}
                />
                <StatCard
                    label="مصاحبه‌های این هفته"
                    value={stats.interviewsThisWeek}
                    gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                    accent="bg-white/25"
                    icon={<CalendarIcon className="h-5 w-5 text-white" />}
                />
                <StatCard
                    label="استخدام شده"
                    value={stats.offersExtended}
                    gradient="bg-gradient-to-br from-violet-500 to-purple-700"
                    accent="bg-white/25"
                    icon={<BriefcaseIcon className="h-5 w-5 text-white" />}
                />
            </div>

            {stats.sourceData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                    <h3 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[var(--color-primary-500)] inline-block"></span>
                        متقاضیان بر اساس منبع
                    </h3>
                    <div className="space-y-3">
                        {stats.sourceData.map((source) => (
                            <div key={source.name} className="flex items-center gap-3">
                                <p className="w-28 text-sm font-medium text-gray-600 truncate flex-shrink-0">{source.name}</p>
                                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="h-2.5 rounded-full transition-all duration-700"
                                        style={{
                                            width: `${source.percentage}%`,
                                            background: `linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600))`
                                        }}
                                    />
                                </div>
                                <span className="w-8 text-left text-sm font-bold text-gray-700 flex-shrink-0">{source.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardSummary;
