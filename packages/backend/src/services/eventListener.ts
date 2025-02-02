import { ethers } from "ethers";
import gameServiceEmitter, { createNewGame, findAvailableGame, games, joinGame } from "./gameService";
import { contract } from "../config/contractConfig";
import { io } from "../server"; // Assuming `server.ts` exports `io`
import { createOrJoin } from "./gameService";

// Listen when someone purchases a ticket
gameServiceEmitter.on("ticketBought", async ({ owner, ticketId }) => {
    console.log(`📢 Handling ticket purchase for ${owner}, Ticket ID: ${ticketId}`);

    // 🔹 Buscar una partida de apuestas disponible
    let game = findAvailableGame(true); // Solo partidas de apuestas

    // 🔹 Si no hay, crear una nueva partida de apuestas
    if (!game) {
        const newRoomId = `room-${Object.keys(games).length + 1}`;
        game = createNewGame(newRoomId, true); // `true` significa partida de apuestas
    }

    // 🔹 Marcar el ticket como usado ANTES de unir al jugador
    await contract.useTicket(ticketId);

    // 🔹 Unir al jugador a la partida de apuestas
    joinGame(game.roomId, owner);
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