import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Award, Cpu, BarChart2, Star, Calendar, RefreshCcw } from 'lucide-react';
import { storage } from '../storage';
import type { AnalyticsEntry } from '../types';

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    improvedPercent: 0,
    interviewPercent: 0,
    topProvider: 'gemini',
    topPlatform: 'Gemini',
    categoryCounts: {} as Record<string, number>,
    dailyCounts: [] as { date: string; count: number }[]
  });

  const load = async () => {
    setLoading(true);
    const analytics = await storage.getAnalytics();
    setData(analytics);

    if (analytics.length === 0) {
      setLoading(false);
      return;
    }

    // Calculations
    const total = analytics.length;
    const scores = analytics.map(e => e.qualityScore).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const improvedPercent = Math.round((analytics.filter(e => e.improved).length / total) * 100) || 0;
    const interviewPercent = Math.round((analytics.filter(e => e.interviewUsed).length / total) * 100) || 0;

    // Top provider
    const providers = analytics.map(e => e.provider);
    const providerFreq = providers.reduce((acc, p) => ({ ...acc, [p]: (acc[p] || 0) + 1 }), {} as Record<string, number>);
    const topProvider = Object.keys(providerFreq).reduce((a, b) => providerFreq[a] > providerFreq[b] ? a : b, 'gemini');

    // Top platform
    const platforms = analytics.map(e => e.platform);
    const platformFreq = platforms.reduce((acc, p) => ({ ...acc, [p]: (acc[p] || 0) + 1 }), {} as Record<string, number>);
    const topPlatform = Object.keys(platformFreq).reduce((a, b) => platformFreq[a] > platformFreq[b] ? a : b, 'Gemini');

    // Categories
    const categories = analytics.map(e => e.category);
    const categoryCounts = categories.reduce((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {} as Record<string, number>);

    // Daily counts (last 7 days)
    const dailyMap = {} as Record<string, number>;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    analytics.forEach(e => {
      if (dailyMap[e.date] !== undefined) {
        dailyMap[e.date]++;
      }
    });
    const dailyCounts = Object.keys(dailyMap).map(k => ({ date: k.slice(5), count: dailyMap[k] }));

    setStats({
      total,
      avgScore,
      improvedPercent,
      interviewPercent,
      topProvider,
      topPlatform,
      categoryCounts,
      dailyCounts
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleClear = async () => {
    if (!window.confirm('Clear all analytics data? This will reset metrics.')) return;
    await storage.clearAnalytics();
    setData([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Usage <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Insights into your prompt enhancement patterns
          </p>
        </div>
        {data.length > 0 && (
          <button className="btn-secondary py-1.5 px-3 text-xs" onClick={handleClear}>
            Reset Metrics
          </button>
        )}
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading analytics...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="glass-card-static p-12 text-center">
          <BarChart2 size={36} className="mx-auto text-primary-500/40 mb-3 animate-pulse" />
          <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>No Analytics Yet</h3>
          <p className="text-xs max-w-xs mx-auto mb-4" style={{ color: 'var(--text-secondary)' }}>
            Once you enhance prompts using the extension widget, details of scores, provider routes, and styles will be visualized here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top stats */}
          <div className="grid grid-cols-1 gap-4 md:col-span-1">
            <div className="glass-card-static p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500">
                <Sparkles size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Total Enhancements</span>
                <span className="text-2xl font-bold text-slate-100">{stats.total}</span>
              </div>
            </div>

            <div className="glass-card-static p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-green-500/10 text-green-500">
                <Award size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Average Quality Score</span>
                <span className="text-2xl font-bold text-slate-100">{stats.avgScore}/100</span>
              </div>
            </div>

            <div className="glass-card-static p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-purple-500/10 text-purple-500">
                <Cpu size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Top Provider / Platform</span>
                <span className="text-sm font-semibold text-slate-100 block capitalize">{stats.topProvider}</span>
                <span className="text-[10px] text-slate-400">on {stats.topPlatform}</span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="glass-card-static p-5 md:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp size={15} /> Weekly Activity
              </h3>
            </div>
            <div className="h-44 w-full flex items-end justify-between gap-1.5 pt-4">
              {stats.dailyCounts.map((d, i) => {
                const max = Math.max(...stats.dailyCounts.map(x => x.count), 1);
                const heightPercent = (d.count / max) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="text-[10px] font-semibold text-slate-300 mb-1">{d.count}</div>
                    <div
                      style={{ height: `${Math.max(heightPercent, 5)}%`, background: 'linear-gradient(to top, #4285F4, #9333EA)' }}
                      className="w-full rounded-t-lg transition-all duration-500 hover:brightness-110"
                    />
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">{d.date}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Platform and Provider Route Distribution */}
          <div className="glass-card-static p-5 md:col-span-3">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Category & Style Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Intent Category</span>
                {Object.keys(stats.categoryCounts).map(cat => {
                  const count = stats.categoryCounts[cat];
                  const percentage = Math.round((count / stats.total) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-300">
                        <span className="capitalize">{cat}</span>
                        <span>{percentage}% ({count})</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4 flex flex-col justify-center">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/20 border border-slate-700/20">
                  <div className="text-xs">
                    <span className="font-semibold block text-slate-200">Replaced Prompts</span>
                    <span className="text-slate-400 text-[10px]">Percentage of prompt updates accepted</span>
                  </div>
                  <span className="text-lg font-bold text-green-500">{stats.improvedPercent}%</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/20 border border-slate-700/20">
                  <div className="text-xs">
                    <span className="font-semibold block text-slate-200">Interview Mode Used</span>
                    <span className="text-slate-400 text-[10px]">Prompts requiring detailed clarification</span>
                  </div>
                  <span className="text-lg font-bold text-purple-500">{stats.interviewPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
