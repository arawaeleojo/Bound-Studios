import { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingUp, TrendingDown, Activity, Wallet, Award } from 'lucide-react';
import { useEnquiries } from '../hooks/useEnquiries';
import { useSettings } from '../contexts/SettingsContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Select } from '../components/ui/Select';
import { StatCard } from '../components/dashboard/StatCard';
import { 
  filterEnquiriesByRange, 
  getEnquiryVolumeByPeriod, 
  getPipelineMetrics, 
  getStatusDistribution, 
  getSourceDistribution 
} from '../utils/statisticsUtils';
import type { TimeRange } from '../utils/statisticsUtils';
import type { EnquiryStatus } from '../types/enquiry';

const STATUS_COLORS: Record<EnquiryStatus, string> = {
  'New': 'var(--status-new)',
  'Contacted': 'var(--status-contacted)',
  'Proposal Sent': 'var(--status-proposal)',
  'Won': 'var(--status-won)',
  'Lost': 'var(--status-lost)'
};

export const Statistics = () => {
  const { enquiries, isLoaded } = useEnquiries();
  const { formatCurrency } = useSettings();
  const [timeRange, setTimeRange] = useState<TimeRange>('12months');

  const { filteredData, volumeData, metrics, statusData, sourceData } = useMemo(() => {
    const filtered = filterEnquiriesByRange(enquiries, timeRange);
    return {
      filteredData: filtered,
      volumeData: getEnquiryVolumeByPeriod(enquiries, timeRange),
      metrics: getPipelineMetrics(filtered),
      statusData: getStatusDistribution(filtered),
      sourceData: getSourceDistribution(filtered)
    };
  }, [enquiries, timeRange]);

  if (!isLoaded) return null;

  const activeCount = filteredData.length - metrics.wonCount - metrics.lostCount;
  const topStatus = [...statusData].sort((a, b) => b.value - a.value)[0]?.name || 'None';
  const topSource = sourceData[0]?.name || 'None';

  type ChartDataPoint = { name: string; value: number; percentage: number };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader 
        title="Statistics" 
        subtitle="Understand your enquiry pipeline, monitor performance and identify trends over time."
        action={
          <Select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="w-full sm:w-48 bg-brand-card"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="12months">Last 12 months</option>
            <option value="all">All time</option>
          </Select>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Enquiries" value={filteredData.length} icon={Target} />
        <StatCard title="Won Enquiries" value={metrics.wonCount} icon={TrendingUp} />
        <StatCard title="Lost Enquiries" value={metrics.lostCount} icon={TrendingDown} />
        <StatCard title="Conversion Rate (Closed)" value={`${metrics.conversionRate}%`} icon={Activity} />
        <StatCard title="Est. Pipeline Value (Active)" value={formatCurrency(metrics.pipelineValue)} icon={Wallet} />
        <StatCard title="Won Opportunity Value" value={formatCurrency(metrics.wonValue)} icon={Award} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        
        {/* ROW 1: Enquiries Over Time - Bar Chart */}
        <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-card p-6 xl:col-span-2">
          <h2 className="font-semibold text-content-primary">Enquiries Volume</h2>
          
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                {/* minTickGap safely distributes labels for dense datasets like 30days without overlapping */}
                <XAxis 
                  dataKey="shortLabel" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                  dy={10}
                  minTickGap={30} 
                />
                <YAxis 
                  allowDecimals={false} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                  width={45} 
                />
                <Tooltip 
                  cursor={{ fill: 'var(--hover-bg)' }}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                  labelFormatter={(_, payload) => payload[0]?.payload?.label || ''}
                />
                <Bar 
                  dataKey="count" 
                  name="Enquiries" 
                  fill="var(--accent-secondary)" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROW 1: Status Distribution - Donut Chart */}
        <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-card p-6">
          <h2 className="font-semibold text-content-primary">Pipeline Distribution</h2>
          <div className="flex flex-col items-center w-full h-full justify-between gap-4">
            <div className="h-[220px] sm:h-[260px] w-full relative flex items-center justify-center">
              {filteredData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData.filter((d: ChartDataPoint) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="85%"
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.filter((d: ChartDataPoint) => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as EnquiryStatus]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl sm:text-3xl font-semibold text-content-primary">{filteredData.length}</span>
                    <span className="text-xs text-content-secondary">Total</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-content-secondary flex h-full items-center">No data for selected period</div>
              )}
            </div>

            {filteredData.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 w-full border-t border-brand-border/50 pt-4 mt-auto">
                {statusData.filter((d: ChartDataPoint) => d.value > 0).map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs font-medium text-content-secondary">
                    <span 
                      className="h-2.5 w-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: STATUS_COLORS[entry.name as EnquiryStatus] }} 
                    />
                    <span>{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Source Distribution - Horizontal Bar Chart */}
        <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-card p-6 xl:col-span-2">
          <h2 className="font-semibold text-content-primary">Enquiry Sources</h2>
          <div className="h-[240px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 11, fontWeight: 500 }} width={55} />
                <Tooltip 
                  cursor={{ fill: 'var(--hover-bg)' }}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
                />
                <Bar dataKey="value" name="Enquiries" fill="var(--btn-primary)" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROW 2: Data Insights Panel */}
        <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-elevated p-6">
          <h2 className="font-semibold text-content-primary">Key Insights</h2>
          <div className="flex flex-col divide-y divide-brand-border h-full justify-center">
            <div className="py-3 flex justify-between items-center">
              <span className="text-sm text-content-secondary">Active Opportunities</span>
              <span className="text-sm font-semibold text-content-primary">{activeCount}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-sm text-content-secondary">Most Common Status</span>
              <span className="text-sm font-semibold text-content-primary">{topStatus}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-sm text-content-secondary">Top Enquiry Source</span>
              <span className="text-sm font-semibold text-content-primary">{topSource}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-sm text-content-secondary">Enquiries in Period</span>
              <span className="text-sm font-semibold text-content-primary">{filteredData.length}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};