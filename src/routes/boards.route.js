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

module.exports = router;