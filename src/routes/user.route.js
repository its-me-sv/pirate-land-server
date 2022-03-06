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

module.exports = router;
