"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { ChooseGame } from "~~/components/sami/ChooseGame";
import { PlayGame } from "~~/components/sami/PlayGame";

const Home: NextPage = () => {
  const [choosingGame, setChoosingGame] = useState(true);
  const [timeForFirstRound, setTimeForFirstRound] = useState<any>(null);
  const showGame = ({ timeBeforeEnds, serverTime }: { timeBeforeEnds: any; serverTime: any }) => {
    setChoosingGame(false);
    setTimeForFirstRound({ timeBeforeEnds, serverTime });
  };
  return (
    <>
      <div className="flex justify-center items-center flex-col flex-grow pt-4 pb-1">
        <div className="flex justify-center items-center flex-col flex-grow w-5/6 rounded-2xl border-slate-700 ">
          {choosingGame ? <ChooseGame showGame={showGame} /> : <PlayGame timeForFirstRound={timeForFirstRound} />}
        </div>
      </div>
    </>
  );
};

export default Home;
