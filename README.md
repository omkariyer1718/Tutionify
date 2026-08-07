<div align="center">
  <h1 align="center">Tutionify</h1>
  <p align="center">
    <strong>A Multi-Tenant SaaS Platform for Independent Tutors</strong>
    <br />
    <a href="https://tutionify.vercel.app">View Live Demo</a>
    ·
    <a href="https://github.com/omkariyer1718/Tutionify/issues">Report Bug</a>
  </p>
</div>

## 🎮 Live Demo Account

Want to test drive the platform without creating an account or starting from a blank slate? You can log into our fully populated showcase account to see Tutionify in action:

- **Email:** `dummy@tutionify.com`
- **Password:** `dummyPassword`

*(Note: Because of our strict multi-tenant architecture, anything you add or delete in this demo account stays isolated here and won't affect real users! Additionally, this demo environment automatically resets to a clean state every 24 hours.)*

---

## 📌 About The Project

Tutionify was built to solve a real-world problem: independent tutors and small tuition centers often rely on scattered notebooks, messy spreadsheets, and WhatsApp groups to manage their daily operations. 

This project transforms that chaotic workflow into a streamlined, digital dashboard. It is a fully functional **multi-tenant SaaS application** where any tutor can sign up, get a securely isolated database environment, and immediately start managing their students, batches, attendance, and fee collections in one place.

### 🚀 Built With Modern Web Technologies

- **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), React, TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication:** Supabase Auth (Google OAuth & Email/Password)
- **Security:** Strict Row Level Security (RLS) for Multi-Tenant Data Isolation
- **Deployment:** [Vercel](https://vercel.com/)

---

## ✨ Key Features

* **Multi-Tenant Architecture:** Built with secure Row Level Security (RLS). Every tutor who signs up via Google gets a completely blank, isolated database slice. No user can ever query or access another tutor's data.
* **Interactive Timetable:** A visual weekly calendar built with FullCalendar. Tutors can visualize their teaching batches with dynamic color-coded tags and instantly detect scheduling conflicts.
* **Flexible Personal Slots:** A relaxed scheduling feature that allows tutors to block out custom time slots on the calendar for personal activities or ad-hoc events. These slots are decoupled from the core student/textbook curriculum, ensuring personal commitments are tracked and never clash with official teaching batches.
* **Student & Batch Management:** Add students, assign them to specific batches based on textbooks/grades, and track their parent contact information.
* **Financial Tracking:** A dedicated fee management system that auto-generates monthly fee records based on student joining dates, allowing tutors to mark payments as paid/unpaid with a single click.
* **Attendance & Analytics:** Track daily attendance per batch and manage exam scores to monitor student progression.
* **Data Portability:** Tutors can export their entire student database and financial records instantly to formatted CSV files for local backups.

---

## 📖 How to Use (The Workflow)

Tutionify is designed with a strict relational database to keep your records perfectly organized. When you first log in, follow this exact order to set up your dashboard:

1. **📚 Add Textbooks First:** Go to the **Settings** page and add your Textbooks (e.g., "NCERT Mathematics - Grade 9"). *Why? Because every teaching batch must be linked to a specific curriculum.*
2. **📅 Create Batches:** Go to the **Timetable** page and click "Add Batch". You will now be able to select the Textbook you just created and assign a time slot.
3. **🎓 Enroll Students:** Go to the **Students** page and add a student. You can now successfully assign them to the Batch you created in step 2!

*(If you try to add a student before creating a batch, or a batch before creating a textbook, the dropdowns will be empty!)*

---

## 🛠️ Local Development Setup

If you want to clone this repository and run it locally, follow these steps:

### 1. Prerequisites
- Node.js 18+ installed
- A free [Supabase](https://supabase.com/) account

### 2. Clone the repo
```bash
git clone https://github.com/omkariyer1718/Tutionify.git
cd Tutionify
```

### 3. Install NPM packages
```bash
npm install
```

### 4. Setup Supabase
1. Create a new project in Supabase.
2. Run the SQL schema files located in the `supabase/` directory in your Supabase SQL Editor to build the tables and Row Level Security policies.
3. Obtain your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase settings.

### 5. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase keys:
```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 6. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 👨‍💻 Author

**Omkar Iyer**
- LinkedIn: www.linkedin.com/in/omkariyer
- GitHub: [@omkariyer1718](https://github.com/omkariyer1718)

*Designed and engineered as a real-world utility project.*
