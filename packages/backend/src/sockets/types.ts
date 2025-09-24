
import { z } from "zod";

export const RegisterWalletSchema = z.object({
  walletAddress: z.string().min(1),
});
export type RegisterWallet = z.infer<typeof RegisterWalletSchema>;

export const CreateOrJoinSchema = z.object({
  playerId: z.string().min(1),
  isBetGame: z.boolean().optional().default(false),
});
export type CreateOrJoin = z.infer<typeof CreateOrJoinSchema>;

export const CastVoteSchema = z.object({
  roomId: z.string().min(1),
  voterId: z.string().min(1),
  targetId: z.string().min(1),
});
export type CastVote = z.infer<typeof CastVoteSchema>;