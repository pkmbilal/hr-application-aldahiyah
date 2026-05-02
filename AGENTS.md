<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# HR Aldahiyah Project Rules

## Stack

- Use Next.js 16 App Router conventions.
- Use React 19.
- Use Tailwind CSS 4.
- Use Supabase for Auth, Postgres, Storage, and Row Level Security.
- Write all application code in JavaScript only.
- Use `.js` and `.jsx` files.
- Do not create `.ts` or `.tsx` files.
- Do not add TypeScript syntax, TypeScript config, or generated TypeScript types.

## Product Direction

- Build an internal office dashboard, not a public marketing website.
- Use a TailAdmin-inspired admin UI: clean sidebar, topbar, compact tables, forms, badges, and practical dashboard cards.
- Required routes:
  - `/login`
  - `/dashboard`
  - `/dashboard/instruments`
  - `/dashboard/employees`
  - `/dashboard/vehicles`
- Required modules:
  - Instruments
  - Employees
  - Vehicles

## Roles And Access

- Admin users can create, read, update, and delete records in all modules.
- Employee users can view instruments and vehicles.
- Employee users can view only their own employee data.
- Do not rely only on hidden frontend buttons for security.
- Enforce permissions with Supabase Row Level Security.

## Supabase Rules

- Store structured records in Supabase Postgres.
- Store uploaded files in private Supabase Storage buckets.
- Use separate private buckets or clearly separated paths for:
  - employee documents
  - instrument documents
  - vehicle documents
- Admin users can access all uploaded documents.
- Employee users can access only their own employee documents.
- Instruments and vehicles are visible to all logged-in users, but editable only by admin users.

## Feature Requirements

### Instruments

- Admin can add, edit, delete, list, and view instruments.
- Employees can list and view instruments.
- Fields:
  - name
  - model number
  - serial number
  - last calibration date
  - calibration due date
  - calibration file upload

### Employees

- Admin can add, edit, delete, list, and view employees.
- Employees can view only their own employee record.
- Fields:
  - name
  - company mobile number
  - personal mobile number
  - email
  - passport number
  - passport expiry
  - passport copy upload
  - iqama number
  - iqama expiry
  - iqama copy upload
  - license expiry
  - license upload
  - muqeem expiry date
  - blood group
  - JCC card expiry date
  - other IDs with issuing authority, ID number, expiry date, and file upload
  - bank account number

### Vehicles

- Admin can add, edit, delete, list, and view vehicles.
- Employees can list and view vehicles.
- Fields:
  - vehicle name
  - type
  - vehicle number
  - istamara number
  - istamara expiry
  - istamara other details
  - istamara file upload
  - fahas expiry date
  - insurance expiry date
  - insurance upload
  - other details

## Execution Order

1. App shell.
2. Supabase connection.
3. Database, storage, and RLS.
4. Authentication.
5. Instruments module.
6. Employees module.
7. Vehicles module.
8. Dashboard polish.

## Verification

- Run `npm run build` after each milestone.
- Run `npm run lint` for UI and form changes.
- Manually verify unauthenticated users cannot access dashboard routes.
- Manually verify admin CRUD access in all modules.
- Manually verify employee read-only access for instruments and vehicles.
- Manually verify employees can view only their own employee data.
- Manually verify private file access:
  - admin can open all uploaded files
  - employee can open only their own employee documents

## Out Of Scope For First Version

- Email reminders.
- Excel import/export.
- Audit logs.
- Department-based permissions.
- Public landing page.
