import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, Calendar, X } from 'lucide-react';
import { format, isBefore, isToday, startOfDay, parseISO } from 'date-fns';
import { useFollowUps } from '../../hooks/useFollowUps';
import { useEnquiries } from '../../hooks/useEnquiries';
import { cn } from '../../utils/cn';

interface NotificationItem {
  id: string;
  type: 'overdue' | 'today' | 'upcoming';
  title: string;
  client: string;
  description: string;
  date: string;
  icon: React.ElementType;
}

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { followUps } = useFollowUps();
  const { enquiries } = useEnquiries();

  // Persist Read and Dismissed states to localStorage
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('bound_read_notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('bound_dismissed_notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('bound_read_notifications', JSON.stringify(Array.from(readIds)));
  }, [readIds]);

  useEffect(() => {
    localStorage.setItem('bound_dismissed_notifications', JSON.stringify(Array.from(dismissedIds)));
  }, [dismissedIds]);

  // Generate dynamic notifications from Follow-ups
  const allNotifications = useMemo(() => {
    const today = startOfDay(new Date());
    const items: NotificationItem[] = [];

    followUps.forEach(fu => {
      const enquiry = enquiries.find(e => e.id === fu.enquiryId);
      
      // Rely strictly on the Enquiry status. If it's Won or Lost, it's completed.
      if (!enquiry || enquiry.status === 'Won' || enquiry.status === 'Lost') return;

      const scheduled = startOfDay(parseISO(fu.scheduledDate));
      
      if (isBefore(scheduled, today)) {
        items.push({
          id: fu.id,
          type: 'overdue',
          title: 'Overdue follow-up',
          client: enquiry.clientName,
          description: fu.description,
          date: fu.scheduledDate,
          icon: Clock
        });
      } else if (isToday(scheduled)) {
        items.push({
          id: fu.id,
          type: 'today',
          title: 'Follow-up due today',
          client: enquiry.clientName,
          description: fu.description,
          date: fu.scheduledDate,
          icon: Calendar
        });
      } else if (scheduled > today) {
        items.push({
          id: fu.id,
          type: 'upcoming',
          title: 'Upcoming follow-up',
          client: enquiry.clientName,
          description: fu.description,
          date: fu.scheduledDate,
          icon: Calendar
        });
      }
    });

    // Sort: Overdue first, then Today, then Upcoming
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [followUps, enquiries]);

  // Filter out dismissed notifications
  const visibleNotifications = allNotifications.filter(n => !dismissedIds.has(n.id));
  const unreadCount = visibleNotifications.filter(n => !readIds.has(n.id)).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setReadIds(new Set([...Array.from(readIds), ...visibleNotifications.map(n => n.id)]));
  };

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevents the click from triggering the navigation
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
  };

  const handleNotificationClick = (id: string) => {
    // Mark as read
    const newRead = new Set(readIds);
    newRead.add(id);
    setReadIds(newRead);
    
    // Close dropdown
    setIsOpen(false);
    
    // FIX: Deep Linking! Navigate to follow-ups and pass the ID via React Router state
    navigate('/follow-ups', { state: { targetFollowUpId: id } });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <style>{`
        .hide-notification-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-notification-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-content-secondary transition-colors hover:bg-brand-hover hover:text-content-primary"
      >
        <Bell className="h-5 w-5" />
        
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-action-primary px-1 text-[10px] font-bold text-action-primary-text ring-2 ring-brand-main">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile Responsiveness */}
      {isOpen && (
        <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-12 z-50 sm:w-96 overflow-hidden rounded-xl border border-brand-border bg-brand-card shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-border px-4 py-3 bg-brand-card">
            <h3 className="font-serif text-lg text-content-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllRead();
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-content-secondary transition-colors hover:text-content-primary"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="hide-notification-scrollbar max-h-[60vh] overflow-y-auto overscroll-contain bg-brand-card">
            {visibleNotifications.length > 0 ? (
              <div className="flex flex-col divide-y divide-brand-border/50">
                {visibleNotifications.map((notification) => {
                  const isRead = readIds.has(notification.id);
                  const Icon = notification.icon;
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "group relative flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 transition-colors hover:bg-brand-hover cursor-pointer",
                        !isRead && "bg-action-primary/10 dark:bg-white/5"
                      )}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-brand-elevated border border-brand-border/50 text-content-secondary shadow-sm">
                        <Icon className={cn(
                          "h-4 w-4 sm:h-5 sm:w-5", 
                          notification.type === 'overdue' ? "text-[var(--status-lost)]" : "text-action-primary"
                        )} />
                      </div>

                      <div className="flex flex-1 flex-col gap-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-content-primary whitespace-normal break-words">
                          {notification.title}
                        </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isRead && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-action-primary" />
                            )}
                            <button 
                              onClick={(e) => dismissNotification(e, notification.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-content-muted hover:bg-brand-border hover:text-content-primary transition-colors"
                              title="Dismiss"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-content-primary truncate">{notification.client}</p>
                        <p className="text-sm text-content-secondary line-clamp-1">{notification.description}</p>
                        <p className="mt-1 text-xs text-content-muted font-medium">
                          Due: {format(parseISO(notification.date), 'yyyy-MM-dd')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center bg-brand-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-elevated">
                  <Bell className="h-6 w-6 text-content-muted" />
                </div>
                <p className="text-sm text-content-secondary">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};