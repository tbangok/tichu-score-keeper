'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, Undo } from 'lucide-react';
import { Card, Button, ScoreInput } from '@/components/UI';
import { supabase } from '@/lib/supabase';
import { Game, GameTeam, Round, GameStatus, GameMode } from '@/types';
import { cn } from '@/lib/utils';

export default function Scoreboard() {
  const params = useParams();
  const gameId = params?.gameId as string;
  const router = useRouter();
  
  const [game, setGame] = useState<Game | null>(null);
  const [gameTeams, setGameTeams] = useState<(GameTeam & { team: { display_name: string, username: string } })[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Current round inputs
  const [roundInputs, setRoundInputs] = useState<Record<string, number>>({});
  
  // Modals
  const [showEndModal, setShowEndModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const fetchGameData = useCallback(async () => {
    if (!gameId) return;
    
    try {
      // 1. Fetch Game
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
      
      if (!gameData) throw new Error('Game not found');
      setGame(gameData);

      // 2. Fetch Teams
      const { data: teamsData } = await supabase
        .from('game_teams')
        .select('*, team:teams(display_name, username)')
        .eq('game_id', gameId)
        .order('position', { ascending: true });
      
      setGameTeams(teamsData as any);
      
      // Initialize inputs if empty
      if (Object.keys(roundInputs).length === 0 && teamsData) {
        const initialInputs: Record<string, number> = {};
        teamsData.forEach(t => initialInputs[t.team_id] = 0);
        setRoundInputs(initialInputs);
      }

      // 3. Fetch Rounds (with scores)
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('*, scores:round_scores(*)')
        .eq('game_id', gameId)
        .order('round_number', { ascending: false });
      
      setRounds(roundsData as any);

      // Check for auto-game over
      if (gameData.status === GameStatus.PLAYING) {
        const anyTeamReachedTarget = teamsData?.some(t => t.final_score >= gameData.target_score);
        if (anyTeamReachedTarget) {
          setShowGameOverModal(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [gameId, roundInputs]);

  useEffect(() => {
    fetchGameData();
  }, [gameId, fetchGameData]);

  const handleAddRound = async () => {
    if (!game) return;

    try {
      const nextRoundNum = rounds.length + 1;
      
      // 1. Create Round
      const { data: newRound, error: roundError } = await supabase
        .from('rounds')
        .insert({ game_id: game.id, round_number: nextRoundNum })
        .select()
        .single();
      
      if (roundError) throw roundError;

      // 2. Create Round Scores
      const scoresToInsert = gameTeams.map(gt => ({
        round_id: newRound.id,
        team_id: gt.team_id,
        score_change: roundInputs[gt.team_id] || 0
      }));

      const { error: scoresError } = await supabase
        .from('round_scores')
        .insert(scoresToInsert);
      
      if (scoresError) throw scoresError;

      // 3. Update Game Teams total scores
      for (const gt of gameTeams) {
        const newTotal = (gt.final_score || 0) + (roundInputs[gt.team_id] || 0);
        await supabase
          .from('game_teams')
          .update({ final_score: newTotal })
          .eq('id', gt.id);
      }

      // Reset inputs and refresh
      const resetInputs: Record<string, number> = {};
      gameTeams.forEach(t => resetInputs[t.team_id] = 0);
      setRoundInputs(resetInputs);
      fetchGameData();
    } catch (err) {
      alert('Error adding round');
    }
  };

  const handleUndoRound = async () => {
    if (rounds.length === 0) return;
    if (!confirm('Undo the last round? Current scores will be adjusted.')) return;

    const lastRound = rounds[0]; // Ordered descending

    try {
      // 1. Revert scores in game_teams
      for (const score of lastRound.scores || []) {
        const gt = gameTeams.find(t => t.team_id === score.team_id);
        if (gt) {
          const revertedTotal = gt.final_score - score.score_change;
          await supabase
            .from('game_teams')
            .update({ final_score: revertedTotal })
            .eq('id', gt.id);
        }
      }

      // 2. Delete round (cascade deletes scores)
      await supabase.from('rounds').delete().eq('id', lastRound.id);

      fetchGameData();
    } catch (err) {
      alert('Error undoing round');
    }
  };

  const finishGame = async (isDraw = false, winnerId: string | null = null) => {
    if (!game) return;

    try {
      await supabase.from('games').update({
        status: GameStatus.FINISHED,
        finished_at: new Date().toISOString(),
        is_draw: isDraw,
        winner_team_id: winnerId
      }).eq('id', game.id);

      router.push(`/game/${game.id}`);
    } catch (err) {
      alert('Error finishing game');
    }
  };

  if (loading || !game) return <div className="text-center py-20 italic">Loading Imperial Scoreboard...</div>;

  const maxScore = Math.max(...gameTeams.map(t => t.final_score), 0);
  const progressPercent = Math.min((maxScore / game.target_score) * 100, 100);

  // Winner logic
  const sortedByScore = [...gameTeams].sort((a, b) => b.final_score - a.final_score);
  const potentialWinner = sortedByScore[0];
  const isCurrentlyDrawn = sortedByScore.length > 1 && sortedByScore[0].final_score === sortedByScore[1].final_score;

  return (
    <div className="space-y-12">
      {/* Scoreboard Cards */}
      <div className={cn("grid gap-8", game.mode === GameMode.TWO_TEAMS ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3")}>
        {gameTeams.map((gt, idx) => {
          const lastRoundScore = rounds[0]?.scores?.find(s => s.team_id === gt.team_id)?.score_change || 0;
          const labelColor = idx === 0 ? "text-primary" : (idx === 1 ? "text-secondary" : "text-tertiary");
          return (
            <Card key={gt.id} gold={gt.final_score === maxScore && maxScore > 0} className="relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 dragon-watermark pointer-events-none" />
              <div className="flex flex-col items-center relative z-10">
                <span className={cn("text-xs font-bold uppercase tracking-[0.2em] mb-2", labelColor)}>{gt.team.display_name}</span>
                <h2 className="text-6xl md:text-7xl font-bold font-display text-on-surface">{gt.final_score}</h2>
                <div className="mt-4 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Last Round</span>
                  <span className={cn("text-lg font-bold", lastRoundScore > 0 ? "text-secondary" : (lastRoundScore < 0 ? "text-error" : "text-on-surface-variant"))}>
                    {lastRoundScore > 0 ? `+${lastRoundScore}` : lastRoundScore}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-surface-container-high rounded-full overflow-hidden shadow-inner">
        <div 
          className="absolute h-full bg-gradient-to-r from-primary via-tertiary to-secondary transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="absolute inset-0 flex justify-between items-center px-4 mix-blend-difference">
          <span className="text-[10px] font-bold text-white uppercase">High: {maxScore}</span>
          <span className="text-[10px] font-bold text-white uppercase">Target: {game.target_score}</span>
        </div>
      </div>

      {/* Round Score Entry */}
      <Card className="bg-surface-container-low p-8 border border-outline-variant shadow-inner">
        <h3 className="text-2xl font-bold mb-8 text-center uppercase tracking-widest">Score Round {rounds.length + 1}</h3>
        <div className={cn("grid gap-8 items-center", game.mode === GameMode.TWO_TEAMS ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3")}>
          {gameTeams.map((gt, idx) => (
             <ScoreInput 
               key={gt.id}
               label={gt.team.display_name}
               value={roundInputs[gt.team_id] || 0}
               onChange={(val) => setRoundInputs({ ...roundInputs, [gt.team_id]: val })}
               colorClass={idx === 0 ? "text-primary" : (idx === 1 ? "text-secondary" : "text-tertiary")}
             />
          ))}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="primary" size="lg" className="sm:flex-1 gold-glow" onClick={handleAddRound}>
            Add Round
          </Button>
          <Button variant="outline" size="lg" className="sm:flex-1" onClick={() => setShowEndModal(true)}>
            Manual End
          </Button>
        </div>
      </Card>

      {/* History Area */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-surface-container-high flex justify-between items-center border-b border-outline-variant">
          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Round History</h4>
          <Button variant="outline" size="sm" onClick={handleUndoRound} disabled={rounds.length === 0}>
            <Undo size={14} className="mr-2" /> Undo Last Round
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] text-outline bg-surface-container-highest">
                <th className="px-6 py-4">Rd</th>
                {gameTeams.map(gt => (
                  <th key={gt.id} className="px-6 py-4">{gt.team.display_name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {rounds.map((round) => (
                <tr key={round.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-4 font-bold text-outline">{round.round_number}</td>
                  {gameTeams.map(gt => {
                    const score = round.scores?.find(s => s.team_id === gt.team_id)?.score_change || 0;
                    return (
                      <td key={gt.id} className={cn("px-6 py-4 font-bold text-lg", score > 0 ? "text-secondary" : (score < 0 ? "text-error" : "text-on-surface-variant"))}>
                        {score > 0 ? `+${score}` : score}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rounds.length === 0 && (
                <tr>
                  <td colSpan={gameTeams.length + 1} className="px-6 py-12 text-center text-on-surface-variant italic">
                    The ritual has just begun. No rounds recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual End Game Modal */}
      {showEndModal && (
        <Modal onClose={() => setShowEndModal(false)}>
           <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-primary italic uppercase tracking-tighter">End Imperial Ritual?</h2>
              <p className="text-on-surface-variant">The game will be recorded as finished. Current scores will be finalized.</p>
              
              <div className="p-4 bg-surface-container-high rounded-xl space-y-2">
                 {gameTeams.map(gt => (
                    <div key={gt.id} className="flex justify-between items-center">
                       <span className="font-bold">{gt.team.display_name}</span>
                       <span className="text-2xl font-bold">{gt.final_score}</span>
                    </div>
                 ))}
              </div>

              {isCurrentlyDrawn ? (
                <div className="space-y-4">
                   <p className="text-tertiary font-bold">The ritual is currently tied!</p>
                   <div className="flex gap-4">
                      <Button variant="gold" className="flex-1" onClick={() => finishGame(true, null)}>Mark as Draw</Button>
                      <Button variant="outline" className="flex-1" onClick={() => setShowEndModal(false)}>Keep Playing</Button>
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-secondary font-bold flex items-center justify-center gap-2">
                    <Award size={20} /> Predicted Winner: {potentialWinner.team.display_name}
                  </p>
                  <Button variant="primary" size="lg" fullWidth onClick={() => finishGame(false, potentialWinner.team_id)}>
                    End & Save
                  </Button>
                  <Button variant="outline" fullWidth onClick={() => setShowEndModal(false)}>Go Back</Button>
                </div>
              )}
           </div>
        </Modal>
      )}

      {/* Game Over Modal (Auto-detection) */}
      {showGameOverModal && (
        <Modal onClose={() => setShowGameOverModal(false)}>
           <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Award size={64} className="text-tertiary animate-bounce" />
              </div>
              <h2 className="text-4xl font-bold text-tertiary tracking-widest uppercase">GLORY ACHIEVED!</h2>
              <p className="text-on-surface-variant">Target score reached. Behold the victors.</p>
              
              <div className="p-6 bg-surface-container-high rounded-2xl space-y-4">
                 {sortedByScore.map((gt, idx) => (
                    <div key={gt.id} className={cn("flex justify-between items-center p-3 rounded-lg", idx === 0 && !isCurrentlyDrawn ? "bg-tertiary/10 border border-tertiary shadow-lg" : "bg-surface-container")}>
                       <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-outline">{idx + 1}.</span>
                         <span className="font-bold">{gt.team.display_name}</span>
                         {idx === 0 && !isCurrentlyDrawn && <Award size={16} className="text-tertiary"/>}
                       </div>
                       <span className="text-2xl font-bold">{gt.final_score}</span>
                    </div>
                 ))}
              </div>

              {isCurrentlyDrawn ? (
                <div className="space-y-4">
                   <p className="text-tertiary font-bold">A rare draw has occurred!</p>
                   <div className="flex flex-col gap-3">
                      <Button variant="secondary" size="lg" fullWidth onClick={() => setShowGameOverModal(false)}>Continue Playing</Button>
                      <Button variant="gold" fullWidth onClick={() => finishGame(true, null)}>Mark as Draw</Button>
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button variant="primary" size="lg" fullWidth className="gold-glow" onClick={() => finishGame(false, potentialWinner.team_id)}>
                    Save & Finish
                  </Button>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setShowGameOverModal(false)}>Keep Playing</Button>
                    <Button variant="gold" className="flex-1" as={Link} href="/new-game">New Game</Button>
                  </div>
                </div>
              )}
           </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-dim/90 backdrop-blur-sm">
      <div className="bg-surface-container w-full max-w-lg rounded-2xl gold-border shadow-[0_0_50px_rgba(212,175,55,0.2)] p-8">
        {children}
      </div>
    </div>
  );
}
