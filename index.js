// packages
require("dotenv").config();
const express = require("express");

// express instance
const app = express();

// custom
const combineRoutes = require('./src/routes');
const combineMiddlewares = require('./src/utils/middleware.util');

// middlewares
combineMiddlewares(app, express.json());

// routes
combineRoutes(app);

// port declaration & server spin up
const PORT = process.env.port || process.env.PORT || process.env.Port || 5000;
const server = app.listen(PORT, async () => {
    console.clear();
    console.log(`[SERVER] Listening to PORT ${PORT}`);
});

// purposely crashing
process.on("uncaughtException", async err => {
    server.close();
    console.log(`[SERVER] App crashed due to ${err.message}`);
    process.exit(1);
});