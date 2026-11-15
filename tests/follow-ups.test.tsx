import {
  renderHook,
  act,
  waitFor,
} from '@testing-library/react';

import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';

// FIX: Importing ToastProvider from the restored providers directory
import { ToastProvider } from '../src/providers/ToastProvider';
import {
  FollowUpsProvider,
  useFollowUps,
} from '../src/hooks/useFollowUps';

// Recreates the provider required by useFollowUps
const followUpWrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <FollowUpsProvider>
      {children}
    </FollowUpsProvider>
  </ToastProvider>
);

describe('Bound Studios follow-up management', () => {

  // TEST 1: Create and save a follow-up
  it('creates a follow-up and saves it to localStorage', async () => {
    localStorage.clear();

    const { result } = renderHook(
      () => useFollowUps(),
      { wrapper: followUpWrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      result.current.addFollowUp(
        'enquiry-001',
        '2026-11-20',
        'Discuss project proposal'
      );
    });

    expect(result.current.followUps).toHaveLength(1);

    const createdFollowUp = result.current.followUps[0];

    expect(createdFollowUp).toBeDefined();

    if (!createdFollowUp) {
      throw new Error('Follow-up was not created');
    }

    expect(createdFollowUp.enquiryId).toBe('enquiry-001');

    expect(createdFollowUp.scheduledDate).toBe(
      '2026-11-20T00:00:00.000Z'
    );

    expect(createdFollowUp.description).toBe(
      'Discuss project proposal'
    );

    const savedFollowUps = JSON.parse(
      localStorage.getItem('bound_followups') || '[]'
    );

    expect(savedFollowUps).toHaveLength(1);
    expect(savedFollowUps[0].enquiryId).toBe('enquiry-001');
  });


  // TEST 2: Reschedule an existing follow-up
  it('reschedules a follow-up and records the date change in its activity history', async () => {
    localStorage.clear();

    const { result } = renderHook(
      () => useFollowUps(),
      { wrapper: followUpWrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Create the original follow-up
    await act(async () => {
      result.current.addFollowUp(
        'enquiry-002',
        '2026-11-20',
        'Discuss project proposal'
      );
    });

    const createdFollowUp = result.current.followUps[0];

    expect(createdFollowUp).toBeDefined();

    if (!createdFollowUp) {
      throw new Error('Follow-up was not created');
    }

    const followUpId = createdFollowUp.id;

    // Change its scheduled date
    await act(async () => {
      result.current.rescheduleFollowUp(
        followUpId,
        '2026-11-25'
      );
    });

    const updatedFollowUp = result.current.followUps.find(
      followUp => followUp.id === followUpId
    );

    expect(updatedFollowUp).toBeDefined();

    if (!updatedFollowUp) {
      throw new Error('Rescheduled follow-up was not found');
    }

    // Check the new date
    expect(updatedFollowUp.scheduledDate).toBe(
      '2026-11-25T00:00:00.000Z'
    );

    // Check that the rescheduling activity was recorded
    expect(updatedFollowUp.activity[0]?.type).toBe('rescheduled');

    expect(updatedFollowUp.activity[0]?.previousDate).toBe(
      '2026-11-20T00:00:00.000Z'
    );

    expect(updatedFollowUp.activity[0]?.newDate).toBe(
      '2026-11-25T00:00:00.000Z'
    );

    // Check that the change was persisted
    const savedFollowUps = JSON.parse(
      localStorage.getItem('bound_followups') || '[]'
    );

    expect(savedFollowUps[0].scheduledDate).toBe(
      '2026-11-25T00:00:00.000Z'
    );
  });


  // TEST 3: Synchronise an enquiry's follow-up date without duplicates
  it('updates an existing follow-up instead of creating duplicates when synchronised', async () => {
    localStorage.clear();

    const { result } = renderHook(
      () => useFollowUps(),
      { wrapper: followUpWrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Set the initial follow-up date
    await act(async () => {
      result.current.syncEnquiryFollowUp(
        'enquiry-003',
        '2026-11-20'
      );
    });

    expect(result.current.followUps).toHaveLength(1);

    // Change the date for the same enquiry
    await act(async () => {
      result.current.syncEnquiryFollowUp(
        'enquiry-003',
        '2026-11-25'
      );
    });

    // Confirm there is still only one follow-up
    expect(result.current.followUps).toHaveLength(1);

    const updatedFollowUp = result.current.followUps[0];

    expect(updatedFollowUp).toBeDefined();

    if (!updatedFollowUp) {
      throw new Error('Synchronized follow-up was not found');
    }

    expect(updatedFollowUp.enquiryId).toBe('enquiry-003');

    expect(updatedFollowUp.scheduledDate).toBe(
      '2026-11-25T00:00:00.000Z'
    );

    // Confirm that the new date was saved
    const savedFollowUps = JSON.parse(
      localStorage.getItem('bound_followups') || '[]'
    );

    expect(savedFollowUps).toHaveLength(1);

    expect(savedFollowUps[0].scheduledDate).toBe(
      '2026-11-25T00:00:00.000Z'
    );
  });

});

describe('Follow-up closure activity', () => {
    it('records a closure activity when an enquiry is marked as Won', () => {
      const { result } = renderHook(() => useFollowUps(), {
        wrapper: followUpWrapper,
      });
  
      act(() => {
        result.current.addFollowUp('enquiry-1', '2026-11-20');
      });
  
      act(() => {
        result.current.logClosureActivity('enquiry-1', 'Won');
      });
  
      const followUp = result.current.followUps.find(
        (item) => item.enquiryId === 'enquiry-1'
      );
  
      expect(followUp).toBeDefined();
      expect(followUp?.activity[0]?.type).toBe('closed');
      expect(followUp?.activity[0]?.description).toContain('Won');
    });
  
    it('does not record duplicate closure activity for the same status', () => {
      const { result } = renderHook(() => useFollowUps(), {
        wrapper: followUpWrapper,
      });
  
      act(() => {
        result.current.addFollowUp('enquiry-2', '2026-11-20');
      });
  
      act(() => {
        result.current.logClosureActivity('enquiry-2', 'Won');
      });
  
      act(() => {
        result.current.logClosureActivity('enquiry-2', 'Won');
      });
  
      const followUp = result.current.followUps.find(
        (item) => item.enquiryId === 'enquiry-2'
      );
  
      expect(followUp).toBeDefined();
  
      const closureActivities = followUp?.activity.filter(
        (item) => item.type === 'closed' && item.description.includes('Won')
      );
  
      expect(closureActivities).toHaveLength(1);
    });
  
    it('records a new closure activity when status changes from Won to Lost', () => {
      const { result } = renderHook(() => useFollowUps(), {
        wrapper: followUpWrapper,
      });
  
      act(() => {
        result.current.addFollowUp('enquiry-3', '2026-11-20');
      });
  
      act(() => {
        result.current.logClosureActivity('enquiry-3', 'Won');
      });
  
      act(() => {
        result.current.logClosureActivity('enquiry-3', 'Lost');
      });
  
      const followUp = result.current.followUps.find(
        (item) => item.enquiryId === 'enquiry-3'
      );
  
      expect(followUp).toBeDefined();
      expect(followUp?.activity[0]?.type).toBe('closed');
      expect(followUp?.activity[0]?.description).toContain('Lost');
  
      const closureActivities = followUp?.activity.filter(
        (item) => item.type === 'closed'
      );
  
      expect(closureActivities).toHaveLength(2);
    });
  });

  
  describe('Follow-up date removal and synchronisation', () => {
    it('clears the scheduled date but retains the follow-up record and activity history', () => {
      const { result } = renderHook(() => useFollowUps(), {
        wrapper: followUpWrapper,
      });
  
      act(() => {
        result.current.addFollowUp('enquiry-4', '2026-11-20');
      });
  
      act(() => {
        result.current.syncEnquiryFollowUp('enquiry-4', null);
      });
  
      const followUp = result.current.followUps.find(
        (item) => item.enquiryId === 'enquiry-4'
      );
  
      expect(followUp).toBeDefined();
      expect(followUp?.scheduledDate).toBe('');
      expect(followUp?.activity.length).toBeGreaterThan(1);
      expect(followUp?.activity[0]?.description).toBe(
        'Follow-up date removed from enquiry'
      );
    });
  
    it('does not create duplicate removal activities when the date is already empty', () => {
      const { result } = renderHook(() => useFollowUps(), {
        wrapper: followUpWrapper,
      });
  
      act(() => {
        result.current.addFollowUp('enquiry-5', '2026-11-20');
      });
  
      act(() => {
        result.current.syncEnquiryFollowUp('enquiry-5', null);
      });
  
      act(() => {
        result.current.syncEnquiryFollowUp('enquiry-5', null);
      });
  
      const followUp = result.current.followUps.find(
        (item) => item.enquiryId === 'enquiry-5'
      );
  
      const removalActivities = followUp?.activity.filter(
        (item) => item.description === 'Follow-up date removed from enquiry'
      );
  
      expect(removalActivities).toHaveLength(1);
    });
  
    it('reuses an existing follow-up when a new date is scheduled after removal', () => {
      const { result } = renderHook(() => useFollowUps(), {
        wrapper: followUpWrapper,
      });
  
      act(() => {
        result.current.addFollowUp('enquiry-6', '2026-11-20');
      });
  
      act(() => {
        result.current.syncEnquiryFollowUp('enquiry-6', null);
      });
  
      act(() => {
        result.current.syncEnquiryFollowUp('enquiry-6', '2026-11-25');
      });
  
      const linkedFollowUps = result.current.followUps.filter(
        (item) => item.enquiryId === 'enquiry-6'
      );
  
      expect(linkedFollowUps).toHaveLength(1);
      expect(linkedFollowUps[0]?.scheduledDate).toContain('2026-11-25');
      expect(linkedFollowUps[0]?.activity[0]?.type).toBe('rescheduled');
    });
  });