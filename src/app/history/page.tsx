'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { History as HistoryIcon, Users, Flag, Trophy, ChevronRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/UI';
import { Game, GameTeam } from '@/types';
import { cn } from '@/lib/utils';

export default function History() {
  const [games, setGames] = useState<(Game & { game_teams: (GameTeam & { team: { display_name: string } })[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data } = await supabase
          .from('games')
          .select('*, game_teams(*, team:teams(display_name))')
          .eq('status', 'finished')
          .order('finished_at', { ascending: false });
        
        if (data) setGames(data as any);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center py-20 italic">Consulting Imperial Archives...</div>;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Game History</h1>
          <p className="text-on-surface-variant italic">Relive your imperial conquests and strategic duels.</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-surface-container-high px-4 py-1.5 rounded-full text-xs font-bold text-on-surface-variant border border-outline-variant">Filter: All Modes</span>
          <span className="bg-surface-container-high px-4 py-1.5 rounded-full text-xs font-bold text-on-surface-variant border border-outline-variant">Sort: Recent</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {games.length > 0 ? games.map((game, idx) => (
          <Link key={game.id} href={`/game/${game.id}`}>
            <Card 
              gold={idx === 0} 
              hover 
              className={idx === 0 ? "shadow-[0_0_30px_rgba(212,175,55,0.1)]" : ""}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center bg-surface-container-highest h-20 w-20 rounded-lg border border-outline-variant">
                    <span className="text-[10px] font-bold text-tertiary uppercase">
                      {game.finished_at ? new Date(game.finished_at).toLocaleDateString('en-US', { month: 'short' }) : 'N/A'}
                    </span>
                    <span className="text-3xl font-bold">
                      {game.finished_at ? new Date(game.finished_at).toLocaleDateString('en-US', { day: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy size={18} className="text-tertiary" />
                      <h3 className="text-xl font-bold uppercase tracking-tight">
                        {game.is_draw ? 'Imperial Draw' : 'Imperial Victory'}
                      </h3>
                    </div>
                    <div className="flex gap-4 text-xs font-bold text-on-surface-variant uppercase">
                      <span className="flex items-center gap-1"><Users size={14} /> {game.mode === '2_teams' ? '2 Teams' : '3 Teams'}</span>
                      <span className="flex items-center gap-1"><Flag size={14} /> {game.target_score} Target</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center lg:justify-end flex-grow gap-8 md:gap-16">
                  {game.game_teams.sort((a,b) => a.position - b.position).map((gt) => (
                    <div key={gt.id} className={cn("text-center", gt.team_id !== game.winner_team_id && !game.is_draw && "opacity-40")}>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">{gt.team?.display_name}</p>
                      <div className="flex flex-col items-center">
                        <span className="text-4xl md:text-5xl font-bold font-display">{gt.final_score}</span>
                        {gt.team_id === game.winner_team_id && (
                          <div className="mt-1 flex items-center gap-1 text-tertiary">
                            <Check size={14} />
                            <span className="text-[10px] font-bold uppercase">Winner</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center text-tertiary">
                  <ChevronRight size={24} />
                </div>
              </div>
            </Card>
          </Link>
        )) : (
          <div className="text-center py-20 opacity-40">
            <HistoryIcon size={64} className="mx-auto mb-4" />
            <p className="text-xl font-bold uppercase">Archives Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
