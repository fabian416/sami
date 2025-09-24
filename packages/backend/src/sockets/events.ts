export const Events = {
  // Core
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  ERROR: "error",
  CONNECTED_PLAYERS: "connectedPlayers",

  // Player
  PLAYER_REGISTER_WALLET: "registerWallet",
  PLAYER_GET_INDEX: "getPlayerIndex",
  PLAYER_GET_ROOM: "getPlayerRoomId",

  // Game
  GAME_JOIN: "createOrJoinGame",
  GAME_JOINED: "gameJoined",
  GAME_PLAYERS_COUNT: "getNumberOfPlayers",
  GAME_CAST_VOTE: "castVote",
  GAME_MESSAGE: "message",
} as const;

export type EventName = typeof Events[keyof typeof Events];