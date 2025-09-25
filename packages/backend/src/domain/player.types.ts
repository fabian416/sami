export type Player = {
  id: string;
  socketId?: string;
  walletAddress?: string;
  index?: number;
  isAI: boolean;
  left: boolean;
  winner: boolean;
};