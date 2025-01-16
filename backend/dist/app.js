"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gameRoutes_1 = __importDefault(require("./routes/gameRoutes"));
const app = (0, express_1.default)();
// Middleware to manage JSON
app.use(express_1.default.json());
// Main routes
app.use('/api/games', gameRoutes_1.default);
exports.default = app;
