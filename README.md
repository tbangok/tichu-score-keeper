# Tichu Score Keeper

A sophisticated web application for tracking and managing competitive Tichu card game matches with real-time scoring, team management, and detailed game analytics.

## Overview

Tichu Score Keeper is designed for serious players who want to maintain detailed records of their games, track team statistics, and manage multiple game modes (2-team classic or 3-team battle format). The app features an imperial, high-stakes aesthetic and provides a seamless experience for both casual and competitive play.

## Features

### 🎮 Game Management
- **Multiple Game Modes**: Play 2-team (classic 2v2) or 3-team (battle) formats
- **Flexible Scoring**: Support for 500 or 1000 point target scores
- **Real-Time Scoreboard**: Large, readable displays with dynamic progress tracking toward target score
- **Round History**: Complete round-by-round breakdown with undo functionality
- **Game Status**: Track ongoing games and resume where you left off

### 👥 Team Management
- **Team Creation**: Create new teams with unique usernames and secure PIN protection
- **Team Verification**: Existing team members verify with PIN to join games
- **Team Identity**: Display names and usernames for easy team recognition

### 📊 Analytics & History
- **Game History**: Access the Imperial Archives to view all past games
- **Detailed Game Stats**: See final scores, winners, and round-by-round breakdowns
- **Team Statistics**: Search teams by @username to view:
  - Career win rate
  - Highest scores
  - Average points per game
  - Total games played

### 🎨 User Experience
- **Imperial Aesthetic**: Custom theme with Deep Red (#8B0000), Gold (#D4AF37), and Dark Surface colors
- **Responsive Design**: Fully optimized for desktop and mobile devices
- **Intuitive Navigation**: Multi-step setup process with clear visual feedback

## Tech Stack

- **Frontend**: Next.js 14+ with React 19
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React
- **Authentication**: PIN-based team verification
- **Hosting**: Ready for Vercel or Cloud Run

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Gemini API key (for AI features)

## Installation

### 1. Clone or Download the Project
```bash
git clone <repository-url>
cd tichu-score-keeper
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Create a new project:
   - Click "New project"
   - Give it a name (e.g., "tichu-score-keeper")
   - Set a secure database password
   - Choose your region
   - Click "Create new project"

#### Get Your API Credentials
1. In your Supabase dashboard, go to **Settings → API Keys**
2. Copy:
   - **Project URL** (the `https://...supabase.co` link)
   - **Publishable Key** (starts with `sb_publishable_`)

#### Create Database Tables
1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `schema.sql` from this project
4. Paste it into the SQL Editor
5. Click **Run** to create all tables and indexes

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_KEY="sb_publishable_xxxxx"

# Gemini API Key (get from https://ai.google.dev)
GEMINI_API_KEY="your-gemini-api-key"

# Optional: App URL (for production)
APP_URL="https://your-app-url.com"
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start playing.

## Usage

### Creating a New Game

1. Click **"Start New Game"** from the home page
2. **Choose Game Mode**: Select between 2-team (classic) or 3-team (battle)
3. **Set Target Score**: Choose 500 or 1000 points
4. **Define Teams**: For each team position:
   - Enter a team username
   - If new: create display name and PIN
   - If existing: verify with PIN
5. **Review & Start**: Confirm all settings and begin the game

### During the Game

1. **Add Scores**: Enter points for each team after each round
2. **View Progress**: Watch the dynamic progress bar toward the target score
3. **Undo Rounds**: If a mistake is made, undo the last round
4. **Track History**: View all completed rounds in the round history table

### After the Game

1. The app automatically detects when a team reaches the target score
2. A victory modal displays the winner
3. Game is saved to history and accessible from the Imperial Archives

### Viewing Statistics

1. Click **"Quick Stats"** to search for a specific team
2. Enter a team's @username to see:
   - Total games played
   - Win/loss/draw record
   - Win rate percentage
   - Average score per game
   - Highest score achieved

## Project Structure

```
tichu-score-keeper/
├── src/
│   ├── app/              # Next.js app directory and pages
│   │   ├── page.tsx      # Home page
│   │   ├── new-game/     # Game creation flow
│   │   ├── scoreboard/   # Live scoreboard
│   │   ├── game/         # Game details
│   │   ├── history/      # Game history
│   │   └── stats/        # Team statistics
│   ├── components/       # React components
│   ├── lib/              # Utilities and Supabase client
│   ├── types.ts          # TypeScript interfaces
│   └── index.css         # Global styles and custom theme
├── schema.sql            # Database schema setup
├── .env.example          # Example environment variables
└── package.json
```

## API Reference

The app uses the Supabase JavaScript client to interact with the database. Key tables:

- **teams** — Team information and PIN hashes
- **games** — Game records with metadata
- **game_teams** — Team participation in games
- **rounds** — Individual round records
- **round_scores** — Score changes per round

All queries include proper RLS (Row Level Security) policies for data safety.

## Security

- **PIN Protection**: Team PINs are hashed before storage (never stored in plain text)
- **Row Level Security**: Supabase RLS policies control data access
- **Publishable Key**: Frontend uses Supabase publishable key (safe for public exposure)
- **Data Validation**: Input validation on usernames, PINs, and scores

## Troubleshooting

### Supabase Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_KEY` in `.env.local`
- Check that your Supabase project is active
- Ensure the project URL is correct (should include your project subdomain)

### PIN Verification Fails
- PINs are hashed before comparison—re-create the team if PIN is forgotten
- Ensure only 4-8 digits are entered for the PIN

### Database Tables Not Found
- Run `schema.sql` in Supabase SQL Editor to create tables
- Check that RLS policies are enabled

### Local Development Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run dev server again
npm run dev
```

## Performance Optimizations

- Responsive images with Next.js Image component
- CSS Grid for efficient layouts
- Indexed database queries for fast lookups
- Lazy-loaded components for better initial load time

## Future Enhancements

- User authentication (login/signup)
- Tournament management
- Advanced analytics and trending
- Mobile app (React Native)
- Multiplayer real-time updates (Supabase Realtime)
- Tichu-specific statistics (partnership tracking, bidding analysis)

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or feedback:
- Check the [Troubleshooting](#troubleshooting) section
- Review the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Check Next.js docs: [nextjs.org/docs](https://nextjs.org/docs)

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests to improve the project.

---

**Master the Dragon and track your imperial victories!** 🐉
