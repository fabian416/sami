"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../providers/SocketContext";
import type { NextPage } from "next";
import { UserIcon } from "@heroicons/react/24/outline";
import { ChooseGame } from "~~/components/game/ChooseGame";
import { PlayGame } from "~~/components/game/PlayGame";

const Home: NextPage = () => {
  const [choosingGame, setChoosingGame] = useState(true);
  const [connectedPlayers, setConnectedPlayers] = useState<number>(0);
  const { socket } = useSocket();
  const showGame = () => {
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
    <div className="relative flex flex-col items-center justify-center w-full grow">
      <div className="absolute top-4 left-4 flex gap-2 items-center justify-center max-w-16 outline outline-1 outline-green-600 border border-green-600 rounded-lg px-2 py-1 text-sm text-green-600">
        {connectedPlayers}
        <UserIcon className="w-4 h-4 fill-current text-green-600" />
      </div>

      <div className="flex flex-col items-center justify-center w-5/6 p-4">
        {choosingGame ? <ChooseGame showGame={showGame} /> : <PlayGame />}
      </div>
    </div>
  );
};

export default Home;
