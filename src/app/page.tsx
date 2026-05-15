"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Play,
  UserPlus,
  History as HistoryIcon,
  BarChart3,
  ChevronRight,
  Medal,
  X,
  PlayCircle,
} from "lucide-react";
import { Card, Button } from "@/components/UI";
import { supabase } from "@/lib/supabase";
import { Game, GameTeam } from "@/types";
import Image from "next/image";

export default function Home() {
  const [recentGames, setRecentGames] = useState<
    (Game & { game_teams: (GameTeam & { team: { display_name: string } })[] })[]
  >([]);
  const [ongoingGame, setOngoingGame] = useState<Game | null>(null);

  useEffect(() => {
    async function fetchData() {
      // Fetch ongoing game
      const { data: ongoing } = await supabase
        .from("games")
        .select("*")
        .eq("status", "playing")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ongoing) setOngoingGame(ongoing);

      // Fetch recent finished games
      const { data: recent } = await supabase
        .from("games")
        .select("*, game_teams(*, team:teams(display_name))")
        .eq("status", "finished")
        .order("finished_at", { ascending: false })
        .limit(3);

      if (recent) setRecentGames(recent as any);
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container-low gold-border gold-glow">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 p-8 md:p-12 relative z-10">
          <div className="order-2 md:order-1">
            <h1 className="text-5xl md:text-6xl font-bold text-tertiary mb-4 leading-tight">
              MASTER THE <br />
              <span className="text-primary">DRAGON</span>
            </h1>
            <p className="text-lg text-on-surface-variant mb-8 max-w-md">
              Track your imperial matches with precision. The definitive
              high-stakes scorekeeping companion for competitive Tichu play.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                as={Link}
                href="/new-game"
                size="lg"
                variant="primary"
                className="gold-glow"
              >
                Start New Game <Play size={20} className="ml-2" />
              </Button>
              <Button
                as={Link}
                href="/new-game?mode=create"
                size="lg"
                variant="gold"
              >
                Create Team
              </Button>
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <Image
              src="/logo.png"
              alt="Tichu Dragon"
              className="w-full max-w-sm h-auto drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]"
              width={400}
              height={400}
            />
          </div>
        </div>
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <div className="w-[400px] h-[400px] border-4 border-tertiary rounded-full rotate-45" />
        </div>
      </section>

      {/* Action Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/stats" className="md:col-span-1">
          <Card hover className="h-full group">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="text-tertiary" size={40} />
              <ChevronRight className="text-on-surface-variant group-hover:text-tertiary transition-colors" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Quick Stats</h3>
            <p className="text-on-surface-variant">
              View your career win rate, Tichu success percentage, and team
              rankings.
            </p>
          </Card>
        </Link>

        <div className="md:col-span-2">
          {ongoingGame ? (
            <Card className="h-full flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-secondary mb-2">
                  Ongoing Ritual
                </h3>
                <p className="text-on-surface-variant">
                  You have a game in progress. Resume your strategic duel.
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <Button
                  as={Link}
                  href={`/scoreboard/${ongoingGame.id}`}
                  variant="secondary"
                  className="p-4 rounded-lg"
                >
                  Resume Game <Play size={20} className="ml-2" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center border-dashed opacity-60">
              <p className="text-on-surface-variant text-lg">
                No ongoing game. Ready for a new challenge?
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Games */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <HistoryIcon className="text-primary" />
            Recent Games
          </h2>
          <Link
            href="/history"
            className="text-tertiary font-bold hover:underline"
          >
            View All History
          </Link>
        </div>

        <div className="space-y-4">
          {recentGames.length > 0 ? (
            recentGames.map((game) => (
              <Link key={game.id} href={`/game/${game.id}`}>
                <Card
                  hover
                  className="flex flex-wrap md:flex-nowrap items-center gap-6 group mb-4"
                >
                  <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container">
                    {game.is_draw ? (
                      <div className="font-bold">D</div>
                    ) : (
                      <Medal size={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-sm font-bold text-tertiary uppercase">
                      {game.is_draw ? "DRAW" : "VICTORY"} •{" "}
                      {game.finished_at
                        ? new Date(game.finished_at).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div className="text-lg font-bold">
                      {game.game_teams
                        .sort((a, b) => a.position - b.position)
                        .map((gt, idx) => (
                          <span key={gt.id}>
                            {gt.team?.display_name}
                            {idx < game.game_teams.length - 1 && (
                              <span className="text-on-surface-variant font-normal mx-2">
                                vs
                              </span>
                            )}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-xs font-bold text-on-surface-variant">
                        Scores
                      </div>
                      <div className="text-xl font-bold">
                        {game.game_teams
                          .sort((a, b) => a.position - b.position)
                          .map((gt, idx) => (
                            <span key={gt.id}>
                              {gt.final_score}
                              {idx < game.game_teams.length - 1 && (
                                <span className="mx-1">—</span>
                              )}
                            </span>
                          ))}
                      </div>
                    </div>
                    <ChevronRight className="text-on-surface-variant group-hover:text-on-surface transition-colors" />
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <p className="text-on-surface-variant text-center py-12">
              No finished games yet. Start your imperial journey!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
