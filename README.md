# HR Aldahiyah

Internal office dashboard for employees, instruments, vehicles, documents, and expiry tracking.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase Auth, Postgres, Storage, and Row Level Security
- JavaScript only

## Getting Started

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Milestones

1. App shell.
2. Supabase connection.
3. Database, storage, and RLS.
4. Authentication.
5. Instruments module.
6. Employees module.
7. Vehicles module.
8. Dashboard polish.

## Verification

Run these checks during development:

```bash
npm run build
npm run lint
```

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
