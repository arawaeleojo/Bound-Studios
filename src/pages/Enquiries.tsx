import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from 'lucide-react';

import { useEnquiries } from '../hooks/useEnquiries';
import { useSettings } from '../contexts/SettingsContext';

import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Drawer } from '../components/ui/Drawer';
import { EnquiryForm } from '../components/enquiries/EnquiryForm';
import { EnquiryDetails } from '../components/enquiries/EnquiryDetails';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

import type { Enquiry, EnquiryStatus } from '../types/enquiry';
import { cn } from '../utils/cn';

export const Enquiries = () => {
  const { enquiries, addEnquiry, updateEnquiry, deleteEnquiry } = useEnquiries();
  const { formatDate } = useSettings();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [timelineFilter, setTimelineFilter] = useState<string>('All');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const [now] = useState(() => Date.now());

  // Dynamically extract unique project types from existing enquiries for the filter dropdown
  const projectTypes = useMemo(() => {
    const types = new Set(
      enquiries
        .map((enquiry) => enquiry.projectType)
        .filter((type): type is string => Boolean(type))
    );
    return ['All', ...Array.from(types).sort()];
  }, [enquiries]);

  const activeFilterCount = [
    statusFilter !== 'All',
    typeFilter !== 'All',
    timelineFilter !== 'All',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setTypeFilter('All');
    setTimelineFilter('All');
    setCurrentPage(1);
  };

  // Filter and sort the enquiries based on the active search and filter state
  const filteredEnquiries = useMemo(() => {
    return enquiries
      .filter((enquiry) => {
        const searchTerm = search.toLowerCase().trim();

        const matchesSearch =
          enquiry.clientName?.toLowerCase().includes(searchTerm) ||
          enquiry.email?.toLowerCase().includes(searchTerm) ||
          enquiry.companyName?.toLowerCase().includes(searchTerm);

        const matchesStatus =
          statusFilter === 'All' || enquiry.status === statusFilter;

        const matchesType =
          typeFilter === 'All' || enquiry.projectType === typeFilter;

        let matchesTimeline = true;

        if (timelineFilter !== 'All') {
          const receivedDate = new Date(enquiry.dateReceived).getTime();
          const daysDiff = (now - receivedDate) / (1000 * 60 * 60 * 24);

          if (!Number.isFinite(receivedDate) || daysDiff < 0) {
            matchesTimeline = false;
          } else if (timelineFilter === '7days') {
            matchesTimeline = daysDiff <= 7;
          } else if (timelineFilter === '30days') {
            matchesTimeline = daysDiff <= 30;
          } else if (timelineFilter === '90days') {
            matchesTimeline = daysDiff <= 90;
          }
        }

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType &&
          matchesTimeline
        );
      })
      .sort(
        (a, b) =>
          new Date(b.dateReceived).getTime() -
          new Date(a.dateReceived).getTime()
      );
  }, [enquiries, search, statusFilter, typeFilter, timelineFilter, now]);

  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);

  // Safely adjust the current page if active filters reduce the total page count
  if (totalPages > 0 && currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  // Slice the filtered results for the current page view
  const paginatedEnquiries = filteredEnquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Global listeners to close open action menus on scroll, click, or resize
  useEffect(() => {
    const closeMenu = () => {
      setOpenMenuId(null);
      setMenuPos(null);
    };
    document.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);

    return () => {
      document.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, []);

  // Calculate dynamic positioning for the context menu to prevent viewport clipping
  const toggleMenu = (e: React.MouseEvent, enquiryId: string) => {
    e.stopPropagation();
    if (openMenuId === enquiryId) {
      setOpenMenuId(null);
      setMenuPos(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const menuHeight = 120;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      setMenuPos({
        top: spaceBelow < menuHeight ? rect.top - menuHeight - 8 : rect.bottom + 8,
        left: rect.right - 144, 
      });
      setOpenMenuId(enquiryId);
    }
  };

  const handleAction = (
    e: React.MouseEvent,
    action: 'view' | 'edit' | 'delete',
    enquiry: Enquiry
  ) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setMenuPos(null);
    setSelectedEnquiry(enquiry);

    if (action === 'delete') {
      setIsDeleteDialogOpen(true);
    } else {
      setDrawerMode(action);
      setIsDrawerOpen(true);
    }
  };

  const openEnquiryDetails = (enquiry: Enquiry) => {
    setOpenMenuId(null);
    setMenuPos(null);
    setSelectedEnquiry(enquiry);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const activeMenuEnquiry = useMemo(() => 
    enquiries.find((e) => e.id === openMenuId), 
  [enquiries, openMenuId]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Enquiries"
        subtitle="View, filter and manage all studio enquiries."
        action={
          <Button
            variant="primary"
            onClick={() => {
              setDrawerMode('create');
              setSelectedEnquiry(null);
              setIsDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Enquiry
          </Button>
        }
      />

      <div className="rounded-xl border border-brand-border bg-brand-card p-4 sm:p-5">
        <div className="mb-6">
          <div className="hidden lg:flex w-full items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
              <Input
                placeholder="Search enquiries..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9"
              />
            </div>
            <Select
              wrapperClassName="w-36 shrink-0"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as EnquiryStatus | 'All');
                setCurrentPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </Select>

            <Select
              wrapperClassName="w-44 shrink-0"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {projectTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All Project Types' : type}
                </option>
              ))}
            </Select>

            <Select
              wrapperClassName="w-36 shrink-0"
              value={timelineFilter}
              onChange={(e) => {
                setTimelineFilter(e.target.value);
                setCurrentPage(1);
              }}
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

          <div className="flex flex-col gap-3 lg:hidden">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
              <Input
                placeholder="Search enquiries..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex w-full items-center justify-between rounded-lg border border-brand-border bg-brand-elevated px-4 py-3 text-sm font-medium text-content-primary transition-colors hover:bg-brand-hover"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-action-primary px-1.5 text-xs font-semibold text-action-primary-text">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <span className="text-xs text-content-secondary">
                {activeFilterCount > 0
                  ? `${activeFilterCount} applied`
                  : 'Filter enquiries'}
              </span>
            </button>
          </div>
        </div>

        {isMobileFiltersOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-filter-title"
              className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border border-brand-border bg-brand-card p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between border-b border-brand-border pb-4">
                <div>
                  <h2 id="mobile-filter-title" className="text-lg font-semibold text-content-primary">
                    Filter Enquiries
                  </h2>
                  <p className="mt-1 text-sm text-content-secondary">
                    Narrow down your enquiry list.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  aria-label="Close filters"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-content-secondary transition-colors hover:bg-brand-hover hover:text-content-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-content-primary">Status</label>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as EnquiryStatus | 'All');
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </Select>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-content-primary">Project Type</label>
                <Select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  {projectTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'All' ? 'All Project Types' : type}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-content-primary">Date Received</label>
                <Select
                  value={timelineFilter}
                  onChange={(e) => {
                    setTimelineFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  <option value="All">All Time</option>
                  <option value="7days">Past 7 Days</option>
                  <option value="30days">Past 30 Days</option>
                  <option value="90days">Past 90 Days</option>
                </Select>
              </div>

              <div className="flex gap-3 border-t border-brand-border pt-4">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-border px-4 py-3 text-sm font-medium text-content-primary transition-colors hover:bg-brand-hover"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-lg bg-action-primary px-4 py-3 text-sm font-semibold text-action-primary-text transition-colors hover:opacity-90"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border text-content-secondary">
                <th className="px-4 pb-3 font-medium">Name / Organisation</th>
                <th className="pb-3 font-medium">Project Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Received</th>
                <th className="pr-4 pb-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {paginatedEnquiries.map((enquiry) => (
                <tr
                  key={enquiry.id}
                  className="group cursor-pointer transition-colors hover:bg-brand-hover"
                  onClick={() => openEnquiryDetails(enquiry)}
                >
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-content-primary">
                        {enquiry.clientName}
                      </span>
                      <span className="mt-0.5 text-xs text-content-secondary">
                        {enquiry.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-content-secondary">
                    {enquiry.projectType || '—'}
                  </td>
                  <td className="py-4">
                    <StatusBadge status={enquiry.status} />
                  </td>
                  <td className="py-4 text-content-secondary">
                    {formatDate(enquiry.dateReceived)}
                  </td>
                  <td className="relative py-4 pr-4 text-right">
                    <button
                      type="button"
                      aria-label={`Actions for ${enquiry.clientName}`}
                      onClick={(e) => toggleMenu(e, enquiry.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-content-secondary transition-colors hover:bg-brand-elevated"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedEnquiries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-content-secondary">
                    No enquiries found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-4 border-t border-brand-border px-2 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <span className="text-sm text-content-secondary">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredEnquiries.length)}{' '}
              of {filteredEnquiries.length}
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

      {/* Slide-out drawer for creating, viewing, or editing an enquiry */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          drawerMode === 'create'
            ? 'New Enquiry'
            : drawerMode === 'edit'
              ? 'Edit Enquiry'
              : 'Enquiry Details'
        }
      >
        {drawerMode === 'view' && selectedEnquiry ? (
          <EnquiryDetails
            enquiry={selectedEnquiry}
            onEdit={() => setDrawerMode('edit')}
            onDelete={() => setIsDeleteDialogOpen(true)}
            onStatusChange={(status) =>
              updateEnquiry(selectedEnquiry.id, { status })
            }
          />
        ) : (
          <EnquiryForm
            initialData={selectedEnquiry || undefined}
            onSubmit={(data) => {
              if (selectedEnquiry) {
                updateEnquiry(selectedEnquiry.id, data);
              } else {
                addEnquiry(data);
              }
              setIsDrawerOpen(false);
            }}
            onCancel={() => setIsDrawerOpen(false)}
          />
        )}
      </Drawer>

      {/* Modal dialog for confirming destructive actions */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (selectedEnquiry) {
            deleteEnquiry(selectedEnquiry.id);
          }
          setIsDeleteDialogOpen(false);
          setIsDrawerOpen(false);
          setSelectedEnquiry(null);
        }}
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry? This action cannot be undone."
        confirmText="Delete"
      />

      {/* Render context menu in a Portal to prevent clipping within hidden overflow containers */}
      {openMenuId && menuPos && activeMenuEnquiry && createPortal(
        <div
          className="fixed z-[9999] w-36 overflow-hidden rounded-lg border border-brand-border bg-brand-card shadow-xl py-1"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => handleAction(e, 'view', activeMenuEnquiry)}
            className="w-full px-4 py-2 text-left text-sm text-content-primary hover:bg-brand-hover"
          >
            View details
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'edit', activeMenuEnquiry)}
            className="w-full px-4 py-2 text-left text-sm text-content-primary hover:bg-brand-hover"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'delete', activeMenuEnquiry)}
            className="w-full px-4 py-2 text-left text-sm text-[var(--status-lost)] hover:bg-[var(--status-lost-bg)] transition-colors"
          >
            Delete
          </button>
        </div>,
        document.body
      )}

    </div>
  );
};