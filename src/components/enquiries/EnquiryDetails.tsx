import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Phone, Calendar, Briefcase, DollarSign, Tag, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { useSettings } from '../../contexts/SettingsContext';
import type { Enquiry, EnquiryStatus } from '../../types/enquiry';
import { cn } from '../../utils/cn';

interface EnquiryDetailsProps {
  enquiry: Enquiry;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: EnquiryStatus) => void;
  readOnly?: boolean;
}

// FIX: Define a strict interface to safely handle the expected properties from settings
interface ExtendedSettings {
  currency?: string;
  formatCurrency?: (amount: number) => string;
}

export const EnquiryDetails: React.FC<EnquiryDetailsProps> = ({
  enquiry,
  onEdit,
  onDelete,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  
  // FIX: Cast to a well-defined interface instead of 'any'
  const settingsContext = useSettings() as ExtendedSettings; 

  const formatCurrency = settingsContext.formatCurrency || ((amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: settingsContext.currency || 'NGN' 
    }).format(amount);
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header Info */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-medium text-content-primary">{enquiry.clientName}</h3>
            {enquiry.email && (
              <a href={`mailto:${enquiry.email}`} className="text-sm text-content-secondary hover:text-content-primary transition-colors">
                {enquiry.email}
              </a>
            )}
          </div>
          <StatusBadge status={enquiry.status} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-brand-border">
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === 'details' ? "border-b-2 border-action-primary text-content-primary" : "text-content-secondary hover:text-content-primary"
          )}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === 'activity' ? "border-b-2 border-action-primary text-content-primary" : "text-content-secondary hover:text-content-primary"
          )}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-2">
        {activeTab === 'details' ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-content-secondary uppercase tracking-wider">Project Description</span>
              <p className="text-sm text-content-primary whitespace-pre-wrap rounded-md glass-input p-4">
                {enquiry.projectDescription || 'No description provided.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-content-secondary" />
                <div className="flex flex-col">
                  <span className="text-xs text-content-secondary">Project Type</span>
                  <span className="text-sm font-medium text-content-primary">{enquiry.projectType || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-content-secondary" />
                <div className="flex flex-col">
                  <span className="text-xs text-content-secondary">Budget</span>
                  <span className="text-sm font-medium text-content-primary">
                    {enquiry.estimatedBudget ? formatCurrency(enquiry.estimatedBudget) : '—'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-content-secondary" />
                <div className="flex flex-col">
                  <span className="text-xs text-content-secondary">Phone</span>
                  <span className="text-sm font-medium text-content-primary">{enquiry.phone || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-content-secondary" />
                <div className="flex flex-col">
                  <span className="text-xs text-content-secondary">Source</span>
                  <span className="text-sm font-medium text-content-primary">{enquiry.source || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-content-secondary" />
                <div className="flex flex-col">
                  <span className="text-xs text-content-secondary">Received</span>
                  <span className="text-sm font-medium text-content-primary">{format(parseISO(enquiry.dateReceived), 'dd MMM yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-content-secondary" />
                <div className="flex flex-col">
                  <span className="text-xs text-content-secondary">Follow-up Date</span>
                  <span className="text-sm font-medium text-content-primary">
                    {enquiry.followUpDate ? format(parseISO(enquiry.followUpDate), 'dd MMM yyyy') : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="relative border-l border-brand-border ml-2">
              {enquiry.activity && enquiry.activity.length > 0 ? (
                enquiry.activity.map((act, index) => (
                  <div key={act.id} className={cn("relative pl-4", index !== enquiry.activity!.length - 1 ? "mb-6" : "")}>
                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-border" />
                    <p className="text-sm font-medium text-content-primary">{act.description}</p>
                    <p className="text-xs text-content-secondary">
                      {format(parseISO(act.date), 'dd MMM yyyy, h:mm a')} • {act.user}
                    </p>
                  </div>
                ))
              ) : (
                <div className="relative pl-4">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-border" />
                  <p className="text-sm font-medium text-content-primary">Enquiry Created</p>
                  <p className="text-xs text-content-secondary">
                    {format(parseISO(enquiry.dateReceived), 'dd MMM yyyy, h:mm a')} • System
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!readOnly && onEdit && onDelete && (
        <div className="mt-8 flex items-center gap-3 border-t border-brand-border pt-6">
          <Button variant="primary" onClick={onEdit} className="flex-1 py-2.5">Edit</Button>
          <button
            type="button"
            onClick={onDelete}
            className="flex flex-1 items-center justify-center rounded-lg border border-red-200 bg-transparent px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};