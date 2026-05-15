'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Calendar, Users, Flag, ChevronLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, Button } from '@/components/UI';
import { Game, GameTeam, Round } from '@/types';
import { cn } from '@/lib/utils';

export default function GameDetail() {
  const params = useParams();
  const gameId = params?.gameId as string;
  
  const [game, setGame] = useState<(Game & { game_teams: (GameTeam & { team: { display_name: string, username: string } })[] }) | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGame() {
      if (!gameId) return;
      try {
        const { data: gData } = await supabase
          .from('games')
          .select('*, game_teams(*, team:teams(display_name, username))')
          .eq('id', gameId)
          .single();
        
        if (gData) setGame(gData as any);

        const { data: rData } = await supabase
          .from('rounds')
          .select('*, scores:round_scores(*)')
          .eq('game_id', gameId)
          .order('round_number', { ascending: true });
        
        if (rData) setRounds(rData as any);
      } finally {
        setLoading(false);
      }
    }
    fetchGame();
  }, [gameId]);

  if (loading || !game) return <div className="text-center py-20 italic">Retrieving Sacred Game Scroll...</div>;

  const winner = game.game_teams.find(gt => gt.team_id === game.winner_team_id);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" as={Link} href="/history">
           <ChevronLeft size={16} /> Back to History
        </Button>
        <div className="text-sm font-bold text-on-surface-variant uppercase flex items-center gap-2">
           <Calendar size={14} /> {game.finished_at ? new Date(game.finished_at).toLocaleDateString() : new Date(game.created_at).toLocaleDateString()}
        </div>
      </div>

      <Card gold className="text-center py-12 relative">
        <div className="absolute inset-0 dragon-watermark pointer-events-none" />
        <h1 className="text-4xl md:text-5xl font-bold mb-8 uppercase tracking-widest text-tertiary">
          {game.is_draw ? 'Hand Of Balance' : 'Imperial Conquest'}
        </h1>
        
        <div className="flex justify-center items-end gap-8 md:gap-24 mb-12">
           {game.game_teams.sort((a,b) => a.position - b.position).map(gt => (
             <div key={gt.id} className="flex flex-col items-center">
                <span className={cn("text-[10px] font-bold uppercase mb-2", gt.team_id === game.winner_team_id ? "text-tertiary" : "text-on-surface-variant")}>
                  {gt.team.display_name}
                </span>
                <span className={cn("text-5xl md:text-7xl font-bold", gt.team_id === game.winner_team_id ? "text-on-surface" : "text-on-surface-variant opacity-50")}>
                  {gt.final_score}
                </span>
                {gt.team_id === game.winner_team_id && (
                  <div className="mt-2 bg-tertiary text-on-tertiary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Trophy size={12} /> VICTOR
                  </div>
                )}
             </div>
           ))}
        </div>

        {game.is_draw ? (
          <p className="text-on-surface-variant italic">Both teams matched in skill, ending the ritual in a draw.</p>
        ) : (
          <p className="text-secondary font-bold text-lg uppercase tracking-widest">
             {winner?.team.display_name} Reigns Supreme
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="h-full">
           <h3 className="text-lg font-bold text-tertiary uppercase mb-6 flex items-center gap-2">
             <Trophy size={20} /> Game Summary
           </h3>
           <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant">Mode</span>
                <span className="font-bold">{game.mode === '2_teams' ? '2 Teams Versus' : '3 Teams Battle'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant">Target Score</span>
                <span className="font-bold">{game.target_score} Points</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant">Total Rounds</span>
                <span className="font-bold">{rounds.length} Rounds</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-on-surface-variant">Imperial Date</span>
                <span className="font-bold">{game.finished_at ? new Date(game.finished_at).toLocaleDateString() : new Date(game.created_at).toLocaleDateString()}</span>
              </div>
           </div>
        </Card>

        <Card className="h-full p-0">
          <div className="px-6 py-4 bg-surface-container-high border-b border-outline-variant">
            <h3 className="text-lg font-bold text-tertiary uppercase flex items-center gap-2">
               <ArrowRight size={20} /> Round History
            </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
             <table className="w-full text-left">
                <thead className="bg-surface-container-highest">
                  <tr className="text-[10px] font-bold text-outline uppercase tracking-widest">
                    <th className="px-4 py-3">Rd</th>
                    {game.game_teams.map(gt => (
                      <th key={gt.id} className="px-4 py-3 text-[10px]">{gt.team.display_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                   {rounds.map(round => (
                     <tr key={round.id} className="hover:bg-surface-container-high transition-colors">
                        <td className="px-4 py-3 font-bold text-on-surface-variant">{round.round_number}</td>
                        {game.game_teams.map(gt => {
                          const score = round.scores?.find(s => s.team_id === gt.team_id)?.score_change || 0;
                          return (
                            <td key={gt.id} className={cn("px-4 py-3 font-bold", score > 0 ? "text-secondary" : (score < 0 ? "text-error" : "text-on-surface-variant"))}>
                              {score > 0 ? `+${score}` : score}
                            </td>
                          );
                        })}
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
