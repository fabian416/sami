import type { Server } from "socket.io";
import gameServiceEmitter, { rooms } from "@services/game.service";

let wired = false;

export function wireGameRelays(io: Server) {
  if (wired) return;
  wired = true;

  for (const evt of ["startConversation","voteSubmitted","newMessage","startVoting","gameStarted","gameOver"]) {
    gameServiceEmitter.removeAllListeners(evt);
  }

  gameServiceEmitter.on("startConversation", ({ roomId, timeBeforeEnds, serverTime }) => {
    io.to(roomId).emit("startConversationPhase", {
      message: { message: "Conversation phase has started" },
      timeBeforeEnds,
      serverTime,
    });
  });

  gameServiceEmitter.on("voteSubmitted", ({ roomId, voterId, votedId }) => {
    io.to(roomId).emit("voteSubmitted", { voterId, votedId });
  });

  gameServiceEmitter.on("newMessage", (data) => {
    io.to(data.roomId).emit("newMessage", data);
  });

  gameServiceEmitter.on("startVoting", ({ roomId, timeBeforeEnds, serverTime }) => {
    const game = rooms[roomId];
    if (!game) return;
    const players = game.players.map(p => ({ id: p.id, index: p.index }));
    io.to(roomId).emit("startVotePhase", { message: "Voting phase has started", roomId, players, timeBeforeEnds, serverTime });
  });

  gameServiceEmitter.on("gameStarted", ({ roomId, game, timeBeforeEnds, serverTime }) => {
    io.to(roomId).emit("gameStarted", { roomId: game.roomId, players: game.players, timeBeforeEnds, serverTime });
  });

  gameServiceEmitter.on("gameOver", ({ roomId, isBetGame, results }) => {
    io.to(roomId).emit("gameOver", { message: "The game is over! Here are the results:", isBetGame, results });
  });

  console.log("Relays wired. listeners(newMessage):", gameServiceEmitter.listenerCount("newMessage"));
}
