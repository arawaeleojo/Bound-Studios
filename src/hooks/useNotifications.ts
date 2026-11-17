import { useState, useEffect, useMemo } from 'react';
import { isBefore, isToday, isAfter, startOfDay, addDays, parseISO } from 'date-fns';
import { useEnquiries } from './useEnquiries';
import type { Enquiry } from '../types/enquiry';

export interface AppNotification {
  id: string;
  enquiryId: string;
  type: 'overdue' | 'today' | 'upcoming';
  title: string;
  clientName: string;
  project: string;
  date: string;
  isRead: boolean;
  enquiry: Enquiry;
}

// Custom hook generating ephemeral alert states derived strictly from scheduled Follow-ups
export function useNotifications() {
  const { enquiries } = useEnquiries();
  
  // Persists the interaction state for read and dismissed notifications across sessions
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('bound_read_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('bound_dismissed_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bound_read_notifications', JSON.stringify(readIds));
    } catch (error) {
      console.warn('Storage blocked:', error);
    }
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem('bound_dismissed_notifications', JSON.stringify(dismissedIds));
    } catch (error) {
      console.warn('Storage blocked:', error);
    }
  }, [dismissedIds]);

  // Evaluates all non-finalized enquiries to generate active alerts mapped to their due dates
  const allGeneratedNotifications = useMemo(() => {
    const today = startOfDay(new Date());
    const threeDaysFromNow = addDays(today, 3);
    const generated: AppNotification[] = [];

    enquiries.forEach(eq => {
      if (eq.status === 'Won' || eq.status === 'Lost' || !eq.followUpDate) return;
      
      const followUpDate = startOfDay(parseISO(eq.followUpDate));
      const notifId = `${eq.id}-${eq.followUpDate}`;

      let type: AppNotification['type'] | null = null;
      let title = '';

      if (isBefore(followUpDate, today)) {
        type = 'overdue'; title = 'Overdue follow-up';
      } else if (isToday(followUpDate)) {
        type = 'today'; title = 'Follow-up due today';
      } else if (isAfter(followUpDate, today) && followUpDate <= threeDaysFromNow) {
        type = 'upcoming'; title = 'Upcoming follow-up';
      }

      if (type) {
        generated.push({
          id: notifId,
          enquiryId: eq.id,
          type,
          title,
          clientName: eq.clientName,
          project: eq.projectDescription,
          date: eq.followUpDate,
          isRead: readIds.includes(notifId),
          enquiry: eq
        });
      }
    });

    return generated;
  }, [enquiries, readIds]);

  // Derived state replaces cascading useEffect hooks by dynamically mapping valid UI states synchronously
  const notifications = useMemo(() => {
    const validIds = allGeneratedNotifications.map(n => n.id);
    
    const validDismissedIds = dismissedIds.filter(id => validIds.includes(id));

    return allGeneratedNotifications
      .filter(n => !validDismissedIds.includes(n.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allGeneratedNotifications, dismissedIds]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) setReadIds(prev => [...prev, id]);
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(Array.from(new Set([...readIds, ...allIds])));
  };

  const dismissNotification = (id: string) => {
    if (!dismissedIds.includes(id)) setDismissedIds(prev => [...prev, id]);
  };

  return { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  };
}