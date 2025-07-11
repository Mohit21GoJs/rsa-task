# Job Application Tracker - Frontend

A modern Next.js frontend for tracking job applications with automated workflows. Built with Next.js 15, React 19, TypeScript, and shadcn/ui components.

## Features

- **Dashboard View**: Overview of all job applications with status filtering
- **Application Management**: Add, edit, and delete job applications
- **Status Tracking**: Track application progress from pending to offer/rejection
- **Deadline Monitoring**: Visual indicators for approaching deadlines and overdue applications
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Automatic refresh and status updates

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI component library
- **Lucide React** - Icon library
- **date-fns** - Date manipulation

## Prerequisites

- Node.js 18+ 
- pnpm (package manager)
- Backend API running on `http://localhost:3000` (see backend README)

## Setup Instructions

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Configuration** (optional):
   Create a `.env.local` file if you need to override the API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:3001`

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Application Usage

### Adding a New Application

1. Click the "Add Application" button
2. Fill in the required fields:
   - Company name
   - Job role/position
   - Job description
   - Resume content
   - Application deadline (optional, defaults to 4 weeks)
   - Notes (optional)
3. Click "Create Application"

### Managing Applications

- **View Applications**: All applications are displayed as cards on the dashboard
- **Filter by Status**: Use the status filter buttons to view specific application types
- **Update Status**: Click status buttons on pending applications to change their state
- **Edit Notes**: Click the edit (pencil) icon to modify application notes
- **Delete Applications**: Click the delete (trash) icon to remove applications

### Status Types

- **Pending**: Initial application status
- **Interview**: Application has progressed to interview stage
- **Offer**: Job offer received
- **Rejected**: Application was rejected
- **Withdrawn**: You withdrew from the process
- **Archived**: Automatically archived after deadline + grace period

### Visual Indicators

- **Status Badges**: Color-coded status indicators
- **Deadline Warnings**: Red text for overdue applications
- **Days Remaining**: Shows countdown for applications due within 7 days
- **Cover Letter Status**: Green checkmark when cover letter is generated

## API Integration

The frontend communicates with the backend API through:

- `GET /api/applications` - Fetch all applications
- `GET /api/applications/:id` - Fetch specific application
- `POST /api/applications` - Create new application
- `PATCH /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application
- `POST /api/applications/archive-expired` - Archive expired applications

## Component Structure

```
src/
├── app/
│   ├── page.tsx          # Main dashboard page
│   ├── layout.tsx        # App layout with header
│   └── globals.css       # Global styles
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── application-card.tsx  # Individual application display
│   └── application-form.tsx  # Add/edit application form
└── lib/
    ├── types.ts         # TypeScript type definitions
    ├── api.ts           # API client functions
    └── utils.ts         # Utility functions
```

## Styling

The application uses a carefully crafted design system with:

- **Color Palette**: Professional grays with accent colors for status
- **Typography**: Geist font family for modern, readable text
- **Spacing**: Consistent spacing scale using Tailwind utilities
- **Responsive**: Mobile-first design with breakpoints for tablet and desktop

## Error Handling

- API errors are logged to console and shown as alerts
- Loading states are displayed during async operations
- Form validation prevents submission of incomplete data
- Confirmation dialogs for destructive actions (delete)

## Performance Optimizations

- **React 19 Features**: Automatic batching and improved reconciliation
- **Next.js 15**: Turbopack for fast development builds
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js automatic image optimization (when images are added)
- **Bundle Analysis**: Built-in bundle analyzer

## Browser Support

- Chrome 91+
- Firefox 90+
- Safari 14+
- Edge 91+

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Add proper error handling for API calls
4. Test responsive design on multiple screen sizes
5. Ensure accessibility standards are met

## Troubleshooting

### Common Issues

1. **API Connection Error**:
   - Ensure backend server is running on port 3000
   - Check CORS settings if accessing from different domain

2. **Build Errors**:
   - Clear `.next` directory: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && pnpm install`

3. **TypeScript Errors**:
   - Check for mismatched types between frontend and backend
   - Ensure all imports are correctly typed

4. **Styling Issues**:
   - Clear browser cache
   - Check if custom CSS conflicts with Tailwind

For more help, check the console for detailed error messages.
