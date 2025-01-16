"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gameController_1 = require("../controllers/gameController");
const router = (0, express_1.Router)();
// Create a new match
router.post('/create', gameController_1.createGame);
// Get info of a specific match
router.get('/:id', gameController_1.getGame);
exports.default = router;
