import { useEffect, useState } from "react";
import { useSocket } from "~~/providers/SocketContext";

export const ModalWaitingForPlayers = ({ isBetGame }: { isBetGame: boolean }) => {
  const [amountOfPlayers, setAmountOfPlayers] = useState<number | null>(null);
  const [minPlayers, setMinPlayers] = useState<number | null>(null);
  const { socket, playerId, roomId, setRoomId } = useSocket();

  useEffect(() => {
    if (!socket) return;
    if (!roomId) {
      socket.emit("getPlayerRoomId", { playerId });
    }

    socket.on("playerRoomId", (data: { roomId: string; playerId: string }) => {
      if (playerId === data.playerId) {
        setRoomId(data.roomId);
      }
    });

    return () => {
      socket.off("playerRoomId");
    };
  }, [socket, roomId, playerId, setRoomId]);

  useEffect(() => {
    if (!socket || !roomId) return;

    // Emit `isBetGame` along with the request
    socket.emit("getNumberOfPlayers", { roomId, isBetGame });

    const interval = setInterval(() => {
      socket.emit("getNumberOfPlayers", { roomId, isBetGame });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, roomId, isBetGame]);

  useEffect(() => {
    if (!socket) return;

    const handleNumberOfPlayers = (data: { amountOfPlayers: number; neededPlayers: number; isBetGame: boolean }) => {
      if (data.isBetGame === isBetGame) {
        // update only if is a bet game
        setAmountOfPlayers(data.amountOfPlayers);
        setMinPlayers(data.neededPlayers);
      }
    };

    socket.on("numberOfPlayers", handleNumberOfPlayers);
    return () => {
      socket.off("numberOfPlayers", handleNumberOfPlayers);
    };
  }, [socket, isBetGame]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#1CA297] glow-cyan text-white rounded-2xl items-center justify-center p-8">
        <div className="flex items-center justify-center text-center flex-col gap-2">
          <span className="text-[#2c2171]">
            <strong className="text-xl">Waiting for other players to join</strong>
          </span>
          <div className="flex items-center justify-center gap-4 flex-row">
            <span className="text-5xl m-2">
              <strong>{amountOfPlayers && minPlayers && `${amountOfPlayers}/${minPlayers}`}</strong>
            </span>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#2c2171] border-solid"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
