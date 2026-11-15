export type FollowUpActivityType = 'scheduled' | 'rescheduled' | 'note' | 'closed';

export interface FollowUpActivity {
  id: string;
  type: FollowUpActivityType;
  date: string;
  description: string;
  previousDate?: string;
  newDate?: string;
  user: string;
}

export interface FollowUp {
  id: string;
  enquiryId: string;
  scheduledDate: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  activity: FollowUpActivity[];
}