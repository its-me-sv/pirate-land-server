// packages
const router = require('express').Router();

// custom
const client = require("../utils/astra-database.util");

// get team score of game from scoreboard
router.post("/get_score", async (req, res) => {
    try {
        const {gameId} = req.body;
        
        const QUERY = `SELECT team1, team2 FROM SCOREBOARDS WHERE id = ?;`;
        const VALUES = [gameId];

        const {rowLength, rows} = await client.execute(QUERY, VALUES);

        if (!rowLength)
          return res.status(400).json("Game not found");
        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;
