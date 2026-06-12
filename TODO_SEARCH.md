# Search Implementation Plan

## Task
Implement "search as you type" (real-time filtering) for arrivals and documents pages

## Steps
- [x] 1. Update arrivals page with client-side search
- [x] 2. Update documents page with client-side search
- [x] 3. Test the implementation

## Details

### 1. Arrivals Page (app/dashboard/arrivals/page.tsx)
- Convert to client component with 'use client'
- Add searchQuery state
- Filter results by: OMI number, ship name, agent name
- Show "no results" message when no matches

### 2. Documents Page (app/dashboard/documents/page.tsx)
- Convert to client component with 'use client'
- Add searchQuery state
- Filter results by: document name, document type, ship name
- Show "no results" message when no matches

