
import PlayerServiceEmitter from "@services/playerService";
import { io } from "../server";
import { games } from "@services/gameService";
import { Player } from "@services/playerService";
import _ from 'lodash';


PlayerServiceEmitter.on("playerIndex", (data: { roomId: string, playerId: string, playerIndex: number }) => {
  io.to(data.roomId).emit("playerIndex", {
    playerId: data.playerId,
    playerIndex: data.playerIndex,
  });
});

PlayerServiceEmitter.on("playerRoomId", (data: { roomId: string, playerId: string }) => {
  io.to(data.roomId).emit("playerRoomId", {
    roomId: data.roomId,
    playerId: data.playerId,
  });
});


export const disconnectPlayer = (data: {roomId: string, playerId: string}) => {
  const { roomId, playerId } = data;
  const game = games[roomId];
  if (game) {
    _.remove(game.players, (player: Player) => player.id === playerId);
  }
}


export const getPlayerIndex = (data: {roomId: string, playerId: string}) => {
    const { roomId, playerId } = data;
    const game = games[roomId];
    if (!game) return -1;
    const player = game.players.find((p: Player) => p.id === playerId);
    if (!player) return -1;
    
    PlayerServiceEmitter.emit("playerIndex", { roomId, playerId, playerIndex: player.index });
}
  
export const getPlayerRoomId = (data: {playerId: string}) => {
  const { playerId } = data;

  const reverseGames = _.reverse(Object.entries(games)); // Convertimos a [roomId, game] y lo invertimos

  // Buscamos el jugador junto con su roomId
  const result: any = _.find(reverseGames, ([roomId, game]: any) =>
    _.find(game.players, { id: playerId })
  );

  if (result) {
    const [roomId, _] = result;
    PlayerServiceEmitter.emit("playerRoomId", { roomId, playerId });
    return roomId;
  }
}
