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
        
        const QUERY = `
          INSERT INTO users (id, name, username, password_hash, created_at)
          VALUES (uuid(), ?, ?, ?, now());
        `;
        const VALUES = [name, username, hashedPassword];

        const result = await client.execute(QUERY, VALUES);
        console.log(result);

        return res.status(200).json("Account created successfully");

    } catch (err) {
        console.log(err);
        return res.status(500).json("Error while creating account");
    }
});

module.exports = router;
