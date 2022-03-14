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

router.put(`/make_move`, async (req, res) => {
    try {
        const {currTeamId, idx, oppTeamId, gameId, currTeam, mTyp} = req.body;
        // fetching team board and converting it
        let QUERY = `SELECT board FROM boards WHERE id = ?;`;
        let VALUE = [currTeamId];
        let myTeamBoard = (await client.execute(QUERY, VALUE)).rows[0].board;
        myTeamBoard = myTeamBoard.split(',').map(v => Number(v));
        // fetching opp board and converting it
        VALUE = [oppTeamId];
        let oppTeamBoard = (await client.execute(QUERY, VALUE)).rows[0].board;
        oppTeamBoard = oppTeamBoard.split(',').map(v => Number(v));
        // opponent missed
        if (!(oppTeamBoard[idx] != 0)) return res.status(200).json("miss");
        // opponent hit
        // find opp typ
        let oppTyp = oppTeamBoard[idx];
        // update both boards
        myTeamBoard[idx] = -oppTyp;
        oppTeamBoard[idx] = -oppTyp;
        // convert both boards
        myTeamBoard = myTeamBoard.join();
        oppTeamBoard = oppTeamBoard.join();
        // update the teams boards
        // updating my team board
        QUERY = `UPDATE boards SET board = ? WHERE id = ?;`;
        VALUE = [myTeamBoard, currTeamId];
        await client.execute(QUERY, VALUE);
        // updating opp team board
        VALUE = [oppTeamBoard, oppTeamId];
        await client.execute(QUERY, VALUE);
        // updating the scores
        // get scores
        QUERY = `SELECT team1, team2 FROM scoreboards WHERE id = ?;`;
        VALUE = [gameId];
        let scores = (await client.execute(QUERY, VALUE)).rows[0];
        scores = JSON.parse(JSON.stringify(scores));
        // set team score and opp scores
        let teamScore = [];
        let oppTeamScore = [];
        if (currTeam == 'Team 1') {
            teamScore = scores.team1;
            oppTeamScore = scores.team2;
        } else {
            teamScore = scores.team2;
            oppTeamScore = scores.team1;
        }
        // finding my score and opp
        // score using mtyp and oppTyp
        const myScore = teamScore[mTyp-1];
        myScore.captures += 1;
        const oppScore = oppTeamScore[oppTyp-1];
        oppScore.caught += 1;
        // updating mine and opponents scores
        teamScore[mTyp-1] = myScore;
        oppTeamScore[oppTyp-1] = oppScore;
        // updating the scores
        let team1Score = [];
        let team2Score = [];
        if (currTeam == 'Team 1') {
            team1Score = teamScore;
            team2Score = oppTeamScore;
        } else {
            team1Score = oppTeamScore;
            team2Score = teamScore;
        }
        QUERY = `UPDATE scoreboards SET team1 = ?, team2 = ? WHERE id = ?;`;
        VALUE = [team1Score, team2Score, gameId];
        await client.execute(QUERY, VALUE, {prepare: true});
        return res.status(200).json("hit");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

module.exports = router;