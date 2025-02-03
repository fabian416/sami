import gameServiceEmitter, { createOrJoin } from "./gameService";
import { contract, useTicket } from "../config/contractConfig";
import { io } from "../server";
import { players } from "../server";  
const main = async () => {
    console.log(" Starting event listeners...");

    // Remove previous listeners 
    contract.removeAllListeners();

    // Listen when someoen purchase a ticket
    contract.on(contract.filters.TicketBought, async (owner, ticketId) => {
        console.log(`Handling ticket purchase for ${owner}, Ticket ID: ${ticketId}`);
        
        try {
            // Solo marcar el ticket como usado, sin crear partidas
            await useTicket(ticketId);
            console.log(` Ticket ${ticketId} used by ${owner}`);
            
        } catch (error) {
            console.error(`Error using the ticket for ${owner}:`, error);
        }
    });

    // Emit when a ticket is used
    contract.on(contract.filters.TicketUsed, (owner, ticketId) => {
        console.log(`🎯 Ticket ${ticketId} used by ${owner}`);
    });

    // Listen when a prize is sent
    contract.on(contract.filters.PrizeSent, async (winner, amount) => {
        console.log(`Prize sent to ${winner}: ${amount} MODE`);
        gameServiceEmitter.emit("prizeSent", { winner, amount });
    });

    console.log("Event listeners are now running.");
};

main().catch((error) => console.error(" Error initializing event listeners:", error));