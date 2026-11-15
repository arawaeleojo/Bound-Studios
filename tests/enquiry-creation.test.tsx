import {
  render,
  screen,
  fireEvent,
  waitFor,
  renderHook,
  act,
} from '@testing-library/react';

import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';

import { EnquiryForm } from '../src/components/enquiries/EnquiryForm';

// FIX: Importing SettingsProvider and ToastProvider from the restored providers directory
import { SettingsProvider } from '../src/providers/SettingsProvider';
import { ToastProvider } from '../src/providers/ToastProvider';

import { FollowUpsProvider } from '../src/hooks/useFollowUps';
import { EnquiriesProvider, useEnquiries } from '../src/hooks/useEnquiries';

// Recreates the provider hierarchy used by the application
const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <FollowUpsProvider>
      <EnquiriesProvider>
        {children}
      </EnquiriesProvider>
    </FollowUpsProvider>
  </ToastProvider>
);

describe('Bound Studios enquiry management', () => {

  // TEST 1: Valid enquiry submission
  it('submits a valid enquiry successfully', async () => {
    const handleSubmit = vi.fn();

    render(
      <SettingsProvider>
        <EnquiryForm
          onSubmit={handleSubmit}
          onCancel={() => {}}
        />
      </SettingsProvider>
    );

    fireEvent.change(
      screen.getByPlaceholderText('Enter client or organization name'),
      { target: { value: 'Acme Creative Ltd' } }
    );

    fireEvent.change(
      screen.getByPlaceholderText('Enter project description'),
      { target: { value: 'Website redesign project' } }
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Create Enquiry' })
    );

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'Acme Creative Ltd',
        projectDescription: 'Website redesign project',
        status: 'New',
        estimatedBudget: 0,
      })
    );
  });


  // TEST 2: Reject an enquiry with an empty client name
  it('rejects an enquiry when the client name is empty', async () => {
    const handleSubmit = vi.fn();

    render(
      <SettingsProvider>
        <EnquiryForm
          onSubmit={handleSubmit}
          onCancel={() => {}}
        />
      </SettingsProvider>
    );

    fireEvent.change(
      screen.getByPlaceholderText('Enter project description'),
      { target: { value: 'Website redesign project' } }
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Create Enquiry' })
    );

    expect(
      await screen.findByText('Client name is required')
    ).toBeInTheDocument();

    expect(handleSubmit).not.toHaveBeenCalled();
  });


  // TEST 3: Save and restore an enquiry from localStorage
  it('saves a new enquiry to localStorage and restores it after reloading', async () => {
    localStorage.clear();

    const { result, unmount } = renderHook(
      () => useEnquiries(),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      result.current.addEnquiry({
        clientName: 'Acme Creative Ltd',
        email: 'hello@acme.com',
        projectDescription: 'Website redesign project',
        estimatedBudget: 250000,
        status: 'New',
        dateReceived: '2026-11-14T10:00:00.000Z',
      });
    });

    expect(result.current.enquiries).toHaveLength(1);

    const createdEnquiry = result.current.enquiries[0];

    expect(createdEnquiry).toBeDefined();

    if (!createdEnquiry) {
      throw new Error('Enquiry was not created successfully');
    }

    expect(createdEnquiry.clientName).toBe('Acme Creative Ltd');

    const savedEnquiries = JSON.parse(
      localStorage.getItem('bound_enquiries') || '[]'
    );

    expect(savedEnquiries).toHaveLength(1);
    expect(savedEnquiries[0].email).toBe('hello@acme.com');

    unmount();

    const { result: reloadedResult } = renderHook(
      () => useEnquiries(),
      { wrapper }
    );

    await waitFor(() => {
      expect(reloadedResult.current.isLoaded).toBe(true);
    });

    expect(reloadedResult.current.enquiries).toHaveLength(1);

    const restoredEnquiry = reloadedResult.current.enquiries[0];

    expect(restoredEnquiry).toBeDefined();

    if (!restoredEnquiry) {
      throw new Error('Saved enquiry was not restored');
    }

    expect(restoredEnquiry.clientName).toBe('Acme Creative Ltd');
  });


  // TEST 4: Update an existing enquiry
  it('updates an existing enquiry and saves the changes to localStorage', async () => {
    localStorage.clear();

    const { result } = renderHook(
      () => useEnquiries(),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      result.current.addEnquiry({
        clientName: 'Acme Creative Ltd',
        email: 'hello@acme.com',
        projectDescription: 'Website redesign project',
        estimatedBudget: 250000,
        status: 'New',
        dateReceived: '2026-11-14T10:00:00.000Z',
      });
    });

    const createdEnquiry = result.current.enquiries[0];

    expect(createdEnquiry).toBeDefined();

    if (!createdEnquiry) {
      throw new Error('Enquiry was not created successfully');
    }

    const enquiryId = createdEnquiry.id;

    await act(async () => {
      result.current.updateEnquiry(enquiryId, {
        clientName: 'Acme Digital Ltd',
        projectDescription: 'Complete brand and website redesign',
      });
    });

    const updatedEnquiry = result.current.enquiries.find(
      enquiry => enquiry.id === enquiryId
    );

    expect(updatedEnquiry).toBeDefined();

    if (!updatedEnquiry) {
      throw new Error('Updated enquiry could not be found');
    }

    expect(updatedEnquiry.clientName).toBe('Acme Digital Ltd');

    expect(updatedEnquiry.projectDescription).toBe(
      'Complete brand and website redesign'
    );

    expect(updatedEnquiry.activity).toBeDefined();

    expect(updatedEnquiry.activity?.[0]?.description).toBe(
    'Enquiry details updated'
    );

    const savedEnquiries = JSON.parse(
      localStorage.getItem('bound_enquiries') || '[]'
    );

    expect(savedEnquiries[0].clientName).toBe('Acme Digital Ltd');

    expect(savedEnquiries[0].projectDescription).toBe(
      'Complete brand and website redesign'
    );
  });


  // TEST 5: Delete an enquiry and its linked follow-up
  it('deletes an enquiry and removes its linked follow-up', async () => {
    localStorage.clear();

    const { result } = renderHook(
      () => useEnquiries(),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      result.current.addEnquiry({
        clientName: 'Acme Creative Ltd',
        email: 'hello@acme.com',
        projectDescription: 'Website redesign project',
        estimatedBudget: 250000,
        status: 'New',
        dateReceived: '2026-11-14T10:00:00.000Z',
        followUpDate: '2026-11-20',
      });
    });

    const createdEnquiry = result.current.enquiries[0];

    expect(createdEnquiry).toBeDefined();

    if (!createdEnquiry) {
      throw new Error('Enquiry was not created successfully');
    }

    const enquiryId = createdEnquiry.id;

    expect(result.current.enquiries).toHaveLength(1);

    await act(async () => {
      result.current.deleteEnquiry(enquiryId);
    });

    expect(result.current.enquiries).toHaveLength(0);

    const savedEnquiries = JSON.parse(
      localStorage.getItem('bound_enquiries') || '[]'
    );

    expect(savedEnquiries).toHaveLength(0);

    const savedFollowUps = JSON.parse(
      localStorage.getItem('bound_followups') || '[]'
    );

    expect(
      savedFollowUps.some(
        (followUp: { enquiryId: string }) =>
          followUp.enquiryId === enquiryId
      )
    ).toBe(false);
  });

});