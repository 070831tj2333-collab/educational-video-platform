# Educational Video Platform

A full-stack educational platform where teachers can upload videos and worksheets, and students can watch videos, ask questions, and take notes.

## Features

### For Teachers
- Create and manage courses
- Upload videos and worksheets
- Invite students via email
- Answer student questions
- View course analytics

### For Students
- Access enrolled courses
- Watch videos with custom player
- Take timestamped notes while watching
- Ask questions on videos
- Download worksheets

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, React Server Components, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Storage**: Local filesystem (upgradeable to S3/Cloudinary)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your database URL and NextAuth secret:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/educational_platform?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### For Teachers

1. Register a new account at `/register`
2. Create a course from the dashboard
3. Upload videos and worksheets to your course
4. Generate student invitation links from the course page
5. Answer student questions from the questions page

### For Students

1. Use an invitation link sent by your teacher
2. Create your account with the invitation token
3. Log in and access your enrolled courses
4. Watch videos, take notes, and ask questions

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── teacher/       # Teacher dashboard
│   │   └── student/       # Student dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── video/            # Video player components
├── lib/                   # Utility functions
├── prisma/                # Database schema
└── public/                # Static files
```

## Database Schema

- **User**: Teachers and students
- **Course**: Courses created by teachers
- **Video**: Videos uploaded to courses
- **Worksheet**: Worksheets uploaded to courses
- **Question**: Questions asked by students
- **Note**: Timestamped notes taken by students
- **StudentInvite**: Invitation tokens for students

## Security

- Authentication required for all protected routes
- Role-based access control (TEACHER/STUDENT)
- File upload validation (type and size limits)
- SQL injection prevention via Prisma
- XSS prevention with React's built-in escaping
- CSRF protection via NextAuth

## License

MIT

