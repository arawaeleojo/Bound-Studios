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
  eachWeekOfInterval,
  eachYearOfInterval,
  startOfMonth,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  min,
  differenceInMonths
} from 'date-fns';
import type { Enquiry, EnquiryStatus } from '../types/enquiry';

export type TimeRange = '7days' | '30days' | '90days' | '12months' | 'all';

// Filters the dataset to only include enquiries received within the specified timeframe
export const filterEnquiriesByRange = (enquiries: Enquiry[], range: TimeRange): Enquiry[] => {
  if (range === 'all') return enquiries;
  
  const today = startOfDay(new Date());
  let startDate: Date;

  switch (range) {
    case '7days': startDate = subDays(today, 6); break;
    case '30days': startDate = subDays(today, 29); break;
    case '90days': startDate = subDays(today, 89); break;
    case '12months': startDate = subMonths(today, 11); break; // 11 to include current month = 12 total
  }

  return enquiries.filter(eq => {
    const received = startOfDay(parseISO(eq.dateReceived));
    return !isBefore(received, startDate) && !isAfter(received, today);
  });
};

// Aggregates enquiry volume chronologically adaptively by day, week, month, or year
export const getEnquiryVolumeByPeriod = (enquiries: Enquiry[], range: TimeRange) => {
  const filtered = filterEnquiriesByRange(enquiries, range);
  const today = startOfDay(new Date());
  
  if (filtered.length === 0) return [];

  if (range === '7days' || range === '30days') {
    const start = range === '7days' ? subDays(today, 6) : subDays(today, 29);
    const days = eachDayOfInterval({ start, end: today });
    
    return days.map(day => ({
      label: format(day, 'dd MMM yyyy'),
      shortLabel: format(day, 'dd MMM'),
      count: filtered.filter(eq => isSameDay(parseISO(eq.dateReceived), day)).length,
      date: day
    }));
  }

  if (range === '90days') {
    const start = subDays(today, 89);
    const weeks = eachWeekOfInterval({ start, end: today }, { weekStartsOn: 1 });
    
    return weeks.map(week => ({
      label: `Week of ${format(week, 'dd MMM yyyy')}`,
      shortLabel: format(week, 'dd MMM'),
      count: filtered.filter(eq => isSameWeek(parseISO(eq.dateReceived), week, { weekStartsOn: 1 })).length,
      date: week
    }));
  }

  if (range === '12months' || range === 'all') {
    let start = subMonths(today, 11);
    
    if (range === 'all') {
      const allDates = filtered.map(eq => parseISO(eq.dateReceived));
      start = startOfMonth(min(allDates));
    }

    const diffMonths = differenceInMonths(today, start);
    
    // Group by year if dataset spans more than 36 months to maintain readability
    if (range === 'all' && diffMonths > 36) {
      const years = eachYearOfInterval({ start, end: today });
      return years.map(year => ({
        label: format(year, 'yyyy'),
        shortLabel: format(year, 'yyyy'),
        count: filtered.filter(eq => isSameYear(parseISO(eq.dateReceived), year)).length,
        date: year
      }));
    }

    const months = eachMonthOfInterval({ start, end: today });
    return months.map(month => ({
      label: format(month, 'MMM yyyy'),
      shortLabel: range === 'all' ? format(month, 'MMM yy') : format(month, 'MMM'),
      count: filtered.filter(eq => isSameMonth(parseISO(eq.dateReceived), month)).length,
      date: month
    }));
  }
  
  return [];
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