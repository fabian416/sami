"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./socketContext";
import type { NextPage } from "next";
import { UserIcon } from "@heroicons/react/24/outline";
import { ChooseGame } from "~~/components/sami/ChooseGame";
import { PlayGame } from "~~/components/sami/PlayGame";

const Home: NextPage = () => {
  const [choosingGame, setChoosingGame] = useState(true);
  const [connectedPlayers, setConnectedPlayers] = useState<number>(0);
  const { socket } = useSocket();
  const showGame = ({ timeBeforeEnds, serverTime }: { timeBeforeEnds: any; serverTime: any }) => {
    setChoosingGame(false);
  };

  useEffect(() => {
    if (!socket) return;
    const handleAmountOfPlayers = (data: { amount: number }) => {
      setConnectedPlayers(data.amount);
    };

    socket.on("connectedPlayers", handleAmountOfPlayers);
    return () => {
      socket.off("gameStarted", handleAmountOfPlayers);
    };
  }, [socket, connectedPlayers, setConnectedPlayers]);

  return (
    <>
      <div className="flex gap-2 items-center justify-center mt-4 mx-4 max-w-16 outline outline-1 outline-green-600 border border-green-600 rounded-lg px-2 py-1 text-sm text-green-600">
        {connectedPlayers}
        <UserIcon className="w-4 h-4 fill-current text-green-600" />
      </div>
      <div className="flex justify-center items-center flex-col flex-grow pb-1">
        <div className="flex justify-center items-center flex-col flex-grow w-5/6 rounded-2xl border-slate-700 ">
          {choosingGame ? <ChooseGame showGame={showGame} /> : <PlayGame />}
        </div>
      </div>
    </>
  );
};

export default Home;
