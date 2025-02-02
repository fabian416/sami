import gameServiceEmitter, { createNewGame, findAvailableGame, games, joinGame } from "./gameService";
import { contract, useTicket } from "../config/contractConfig";
import { io } from "../server"; // Assuming `server.ts` exports `io`

// Listen when someone purchases a ticket
contract.on("ticketBought", async ({ owner, ticketId }: any) => {
    console.log(`Handling ticket purchase for ${owner}, Ticket ID: ${ticketId}`);

    try {
        // Use the ticket before let the user go in a match
        await useTicket(ticketId);
        console.log(`Ticket ${ticketId} marcado como usado para ${owner}`);

        // Look for an available match
        let game = findAvailableGame(true); // Solo partidas de apuestas

        // If not create a new bet match
        if (!game) {
            const newRoomId = `room-${Object.keys(games).length + 1}`;
            game = createNewGame(newRoomId, true); // `true bet match
        }

        // Join the player
        joinGame(game.roomId, owner);
        console.log(` ${owner} unido a la partida ${game.roomId}`);

    } catch (error) {
        console.error(`Error al usar ticket para ${owner}:`, error);
    }
});

// Ticket used by
contract.on("TicketUsed", (owner: any, ticketId: any) => {
    console.log(`Ticket ${ticketId} usado por ${owner}`);
});

// Listen when a prize is sent
contract.on("PrizeSent", async (winner: any, amount: any) => {
    console.log(`Prize sent to ${winner}: ${amount} MODE`);
    gameServiceEmitter.emit("prizeSent", { winner, amount });
});