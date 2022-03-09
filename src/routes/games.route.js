// packages
const router = require("express").Router();
const uuid = require("cassandra-driver").types.Uuid;
const timeuuid = require("cassandra-driver").types.TimeUuid;

// custom
const client = require("../utils/astra-database.util");

// create room
router.post(`/create`, async (req, res) => {
    try {
        // creating team1
        const team1Id = uuid.random();
        let QUERY = `INSERT INTO teams (id, created_at) VALUES (?, now());`;
        let VALUE = [team1Id];
        await client.execute(QUERY, VALUE);
        // creating team2
        const team2Id = uuid.random();
        QUERY = `INSERT INTO teams (id, created_at) VALUES (?, now());`;
        VALUE = [team2Id];
        await client.execute(QUERY, VALUE);
        // creating game
        const creatorId = req.userId;
        const gameId = timeuuid.now();
        QUERY = `
          INSERT INTO games (id, creator, is_ended, launched, team1, team2) 
          VALUES (?, ?, false, false, ?, ?);
        `;
        VALUE = [gameId, creatorId, team1Id, team2Id];
        await client.execute(QUERY, VALUE);
        return res.status(200).json({gameId, creatorId, team1Id, team2Id});
    } catch (err) {
        return res.status(400).json(err);
    }
});

module.exports = router;
