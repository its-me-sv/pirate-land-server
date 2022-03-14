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
        return res.status(200).json({gameId});
    } catch (err) {
        return res.status(400).json(err);
    }
});

// check to join room
router.post(`/check_join`, async (req, res) => {
    try {
        const {gameId} = req.body;
        let QUERY = `SELECT is_ended, launched, team1, team2 FROM games WHERE id = ?;`;
        let VALUE = [gameId];
        const {rowLength, rows} = await client.execute(QUERY, VALUE);
        if (!rowLength || !rows) return res.status(400).json("Island doesn't exist");
        const {is_ended, launched} = rows[0];
        if (is_ended) return res.status(400).json("Island has been closed");
        if (launched) return res.status(400).json("Island has already been occupied");
        const {team1, team2} = rows[0];
        QUERY = `SELECT players FROM teams WHERE id = ?;`;
        VALUE = [team1];
        const t1Players = (await client.execute(QUERY, VALUE)).rows[0].players;
        QUERY = `SELECT players FROM teams WHERE id = ?;`;
        VALUE = [team2];
        const t2Players = (await client.execute(QUERY, VALUE)).rows[0].players;
        if (t1Players?.length + t2Players?.length == 8)
          return res.status(400).json("Island full of players, try after some time");
        return res.status(200).json({gameId});
    } catch (err) {
        return res.status(500).json(err);
    }
});

// game details for lobby
router.post(`/for_lobby`, async (req, res) => {
    try {
        const {gameId} = req.body;
        
        let QUERY = `SELECT id, creator, launched, team1, team2 FROM games WHERE id = ?;`;
        let VALUE = [gameId];
        const game = (await client.execute(QUERY, VALUE)).rows[0];

        QUERY = `SELECT players FROM teams WHERE id = ?;`;
        VALUE = [game.team1];
        const team1 = (await client.execute(QUERY, VALUE)).rows[0].players || [];
        
        QUERY = `SELECT players FROM teams WHERE id = ?;`;
        VALUE = [game.team2];
        const team2 = (await client.execute(QUERY, VALUE)).rows[0].players || [];

        return res.status(200).json({...game, team1, team2});
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// join a team
router.put(`/join_team`, async (req, res) => {
    try {
        const {gameId, teamNo} = req.body;
        const {userId} = req;

        let QUERY = `SELECT team1, team2 FROM games WHERE id = ?;`;
        let VALUE = [gameId];
        const game = (await client.execute(QUERY, VALUE)).rows[0];

        const teamId = teamNo == "Team 1" ? game.team1 : game.team2;
        QUERY = `UPDATE teams SET players = players + ? WHERE id = ?;`;
        VALUE = [[userId], teamId];
        await client.execute(QUERY, VALUE);

        return res.status(200).json("Joined room successfully");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// leave a team
router.put(`/leave_team`, async (req, res) => {
    try {
        const {gameId, teamNo} = req.body;
        const {userId} = req;

        let QUERY = `SELECT team1, team2 FROM games WHERE id = ?;`;
        let VALUE = [gameId];
        const game = (await client.execute(QUERY, VALUE)).rows[0];

        const teamId = teamNo == "Team 1" ? game.team1 : game.team2;
        QUERY = `SELECT players FROM teams WHERE id = ?;`;
        VALUE = [teamId];
        const allPlayers = (await client.execute(QUERY, VALUE)).rows[0].players || [];
        QUERY = `UPDATE teams SET players = ? WHERE id = ?;`;
        VALUE = [allPlayers.filter(v => v != userId), teamId];
        await client.execute(QUERY, VALUE);

        return res.status(200).json("Exited room successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// launch game
router.put(`/launch_game`, async (req, res) => {
    try {
        const {gameId, allPlayers} = req.body;
        // get id of teams being played
        let QUERY = `SELECT team1, team2 FROM games WHERE id = ?`;
        let VALUE = [gameId];
        const {team1: t1id, team2: t2id} = (await client.execute(QUERY, VALUE)).rows[0];
        // get players of team1 and team2, map score
        QUERY = `SELECT players FROM teams WHERE id = ?`;
        VALUE = [t1id];
        const {players: t1p} = (await client.execute(QUERY, VALUE)).rows[0];
        const t1s = t1p.map(val => ({pid: val, captures: 0, caught: 0}));
        QUERY = `SELECT players FROM teams WHERE id = ?`;
        VALUE = [t2id];
        const {players: t2p} = (await client.execute(QUERY, VALUE)).rows[0];
        const t2s = t2p.map(val => ({pid: val, captures: 0, caught: 0}));
        // create the scoreboard
        QUERY = `INSERT INTO scoreboards (id, created_at, team1, team2) VALUES (?, now(), ?, ?);`;
        VALUE = [gameId, t1s, t2s];
        await client.execute(QUERY, VALUE, {prepare: true});
        // create the boards
        const newBoard = new Array(135).fill(0).join();
        QUERY = `INSERT INTO boards (id, board) VALUES (?, ?);`;
        VALUE = [t1id, newBoard];
        await client.execute(QUERY, VALUE);
        VALUE = [t2id, newBoard];
        await client.execute(QUERY, VALUE);
        VALUE = [gameId, newBoard];
        await client.execute(QUERY, VALUE);
        // update the game
        QUERY = `UPDATE games SET initial = true, launched = true, chance_off = 0, players = ? WHERE id = ?`;
        VALUE = [allPlayers, gameId];
        await client.execute(QUERY, VALUE);
        return res.status(200).json("Launched game successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// initial fetch for game
router.post(`/init_fetch`, async (req, res) => {
    try {
        const {gameId, team} = req.body;
        let QUERY = `SELECT chance_off, players, team1, team2, initial FROM games WHERE id = ?;`;
        let VALUE = [gameId];
        const game = (await client.execute(QUERY, VALUE)).rows[0];

        const responseBody = {};
        responseBody["currPlayer"] = game.chance_off;
        responseBody["players"] = game.players;
        responseBody["initial"] = game.initial;
        if (team === 'Team 1') {
            responseBody["currTeamId"] = game.team1;
            responseBody["oppTeamId"] = game.team2;
        } else {
            responseBody["currTeamId"] = game.team2;
            responseBody["oppTeamId"] = game.team1;
        }
        
        return res.status(200).json(responseBody);
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// update chance_off
router.put(`/update_chance`, async (req, res) => {
    try {
        const {gameId} = req.body;

        // retrieve chance_off, initial and players
        let QUERY = `SELECT chance_off, initial, players FROM games WHERE id = ?;`;
        let VALUE = [gameId];
        let {chance_off, initial, players} = (await client.execute(QUERY, VALUE)).rows[0];
        
        // incrementing and reseting values
        chance_off += 1;
        if (chance_off >= players.length) {
            chance_off = 0;
            if (initial === true) initial = false;
        }

        // console.log({chance_off, initial, gameId});
        // console.log({
        //     chance_off: typeof (chance_off), 
        //     initial: typeof (initial), 
        //     gameId: typeof (gameId)
        // });

        // update game
        QUERY = `UPDATE games SET chance_off = ?, initial = ? WHERE id = ?;`;
        VALUE = [chance_off, initial, gameId];
        await client.execute(QUERY, VALUE, {prepare: true});

        return res.status(200).json("game updated");

    } catch (err) {
        // console.log(err);
        return res.status(500).json(err);
    }
});

// get chance_off and initial
router.post(`/get_chance`, async (req, res) => {
    try {
        const {gameId} = req.body;
        const QUERY = `SELECT chance_off, initial FROM games WHERE id = ?;`;
        const VALUE = [gameId];
        const {rows} = await client.execute(QUERY, VALUE);
        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// finish game
router.put(`/finish_game`, async (req, res) => {
    try {
        const {gameId} = req.body;
        const QUERY = `UPDATE games SET initial = false, is_ended = false, launched = false WHERE id = ?;`;
        const VALUE = [gameId];
        await client.execute(QUERY, VALUE);
        return res.status(200).json("Updated game successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

module.exports = router;
