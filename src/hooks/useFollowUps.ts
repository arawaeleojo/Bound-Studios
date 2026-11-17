import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FollowUp, FollowUpActivityType } from '../types/followUp';
import type { Enquiry } from '../types/enquiry';
import { useToast } from '../contexts/ToastContext';

// Defines the contract for central follow-up scheduling, tracking, and synchronization
interface FollowUpsContextType {
  followUps: FollowUp[];
  addFollowUp: (enquiryId: string, scheduledDate: string, description?: string) => void;
  rescheduleFollowUp: (id: string, newDate: string) => void;
  syncEnquiryFollowUp: (enquiryId: string, dateStr?: string | null) => void;
  logClosureActivity: (enquiryId: string, status: string) => void;
  deleteFollowUpByEnquiryId: (enquiryId: string) => void;
  isLoaded: boolean;
}

const FollowUpsContext = createContext<FollowUpsContextType | null>(null);

export function FollowUpsProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  
  // Lazy initialization ensuring follow-ups are deduplicated and correctly migrated from legacy enquiry arrays
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => {
    let storedFollowUps = null;
    let storedEnquiries = null;
    
    try {
      storedFollowUps = localStorage.getItem('bound_followups');
      storedEnquiries = localStorage.getItem('bound_enquiries');
    } catch {
      // Ignored: toast will be handled on write failures
    }
    
    if (storedFollowUps) {
      try {
        const parsed = JSON.parse(storedFollowUps);
        if (Array.isArray(parsed)) {
          return Array.from(new Map(parsed.map((item: FollowUp) => [item.enquiryId, item])).values()) as FollowUp[];
        }
      } catch {
        // Intentionally left empty to avoid overwriting corrupted JSON
      }
    } else if (storedEnquiries) {
      // Backwards compatibility mapping: Extracts old inline followUpDates into dedicated FollowUp entities
      try {
        const parsedEnquiries = JSON.parse(storedEnquiries);
        if (Array.isArray(parsedEnquiries)) {
          const migrated: FollowUp[] = [];
          parsedEnquiries.forEach((eq: Enquiry) => {
            if (eq.followUpDate) {
              migrated.push({
                id: Math.random().toString(36).substr(2, 9),
                enquiryId: eq.id,
                scheduledDate: eq.followUpDate,
                description: 'Initial follow-up',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                activity: [{
                  id: Math.random().toString(36).substr(2, 9),
                  type: 'scheduled' as FollowUpActivityType,
                  date: new Date().toISOString(),
                  description: 'Follow-up scheduled from initial enquiry',
                  user: 'System'
                }]
              });
            }
          });
          return Array.from(new Map(migrated.map(item => [item.enquiryId, item])).values());
        }
      } catch {
        // Intentionally empty
      }
    }
    return [];
  });

  const [isLoaded] = useState(true);

  // Synchronizes the migrated memory state back to persistent storage on the initial load
  useEffect(() => {
    try {
      localStorage.setItem('bound_followups', JSON.stringify(followUps));
    } catch {
      // Ignored on initial mount
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveFollowUps = (newData: FollowUp[]) => {
    setFollowUps(newData);
    try {
      localStorage.setItem('bound_followups', JSON.stringify(newData));
    } catch {
      showToast('Failed to save follow-up data to device storage.', 'error');
    }
  };

  const addFollowUp = (enquiryId: string, scheduledDate: string, description: string = 'Follow-up') => {
    const newFollowUp: FollowUp = {
      id: Math.random().toString(36).substr(2, 9),
      enquiryId,
      scheduledDate: new Date(scheduledDate).toISOString(),
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activity: [{
        id: Math.random().toString(36).substr(2, 9),
        type: 'scheduled' as FollowUpActivityType,
        date: new Date().toISOString(),
        description: 'Follow-up scheduled',
        user: 'You'
      }]
    };
    saveFollowUps([...followUps, newFollowUp]);
    showToast('Follow-up scheduled.', 'success');
  };

  const rescheduleFollowUp = (id: string, newDate: string) => {
    const updated = followUps.map(fu => {
      if (fu.id === id) {
        return {
          ...fu,
          scheduledDate: new Date(newDate).toISOString(),
          updatedAt: new Date().toISOString(),
          activity: [{
            id: Math.random().toString(36).substr(2, 9),
            type: 'rescheduled' as FollowUpActivityType,
            date: new Date().toISOString(),
            description: `Rescheduled to ${new Date(newDate).toLocaleDateString()}`,
            previousDate: fu.scheduledDate,
            newDate: new Date(newDate).toISOString(),
            user: 'You'
          }, ...fu.activity]
        };
      }
      return fu;
    });
    saveFollowUps(updated);
    showToast('Follow-up rescheduled.', 'success');
  };

  // Reconciles manual enquiry updates: creates, modifies, or clears the linked follow-up automatically
  const syncEnquiryFollowUp = (enquiryId: string, dateStr?: string | null) => {
    const existing = followUps.find(f => f.enquiryId === enquiryId);
    
    if (!dateStr) {
      if (existing && existing.scheduledDate) {
        const updated = followUps.map(fu => {
          if (fu.id === existing.id) {
            return {
              ...fu,
              scheduledDate: '',
              updatedAt: new Date().toISOString(),
              activity: [{
                id: Math.random().toString(36).substr(2, 9),
                type: 'note' as FollowUpActivityType,
                date: new Date().toISOString(),
                description: 'Follow-up date removed from enquiry',
                user: 'You'
              }, ...fu.activity]
            };
          }
          return fu;
        });
        saveFollowUps(updated);
      }
      return;
    }

    if (existing) {
      const existingDate = existing.scheduledDate ? existing.scheduledDate.split('T')[0] : '';
      const newDate = dateStr.split('T')[0];
      if (existingDate !== newDate) {
        rescheduleFollowUp(existing.id, dateStr);
      }
    } else {
      addFollowUp(enquiryId, dateStr, 'Follow-up scheduled');
    }
  };

  // Silences or reactivates follow-ups based on whether the parent enquiry was won or lost
  const logClosureActivity = (enquiryId: string, status: string) => {
    const updated = followUps.map(fu => {
      if (fu.enquiryId === enquiryId) {
        const isNowClosed = status === 'Won' || status === 'Lost';
        
        if (isNowClosed && fu.activity.length > 0 && fu.activity[0].type === 'closed') {
          if (fu.activity[0].description.includes(status)) {
            return fu; 
          }
        }

        const isReopening = !isNowClosed;

        return {
          ...fu,
          updatedAt: new Date().toISOString(),
          activity: [{
            id: Math.random().toString(36).substr(2, 9),
            type: (isReopening ? 'note' : 'closed') as FollowUpActivityType,
            date: new Date().toISOString(),
            description: isReopening 
              ? `Enquiry reopened and moved to ${status}. Follow-up reactivated.`
              : `Outstanding follow-up closed because enquiry reached final status: ${status}`,
            user: 'System'
          }, ...fu.activity]
        };
      }
      return fu;
    });
    saveFollowUps(updated);
  };

  const deleteFollowUpByEnquiryId = (enquiryId: string) => {
    const updated = followUps.filter(fu => fu.enquiryId !== enquiryId);
    saveFollowUps(updated);
  };

  return React.createElement(
    FollowUpsContext.Provider,
    { 
      value: { 
        followUps, 
        addFollowUp, 
        rescheduleFollowUp, 
        syncEnquiryFollowUp, 
        logClosureActivity, 
        deleteFollowUpByEnquiryId,
        isLoaded 
      } 
    },
    children
  );
}

export function useFollowUps() {
  const context = useContext(FollowUpsContext);
  if (!context) throw new Error('useFollowUps must be used within FollowUpsProvider');
  return context;
}