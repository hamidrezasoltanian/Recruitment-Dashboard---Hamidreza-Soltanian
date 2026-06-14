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
    iconBg: string;
}

declare const persianDate: any;

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, gradient, iconBg }) => (
    <div className={`relative overflow-hidden p-5 rounded-2xl shadow-md flex items-center gap-4 ${gradient}`}>
        <div className={`flex-shrink-0 p-3 rounded-xl ${iconBg} shadow-sm`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-3xl font-extrabold text-white">{value}</p>
            <p className="text-sm font-medium text-white/80 mt-0.5">{label}</p>
        </div>
        <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white/10"></div>
        <div className="absolute -left-2 top-[-30px] w-14 h-14 rounded-full bg-white/5"></div>
    </div>
);


const DashboardSummary: React.FC<DashboardSummaryProps> = ({ candidates }) => {
    
    const stats = React.useMemo(() => {
        const activeCandidates = candidates.filter(c => !['hired', 'rejected', 'archived'].includes(c.stage));

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newThisWeek = activeCandidates.filter(c => new Date(c.createdAt) >= oneWeekAgo).length;

        const today = new persianDate();
        const startOfWeek = today.clone().startOf('week');
        const endOfWeek = today.clone().endOf('week');

        const interviewsThisWeek = candidates.filter(c => {
            if (!c.interviewDate) return false;
            try {
                // The date format is YYYY/MM/DD
                const interviewPDate = new persianDate(c.interviewDate.split('/').map(Number));
                return interviewPDate.isBetween(startOfWeek, endOfWeek, 'day', '[]');
            } catch {
                return false;
            }
        }).length;
        
        const offersExtended = candidates.filter(c => c.stage === 'hired').length;
        
        const sourceCounts: { [key: string]: number } = activeCandidates.reduce((acc, c) => {
            acc[c.source] = (acc[c.source] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const sortedSources = Object.entries(sourceCounts)
            .sort(([, a], [, b]) => b - a);

        const topSources = sortedSources.slice(0, 5);
        const otherSourcesCount = sortedSources.slice(5).reduce((sum, [, count]) => sum + count, 0);
        if (otherSourcesCount > 0) {
            topSources.push(['سایر', otherSourcesCount]);
        }
        
        const maxSourceCount = topSources.length > 0 ? Math.max(...topSources.map(([,count]) => count)) : 0;

        return {
            activeCount: activeCandidates.length,
            newThisWeek,
            interviewsThisWeek,
            offersExtended,
            sourceData: topSources.map(([name, count]) => ({
                name,
                count,
                percentage: maxSourceCount > 0 ? (count / maxSourceCount) * 100 : 0
            }))
        };
    }, [candidates]);
    
    if (candidates.length === 0) {
        return null; // Don't show summary if there are no candidates
    }

    return (
        <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="متقاضیان فعال"
                    value={stats.activeCount}
                    gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                    iconBg="bg-white/20"
                    icon={<UserIcon className="h-6 w-6 text-white" />}
                />
                <StatCard
                    label="جدید در این هفته"
                    value={stats.newThisWeek}
                    gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                    iconBg="bg-white/20"
                    icon={<SparklesIcon className="h-6 w-6 text-white" />}
                />
                <StatCard
                    label="مصاحبه‌های این هفته"
                    value={stats.interviewsThisWeek}
                    gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                    iconBg="bg-white/20"
                    icon={<CalendarIcon className="h-6 w-6 text-white" />}
                />
                <StatCard
                    label="استخدام شده"
                    value={stats.offersExtended}
                    gradient="bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-800)]"
                    iconBg="bg-white/20"
                    icon={<BriefcaseIcon className="h-6 w-6 text-white" />}
                />
            </div>

            {stats.sourceData.length > 0 && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-1 h-5 rounded-full" style={{background: 'var(--color-primary-500)'}}></div>
                        <h3 className="text-base font-bold text-gray-800">متقاضیان بر اساس منبع</h3>
                    </div>
                    <div className="space-y-3.5">
                        {stats.sourceData.map(source => (
                            <div key={source.name} className="flex items-center gap-3">
                                <p className="w-28 text-sm font-semibold text-gray-600 truncate">{source.name}</p>
                                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${source.percentage}%`, background: 'linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600))' }}
                                    ></div>
                                </div>
                                <p className="w-8 text-left text-sm font-bold text-gray-700">{source.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardSummary;