// packages
const router = require("express").Router();

// custom
const client = require("../utils/astra-database.util");

router.post(`/get_board`, async (req, res) => {
    try {
        const {boardId} = req.body;
        const QUERY = `SELECT board FROM boards WHERE id = ?;`;
        const VALUE = [boardId];

        const {rowLength, rows} = await client.execute(QUERY, VALUE);
        if (!rowLength) return res.status(400).json("Game not found");
        const {board} = rows[0];
        return res.status(200).json({grid: board.split(',').map(v => Number(v))});
    } catch (err) {
        return res.status(500).json(err);
    }
});

router.put(`/update_board`, async (req, res) => {
    try {
        const {currTeamId, typ, idx, oppTeamId, initial} = req.body;
        // fetching team board
        let QUERY = `SELECT board FROM boards WHERE id = ?;`;
        let VALUE = [currTeamId];
        let teamBoard = (await client.execute(QUERY, VALUE)).rows[0].board;
        // set team board
        teamBoard = teamBoard.split(',').map(v => Number(v));
        teamBoard[idx] = typ;
        teamBoard = teamBoard.join();
        // update team board
        QUERY = `UPDATE boards SET board = ? WHERE id = ?;`;
        VALUE = [teamBoard, currTeamId];
        await client.execute(QUERY, VALUE);
        // check initiality
        if (initial) return res.status(200).json("Board updated successfully");
        // fetch opp team board
        console.log("game time now");
        return res.status(200).json("Board updated successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

module.exports = router;