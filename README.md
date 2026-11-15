# Bound Studios — Enquiry Manager

A responsive enquiry management application built for Bound Studios to organise client enquiries, track project opportunities, manage follow-ups and monitor business performance.

## Overview

Bound Studios Enquiry Manager provides a centralised workspace for recording and managing potential client projects. It helps a creative studio keep track of incoming enquiries, monitor their progress and ensure follow-ups are not overlooked.

The application uses browser local storage for data persistence.

## Features

- **Dashboard:** Overview of enquiry activity and important business metrics.
- **Enquiry Management:** Create, view, edit, delete, search and filter client enquiries.
- **Status Tracking:** Track enquiries through New, Contacted, Proposal Sent, Won and Lost.
- **Follow-up Management:** Schedule, reschedule and monitor pending, overdue and completed follow-ups.
- **Activity History:** Review recorded changes and follow-up activities.
- **Statistics:** View enquiry trends, status distribution, conversion rate and estimated pipeline value.
- **Notifications:** In-app notifications for overdue, due-today and upcoming follow-ups.
- **Appearance Settings:** Light, dark and system theme options.
- **Regional Preferences:** Configure currency and date display formats.
- **Responsive Interface:** Designed for desktop, tablet and mobile screens.

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- React Hook Form
- Zod
- Recharts
- date-fns
- Lucide React
- Vitest
- React Testing Library

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/arawaeleojo/Bound-Studios.git
```

Navigate into the project directory:

```bash
cd Bound-Studios
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at:

`http://localhost:5173`

## Testing

Run the automated tests:

```bash
npm run test
```

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## Data Storage and Limitations

The application currently uses browser local storage to persist enquiry records, follow-ups, settings and notification preferences.

This means:

- Data remains available after refreshing the same browser.
- Data is not automatically synchronised across devices or browsers.
- Clearing browser storage may permanently remove locally stored records.
- The current implementation does not include authentication or a shared backend database.

## Project Structure

```text
Bound-Studios/
├── public/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## Quality Assurance

The project has been checked using:

- ESLint
- Vitest automated tests
- TypeScript compilation
- Vite production build

Latest test results: 50 tests passed across 6 test files.

## Deployment

The application is intended for deployment using Vercel.

## Author

Developed as a digital product development assessment for Bound Studios.