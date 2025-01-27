import { AgentRuntime } from "../../eliza-starter/dist/src";
import { createAgent } from "../../eliza-starter/dist/src";
import { initializeDatabase } from "../../eliza-starter/dist/src/database/index";
import { initializeDbCache } from "../../eliza-starter/dist/src/cache/index";
import { character } from "../../eliza-starter/dist/src/character";

const agentMap = new Map<string, AgentRuntime>();

export async function createAgentForRoom(roomId: string): Promise<AgentRuntime> {
  const db = initializeDatabase("./data");
  await db.init();

  const cache = initializeDbCache(character, db);
  const token = process.env.OPENAI_API_KEY || "your-token-here";

  const agent = createAgent(character, db, cache, token);
  await agent.initialize();

  agentMap.set(roomId, agent);
  return agent;
}

export function getAgentForRoom(roomId: string): AgentRuntime | undefined {
  return agentMap.get(roomId);
}