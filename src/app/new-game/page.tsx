'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, UserPlus, Flag, ChevronRight, ChevronLeft, ShieldCheck, Play } from 'lucide-react';
import { Card, Button } from '@/components/UI';
import { supabase } from '@/lib/supabase';
import { GameMode, Team } from '@/types';
import { validateUsername, validatePin, hashPin, cn } from '@/lib/utils';

function NewGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<GameMode>(GameMode.TWO_TEAMS);
  const [targetScore, setTargetScore] = useState(1000);
  
  // Team selection state
  const [teamSelections, setTeamSelections] = useState<any[]>([]);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  
  // Search/Verification state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Team | null | 'new'>(null);
  const [error, setError] = useState('');

  const numTeams = mode === GameMode.TWO_TEAMS ? 2 : 3;

  useEffect(() => {
    // If we have an existing team index in state, reset selection inputs
    setUsername('');
    setDisplayName('');
    setPin('');
    setConfirmPin('');
    setSearchResult(null);
    setError('');
  }, [currentTeamIdx]);

  const handleSearch = async () => {
    if (!validateUsername(username)) {
      setError('Username must be 3-30 lowercase characters, numbers or underscores.');
      return;
    }
    
    // Check if this username is already selected for another position
    if (teamSelections.some((t, i) => i !== currentTeamIdx && t?.username === username)) {
      setError('This team is already selected.');
      return;
    }

    setIsSearching(true);
    setError('');
    
    try {
      const { data, error: sbError } = await supabase
        .from('teams')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (sbError) throw sbError;
      
      if (data) {
        setSearchResult(data);
        setDisplayName(data.display_name);
      } else {
        setSearchResult('new');
        setDisplayName('');
      }
    } catch (err) {
      setError('Error searching for team.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerifyOrJoin = async () => {
    if (!validatePin(pin)) {
      setError('PIN must be 4-8 digits.');
      return;
    }

    if (searchResult === 'new') {
      if (pin !== confirmPin) {
        setError('PINs do not match.');
        return;
      }
      if (!displayName.trim()) {
        setError('Display name is required.');
        return;
      }

      try {
        const { data: newTeam, error: createError } = await supabase
          .from('teams')
          .insert({
            username,
            display_name: displayName,
            pin_hash: hashPin(pin)
          })
          .select()
          .single();

        if (createError) throw createError;
        
        finishSelection(newTeam);
      } catch (err: any) {
        setError(err.message || 'Error creating team.');
      }
    } else if (searchResult) {
      // Verify PIN
      try {
        const { data, error: verifyError } = await supabase
          .from('teams')
          .select('pin_hash')
          .eq('id', searchResult.id)
          .single();
        
        if (verifyError) throw verifyError;
        
        if (data.pin_hash === hashPin(pin)) {
          finishSelection(searchResult);
        } else {
          setError('Invalid PIN.');
        }
      } catch (err) {
        setError('Error verifying PIN.');
      }
    }
  };

  const finishSelection = (team: Team) => {
    const newSelections = [...teamSelections];
    newSelections[currentTeamIdx] = team;
    setTeamSelections(newSelections);
    
    if (currentTeamIdx < numTeams - 1) {
      setCurrentTeamIdx(currentTeamIdx + 1);
    } else {
      setStep(3); // Move to review
    }
  };

  const startGame = async () => {
    try {
      // 1. Insert Game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          mode,
          target_score: targetScore,
          status: 'playing'
        })
        .select()
        .single();
      
      if (gameError) throw gameError;

      // 2. Insert Game Teams
      const gameTeamsToInsert = teamSelections.map((team, idx) => ({
        game_id: game.id,
        team_id: team.id,
        position: idx + 1,
        final_score: 0
      }));

      const { error: gTeamsError } = await supabase
        .from('game_teams')
        .insert(gameTeamsToInsert);
      
      if (gTeamsError) throw gTeamsError;

      router.push(`/scoreboard/${game.id}`);
    } catch (err) {
      setError('Error starting game.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Stepper */}
      <div className="flex justify-between items-center mb-12 relative max-w-lg mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-outline-variant -z-10 -translate-y-1/2" />
        <div className="flex flex-col items-center gap-2">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold ring-4 ring-surface transition-all", step >= 1 ? "bg-tertiary text-on-tertiary shadow-lg" : "bg-surface-container border-2 border-outline-variant text-on-surface-variant")}>1</div>
          <span className={cn("text-xs font-bold uppercase", step >= 1 ? "text-tertiary" : "text-on-surface-variant")}>Mode</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold ring-4 ring-surface transition-all", step >= 2 ? "bg-tertiary text-on-tertiary shadow-lg" : "bg-surface-container border-2 border-outline-variant text-on-surface-variant")}>2</div>
          <span className={cn("text-xs font-bold uppercase", step >= 2 ? "text-tertiary" : "text-on-surface-variant")}>Teams</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold ring-4 ring-surface transition-all", step >= 3 ? "bg-tertiary text-on-tertiary shadow-lg" : "bg-surface-container border-2 border-outline-variant text-on-surface-variant")}>3</div>
          <span className={cn("text-xs font-bold uppercase", step >= 3 ? "text-tertiary" : "text-on-surface-variant")}>Start</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-8">
          {step === 1 && (
            <>
              <Card gold className="relative overflow-hidden">
                <h2 className="text-2xl font-bold text-tertiary mb-6 flex items-center gap-2">
                  <Users size={24} /> Choose Game Mode
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setMode(GameMode.TWO_TEAMS)}
                    className={cn("flex flex-col items-center gap-4 p-6 rounded-lg bg-surface-container-high border-2 transition-all active:scale-95", mode === GameMode.TWO_TEAMS ? "border-primary gold-glow" : "border-transparent opacity-60")}
                  >
                    <Users size={40} className="text-primary" />
                    <div className="text-center">
                      <p className="text-xl font-bold">2 Teams</p>
                      <p className="text-xs text-on-surface-variant uppercase font-bold">Classic 2v2 Strategy</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setMode(GameMode.THREE_TEAMS)}
                    className={cn("flex flex-col items-center gap-4 p-6 rounded-lg bg-surface-container-high border-2 transition-all active:scale-95", mode === GameMode.THREE_TEAMS ? "border-primary gold-glow" : "border-transparent opacity-60")}
                  >
                    <Users size={40} className="text-primary" />
                    <div className="text-center">
                      <p className="text-xl font-bold">3 Teams</p>
                      <p className="text-xs text-on-surface-variant uppercase font-bold">The Threesome Variant</p>
                    </div>
                  </button>
                </div>
              </Card>

              <Card>
                <h2 className="text-2xl font-bold text-tertiary mb-6 flex items-center gap-2">
                  <Flag size={24} /> Victory Condition
                </h2>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant={targetScore === 500 ? 'primary' : 'outline'}
                    onClick={() => setTargetScore(500)}
                    className="flex-1 min-w-[120px]"
                  >
                    500 Points
                  </Button>
                  <Button 
                    variant={targetScore === 1000 ? 'primary' : 'outline'}
                    onClick={() => setTargetScore(1000)}
                    className="flex-1 min-w-[120px]"
                  >
                    1000 Points
                  </Button>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button variant="gold" size="lg" onClick={() => setStep(2)}>
                  Define Teams <ChevronRight size={20} />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <Card gold className="relative min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-tertiary">
                  Step 2: Team Roster {currentTeamIdx + 1}/{numTeams}
                </h2>
                <div className="flex gap-2">
                   {Array.from({ length: numTeams }).map((_, i) => (
                     <div key={i} className={cn("w-3 h-3 rounded-full", i === currentTeamIdx ? "bg-primary" : (teamSelections[i] ? "bg-secondary" : "bg-outline-variant"))} />
                   ))}
                </div>
              </div>

              {!searchResult ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Enter Team Username</label>
                    <input 
                      className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-4 text-xl font-bold focus:border-tertiary outline-none"
                      placeholder="dragon_team"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      disabled={isSearching}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  {error && <p className="text-error text-sm font-bold">{error}</p>}
                  <Button fullWidth onClick={handleSearch} disabled={isSearching} size="lg">
                    {isSearching ? 'Searching...' : 'Search Team'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-surface-container-highest rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-tertiary uppercase">Selection for Team {currentTeamIdx + 1}</p>
                      <p className="text-xl font-bold">@{username}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSearchResult(null)}>Change</Button>
                  </div>

                  <div className="space-y-4">
                    {searchResult === 'new' ? (
                      <>
                        <div className="p-3 bg-secondary-container/20 border border-secondary/30 rounded-lg text-secondary text-sm flex items-center gap-2">
                          <UserPlus size={16} /> New team detected! Create it below.
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-on-surface-variant uppercase">Display Name</label>
                          <input 
                            className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-3 text-lg focus:border-tertiary outline-none"
                            placeholder="The Golden Dragons"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-on-surface-variant uppercase">Set PIN (4-8 digits)</label>
                            <input 
                              type="password"
                              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-3 text-lg text-center tracking-[0.5em] focus:border-tertiary outline-none"
                              value={pin}
                              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                              maxLength={8}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-on-surface-variant uppercase">Confirm PIN</label>
                            <input 
                              type="password"
                              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-3 text-lg text-center tracking-[0.5em] focus:border-tertiary outline-none"
                              value={confirmPin}
                              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                              maxLength={8}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-primary-container/20 border border-primary/30 rounded-lg text-primary text-sm flex items-center gap-2">
                          <ShieldCheck size={16} /> Existing team. Please enter PIN to join game.
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-on-surface-variant uppercase">Enter Team PIN</label>
                          <input 
                            type="password"
                            className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-3 text-xl text-center tracking-[0.5em] focus:border-tertiary outline-none"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            maxLength={8}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleVerifyOrJoin()}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {error && <p className="text-error text-sm font-bold">{error}</p>}
                  
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                       <ChevronLeft size={20} /> Back
                    </Button>
                    <Button variant="primary" className="flex-[2]" onClick={handleVerifyOrJoin}>
                       {searchResult === 'new' ? 'Register & Next' : 'Verify & Next'} <ChevronRight size={20} />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {step === 3 && (
            <Card gold className="space-y-8">
              <h2 className="text-3xl font-bold text-tertiary text-center">Imperial Review</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="p-4 bg-surface-container-high rounded-xl border border-outline-variant border-l-4 border-l-primary">
                    <p className="text-xs font-bold text-on-surface-variant uppercase">Game Settings</p>
                    <p className="text-xl font-bold mt-1">{mode === GameMode.TWO_TEAMS ? '2 Teams Versus' : '3 Teams Battle'}</p>
                    <p className="text-secondary font-bold">{targetScore} Points Target</p>
                 </div>
                 <div className="p-4 bg-surface-container-high rounded-xl border border-outline-variant border-l-4 border-l-tertiary">
                    <p className="text-xs font-bold text-on-surface-variant uppercase">Participating Teams</p>
                    <div className="mt-2 space-y-1">
                      {teamSelections.map((team, idx) => (
                        <div key={team.id} className="font-bold flex items-center gap-2">
                          <span className="text-tertiary">{idx+1}.</span> {team.display_name} (@{team.username})
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Modify Teams</Button>
                <Button variant="primary" size="lg" className="flex-[2] gold-glow" onClick={startGame}>
                   BEGIN THE RITUAL <Play size={20} className="ml-2" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <Card className="border-l-4 border-l-tertiary">
            <h3 className="text-sm font-bold text-tertiary uppercase mb-4">Imperial Wisdom</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed italic">
              "A typical game of Tichu to 1000 points lasts roughly 60 minutes. Choose 500 for a quick ceremonial skirmish."
            </p>
          </Card>
          
          <Card>
            <h3 className="text-sm font-bold text-on-surface mb-4">Setup Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant text-sm">
                <span className="text-on-surface-variant">Mode</span>
                <span className="font-bold">{mode === GameMode.TWO_TEAMS ? '2 Teams' : '3 Teams'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant text-sm">
                <span className="text-on-surface-variant">Target</span>
                <span className="font-bold text-primary">{targetScore} pts</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-on-surface-variant">Teams</span>
                <span className={cn("font-bold px-2 py-0.5 rounded text-[10px]", teamSelections.length === numTeams ? "bg-secondary/20 text-secondary" : "bg-outline-variant/30 text-on-surface-variant")}>
                  {teamSelections.length}/{numTeams} Defined
                </span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function NewGame() {
  return (
    <Suspense fallback={<div className="text-center py-20 italic">Loading Imperial Setup...</div>}>
      <NewGameContent />
    </Suspense>
  );
}
