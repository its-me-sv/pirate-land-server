// packages
const router = require("express").Router();

// custom
const client = require("../utils/astra-database.util");

router.post(`/get_players`, async (req, res) => {
    try {
        const {teamId} = req.body;
        const QUERY = `SELECT players FROM teams WHERE id = ?;`;
        const VALUE = [teamId];

        const {rowLength, rows} = await client.execute(QUERY, VALUE);
        if (!rowLength) return res.status(400).json("Game not found");
        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;