import { 
  parseISO, 
  startOfDay, 
  subDays, 
  subMonths, 
  isAfter, 
  isBefore, 
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfMonth,
  isSameDay,
  isSameMonth
} from 'date-fns';
import type { Enquiry, EnquiryStatus } from '../types/enquiry';

export type TimeRange = '7days' | '30days' | '90days' | '12months' | 'all';

// Filters the dataset to only include enquiries received within the specified timeframe
export const filterEnquiriesByRange = (enquiries: Enquiry[], range: TimeRange): Enquiry[] => {
  if (range === 'all') return enquiries;
  
  const today = startOfDay(new Date());
  let startDate: Date;

  switch (range) {
    // Calculates inclusive date boundaries where today is counted as the first calendar day
    case '7days': startDate = subDays(today, 6); break;
    case '30days': startDate = subDays(today, 29); break;
    case '90days': startDate = subDays(today, 89); break;
    case '12months': startDate = subMonths(today, 12); break;
  }

  return enquiries.filter(eq => {
    const received = startOfDay(parseISO(eq.dateReceived));
    return !isBefore(received, startDate) && !isAfter(received, today);
  });
};

// Aggregates enquiry volume chronologically by day or month for chart rendering
export const getEnquiryVolumeByPeriod = (enquiries: Enquiry[], range: TimeRange) => {
  const filtered = filterEnquiriesByRange(enquiries, range);
  const today = startOfDay(new Date());
  
  if (range === '12months' || range === 'all') {
    const start = range === 'all' 
      ? (filtered.length > 0 ? startOfMonth(parseISO(filtered[filtered.length - 1].dateReceived)) : subMonths(today, 6))
      : subMonths(today, 11);
    
    const months = eachMonthOfInterval({ start, end: today });
    
    return months.map(month => {
      const count = filtered.filter(eq => isSameMonth(parseISO(eq.dateReceived), month)).length;
      return {
        label: format(month, 'MMM yyyy'),
        shortLabel: format(month, 'MMM'),
        count,
        date: month
      };
    });
  } else {
    // Generates daily data points using inclusive date boundaries for shorter timeframes
    const start = range === '7days' ? subDays(today, 6) : range === '30days' ? subDays(today, 29) : subDays(today, 89);
    const days = eachDayOfInterval({ start, end: today });
    
    return days.map(day => {
      const count = filtered.filter(eq => isSameDay(parseISO(eq.dateReceived), day)).length;
      return {
        label: format(day, 'dd MMM yyyy'),
        shortLabel: format(day, 'dd MMM'),
        count,
        date: day
      };
    });
  }
};

// Calculates financial totals and win/loss conversion rates from active and closed enquiries
export const getPipelineMetrics = (enquiries: Enquiry[]) => {
  let wonCount = 0;
  let lostCount = 0;
  let pipelineValue = 0;
  let wonValue = 0;

  enquiries.forEach(eq => {
    if (eq.status === 'Won') {
      wonCount++;
      wonValue += eq.estimatedBudget;
    } else if (eq.status === 'Lost') {
      lostCount++;
    } else {
      pipelineValue += eq.estimatedBudget;
    }
  });

  const closedCount = wonCount + lostCount;
  const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  return { pipelineValue, wonValue, conversionRate, wonCount, lostCount };
};

// Computes the absolute count and relative percentage of enquiries across all pipeline stages
export const getStatusDistribution = (enquiries: Enquiry[]) => {
  const distribution: Record<EnquiryStatus, number> = {
    'New': 0, 'Contacted': 0, 'Proposal Sent': 0, 'Won': 0, 'Lost': 0
  };
  
  enquiries.forEach(eq => { distribution[eq.status]++; });
  
  return Object.entries(distribution).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: enquiries.length > 0 ? Math.round((count / enquiries.length) * 100) : 0
  }));
};

// Groups enquiries by acquisition channel, falling back to 'Unknown' for missing data
export const getSourceDistribution = (enquiries: Enquiry[]) => {
  const distribution: Record<string, number> = {};
  
  enquiries.forEach(eq => {
    const source = eq.source || 'Unknown';
    distribution[source] = (distribution[source] || 0) + 1;
  });

  return Object.entries(distribution)
    .map(([source, count]) => ({ name: source, value: count }))
    .sort((a, b) => b.value - a.value);
};