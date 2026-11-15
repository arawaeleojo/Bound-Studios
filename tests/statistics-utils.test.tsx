import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Enquiry } from '../src/types/enquiry';

import {
  getPipelineMetrics,
  getStatusDistribution,
  getSourceDistribution,
  filterEnquiriesByRange,
  getEnquiryVolumeByPeriod,
} from '../src/utils/statisticsUtils';

// Create test enquiries with predictable values.
const makeEnquiry = (
  overrides: Partial<Enquiry> = {}
): Enquiry =>
  ({
    id: 'test-enquiry',
    clientName: 'Test Client',
    dateReceived: '2026-11-01T10:00:00.000Z',
    status: 'New',
    estimatedBudget: 100000,
    source: 'Website',
    ...overrides,
  }) as Enquiry;

describe('Statistics utility functions', () => {
  describe('getPipelineMetrics', () => {
    it('calculates pipeline value, won value and conversion rate correctly', () => {
      const enquiries = [
        makeEnquiry({
          id: '1',
          status: 'New',
          estimatedBudget: 100000,
        }),
        makeEnquiry({
          id: '2',
          status: 'Contacted',
          estimatedBudget: 200000,
        }),
        makeEnquiry({
          id: '3',
          status: 'Proposal Sent',
          estimatedBudget: 300000,
        }),
        makeEnquiry({
          id: '4',
          status: 'Won',
          estimatedBudget: 400000,
        }),
        makeEnquiry({
          id: '5',
          status: 'Lost',
          estimatedBudget: 500000,
        }),
      ];

      const result = getPipelineMetrics(enquiries);

      expect(result).toEqual({
        pipelineValue: 600000,
        wonValue: 400000,
        conversionRate: 50,
        wonCount: 1,
        lostCount: 1,
      });
    });

    it('returns zero values when there are no enquiries', () => {
      const result = getPipelineMetrics([]);

      expect(result).toEqual({
        pipelineValue: 0,
        wonValue: 0,
        conversionRate: 0,
        wonCount: 0,
        lostCount: 0,
      });
    });

    it('returns zero conversion rate when there are no closed enquiries', () => {
      const enquiries = [
        makeEnquiry({ id: '1', status: 'New' }),
        makeEnquiry({ id: '2', status: 'Contacted' }),
        makeEnquiry({ id: '3', status: 'Proposal Sent' }),
      ];

      const result = getPipelineMetrics(enquiries);

      expect(result.conversionRate).toBe(0);
      expect(Number.isFinite(result.conversionRate)).toBe(true);
    });
  });

  describe('getStatusDistribution', () => {
    it('counts enquiries under their correct statuses', () => {
      const enquiries = [
        makeEnquiry({ id: '1', status: 'New' }),
        makeEnquiry({ id: '2', status: 'New' }),
        makeEnquiry({ id: '3', status: 'Contacted' }),
        makeEnquiry({ id: '4', status: 'Proposal Sent' }),
        makeEnquiry({ id: '5', status: 'Won' }),
        makeEnquiry({ id: '6', status: 'Lost' }),
      ];

      const result = getStatusDistribution(enquiries);

      expect(result).toEqual([
        { name: 'New', value: 2, percentage: 33 },
        { name: 'Contacted', value: 1, percentage: 17 },
        { name: 'Proposal Sent', value: 1, percentage: 17 },
        { name: 'Won', value: 1, percentage: 17 },
        { name: 'Lost', value: 1, percentage: 17 },
      ]);
    });

    it('returns all five statuses with zero values for an empty dataset', () => {
      const result = getStatusDistribution([]);

      expect(result).toEqual([
        { name: 'New', value: 0, percentage: 0 },
        { name: 'Contacted', value: 0, percentage: 0 },
        { name: 'Proposal Sent', value: 0, percentage: 0 },
        { name: 'Won', value: 0, percentage: 0 },
        { name: 'Lost', value: 0, percentage: 0 },
      ]);
    });
  });

  describe('getSourceDistribution', () => {
    it('groups enquiries by source and sorts them by count', () => {
      const enquiries = [
        makeEnquiry({ id: '1', source: 'Website' }),
        makeEnquiry({ id: '2', source: 'Referral' }),
        makeEnquiry({ id: '3', source: 'Website' }),
        makeEnquiry({ id: '4', source: 'Instagram' }),
        makeEnquiry({ id: '5', source: 'Website' }),
      ];

      const result = getSourceDistribution(enquiries);

      expect(result).toEqual([
        { name: 'Website', value: 3 },
        { name: 'Referral', value: 1 },
        { name: 'Instagram', value: 1 },
      ]);
    });

    it('groups enquiries without a source under Unknown', () => {
      const enquiries = [
        makeEnquiry({ id: '1', source: 'Website' }),
        makeEnquiry({ id: '2', source: undefined }),
        makeEnquiry({ id: '3', source: '' }),
      ];

      const result = getSourceDistribution(enquiries);

      expect(result).toContainEqual({
        name: 'Unknown',
        value: 2,
      });
    });

    it('returns an empty array when there are no enquiries', () => {
      expect(getSourceDistribution([])).toEqual([]);
    });
  });
});


describe('Date range filtering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns enquiries received within the last seven calendar days, including today', () => {
    const enquiries = [
      makeEnquiry({
        id: '1',
        dateReceived: '2026-11-07', // FIX: Set to exactly 8 days ago (Excluded)
      }),
      makeEnquiry({
        id: '2',
        dateReceived: '2026-11-08', // FIX: Set to exactly 7 days inclusive (Included)
      }),
      makeEnquiry({
        id: '3',
        dateReceived: '2026-11-14', // Today (Included)
      }),
    ];

    const result = filterEnquiriesByRange(enquiries, '7days');

    expect(result.map((item) => item.id)).toEqual(['2', '3']);
  });

  it('excludes enquiries received in the future', () => {
    const enquiries = [
      makeEnquiry({
        id: '1',
        dateReceived: '2026-11-14',
      }),
      makeEnquiry({
        id: '2',
        dateReceived: '2026-11-15',
      }),
    ];

    const result = filterEnquiriesByRange(enquiries, '7days');

    expect(result.map((item) => item.id)).toEqual(['1']);
  });

  it('returns all enquiries when the selected range is all time', () => {
    const enquiries = [
      makeEnquiry({
        id: '1',
        dateReceived: '2020-01-01',
      }),
      makeEnquiry({
        id: '2',
        dateReceived: '2026-11-14',
      }),
    ];

    const result = filterEnquiriesByRange(enquiries, 'all');

    expect(result).toHaveLength(2);
  });
});

describe('Enquiry volume over time', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates exactly seven daily data points for the 7-day range', () => {
    const enquiries = [
      makeEnquiry({
        id: '1',
        dateReceived: '2026-11-08', // FIX: Set to the first day of the 7-day boundary
      }),
      makeEnquiry({
        id: '2',
        dateReceived: '2026-11-14', // Today (last day of boundary)
      }),
    ];

    const result = getEnquiryVolumeByPeriod(enquiries, '7days');

    expect(result).toHaveLength(7);
    expect(result[0]?.count).toBe(1); // Verifies 2026-11-08
    expect(result[6]?.count).toBe(1); // Verifies 2026-11-14
  });

  it('counts enquiries on their correct dates', () => {
    const enquiries = [
      makeEnquiry({
        id: '1',
        dateReceived: '2026-11-12',
      }),
      makeEnquiry({
        id: '2',
        dateReceived: '2026-11-12',
      }),
      makeEnquiry({
        id: '3',
        dateReceived: '2026-11-14',
      }),
    ];

    const result = getEnquiryVolumeByPeriod(enquiries, '7days');

    const november12 = result.find(
      (item) => item.shortLabel === '12 Nov'
    );

    const november14 = result.find(
      (item) => item.shortLabel === '14 Nov'
    );

    expect(november12?.count).toBe(2);
    expect(november14?.count).toBe(1);
  });
});