import gameServiceEmitter, { createOrJoin } from "./gameService";
import { contract } from "../config/contractConfig";
import { io } from "../server";
import { players } from "../server";
const main = async () => {
  console.log(" Starting event listeners...");

  // Remove previous listeners
  contract.removeAllListeners();

  // Listen when someone enters the game
  contract.on(contract.filters.GameEntered, async (player, timestamp) => {
    console.log(
      `Player ${player} entered the game and paid the entrance fee, Block timestamp: ${timestamp}`
    );
  });

  // Listen when a prize is sent
  contract.on(contract.filters.PrizeSent, async (winner, amount) => {
    console.log(`Prize sent to ${winner}: ${amount} MODE`);
    gameServiceEmitter.emit("prizeSent", { winner, amount });
  });

  // Listen when a en error happens sending prize
  contract.on(contract.filters.ErrorSendingPrize, async (user, amount) => {
    console.log(`Error sending prize to ${user}: ${amount} MODE`);
    gameServiceEmitter.emit("ErrorSendingPrize", { user, amount });
  });

  console.log("Event listeners are now running.");
};

main().catch((error) =>
  console.error(" Error initializing event listeners:", error)
);
