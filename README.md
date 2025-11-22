# Sausalito Turkey Trot - Race Timing System

A comprehensive web application for managing race registration, timing, and results for running events.

## Features

- **Participant Management**: Register participants with detailed information
- **Race Management**: Create and manage multiple races
- **Bib Number Assignment**: Assign bib numbers to participants with duplicate prevention
- **Race Timing**: Quick bib number entry system for recording finish times
- **Results & Placements**: Automatic calculation of placements by overall, gender, and age groups
- **Duplicate Detection**: Prevents duplicate email addresses and phone numbers
- **Editable Finish Times**: Adjust finish times with automatic recalculation of placements

## Age Groups

- 0-12
- 13-17
- 18-29
- 30-39
- 40-49
- 50-59
- 60+

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Vercel account (for deployment)

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd turkeytrott
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **SQL Editor** in the Supabase dashboard
4. Copy the contents of `supabase/schema.sql` and execute it in the SQL editor
5. Go to **Settings** > **API** and copy:
   - Project URL
   - anon/public key

### Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Create Your First User

1. Navigate to [http://localhost:3000/login](http://localhost:3000/login)
2. Click "Sign up" and create an account
3. You'll be redirected to the dashboard

## Usage Guide

### Managing Participants

1. Click on the **Participants** tab
2. Click **Add Participant** to register a new participant
3. Fill in the participant details (all fields are optional)
4. Click **Create** to save
5. Edit or delete participants using the buttons next to each entry

### Creating a Race

1. Click on the **Races** tab
2. Click **Create Race**
3. Enter the race name and date
4. Click **Create**

### Adding Participants to a Race

1. In the **Races** tab, click **Manage** on a race
2. Go to the **Participants** tab
3. Click **Add Participant**
4. Select a participant from the dropdown
5. Enter a bib number
6. Click **Add**
7. You can edit bib numbers by clicking on them

### Starting a Race

1. In the race detail view, click **Start Race** (only appears before race is started)
2. This records the start time for calculating finish times

### Recording Finish Times

1. Go to the **Timing** tab
2. As runners cross the finish line, type their bib number and press Enter
3. The finish time is automatically recorded
4. The field clears immediately for the next entry
5. Recent finishes are displayed below

### Viewing Results

1. Go to the **Results** tab
2. Switch between **Overall**, **By Gender**, and **By Age Group** views
3. Click on any finish time to edit it
4. Placements automatically recalculate when times are adjusted

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Add your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**

### Step 3: Configure Custom Domain (Optional)

1. In your Vercel project, go to **Settings** > **Domains**
2. Add your custom domain
3. Follow the DNS configuration instructions

## Database Schema

### Tables

- **participants**: Stores participant information
- **races**: Stores race information
- **race_participants**: Junction table linking participants to races with bib numbers
- **finish_times**: Stores finish times for each participant

### Key Features

- Row Level Security (RLS) enabled on all tables
- Automatic timestamp updates on record changes
- Unique constraints on bib numbers per race
- Cascade deletes for data integrity

## Troubleshooting

### "Invalid API key" error

- Make sure your `.env.local` file has the correct Supabase URL and anon key
- Restart the development server after adding environment variables

### Participants not loading

- Check that the database schema was properly executed
- Verify your Supabase project is active and not paused
- Check browser console for errors

### Authentication issues

- Make sure email confirmation is disabled in Supabase (Settings > Authentication > Email Auth)
- Or check your email for confirmation link

## License

MIT

## Support

For issues or questions, please create an issue in the GitHub repository.
