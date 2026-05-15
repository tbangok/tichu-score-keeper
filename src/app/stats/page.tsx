'use client';

import React, { useState } from 'react';
import { Search, Award, BarChart3, History, TrendingUp } from 'lucide-react';
import { Card } from '@/components/UI';
import { supabase } from '@/lib/supabase';
import { TeamStats } from '@/types';
import { cn } from '@/lib/utils';

export default function Stats() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (usernameOverride?: string) => {
    const query = usernameOverride || searchTerm;
    if (!query) return;

    setLoading(true);
    setError('');
    
    try {
      // 1. Get team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('username', query.toLowerCase())
        .maybeSingle();
      
      if (teamError) throw teamError;
      if (!team) {
         setError('No imperial record found for this username.');
         setStats(null);
         return;
      }

      // 2. Get game data
      const { data: gameParticipations, error: gpError } = await supabase
        .from('game_teams')
        .select(`
          final_score,
          game:games(id, status, winner_team_id, is_draw)
        `)
        .eq('team_id', team.id);
      
      if (gpError) throw gpError;

      // Filter only finished games
      const finishedGames = gameParticipations.filter(gp => gp.game.status === 'finished');
      
      // 3. Get round data
      const { data: roundScores, error: rsError } = await supabase
        .from('round_scores')
        .select('id')
        .eq('team_id', team.id);
      
      if (rsError) throw rsError;

      const gamesPlayed = finishedGames.length;
      const wins = finishedGames.filter(gp => gp.game.winner_team_id === team.id).length;
      const draws = finishedGames.filter(gp => gp.game.is_draw).length;
      const losses = gamesPlayed - wins - draws;
      const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
      const scores = finishedGames.map(gp => gp.final_score);
      const averageScore = scores.length > 0 ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

      setStats({
        display_name: team.display_name,
        username: team.username,
        games_played: gamesPlayed,
        wins,
        losses,
        draws,
        win_rate: winRate,
        average_score: Math.round(averageScore),
        highest_score: highestScore,
        total_rounds: roundScores.length
      });
    } catch (err) {
      setError('An error occurred while fetching archives.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <h1 className="text-4xl font-bold flex items-center gap-3">
           <BarChart3 className="text-tertiary" /> Imperial Statistics
         </h1>
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
            <input 
              className="w-full bg-surface-container-high border-2 border-outline-variant rounded-full pl-12 pr-4 py-3 font-bold focus:ring-2 focus:ring-tertiary outline-none"
              placeholder="Search @username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
         </div>
      </div>

      {!stats && !loading && !error && (
        <div className="text-center py-20 opacity-30">
          <TrendingUp size={80} className="mx-auto mb-6" />
          <p className="text-xl font-bold uppercase tracking-widest">Enter a username to view career stats</p>
        </div>
      )}

      {loading && <div className="text-center py-20 italic">Calculating Strategic Metrics...</div>}
      {error && <div className="text-center py-20 text-error font-bold tracking-tight">{error}</div>}

      {stats && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col items-center text-center">
              <h2 className="text-4xl font-bold text-tertiary mb-1 uppercase tracking-tighter">{stats.display_name}</h2>
              <p className="text-on-surface-variant text-lg">@{stats.username}</p>
           </div>

           <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Win Rate Circle */}
              <div className="md:col-span-4 bg-surface-container border-2 border-transparent gold-border relative overflow-hidden p-8 flex flex-col items-center justify-center rounded-xl shadow-2xl">
                 <div className="dragon-watermark absolute inset-0 pointer-events-none" />
                 <h3 className="text-xs font-bold text-tertiary mb-6 uppercase tracking-[0.2em]">Career Win Rate</h3>
                 <div className="relative w-48 h-48">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" fill="none" r="45" stroke="#2a2a2a" strokeWidth="8" />
                       <circle 
                         cx="50" cy="50" fill="none" r="45" stroke="url(#goldGradient)" 
                         strokeWidth="8" strokeDasharray="282.7" 
                         strokeDashoffset={282.7 - (282.7 * stats.win_rate) / 100} 
                         strokeLinecap="round"
                         className="transition-all duration-1000 ease-out"
                       />
                       <defs>
                          <linearGradient id="goldGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                             <stop offset="0%" stopColor="#D4AF37" />
                             <stop offset="100%" stopColor="#F9E586" />
                          </linearGradient>
                       </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-5xl font-bold font-display text-tertiary">{Math.round(stats.win_rate)}%</span>
                    </div>
                 </div>
              </div>

              {/* Stats Grid */}
              <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <StatCard label="Games Played" value={stats.games_played} />
                 <StatCard label="Wins" value={stats.wins} colorClass="text-secondary" bgColorClass="bg-secondary-container/20" />
                 <StatCard label="Losses" value={stats.losses} colorClass="text-error" bgColorClass="bg-error-container/20" />
                 <StatCard label="Draws" value={stats.draws} />
                 
                 <div className="col-span-2 bg-surface-container border border-outline-variant p-8 rounded-xl relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                       <div>
                          <span className="text-xs font-bold text-tertiary uppercase tracking-widest block mb-1">Imperial High Score</span>
                          <span className="text-5xl font-bold text-on-surface">{stats.highest_score}</span>
                       </div>
                       <div className="bg-tertiary text-on-tertiary p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                          <Award size={40} />
                       </div>
                    </div>
                 </div>

                 <div className="col-span-2 bg-surface-container border border-outline-variant p-8 rounded-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                       <div>
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Avg Game Score</span>
                          <span className="text-5xl font-bold text-on-surface">{stats.average_score}</span>
                       </div>
                       <div className="text-outline-variant opacity-20">
                          <BarChart3 size={64} />
                       </div>
                    </div>
                 </div>
              </div>
           </section>

           <Card className="flex flex-col sm:flex-row items-center justify-around py-8 italic text-on-surface-variant shadow-inner">
              <div className="flex flex-col items-center">
                 <History size={32} className="mb-2 opacity-50" />
                 <span className="text-xl font-bold">{stats.total_rounds}</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">Total Rounds Endured</span>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, colorClass = "text-on-surface", bgColorClass = "bg-surface-container-high" }: { label: string; value: number; colorClass?: string; bgColorClass?: string }) {
  return (
    <div className={cn("p-6 rounded-xl border border-outline-variant flex flex-col items-center justify-center text-center transition-all hover:brightness-110", bgColorClass)}>
      <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 tracking-widest leading-none">{label}</span>
      <span className={cn("text-3xl font-bold", colorClass)}>{value}</span>
    </div>
  );
}
