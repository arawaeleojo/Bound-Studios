export type EnquiryStatus = 'New' | 'Contacted' | 'Proposal Sent' | 'Won' | 'Lost';

export interface EnquiryActivity {
  id: string;
  type: 'note' | 'status_change' | 'email';
  date: string;
  description: string;
  user: string;
}

export interface Enquiry {
  id: string;
  clientName: string;
  companyName?: string;
  email: string;
  phone?: string;
  projectType?: string;
  projectDescription: string;
  estimatedBudget: number;
  status: EnquiryStatus;
  source?: string;
  dateReceived: string;
  followUpDate?: string;
  activity?: EnquiryActivity[];
}