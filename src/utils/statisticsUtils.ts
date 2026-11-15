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

export const filterEnquiriesByRange = (enquiries: Enquiry[], range: TimeRange): Enquiry[] => {
  if (range === 'all') return enquiries;
  
  const today = startOfDay(new Date());
  let startDate: Date;

  switch (range) {
    // FIX: Changed from 7, 30, 90 to 6, 29, 89.
    // If today is counted as Day 1, going back 6 days gives exactly 7 inclusive calendar days.
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
    // The chart was already correctly configured to use 6, 29, and 89.
    // Now it perfectly matches filterEnquiriesByRange.
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