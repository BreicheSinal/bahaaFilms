
  # Modern Next.js Portfolio Website

  A modern portfolio site built with Next.js, featuring a hero landing, featured work, a full projects archive, and a contact form.

  ## Developer View

  This project uses the Next.js App Router under `src/app` with two routes: the homepage (`/`) and a projects area (`/projects` with individual project pages at `/projects/[slug]`). UI is composed from reusable sections and layout components in `src/components`, styled with CSS Modules. Animations are handled with Framer Motion, and icons come from Lucide.

  Project data is loaded via Firebase Firestore and Firebase Storage. The data layer lives in `src/data/projects.ts`, which fetches and normalizes project records. Redux Toolkit in `src/store` manages project state, search, and tag filtering. The contact form posts to Web3Forms and uses client-side validation.

  Local setup:
  - Run `npm i` to install dependencies.
  - Run `npm run dev` to start the development server.

  Environment variables:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
  NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=your_web3forms_key
  ```

  ## Client View

  Visitors land on a hero section that introduces the creator and provides quick CTAs to view the portfolio or get in touch. The featured portfolio showcases selected projects, and a dedicated projects page lets clients browse the full archive with search and tag filters. Each project detail page includes media galleries, dates, tags, and optional links to live work or source code. The contact section provides a validated form with a clear success state so clients can confidently submit inquiries.
  
