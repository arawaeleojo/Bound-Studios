import React from 'react';
import { cn } from '../../utils/cn';
import type { EnquiryStatus } from '../../types/enquiry';

interface StatusBadgeProps {
  status: EnquiryStatus;
  className?: string;
}

// A visual indicator pill that dynamically maps enquiry states to their corresponding semantic theme colors
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  // Maps the pill background and text colors
  const statusStyles: Record<EnquiryStatus, string> = {
    'New': 'bg-[var(--status-new-bg)] text-[var(--status-new)]',
    'Contacted': 'bg-[var(--status-contacted-bg)] text-[var(--status-contacted)]',
    'Proposal Sent': 'bg-[var(--status-proposal-bg)] text-[var(--status-proposal)]',
    'Won': 'bg-[var(--status-won-bg)] text-[var(--status-won)]',
    'Lost': 'bg-[var(--status-lost-bg)] text-[var(--status-lost)]',
  };

  // Maps the solid circular indicator dot colors
  const dotStyles: Record<EnquiryStatus, string> = {
    'New': 'bg-[var(--status-new)]',
    'Contacted': 'bg-[var(--status-contacted)]',
    'Proposal Sent': 'bg-[var(--status-proposal)]',
    'Won': 'bg-[var(--status-won)]',
    'Lost': 'bg-[var(--status-lost)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[status])} aria-hidden="true" />
      {status}
    </span>
  );
};