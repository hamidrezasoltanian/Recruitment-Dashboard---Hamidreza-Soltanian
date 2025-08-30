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
}

declare const persianDate: any;

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm font-medium text-gray-500">{label}</p>
        </div>
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
                // Correctly handle ISO date string
                const interviewPDate = new persianDate(new Date(c.interviewDate));
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
                    color="bg-blue-100 text-blue-600"
                    icon={<UserIcon className="h-6 w-6" />}
                />
                <StatCard 
                    label="جدید در این هفته" 
                    value={stats.newThisWeek} 
                    color="bg-green-100 text-green-600"
                    icon={<SparklesIcon className="h-6 w-6" />}
                />
                <StatCard 
                    label="مصاحبه‌های این هفته" 
                    value={stats.interviewsThisWeek} 
                    color="bg-amber-100 text-amber-600"
                    icon={<CalendarIcon className="h-6 w-6" />}
                />
                <StatCard 
                    label="استخدام شده" 
                    value={stats.offersExtended} 
                    color="bg-indigo-100 text-indigo-600"
                    icon={<BriefcaseIcon className="h-6 w-6" />}
                />
            </div>

            {stats.sourceData.length > 0 && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">متقاضیان بر اساس منبع</h3>
                    <div className="space-y-3">
                        {stats.sourceData.map(source => (
                            <div key={source.name} className="flex items-center">
                                <p className="w-32 text-sm font-medium text-gray-600 truncate">{source.name}</p>
                                <div className="flex-1 bg-gray-200 rounded-full h-4 ml-4">
                                    <div 
                                        className="bg-indigo-500 h-4 rounded-full" 
                                        style={{ width: `${source.percentage}%` }}
                                    ></div>
                                </div>
                                <p className="w-12 text-left text-sm font-bold text-gray-700">{source.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardSummary;