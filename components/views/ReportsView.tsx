import React, { useMemo } from 'react';
import { Candidate } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';

declare const persianDate: any;

interface ReportsViewProps {
  candidates: Candidate[];
}

const StatBox: React.FC<{ label: string; value: string | number; sub?: string; color: string }> = ({ label, value, sub, color }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm">
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const HorizontalBar: React.FC<{ label: string; value: number; max: number; count: number; color: string }> = ({ label, value, max, count, color }) => (
  <div className="flex items-center gap-3">
    <div className="w-32 text-sm font-medium text-gray-700 truncate text-left">{label}</div>
    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
      <div
        className={`h-5 rounded-full report-bar ${color}`}
        style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
      />
    </div>
    <div className="w-8 text-sm font-bold text-gray-700 text-center">{count}</div>
  </div>
);

const ReportsView: React.FC<ReportsViewProps> = ({ candidates }) => {
  const { stages } = useSettings();

  const stats = useMemo(() => {
    const now = new Date();
    const activeStageIds = stages
      .filter(s => !['hired', 'rejected', 'archived'].includes(s.id))
      .map(s => s.id);

    const active = candidates.filter(c => activeStageIds.includes(c.stage));
    const hired = candidates.filter(c => c.stage === 'hired');
    const rejected = candidates.filter(c => c.stage === 'rejected');
    const total = candidates.filter(c => c.stage !== 'archived');

    // Conversion rate
    const conversionRate = total.length > 0 ? Math.round((hired.length / total.length) * 100) : 0;

    // Average time to hire (days from createdAt to stageEnteredAt for hired candidates)
    const timeToHireDays = hired
      .map(c => {
        const created = new Date(c.createdAt).getTime();
        const entered = new Date(c.stageEnteredAt || c.createdAt).getTime();
        return Math.round((entered - created) / (1000 * 60 * 60 * 24));
      })
      .filter(d => d >= 0);
    const avgTimeToHire = timeToHireDays.length > 0
      ? Math.round(timeToHireDays.reduce((a, b) => a + b, 0) / timeToHireDays.length)
      : null;

    // Pipeline by stage
    const pipelineData = stages
      .filter(s => s.id !== 'archived')
      .map(s => ({
        id: s.id,
        name: s.title,
        count: candidates.filter(c => c.stage === s.id).length,
      }));
    const maxPipelineCount = Math.max(...pipelineData.map(d => d.count), 1);

    // Source analysis
    const sourceMap: Record<string, { total: number; hired: number }> = {};
    candidates.filter(c => c.stage !== 'archived').forEach(c => {
      if (!sourceMap[c.source]) sourceMap[c.source] = { total: 0, hired: 0 };
      sourceMap[c.source].total++;
      if (c.stage === 'hired') sourceMap[c.source].hired++;
    });
    const sourceData = Object.entries(sourceMap)
      .map(([name, d]) => ({
        name,
        total: d.total,
        hired: d.hired,
        rate: d.total > 0 ? Math.round((d.hired / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
    const maxSourceCount = Math.max(...sourceData.map(d => d.total), 1);

    // Monthly hiring (last 6 months)
    const monthlyData: { label: string; hired: number; added: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const pDate = new persianDate(date);
      const year = pDate.year();
      const month = pDate.month();
      const label = pDate.format('MMM');

      const monthHired = candidates.filter(c => {
        if (c.stage !== 'hired') return false;
        const d = new persianDate(new Date(c.stageEnteredAt || c.createdAt));
        return d.year() === year && d.month() === month;
      }).length;

      const monthAdded = candidates.filter(c => {
        const d = new persianDate(new Date(c.createdAt));
        return d.year() === year && d.month() === month;
      }).length;

      monthlyData.push({ label, hired: monthHired, added: monthAdded });
    }
    const maxMonthly = Math.max(...monthlyData.map(d => Math.max(d.hired, d.added)), 1);

    // Position analysis
    const positionMap: Record<string, { total: number; hired: number }> = {};
    candidates.filter(c => c.stage !== 'archived' && c.position).forEach(c => {
      if (!positionMap[c.position]) positionMap[c.position] = { total: 0, hired: 0 };
      positionMap[c.position].total++;
      if (c.stage === 'hired') positionMap[c.position].hired++;
    });
    const positionData = Object.entries(positionMap)
      .map(([name, d]) => ({ name, total: d.total, hired: d.hired }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalActive: active.length,
      totalHired: hired.length,
      totalRejected: rejected.length,
      conversionRate,
      avgTimeToHire,
      pipelineData,
      maxPipelineCount,
      sourceData,
      maxSourceCount,
      monthlyData,
      maxMonthly,
      positionData,
    };
  }, [candidates, stages]);

  const stageColors: Record<string, string> = {
    inbox: 'bg-gray-400',
    review: 'bg-blue-400',
    'interview-1': 'bg-amber-400',
    'interview-2': 'bg-orange-500',
    test: 'bg-purple-500',
    hired: 'bg-emerald-500',
    rejected: 'bg-red-400',
  };
  const getStageColor = (id: string) => stageColors[id] || 'bg-indigo-400';

  return (
    <div className="space-y-8 pb-8">
      <h2 className="text-2xl font-extrabold text-gray-800">گزارش‌ها و تحلیل</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="متقاضیان فعال" value={stats.totalActive} color="text-blue-600" />
        <StatBox label="استخدام شده" value={stats.totalHired} color="text-emerald-600" />
        <StatBox label="نرخ تبدیل" value={`${stats.conversionRate}٪`} sub="از کل متقاضیان" color="text-[var(--color-primary-600)]" />
        <StatBox
          label="میانگین زمان استخدام"
          value={stats.avgTimeToHire !== null ? `${stats.avgTimeToHire}ر` : '—'}
          sub="روز از ثبت تا استخدام"
          color="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-5">وضعیت پایپ‌لاین</h3>
          <div className="space-y-3">
            {stats.pipelineData.map(stage => (
              <HorizontalBar
                key={stage.id}
                label={stage.name}
                value={stage.count}
                max={stats.maxPipelineCount}
                count={stage.count}
                color={getStageColor(stage.id)}
              />
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-5">روند ماهانه (۶ ماه اخیر)</h3>
          <div className="flex items-end gap-3 h-40">
            {stats.monthlyData.map((month, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-1 items-center" style={{ height: '120px', justifyContent: 'flex-end' }}>
                  <div
                    className="w-full bg-emerald-400 rounded-t"
                    style={{ height: `${stats.maxMonthly > 0 ? (month.hired / stats.maxMonthly) * 100 : 0}%`, minHeight: month.hired > 0 ? '4px' : '0' }}
                    title={`استخدام: ${month.hired}`}
                  />
                  <div
                    className="w-full bg-blue-300 rounded-t"
                    style={{ height: `${stats.maxMonthly > 0 ? (month.added / stats.maxMonthly) * 100 : 0}%`, minHeight: month.added > 0 ? '4px' : '0' }}
                    title={`جدید: ${month.added}`}
                  />
                </div>
                <span className="text-xs text-gray-500 text-center">{month.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-300"></span>جدید</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-400"></span>استخدام</span>
          </div>
        </div>

        {/* Source ROI */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-5">بازدهی منابع استخدام</h3>
          {stats.sourceData.length === 0 ? (
            <p className="text-gray-400 text-sm">داده‌ای موجود نیست.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-2 font-bold text-gray-600">منبع</th>
                    <th className="text-center py-2 font-bold text-gray-600">کل</th>
                    <th className="text-center py-2 font-bold text-gray-600">استخدام</th>
                    <th className="text-center py-2 font-bold text-gray-600">نرخ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sourceData.map(s => (
                    <tr key={s.name} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-800">{s.name}</td>
                      <td className="py-2 text-center text-gray-600">{s.total}</td>
                      <td className="py-2 text-center text-emerald-600 font-bold">{s.hired}</td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${s.rate}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${s.rate >= 30 ? 'text-emerald-600' : 'text-gray-500'}`}>{s.rate}٪</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Position Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-5">تحلیل موقعیت‌های شغلی</h3>
          {stats.positionData.length === 0 ? (
            <p className="text-gray-400 text-sm">داده‌ای موجود نیست.</p>
          ) : (
            <div className="space-y-4">
              {stats.positionData.map(pos => {
                const maxTotal = Math.max(...stats.positionData.map(p => p.total), 1);
                return (
                  <div key={pos.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{pos.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">{pos.total} نفر</span>
                        {pos.hired > 0 && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{pos.hired} استخدام</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-3 bg-[var(--color-primary-400)] rounded-full report-bar" style={{ width: `${(pos.total / maxTotal) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
