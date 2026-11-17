import { useMemo } from 'react';
import { isBefore, isToday, parseISO, startOfDay, isValid } from 'date-fns';
import { Inbox, Sparkles, Send, CalendarClock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useEnquiries } from '../hooks/useEnquiries';
import { useFollowUps } from '../hooks/useFollowUps';
import { useSettings } from '../contexts/SettingsContext';
import { getEnquiryVolumeByPeriod } from '../utils/statisticsUtils';
import { StatCard } from '../components/dashboard/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import type { EnquiryStatus } from '../types/enquiry';
import { cn } from '../utils/cn';

const getStatusColor = (status: EnquiryStatus) => {
  switch (status) {
    case 'New': return 'bg-[var(--status-new)]';
    case 'Contacted': return 'bg-[var(--status-contacted)]';
    case 'Proposal Sent': return 'bg-[var(--status-proposal)]';
    case 'Won': return 'bg-[var(--status-won)]';
    case 'Lost': return 'bg-[var(--status-lost)]';
    default: return 'bg-brand-border';
  }
};

export const Dashboard = () => {
  const { enquiries, stats, isLoaded: enquiriesLoaded } = useEnquiries();
  const { followUps, isLoaded: followUpsLoaded } = useFollowUps();
  const { formatDate } = useSettings();

  // Memoize chart data generation to prevent unnecessary recalculations on re-renders
  const chartData = useMemo(() => {
    if (!enquiriesLoaded) return [];
    return getEnquiryVolumeByPeriod(enquiries, '7days');
  }, [enquiries, enquiriesLoaded]);

  if (!enquiriesLoaded || !followUpsLoaded) return null;

  const today = startOfDay(new Date());

  // Filter out finalized enquiries and strictly validate ISO date strings to prevent NaN rendering errors
  const activePendingFollowUps = followUps.filter(fu => {
    const eq = enquiries.find(e => e.id === fu.enquiryId);
    if (!eq || eq.status === 'Won' || eq.status === 'Lost' || !fu.scheduledDate) return false;
    return isValid(parseISO(fu.scheduledDate));
  });
  
  const overdueFollowUps = activePendingFollowUps.filter(fu => 
    isBefore(startOfDay(parseISO(fu.scheduledDate)), today)
  );

  // Extract the 4 most immediate upcoming follow-ups and map client names for the dashboard list
  const upcomingFollowUps = activePendingFollowUps
    .filter(fu => !isBefore(startOfDay(parseISO(fu.scheduledDate)), today))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 4)
    .map(fu => {
      const eq = enquiries.find(e => e.id === fu.enquiryId)!;
      return { ...fu, clientName: eq.clientName };
    });

  // Sort the full enquiry array chronologically by date received and slice the top 4
  const recentEnquiries = [...enquiries]
    .sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime())
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12">
      <PageHeader 
        title="Dashboard" 
        subtitle="A quick overview of your enquiries and follow-ups." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard title="Total enquiries" value={stats.total} icon={Inbox} />
        <StatCard title="New enquiries" value={stats.new} icon={Sparkles} />
        <StatCard title="In Progress" value={stats.inProgress} icon={Send} />
        <StatCard 
          title="Overdue follow-ups" 
          value={overdueFollowUps.length} 
          icon={CalendarClock} 
          variant={overdueFollowUps.length > 0 ? 'warning' : 'default'} 
        />
      </div>

      <div className="flex flex-col gap-6">
        
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          
          <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-card p-6 xl:col-span-2 h-full min-h-[320px]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-content-primary">Enquiries (Past 7 Days)</h2>
              <Link to="/statistics" className="flex items-center text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">
                <span className="hidden sm:inline">View all &rarr;</span>
                <ArrowRight className="h-4 w-4 sm:hidden" />
              </Link>
            </div>
            
            <div className="w-full pt-4 flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ minHeight: '240px' }}>
              <div className="min-w-[500px] h-full [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
                <ResponsiveContainer width="100%" height="100%" className="!outline-none">
                  <AreaChart data={chartData} margin={{ top: 10, right: 45, left: -25, bottom: 0 }} className="!outline-none">
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--status-won)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--status-won)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                      dataKey="shortLabel" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}
                      allowDecimals={false}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
                    />
                    <Tooltip 
                      cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ 
                        backgroundColor: 'var(--card-bg)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        outline: 'none'
                      }}
                      itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
                      labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                      isAnimationActive={false} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      name="Enquiries"
                      stroke="var(--status-won)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                      activeDot={{ r: 6, fill: 'var(--card-bg)', stroke: 'var(--status-won)', strokeWidth: 2, className: '!outline-none' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-card p-6 xl:col-span-1 h-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-content-primary">Upcoming follow-ups</h2>
              <Link to="/follow-ups" className="flex items-center text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">
                <span className="hidden sm:inline">View all &rarr;</span>
                <ArrowRight className="h-4 w-4 sm:hidden" />
              </Link>
            </div>
            
            <div className="flex flex-col divide-y divide-brand-border h-full">
              {upcomingFollowUps.map((fu) => {
                const isDueToday = isToday(parseISO(fu.scheduledDate));
                return (
                  <div key={fu.id} className="group flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-[var(--status-new)] flex-shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-content-primary leading-tight">{fu.clientName}</span>
                        <span className={cn(
                          "text-xs",
                          isDueToday ? "text-[var(--status-new)] font-medium" : "text-content-secondary"
                        )}>
                          {isDueToday ? 'Due today' : `Due ${formatDate(fu.scheduledDate)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingFollowUps.length === 0 && (
                <div className="flex flex-1 items-center justify-center py-12 text-center text-sm text-content-secondary">
                  No upcoming follow-ups scheduled.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-content-primary">Recent enquiries</h2>
            <Link to="/enquiries" className="flex items-center text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">
              <span className="hidden sm:inline">View all &rarr;</span>
              <ArrowRight className="h-4 w-4 sm:hidden" />
            </Link>
          </div>
          
          <div className="flex flex-col">
            
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-content-secondary">
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Project</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {recentEnquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="group transition-colors hover:bg-brand-hover">
                      <td className="py-3 font-medium text-content-primary">{enquiry.clientName}</td>
                      <td className="py-3 text-content-secondary">{enquiry.projectType || 'General Enquiry'}</td>
                      <td className="py-3">
                        <StatusBadge status={enquiry.status} />
                      </td>
                      <td className="py-3 text-right text-content-secondary">
                        {formatDate(enquiry.dateReceived)}
                      </td>
                    </tr>
                  ))}
                  {recentEnquiries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-content-secondary">
                        No recent enquiries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex sm:hidden flex-col divide-y divide-brand-border mt-2">
              {recentEnquiries.map((enquiry) => (
                <div key={enquiry.id} className="group flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", getStatusColor(enquiry.status))} />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-content-primary leading-tight">{enquiry.clientName}</span>
                      <span className="text-xs text-content-secondary font-medium">{enquiry.status}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentEnquiries.length === 0 && (
                <div className="py-8 text-center text-sm text-content-secondary">
                  No recent enquiries found.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};