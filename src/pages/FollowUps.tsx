import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { isBefore, isToday, isAfter, startOfDay, parseISO, format, isValid } from 'date-fns';

import { MoreHorizontal, ArrowRight, ChevronDown, Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFollowUps } from '../hooks/useFollowUps';
import { useEnquiries } from '../hooks/useEnquiries';
import { useSettings } from '../contexts/SettingsContext';

import { PageHeader } from '../components/layout/PageHeader';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EnquiryDetails } from '../components/enquiries/EnquiryDetails';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { FollowUp } from '../types/followUp';
import type { Enquiry, EnquiryStatus } from '../types/enquiry';
import { cn } from '../utils/cn';

type FollowUpCategory = 'all' | 'overdue' | 'today' | 'upcoming' | 'completed';

type CategorizedFollowUp = {
  followUp: FollowUp;
  enquiry: Enquiry;
};

const CompactStatusSelect = ({ status, onChange }: { status: EnquiryStatus, onChange: (s: EnquiryStatus) => void }) => {
  const getColors = (s: EnquiryStatus) => {
    switch (s) {
      case 'New': return 'bg-[var(--status-new-bg)] text-[var(--status-new)] border-[var(--status-new)]/30';
      case 'Contacted': return 'bg-[var(--status-contacted-bg)] text-[var(--status-contacted)] border-[var(--status-contacted)]/30';
      case 'Proposal Sent': return 'bg-[var(--status-proposal-bg)] text-[var(--status-proposal)] border-[var(--status-proposal)]/30';
      case 'Won': return 'bg-[var(--status-won-bg)] text-[var(--status-won)] border-[var(--status-won)]/30';
      case 'Lost': return 'bg-[var(--status-lost-bg)] text-[var(--status-lost)] border-[var(--status-lost)]/30';
      default: return 'bg-brand-elevated text-content-primary border-brand-border';
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as EnquiryStatus)}
        className={cn(
          "appearance-none rounded-full border py-1 pl-2.5 pr-6 text-xs font-semibold cursor-pointer outline-none transition-colors",
          "dark:[color-scheme:dark] [&>option]:bg-brand-elevated [&>option]:text-content-primary",
          getColors(status)
        )}
      >
        <option value="New">New</option>
        <option value="Contacted">Contacted</option>
        <option value="Proposal Sent">Proposal Sent</option>
        <option value="Won">Won</option>
        <option value="Lost">Lost</option>
      </select>
      <ChevronDown className="absolute right-2 h-3 w-3 pointer-events-none opacity-60" />
    </div>
  );
};

export const FollowUps = () => {
  const { followUps, rescheduleFollowUp } = useFollowUps();
  const { enquiries, updateEnquiry } = useEnquiries();
  const { formatDate } = useSettings();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<FollowUpCategory>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'All'>('All');
  const [timelineFilter, setTimelineFilter] = useState<string>('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view_enquiry' | 'reschedule' | 'history'>('view_enquiry');
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  const [statusConfirmData, setStatusConfirmData] = useState<{ enquiryId: string, newStatus: EnquiryStatus } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const [today] = useState(() => startOfDay(new Date()));
  const [now] = useState(() => Date.now());

  // FIX: Deep Linking Effect - Deferred execution to satisfy strict ESLint rules
  useEffect(() => {
    const state = location.state as { targetFollowUpId?: string, action?: 'view_enquiry' | 'history' } | null;
    
    if (state?.targetFollowUpId) {
      const target = followUps.find(f => f.id === state.targetFollowUpId);
      if (target) {
        // Defer the state updates to avoid synchronous cascading renders
        setTimeout(() => {
          setSelectedFollowUp(target);
          setDrawerMode(state.action || 'history');
          setIsDrawerOpen(true);
        }, 0);
        
        // Clean up the URL state immediately
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, followUps, location.pathname, navigate]);

  const categorizedData = useMemo(() => {
    const data = { 
      all: [] as CategorizedFollowUp[], 
      overdue: [] as CategorizedFollowUp[], 
      today: [] as CategorizedFollowUp[], 
      upcoming: [] as CategorizedFollowUp[], 
      completed: [] as CategorizedFollowUp[] 
    };

    followUps.forEach(fu => {
      const enquiry = enquiries.find(e => e.id === fu.enquiryId);
      if (!enquiry) return;
      
      const searchTerm = search.toLowerCase().trim();
      const matchesSearch = searchTerm === '' || 
        enquiry.clientName.toLowerCase().includes(searchTerm) ||
        enquiry.email.toLowerCase().includes(searchTerm) ||
        enquiry.companyName?.toLowerCase().includes(searchTerm);
        
      const matchesStatus = statusFilter === 'All' || enquiry.status === statusFilter;
      
      let matchesTimeline = true;
      if (timelineFilter !== 'All') {
        const receivedDate = new Date(enquiry.dateReceived).getTime();
        const daysDiff = (now - receivedDate) / (1000 * 60 * 60 * 24);
        if (timelineFilter === '7days') matchesTimeline = daysDiff <= 7;
        if (timelineFilter === '30days') matchesTimeline = daysDiff <= 30;
        if (timelineFilter === '90days') matchesTimeline = daysDiff <= 90;
      }

      if (!matchesSearch || !matchesStatus || !matchesTimeline) return;
      
      const combined: CategorizedFollowUp = { followUp: fu, enquiry };
      
      if (enquiry.status === 'Won' || enquiry.status === 'Lost') {
        data.completed.push(combined);
        return;
      }

      if (!fu.scheduledDate) return;
      const parsedDate = parseISO(fu.scheduledDate);
      if (!isValid(parsedDate)) return;
      
      const scheduled = startOfDay(parsedDate);
      data.all.push(combined);

      if (isBefore(scheduled, today)) {
        data.overdue.push(combined);
      } else if (isToday(scheduled)) {
        data.today.push(combined);
      } else if (isAfter(scheduled, today)) {
        data.upcoming.push(combined);
      }
    });

    Object.keys(data).forEach(key => {
      data[key as keyof typeof data].sort((a, b) => 
        new Date(a.followUp.scheduledDate).getTime() - new Date(b.followUp.scheduledDate).getTime()
      );
    });

    return data;
  }, [followUps, enquiries, search, statusFilter, timelineFilter, today, now]);

  const currentData = categorizedData[activeTab];

  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  
  if (totalPages > 0 && currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const paginatedData = currentData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setTimelineFilter('All');
    setCurrentPage(1);
  };

  useEffect(() => {
    const closeMenu = () => { setOpenMenuId(null); setMenuPos(null); };
    document.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      document.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, []);

  const toggleMenu = (e: React.MouseEvent, followUpId: string) => {
    e.stopPropagation();
    if (openMenuId === followUpId) {
      setOpenMenuId(null);
      setMenuPos(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const menuHeight = 90;
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuPos({
        top: spaceBelow < menuHeight ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left: rect.right - 180,
      });
      setOpenMenuId(followUpId);
    }
  };

  const handleAction = (e: React.MouseEvent, followUp: FollowUp, action: 'view_enquiry' | 'reschedule' | 'history') => {
    e.stopPropagation();
    setOpenMenuId(null);
    setMenuPos(null);
    setSelectedFollowUp(followUp);
    setDrawerMode(action);
    if (action === 'reschedule') {
      setRescheduleDate(followUp.scheduledDate.split('T')[0]);
      setRescheduleError(''); 
    }
    setIsDrawerOpen(true);
  };

  const getActiveEnquiry = () => {
    if (!selectedFollowUp) return null;
    return enquiries.find(e => e.id === selectedFollowUp.enquiryId) || null;
  };

  const handleStatusChange = (enquiryId: string, newStatus: EnquiryStatus) => {
    if (newStatus === 'Won' || newStatus === 'Lost') {
      setStatusConfirmData({ enquiryId, newStatus });
    } else {
      updateEnquiry(enquiryId, { status: newStatus });
    }
  };

  const confirmStatusChange = () => {
    if (statusConfirmData) {
      updateEnquiry(statusConfirmData.enquiryId, { status: statusConfirmData.newStatus });
      setStatusConfirmData(null);
    }
  };

  const activeMenuFollowUp = useMemo(() => followUps.find(f => f.id === openMenuId), [followUps, openMenuId]);
  const activeMenuEnquiryStatus = useMemo(() => enquiries.find(e => e.id === activeMenuFollowUp?.enquiryId)?.status, [enquiries, activeMenuFollowUp]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader 
        title="Follow-ups" 
        subtitle="Manage communication activities and keep client discussions moving forward." 
      />

      <div className="flex overflow-x-auto scrollbar-hide gap-2 border-b border-brand-border pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'all', label: 'All Pending', count: categorizedData.all.length },
          { id: 'overdue', label: 'Overdue', count: categorizedData.overdue.length },
          { id: 'today', label: 'Due Today', count: categorizedData.today.length },
          { id: 'upcoming', label: 'Upcoming', count: categorizedData.upcoming.length },
          { id: 'completed', label: 'Completed', count: categorizedData.completed.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as FollowUpCategory); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 shrink-0 whitespace-nowrap",
              activeTab === tab.id ? "bg-action-primary text-action-primary-text shadow-md scale-[1.02]" : "border border-transparent hover:border-brand-border text-content-secondary hover:text-content-primary",
              tab.id === 'overdue' && activeTab === tab.id && "bg-[var(--status-lost)] text-white dark:text-brand-main"
            )}
          >
            {tab.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-xs transition-colors",
              activeTab === tab.id ? "bg-white/20" : "bg-brand-border/50 text-content-primary"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-card p-4 sm:p-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
            <Input
              placeholder="Search follow-ups..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select 
              wrapperClassName="w-36 shrink-0" 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value as EnquiryStatus | 'All'); setCurrentPage(1); }}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </Select>
            <Select 
              wrapperClassName="w-36 shrink-0" 
              value={timelineFilter} 
              onChange={(e) => { setTimelineFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Time</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
              <option value="90days">Past 90 Days</option>
            </Select>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-brand-hover hover:text-content-primary"
              title="Reset filters"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-brand-border text-content-secondary">
                <th className="pb-3 font-medium px-4 w-1/4">Client / Enquiry</th>
                <th className="pb-3 font-medium w-1/4">Contact</th>
                {activeTab === 'completed' ? (
                  <>
                    <th className="pb-3 font-medium w-1/5">Final Status</th>
                    <th className="pb-3 font-medium w-1/5">Date Received</th>
                  </>
                ) : (
                  <>
                    <th className="pb-3 font-medium w-1/5">Scheduled Date</th>
                    <th className="pb-3 font-medium w-1/5">Enquiry Status</th>
                  </>
                )}
                <th className="pb-3 font-medium text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {paginatedData.map(({ followUp, enquiry }) => {
                const isOverdue = isBefore(startOfDay(parseISO(followUp.scheduledDate)), today);
                
                return (
                  <tr key={followUp.id} className="group transition-colors hover:bg-brand-hover">
                    <td className="py-4 px-4">
                      <div className="flex flex-col cursor-pointer" onClick={(e) => handleAction(e, followUp, 'view_enquiry')}>
                        <span className="font-medium text-content-primary hover:underline decoration-brand-border underline-offset-2">{enquiry.clientName}</span>
                        <span className="text-xs text-content-secondary mt-0.5">{enquiry.projectType || 'General Enquiry'}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-content-primary">{enquiry.email}</span>
                        {enquiry.phone && <span className="text-xs text-content-secondary mt-0.5">{enquiry.phone}</span>}
                      </div>
                    </td>

                    {activeTab === 'completed' ? (
                      <>
                        <td className="py-4" onClick={(e) => e.stopPropagation()}>
                           <CompactStatusSelect status={enquiry.status} onChange={(newStatus) => handleStatusChange(enquiry.id, newStatus)} />
                        </td>
                        <td className="py-4 text-content-secondary">
                          {format(parseISO(enquiry.dateReceived), 'dd MMM yyyy')}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={cn("py-4 font-medium", isOverdue ? "text-[var(--status-lost)]" : "text-content-primary")}>
                          {format(parseISO(followUp.scheduledDate), 'dd MMM yyyy')}
                        </td>
                        <td className="py-4" onClick={(e) => e.stopPropagation()}>
                           <CompactStatusSelect status={enquiry.status} onChange={(newStatus) => handleStatusChange(enquiry.id, newStatus)} />
                        </td>
                      </>
                    )}

                    <td className="py-4 text-right pr-4">
                      <button
                        type="button"
                        onClick={(e) => toggleMenu(e, followUp.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-content-secondary transition-colors hover:bg-brand-elevated"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-content-secondary">
                    No records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex sm:hidden flex-col gap-4">
          {paginatedData.map(({ followUp, enquiry }) => {
             const isOverdue = isBefore(startOfDay(parseISO(followUp.scheduledDate)), today);
             return (
               <div key={followUp.id} className="rounded-xl border border-brand-border bg-brand-elevated p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start cursor-pointer" onClick={(e) => handleAction(e, followUp, 'view_enquiry')}>
                    <div className="flex flex-col">
                      <span className="font-medium text-content-primary flex items-center gap-1">{enquiry.clientName} <ArrowRight className="w-3 h-3 text-content-secondary" /></span>
                      <span className="text-xs text-content-secondary mt-0.5">{enquiry.projectType || 'General Enquiry'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleMenu(e, followUp.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-content-secondary transition-colors hover:bg-brand-hover"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm flex flex-col gap-1">
                    <span className="text-content-primary">{enquiry.email}</span>
                    {activeTab === 'completed' ? (
                       <span className="text-content-secondary">Received: {format(parseISO(enquiry.dateReceived), 'dd MMM yyyy')}</span>
                    ) : (
                       <span className={cn("font-medium", isOverdue ? "text-[var(--status-lost)]" : "text-content-secondary")}>
                          Scheduled: {format(parseISO(followUp.scheduledDate), 'dd MMM yyyy')}
                       </span>
                    )}
                  </div>
                  <div className="pt-2 border-t border-brand-border flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                     <span className="text-xs font-medium text-content-secondary">Status</span>
                     <CompactStatusSelect status={enquiry.status} onChange={(newStatus) => handleStatusChange(enquiry.id, newStatus)} />
                  </div>
               </div>
             )
          })}
          {paginatedData.length === 0 && (
            <div className="py-12 text-center text-sm text-content-secondary">
              No records found matching your filters.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-4 border-t border-brand-border px-2 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <span className="text-sm text-content-secondary">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, currentData.length)}{' '}
              of {currentData.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded text-content-secondary transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                if (totalPages > 5 && page > 3 && page < totalPages && page !== currentPage) {
                  if (page === 4) {
                    return <span key={page} className="px-2 text-content-secondary">...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors',
                      currentPage === page
                        ? 'bg-action-primary text-action-primary-text'
                        : 'text-content-secondary hover:bg-brand-hover hover:text-content-primary'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded text-content-secondary transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!statusConfirmData}
        onClose={() => setStatusConfirmData(null)}
        onConfirm={confirmStatusChange}
        title={`Mark as ${statusConfirmData?.newStatus}`}
        message={`Are you sure you want to mark this enquiry as ${statusConfirmData?.newStatus}? This will finalize the project and move it to the Completed tab.`}
        confirmText="Confirm"
        variant="primary"
      />

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        title={
          drawerMode === 'view_enquiry' ? 'Enquiry Details' : 
          drawerMode === 'reschedule' ? 'Reschedule Follow-up' : 'Activity History'
        }
      >
        {drawerMode === 'view_enquiry' && getActiveEnquiry() && (
          <EnquiryDetails enquiry={getActiveEnquiry()!} readOnly={true} />
        )}

        {drawerMode === 'reschedule' && selectedFollowUp && (
          <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-2">
               <span className="text-sm text-content-secondary">Current Date</span>
               <span className="font-medium text-content-primary">{format(parseISO(selectedFollowUp.scheduledDate), 'dd MMMM yyyy')}</span>
             </div>
             
             <Input 
               type="date" 
               label="New Date *" 
               value={rescheduleDate} 
               onChange={(e) => {
                 setRescheduleDate(e.target.value);
                 setRescheduleError(''); 
               }} 
               min={format(new Date(), 'yyyy-MM-dd')}
               error={rescheduleError} 
             />
             
             <div className="mt-4 flex gap-3">
               <Button variant="secondary" onClick={() => setIsDrawerOpen(false)} className="flex-1">Cancel</Button>
               <Button 
                 variant="primary" 
                 className="flex-1" 
                 disabled={!rescheduleDate || rescheduleDate === selectedFollowUp.scheduledDate.split('T')[0]}
                 onClick={() => {
                   if (rescheduleDate && rescheduleDate !== selectedFollowUp.scheduledDate.split('T')[0]) {
                     const todayStr = format(new Date(), 'yyyy-MM-dd');
                     if (rescheduleDate < todayStr) {
                       setRescheduleError("Cannot use a past date for a follow-up.");
                       return;
                     }
                     rescheduleFollowUp(selectedFollowUp.id, rescheduleDate);
                     setIsDrawerOpen(false);
                   }
                 }}>Confirm Reschedule</Button>
             </div>
          </div>
        )}

        {drawerMode === 'history' && selectedFollowUp && (
          <div className="flex flex-col gap-6">
             <h3 className="font-medium text-content-primary mb-2 border-b border-brand-border pb-2">{getActiveEnquiry()?.clientName} Follow-up</h3>
             <div className="relative border-l border-brand-border ml-2">
               {selectedFollowUp.activity.map((act, index) => (
                 <div key={act.id} className={cn("relative pl-4", index !== selectedFollowUp.activity.length - 1 ? "mb-6" : "")}>
                   <div className={cn(
                     "absolute -left-[5px] top-1.5 h-2 w-2 rounded-full",
                     act.type === 'closed' ? "bg-[var(--status-lost)]" : "bg-brand-border"
                   )} />
                   <p className="text-sm font-medium text-content-primary">{act.description}</p>
                   <p className="text-xs text-content-secondary mt-0.5">
                     {formatDate(act.date)}, {format(parseISO(act.date), 'h:mm a')} • {act.user}
                   </p>
                 </div>
               ))}
             </div>
          </div>
        )}
      </Drawer>

      {openMenuId && menuPos && activeMenuFollowUp && createPortal(
        <div
          className="fixed z-[9999] w-48 overflow-hidden rounded-lg border border-brand-border bg-white dark:bg-brand-card shadow-xl py-1"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {activeMenuEnquiryStatus !== 'Won' && activeMenuEnquiryStatus !== 'Lost' && (
            <button
              type="button"
              onClick={(e) => handleAction(e, activeMenuFollowUp, 'reschedule')}
              className="w-full px-4 py-2 text-left text-sm text-content-primary hover:bg-brand-hover"
            >
              Reschedule
            </button>
          )}
          <button
            type="button"
            onClick={(e) => handleAction(e, activeMenuFollowUp, 'history')}
            className={cn(
              "w-full px-4 py-2 text-left text-sm text-content-primary hover:bg-brand-hover",
              activeMenuEnquiryStatus !== 'Won' && activeMenuEnquiryStatus !== 'Lost' ? "border-t border-brand-border/50" : ""
            )}
          >
            View Activity History
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};