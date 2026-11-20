"use client";

import { Trophy } from "lucide-react";
import { Page } from "@/components/Motion";
import PageHero from "@/components/PageHero";
import PhotoGarland from "@/components/PhotoGarland";
import { PAGE_HEROES } from "@/lib/photos";
import { useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { timeAgo } from "@/lib/moods";
import { useToast } from "@/lib/toast";
import TicTacHeart from "@/components/games/TicTacHeart";
import WouldYouRather from "@/components/games/WouldYouRather";
import TwoTruthsWish from "@/components/games/TwoTruthsWish";
import StoryOfUs from "@/components/games/StoryOfUs";
import TruthOrDare from "@/components/games/TruthOrDare";
import UnoGame from "@/components/games/UnoGame";
import SpinWheel from "@/components/games/SpinWheel";
import ScratchCoupon from "@/components/games/ScratchCoupon";
import DrawGuess from "@/components/games/DrawGuess";
import BusinessHearts from "@/components/games/BusinessHearts";

export default function PlayPage() {
  const { me, mePerson, partner } = usePeople();
  const { rows: games, refresh } = useTable("games", { order: "updated_at" });
  const toast = useToast();

  const find = (type, status) => games.find((g) => g.type === type && g.status === status);
  const ttt = find("ttt", "playing");
  const tttOpen = find("ttt", "open");
  const wyr = find("wyr", "playing");
  const dare = find("dare", "playing");
  const wish = find("wish", "playing");
  const story = find("story", "playing");
  const uno = find("uno", "playing");
  const wheel = find("wheel", "playing");
  const scratch = find("scratch", "playing");
  const draw = find("draw", "playing");
  const business = find("business", "playing");
  const doneGames = games.filter((g) => g.status === "done").slice(-5).reverse();

  const nameOf = (slot) =>
    slot === me?.slot ? mePerson?.name || "You" : partner?.name || "Them";

  const shared = { me, partner, nameOf, refresh, toast };

  return (
    <Page className="pt-8">
      <PageHero {...PAGE_HEROES.play} title="Play Together" />

      <PhotoGarland
        className="mt-2"
        photos={["/assets/us-7.jpeg", "/assets/us-14.jpeg", "/assets/us-19.jpeg", "/assets/us-23.jpeg"]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2 items-start">
        <TicTacHeart
          game={ttt}
          openGame={tttOpen}
          doneGames={doneGames}
          mePerson={mePerson}
          {...shared}
        />
        <SpinWheel game={wheel} {...shared} />
        <ScratchCoupon game={scratch} {...shared} />
        <WouldYouRather game={wyr} {...shared} />
        <TwoTruthsWish game={wish} {...shared} />
        <StoryOfUs game={story} {...shared} />
        <DrawGuess game={draw} {...shared} />
        <BusinessHearts game={business} {...shared} />
        <UnoGame game={uno} {...shared} />
        <TruthOrDare game={dare} {...shared} />
      </div>

      {/* recent results */}
      {doneGames.length > 0 && (
        <div className="card mt-8 p-5 max-w-md mx-auto">
          <h3 className="font-bold text-wine flex items-center gap-2">
            <Trophy size={16} className="text-rose-deep" /> Recent battles
          </h3>
          <div className="mt-3 space-y-1.5">
            {doneGames.map((g) => (
              <div key={g.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-line last:border-0">
                <span>💗 {nameOf(g.x_slot)} vs 💙 {nameOf(g.o_slot)}</span>
                <span className="ml-auto text-xs font-semibold text-rose-deep whitespace-nowrap">
                  {g.winner === "draw" ? "Draw 🤝" : `${nameOf(g.winner)} won`}
                </span>
                <span className="text-xs opacity-50">{timeAgo(g.updated_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
