"use client";

import { useState } from "react";
import type { NextPage } from "next";
// import { BugAntIcon, ClockIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { ChooseGame } from "~~/components/sami/ChooseGame";
import { PlayGame } from "~~/components/sami/PlayGame";

const Home: NextPage = () => {
  const [choosingGame, setChoosingGame] = useState(true);
  const showGame = () => {
    setChoosingGame(false);
  };
  return (
    <>
      <div className="flex justify-center items-center flex-col flex-grow py-3">
        <div className="flex justify-center items-center flex-col flex-grow w-5/6 h-w rounded-2xl border-slate-700 ring-4">
          {choosingGame ? <ChooseGame showGame={showGame} /> : <PlayGame />}
        </div>
      </div>
    </>
  );
};

{
  /*
        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-4">
          <h1 className="text-center">
            <span className="block text-2xl font-bold mb-4">About the game</span>
          </h1>
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>Have a quick chat with strangers and try to discover who&apos;s an AI agent. Harder than you think!</p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <CurrencyDollarIcon className="h-8 w-8 fill-secondary" />
              <p>You pay a fee for each game, and it adds up to a prize that gets distributed among winners.</p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <ClockIcon className="h-8 w-8 fill-secondary" />
              <p>Each round lasts 90 seconds. Then, everyone votes who they think the AI is.</p>
            </div>
          </div>
        </div>*/
}

export default Home;
