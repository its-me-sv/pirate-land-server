// packages
require("dotenv").config();

// custom
const {app, io, httpServer} = require('./src/utils/server.util');
const combineRoutes = require('./src/routes');
const combineMiddlewares = require('./src/utils/middleware.util');
const socketHandler = require('./src/utils/socket.util');

// middlewares
combineMiddlewares(app);

// routes
combineRoutes(app);

// socket
socketHandler(io);

// port declaration & server spin up
const PORT = process.env.port || process.env.PORT || process.env.Port || 5000;
const server = httpServer.listen(PORT, async () => {
    console.clear();
    console.log(`[SERVER] Listening to PORT ${PORT}`);
});

// purposely crashing
process.on("uncaughtException", async err => {
    server.close();
    console.log(`[SERVER] App crashed due to ${err.message}`);
    process.exit(1);
});