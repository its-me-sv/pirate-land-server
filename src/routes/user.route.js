// packages
const router = require('express').Router();
const bcrypt = require("bcrypt");

// custom
const client = require("../utils/astra-database.util");

// create new user
router.post("/create", async (req, res) => {
    const {name, username, password} = req.body;
    try {
        const salt = await bcrypt.genSalt(+process.env.SALT);
        const hashedPassword = await bcrypt.hash(password, salt);

        const QUERY1 = `SELECT id FROM users WHERE username = ?`;
        const VALUES1 = [username];

        const result1 = await client.execute(QUERY1, VALUES1);
        if (result1.rowLength > 0)
          return res.status(400).json("Username already in use");
        
        const QUERY2 = `
          INSERT INTO users (id, name, username, password_hash, created_at)
          VALUES (uuid(), ?, ?, ?, now());
        `;
        const VALUES2 = [name, username, hashedPassword];

        const result2 = await client.execute(QUERY2, VALUES2);

        return res.status(200).json("Account created successfully");

    } catch (err) {
        console.log(err);
        return res.status(500).json("Error while creating account");
    }
});

// get name of user
router.post("/name", async (req, res) => {
  const {userId} = req.body;

  const QUERY = `SELECT name FROM users WHERE id = ?;`;
  const VALUES = [userId];

  try {
    const {rowLength, rows} = await client.execute(QUERY, VALUES);
    if (!rowLength)
      return res.status(400).json("Account not found");
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// update user
router.put("/update", async (req, res) => {
  const {id, name, password} = req.body;
  try {
    const BQ = `SELECT username FROM users WHERE id = ?;`;
    const BV = [id];
    const username = (await client.execute(BQ, BV)).rows[0].username;
    if (name?.length > 0) {
      const QUERY = `UPDATE users SET name = ? WHERE username = ? AND id = ?;`;
      const VALUES = [name, username, id];
      await client.execute(QUERY, VALUES);
    }
    if (password?.length > 0) {
      const salt = await bcrypt.genSalt(+process.env.SALT);
      const hashedPassword = await bcrypt.hash(password, salt);
      const QUERY = `UPDATE users SET password_hash = ? WHERE username = ? AND id = ?;`;
      const VALUES = [hashedPassword, username, id];
      await client.execute(QUERY, VALUES);
    }
    return res.status(200).json("Account updated successfully");
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// games played by user
router.post("/games", async (req, res) => {
  const {id} = req.body;
  const QUERY = `SELECT games FROM users WHERE id = ?;`;
  const VALUES = [id];
  try {
    const {rows} = await client.execute(QUERY, VALUES);
    return res.status(200).json(rows[0]);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// check is game played by user
router.post("/check_game", async (req, res) => {
  const {gameId} = req.body;
  const QUERY = `SELECT games FROM users WHERE id = ?;`;
  const VALUES = [req.userId];
  try {
    const {rows} = await client.execute(QUERY, VALUES);
    const {games} = JSON.parse(JSON.stringify(rows[0]));
    return res.status(200).json({canShow: games.includes(gameId)});
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// current game of user
router.post("/current_game", async (req, res) => {
  try {
    const QUERY = `SELECT current_game FROM users WHERE id = ?;`;
    const VALUES = [req.userId];
    const {rows} = await client.execute(QUERY, VALUES);
    return res.status(200).json(rows[0]);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// set current game of user
router.put("/set_current_game", async (req, res) => {
  const id = req.userId;
  const {gameId} = req.body;
  try {
    const BQ = `SELECT username FROM users WHERE id = ?;`;
    const BV = [id];
    const username = (await client.execute(BQ, BV)).rows[0].username;
    const QUERY = `UPDATE users SET current_game = ? WHERE username = ? AND id = ?;`;
    const VALUES = [gameId, username, id];
    await client.execute(QUERY, VALUES);
    return res.status(200).json("Updated current game successfully");
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
