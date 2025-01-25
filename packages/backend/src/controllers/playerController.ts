
import PlayerServiceEmitter from "../services/playerService";
import { io } from "../server";
import { games } from "../services/gameService";
import { Player } from "../services/playerService";


PlayerServiceEmitter.on("playerIndex", (data: { roomId: string, playerId: string, playerIndex: number }) => {
    io.to(data.roomId).emit("playerIndex", {
      playerId: data.playerId,
      playerIndex: data.playerIndex,
    });
  });


export const getPlayerIndex = (data: {roomId: string, playerId: string}) => {
    const { roomId, playerId } = data;
    console.log(`Player ${playerId} solicitó su index.`);
    const game = games[roomId];
    if (!game) return -1;
    const player = game.players.find((p: Player) => p.id === playerId);
    if (!player) return -1;
    
    PlayerServiceEmitter.emit("playerIndex", { roomId, playerId, playerIndex: player.index });
}
  