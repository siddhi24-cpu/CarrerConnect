# CareerConnect — Placement Intelligence Platform

CareerConnect is a MERN college placement portal with three role-based experiences: Student, TPO Officer and Company Recruiter.

## What is included

### Student
- Career Center with Placement Readiness Score
- Skill-gap comparison against live placement drives
- Professional Resume Studio with 5 resume templates
- Live A4 resume preview and server-generated PDF
- Profile, projects, certifications, achievements and experience sections
- Application Kanban: Applied → Shortlisted → Technical → HR → Selected
- Placement calendar with drive deadlines and interviews
- Notification center
- Offer Vault
- Placement drives with automatic eligibility checks

### TPO
- Student and drive management
- Company recruiter account creation
- Database-driven placement reports
- Branch-wise placement analytics
- Recruiter and offer analytics
- Student CSV export
- Placement activities and dashboard statistics

### Company Recruiter
- Protected recruiter authentication
- Company dashboard and hiring funnel
- Placement drive creation
- Rich-text job descriptions (server-sanitized)
- Applicant pipeline
- Candidate skills, CGPA, branch and resume visibility
- Shortlisting / Technical / HR / Selected / Rejected stages
- Interview scheduling API
- Offer creation on selection

## Run locally

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at the Vite URL, normally `http://localhost:5173`.

## Environment

Backend `.env` should contain:

```env
MONGO_URI=mongodb://127.0.0.1:27017/placementDB
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
```

## Recommended demo flow

1. Register/login as Student.
2. Complete the profile.
3. Open **Career Center** and see the readiness score.
4. Open **Resume Studio**, choose a template, add projects/skills and download the PDF.
5. Open **Placement Drives**, apply to an eligible drive.
6. Login as TPO and create a Company Recruiter.
7. Login as Company Recruiter and create a drive / manage applicants.
8. Move a candidate through the hiring pipeline.
9. Schedule an interview and verify it appears in the student's calendar/notifications.
10. Select a candidate and verify the offer appears in Offer Vault and TPO reports.

## Important notes

- Public registration always creates a Student account. TPO/Company accounts are intentionally protected.
- Company recruiters are created/approved by TPO.
- Eligibility is enforced on the backend using CGPA, branch, batch and backlog rules.
- Rich text is sanitized before storage.
- The resume PDF is generated server-side with PDFKit. The visual editor is only a preview; the final PDF uses the selected template.
- Keep the original project ZIP as a backup while testing the upgraded build.

## Validation performed for this package

- Backend JavaScript syntax checked across all backend files.
- Frontend JS/JSX parsed successfully using the TypeScript parser.
- ZIP should be installed locally with `npm install` before running because dependency folders are not distributed.


## Recent fixes
- Company recruiter placement drives now show a visible candidate pipeline with explicit stages, shortlist/status controls, resume access, and interview scheduling.
- Recruiter drive loading errors are displayed instead of failing silently.
- Resume Studio now supports headline, location, portfolio and custom sections (publications, hackathons, coursework, volunteering, etc.) and includes them in the generated PDF.
