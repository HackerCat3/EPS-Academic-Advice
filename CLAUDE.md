# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EPS Academic Advice is a Next.js 15 academic Q&A platform for Eastside Prep students and teachers. The application uses Supabase for authentication, database, and real-time features with a role-based permission system.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (note: errors ignored during builds)

### Database Management
SQL scripts are located in `/scripts/` directory:
- `001_create_tables.sql` - Core database schema with RLS policies
- `002_create_profile_trigger.sql` - Profile creation automation
- `003_seed_admin_user.sql` - Initial admin user setup

Execute these scripts in Supabase SQL editor in order.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with role-based access
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: Server components with Supabase real-time

### Project Structure

```
/app/                    # Next.js 15 App Router pages
├── api/                 # API routes for backend operations
│   ├── moderation/      # Content moderation endpoints
│   ├── search/          # Full-text search API
│   └── threads/         # Thread CRUD operations
├── auth/                # Authentication pages
├── moderation/          # Moderation dashboard (teachers/admin only)
├── teachers/            # Teachers-only area
└── threads/             # Thread creation and viewing

/components/             # React components
├── ui/                  # Base UI components (Radix + custom)
├── app-shell.tsx        # Main layout with navigation
├── thread-*.tsx         # Thread-related components
└── moderation-*.tsx     # Moderation interface components

/lib/                    # Utilities and configuration
├── supabase/            # Supabase client configurations
│   ├── client.ts        # Browser client
│   ├── server.ts        # Server client
│   └── middleware.ts    # Auth middleware
├── auth.ts              # Authentication utilities
└── utils.ts             # General utilities

/scripts/                # Database migration scripts
```

### Database Schema

Core entities with Row Level Security (RLS):
- **profiles**: User profiles linked to Supabase auth.users
- **threads**: Academic discussions with visibility controls
- **replies**: Threaded responses to discussions
- **moderation_events**: Audit trail for moderation actions
- **flags**: Content flagging system for automated moderation

### Role-Based Access Control

Three user roles with distinct permissions:
- **student**: Can create/view public threads, participate in discussions
- **teacher**: All student permissions + access to teachers_only threads and moderation tools
- **admin**: All permissions + system administration

Role-based access is enforced through:
- Database RLS policies
- Middleware authentication checks
- Component-level role validation
- Route protection via `requireRole()` utility

### Key Architectural Patterns

#### Authentication Flow
1. Supabase Auth handles login/signup
2. Database trigger creates profile record on user registration
3. Middleware validates session on each request
4. Role-based routing enforced at page level

#### Content Moderation
- Automatic off-topic detection via `lib/off-topic-check.ts`
- Flagging system for inappropriate content
- Pending content approval workflow
- Moderation dashboard for teachers/admins

#### Data Fetching Strategy
- Server components for initial data loading
- Supabase real-time subscriptions for live updates
- Full-text search with PostgreSQL GIN indexes
- Optimistic updates for better UX

## Important Configuration

### Environment Variables
Required for Supabase integration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Next.js Configuration
Build settings in `next.config.mjs`:
- ESLint errors ignored during builds
- TypeScript errors ignored during builds
- Image optimization disabled for deployment compatibility

### Design System
Color scheme based on EPS branding:
- Primary: `#10316B` (deep blue)
- Background: `#F2F7FF` (light blue)
- Typography: Inter (sans-serif) + Merriweather (serif for headings)

## Development Guidelines

### Component Patterns
- Use server components by default for data fetching
- Client components marked with "use client" directive
- UI components follow Radix patterns with custom styling
- Anonymous posting supported via `is_anonymous` boolean

### Database Interactions
- Always use appropriate Supabase client (server vs. browser)
- Leverage RLS policies for security - avoid manual permission checks
- Use database triggers for automated actions (profile creation)
- Implement real-time features with Supabase subscriptions

### Authentication Patterns
- Use `getUser()` for basic auth checks
- Use `getUserProfile()` when profile data needed
- Use `requireRole(['teacher', 'admin'])` for role-based routes
- Handle authentication errors with redirects to `/auth/login`

### Content Moderation
- All content goes through moderation pipeline
- Teachers can approve/reject pending content
- Implement proper audit trails via moderation_events table
- Use consistent flagging mechanisms for automated detection

## Common Development Tasks

### Adding New Thread Types
1. Update visibility enum in database schema
2. Add RLS policies for new visibility type
3. Update thread creation form with new options
4. Implement filtering logic in thread lists

### Extending User Roles
1. Update role enum in profiles table
2. Modify RLS policies to include new role
3. Update `requireRole()` utility calls
4. Add navigation items for role-specific areas

### Implementing Real-time Features
1. Set up Supabase real-time subscription in component
2. Handle subscription cleanup in useEffect
3. Merge real-time updates with initial data
4. Consider optimistic updates for better UX