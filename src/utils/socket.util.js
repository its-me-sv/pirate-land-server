// custom
const client = require("./astra-database.util");
const {removeUser} = require("./jwt.util");

// add to sockets table
const registerSocket = async (userId, socketId) => {
    const QUERY = `INSERT INTO sockets(id, socket_id) VALUES (?, ?);`;
    const VALUES = [userId, socketId];
    try {
        await client.execute(QUERY, VALUES);
    } catch (err) {
        console.log(err);
    }
};

// remove from sockets table
const unRegisterSocket = async (socketId) => {
    const QUERY = `SELECT id FROM sockets WHERE socket_id = ?;`;
    const VALUES = [socketId];
    try {
        const {rowLength, rows} = await client.execute(QUERY, VALUES);
        if (!rowLength) return;
        const {id} = rows[0];
        const QUERY1 = `DELETE FROM sockets WHERE id = ?;`;
        const VALUES1 = [id];
        await client.execute(QUERY1, VALUES1);
        await removeUser(id);
    } catch (err) {
        console.log(err);
    }
};

// destroy game when hostleft
const destroyGame = async (gameId) => {
    let QUERY = `SELECT team1, team2 FROM games WHERE id = ?;`;
    let VALUE = [gameId];
    try {
        const game = (await client.execute(QUERY, VALUE)).rows[0];
        QUERY = `DELETE FROM teams WHERE id = ?;`;
        VALUE = [game.team1];
        await client.execute(QUERY, VALUE);
        QUERY = `DELETE FROM teams WHERE id = ?;`;
        VALUE = [game.team2];
        await client.execute(QUERY, VALUE);
        QUERY = `DELETE FROM games WHERE id = ?;`;
        VALUE = [gameId];
        await client.execute(QUERY, VALUE);
    } catch (err) {
        console.log(err);
    }
}

// handling sockets
const socketHandler = io => {
    // user logs in
    io.on("connection", socket => {
        console.log(`[SERVER] ${socket.id} Connected`);
        const {userId} = socket.handshake.query;
        registerSocket(userId, socket.id);
        // user leaves tab or logs out
        socket.on("disconnect", () => {
            console.log(`[SERVER] ${socket.id} Disconnected`);
            unRegisterSocket(socket.id);
        });
        // user joins room
        socket.on("joinRoom", roomId => {
            socket.join(roomId);
            console.log(`[SERVER] ${socket.id} joined ${roomId}`);
        });
        // user leaves room
        socket.on("leaveRoom", roomId => {
            socket.leave(roomId);
            console.log(`[SERVER] ${socket.id} left ${roomId}`);
        });
        // user updates room
        socket.on("updateRoom", roomId => {
            socket.broadcast.to(roomId).emit("updateRoom");
            console.log(`[SERVER] ${socket.id} updates ${roomId}`);
        });
        // host user leaves game
        socket.on("hostLeft", roomId => {
            socket.broadcast.to(roomId).emit("hostLeft");
            console.log(`[SERVER] Host left ${roomId}`);
            destroyGame(roomId.replace('LOBBY:', ''));
        });
        // host launched game
        socket.on("gameLaunched", roomId => {
            socket.broadcast.to(roomId).emit("gameLaunched");
            console.log(`[SERVER] ${socket.id} launched in ${roomId}`);
        });
        // user updates board
        socket.on("updateBoard", roomId => {
            socket.broadcast.to(roomId).emit("updateBoard", roomId);
            console.log(`[SERVER] ${socket.id} updates ${roomId}`);
        });
        // user updates chance to all
        socket.on("updateChance", roomId => {
            socket.broadcast.to(roomId).emit("updateChance");
            console.log(`[SERVER] ${socket.id} updates ${roomId}`);
        });
    });
};

module.exports = socketHandler;
