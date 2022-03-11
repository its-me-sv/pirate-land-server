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
    });
};

module.exports = socketHandler;
