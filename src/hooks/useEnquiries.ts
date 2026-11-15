import React, { createContext, useContext, useState } from 'react';
import type { Enquiry } from '../types/enquiry';
import { useToast } from '../contexts/ToastContext';
import { useFollowUps } from './useFollowUps';

export interface EnquiryStats {
  total: number;
  new: number;
  inProgress: number;
  closed: number;
}

interface EnquiriesContextType {
  enquiries: Enquiry[];
  addEnquiry: (enquiryData: Omit<Enquiry, 'id' | 'activity'>) => void;
  updateEnquiry: (id: string, updates: Partial<Enquiry>) => void;
  deleteEnquiry: (id: string) => void;
  stats: EnquiryStats;
  isLoaded: boolean;
}

const EnquiriesContext = createContext<EnquiriesContextType | null>(null);

export function EnquiriesProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const { syncEnquiryFollowUp, logClosureActivity, deleteFollowUpByEnquiryId } = useFollowUps();
  
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => {
    try {
      const stored = localStorage.getItem('bound_enquiries');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Intentionally omitting 'e' to satisfy "unused catch variables" rule.
    }
    return [];
  });
  
  const [isLoaded] = useState(true);

  const saveEnquiries = (newData: Enquiry[]) => {
    setEnquiries(newData);
    try {
      localStorage.setItem('bound_enquiries', JSON.stringify(newData));
    } catch {
      showToast('Failed to save enquiry data to device storage.', 'error');
    }
  };

  const addEnquiry = (enquiryData: Omit<Enquiry, 'id' | 'activity'>) => {
    try {
      const dateReceived = enquiryData.dateReceived || new Date().toISOString();
      
      const newEnquiry: Enquiry = {
        ...enquiryData,
        dateReceived,
        id: Math.random().toString(36).substr(2, 9),
        activity: [{
          id: Math.random().toString(36).substr(2, 9),
          type: 'status_change',
          date: new Date().toISOString(),
          description: 'Enquiry received',
          user: 'System'
        }]
      };
      
      saveEnquiries([newEnquiry, ...enquiries]);
      
      if (enquiryData.followUpDate) {
        syncEnquiryFollowUp(newEnquiry.id, enquiryData.followUpDate);
      }
      
      showToast('Enquiry created successfully.', 'success');
    } catch {
      showToast('Failed to create enquiry.', 'error');
    }
  };

  const updateEnquiry = (id: string, updates: Partial<Enquiry>) => {
    try {
      let isStatusChange = false;
      let newStatus = '';
      
      const newData = enquiries.map(eq => {
        if (eq.id === id) {
          isStatusChange = updates.status !== undefined && updates.status !== eq.status;
          if (isStatusChange && updates.status) {
            newStatus = updates.status;
          }
          
          const descriptionText = isStatusChange 
            ? `Status updated to ${updates.status}` 
            : 'Enquiry details updated';

          const newActivity = {
            id: Math.random().toString(36).substr(2, 9),
            type: (isStatusChange ? 'status_change' : 'note') as 'status_change' | 'note',
            date: new Date().toISOString(),
            description: descriptionText,
            user: 'You'
          };
          
          return { 
            ...eq, 
            ...updates, 
            activity: [newActivity, ...(eq.activity || [])] 
          };
        }
        return eq;
      });
      
      saveEnquiries(newData);

      // FIX: Replaced unsafe hasOwnProperty with the ESLint-approved prototype call
      if (Object.prototype.hasOwnProperty.call(updates, 'followUpDate')) {
        syncEnquiryFollowUp(id, updates.followUpDate);
      }

      if (isStatusChange) {
        const oldEq = enquiries.find(e => e.id === id);
        const wasClosed = oldEq?.status === 'Won' || oldEq?.status === 'Lost';
        const isNowClosed = newStatus === 'Won' || newStatus === 'Lost';
        
        if (isNowClosed || wasClosed) {
          logClosureActivity(id, newStatus);
        }
      }

      showToast(isStatusChange ? 'Status updated successfully.' : 'Enquiry updated successfully.', 'success');
    } catch {
      showToast('Failed to update enquiry.', 'error');
    }
  };

  const deleteEnquiry = (id: string) => {
    try {
      saveEnquiries(enquiries.filter(eq => eq.id !== id));
      deleteFollowUpByEnquiryId(id);
      showToast('Enquiry deleted successfully.', 'success');
    } catch {
      showToast('Failed to delete enquiry.', 'error');
    }
  };

  const stats: EnquiryStats = {
    total: enquiries.length,
    new: enquiries.filter(e => e.status === 'New').length,
    inProgress: enquiries.filter(e => e.status !== 'Won' && e.status !== 'Lost' && e.status !== 'New').length,
    closed: enquiries.filter(e => e.status === 'Won' || e.status === 'Lost').length
  };
 
  return React.createElement(
    EnquiriesContext.Provider,
    { value: { enquiries, addEnquiry, updateEnquiry, deleteEnquiry, stats, isLoaded } },
    children
  );
}

export function useEnquiries() {
  const context = useContext(EnquiriesContext);
  if (!context) throw new Error('useEnquiries must be used within EnquiriesProvider');
  return context;
}