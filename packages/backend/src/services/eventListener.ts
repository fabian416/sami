import { ethers } from "ethers";
import gameServiceEmitter from "./gameService";
//import { sendPrize } from "./";
import { provider, contract } from "../config/contractConfig";

// Listen when someone purchase a ticket
contract.on("TicketBought", async (owner, ticketId) => {
    console.log(`🎟️ Ticket comprado: ${ticketId} por ${owner}`);
    gameServiceEmitter.emit("ticketBought", { owner, ticketId });
});

// Ticket used by
contract.on("TicketUsed", (owner, ticketId) => {
    console.log(`🎯 Ticket ${ticketId} usado por ${owner}`);
});

// Escuchar cuando un premio es enviado
contract.on("PrizeSent", async (winner, amount) => {
    console.log(`Prize sent to ${winner}: ${amount} MODE`);
    gameServiceEmitter.emit("prizeSent", { winner, amount });
});