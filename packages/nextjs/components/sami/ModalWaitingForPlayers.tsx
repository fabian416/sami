import { useEffect, useState } from "react";
import { useSocket } from "~~/app/socketContext";

export const ModalWaitingForPlayers = () => {
  const [amountOfPlayers, setAmountOfPlayers] = useState<number | null>(null);
  const [minPlayers, setMinPlayers] = useState<number | null>(null);
  const { socket, playerId, roomId, setRoomId } = useSocket();

  useEffect(() => {
    if (!socket) return;
    !roomId && socket.emit("getPlayerRoomId", { playerId });

    socket.on("playerRoomId", (data: { roomId: string; playerId: string }) => {
      playerId === data.playerId && setRoomId(data.roomId);
    });
  }, [socket, roomId, playerId, setRoomId]);

  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit("getNumberOfPlayers", { roomId });

    // Emitir cada 2 segundos, por ejemplo
    const interval = setInterval(() => {
      socket.emit("getNumberOfPlayers", { roomId });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket) return;
    socket.on("numberOfPlayers", (data: { amountOfPlayers: number; neededPlayers: number }) => {
      setAmountOfPlayers(data.amountOfPlayers);
      setMinPlayers(data.neededPlayers);
    });
  }, [socket]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#1CA297] glow-cyan text-white rounded-2xl items-center justify-center p-8">
        <div className="flex items-center justify-center text-center flex-col gap-2">
          <span className="text-[#2c2171]">
            <strong className="text-xl">Waiting for other players to join</strong>
          </span>
          <div className="flex items-center justify-center gap-4">
            <span className="text-6xl">
              <strong>{amountOfPlayers && minPlayers && `${amountOfPlayers}/${minPlayers}`}</strong>
            </span>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#2c2171] border-solid"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
