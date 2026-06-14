import React from 'react';
import { Candidate } from '../../types';

interface AdvancedDashboardProps {
  candidates: Candidate[];
}

// Removed unused ChartData interface

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ candidates }) => {
  // Calculate advanced metrics
  const metrics = React.useMemo(() => {
    const totalCandidates = candidates.length;
    const activeCandidates = candidates.filter(c => !['hired', 'rejected', 'archived'].includes(c.stage)).length;
    
    // Conversion rates
    const hiredCount = candidates.filter(c => c.stage === 'hired').length;
    const rejectedCount = candidates.filter(c => c.stage === 'rejected').length;
    const conversionRate = totalCandidates > 0 ? (hiredCount / totalCandidates) * 100 : 0;
    
    // Time to hire analysis
    const hiredCandidates = candidates.filter(c => c.stage === 'hired');
    const avgTimeToHire = hiredCandidates.length > 0 
      ? hiredCandidates.reduce((sum, c) => {
          const created = new Date(c.createdAt);
          const hired = new Date(); // Assuming hired date is now
          return sum + (hired.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / hiredCandidates.length
      : 0;

    // Source effectiveness
    const sourceStats = candidates.reduce((acc, c) => {
      acc[c.source] = (acc[c.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Stage distribution
    const stageStats = candidates.reduce((acc, c) => {
      acc[c.stage] = (acc[c.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Rating distribution
    const ratingStats = candidates.reduce((acc, c) => {
      acc[c.rating] = (acc[c.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalCandidates,
      activeCandidates,
      hiredCount,
      rejectedCount,
      conversionRate,
      avgTimeToHire,
      sourceStats,
      stageStats,
      ratingStats
    };
  }, [candidates]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="کل متقاضیان"
          value={metrics.totalCandidates}
          icon="👥"
          color="blue"
          trend={12.5}
        />
        <MetricCard
          title="متقاضیان فعال"
          value={metrics.activeCandidates}
          icon="🔄"
          color="green"
          trend={8.2}
        />
        <MetricCard
          title="نرخ استخدام"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon="✅"
          color="purple"
          trend={-2.1}
        />
        <MetricCard
          title="میانگین زمان استخدام"
          value={`${metrics.avgTimeToHire.toFixed(0)} روز`}
          icon="⏱️"
          color="orange"
          trend={-5.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="توزیع مراحل"
          data={Object.entries(metrics.stageStats).map(([stage, count]) => ({
            label: stage,
            value: Number(count),
            color: getStageColor(stage)
          }))}
          type="doughnut"
        />
        <ChartCard
          title="اثربخشی منابع"
          data={Object.entries(metrics.sourceStats).map(([source, count]) => ({
            label: source,
            value: Number(count),
            color: getSourceColor(source)
          }))}
          type="bar"
        />
      </div>

      {/* Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="توزیع امتیازات"
          data={Object.entries(metrics.ratingStats).map(([rating, count]) => ({
            label: `${rating} ستاره`,
            value: Number(count),
            color: getRatingColor(parseInt(rating))
          }))}
          type="bar"
        />
        <RecentActivity candidates={candidates} />
      </div>

      {/* Performance Insights */}
      <PerformanceInsights metrics={metrics} />
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend: number;
}> = ({ title, value, icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <div className="flex items-center mt-2">
            <span className={`text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </span>
            <span className="text-sm text-gray-500 mr-2">از ماه گذشته</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

const ChartCard: React.FC<{
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
  type: 'doughnut' | 'bar';
}> = ({ title, data, type }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      {type === 'doughnut' ? (
        <div className="flex items-center justify-center">
          <div className="w-48 h-48 relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const startAngle = data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                const endAngle = startAngle + (item.value / total) * 360;
                
                return (
                  <path
                    key={item.label}
                    d={`M 50,50 L ${50 + 40 * Math.cos((startAngle * Math.PI) / 180)},${50 + 40 * Math.sin((startAngle * Math.PI) / 180)} A 40,40 0 ${percentage > 50 ? 1 : 0},1 ${50 + 40 * Math.cos((endAngle * Math.PI) / 180)},${50 + 40 * Math.sin((endAngle * Math.PI) / 180)} Z`}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${(item.value / total) * 100}%`,
                      backgroundColor: item.color
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-left">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RecentActivity: React.FC<{ candidates: Candidate[] }> = ({ candidates }) => {
  const recentActivities = React.useMemo(() => {
    return candidates
      .flatMap(c => c.history.map((h: any) => ({ ...h, candidateName: c.name })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [candidates]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">فعالیت‌های اخیر</h3>
      <div className="space-y-3">
        {recentActivities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.action}</p>
              <p className="text-xs text-gray-500">{activity.candidateName}</p>
              <p className="text-xs text-gray-400">
                {new Date(activity.timestamp).toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PerformanceInsights: React.FC<{ metrics: any }> = ({ metrics }) => {
  const insights = React.useMemo(() => {
    const insights = [];
    
    if (metrics.conversionRate > 20) {
      insights.push({
        type: 'success',
        title: 'نرخ استخدام عالی',
        message: `نرخ استخدام ${metrics.conversionRate.toFixed(1)}% بسیار خوب است!`
      });
    }
    
    if (metrics.avgTimeToHire < 30) {
      insights.push({
        type: 'info',
        title: 'فرآیند سریع',
        message: `میانگین زمان استخدام ${metrics.avgTimeToHire.toFixed(0)} روز است.`
      });
    }
    
    if (metrics.activeCandidates > 50) {
      insights.push({
        type: 'warning',
        title: 'تعداد زیاد متقاضی',
        message: `${metrics.activeCandidates} متقاضی فعال دارید. ممکن است نیاز به نیروی بیشتر باشد.`
      });
    }
    
    return insights;
  }, [metrics]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">نکات عملکردی</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className={`p-3 rounded-md ${
            insight.type === 'success' ? 'bg-green-50 border-green-200' :
            insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            'bg-blue-50 border-blue-200'
          } border`}>
            <div className="flex items-start space-x-2">
              <span className={`text-lg ${
                insight.type === 'success' ? 'text-green-600' :
                insight.type === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                {insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <div>
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <p className="text-sm text-gray-600">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions
const getStageColor = (stage: string): string => {
  const colors: Record<string, string> = {
    'inbox': '#3B82F6',
    'review': '#F59E0B',
    'interview-1': '#10B981',
    'interview-2': '#8B5CF6',
    'test': '#EF4444',
    'hired': '#059669',
    'rejected': '#6B7280'
  };
  return colors[stage] || '#6B7280';
};

const getSourceColor = (source: string): string => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  const index = source.length % colors.length;
  return colors[index];
};

const getRatingColor = (rating: number): string => {
  const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#059669'];
  return colors[rating] || '#6B7280';
};

