// packages
const router = require("express").Router();
const bcrypt = require("bcrypt");

// custom
const client = require("../utils/astra-database.util");
const {isUserLoggedIn, generateAccessToken, generateRefreshToken, removeUser} = require("../utils/jwt.util");

// logging in the user
router.post("/login", async (req, res) => {
    try {
        const {username, password} = req.body;

        const QUERY1 = `SELECT id, password_hash, current_game FROM users WHERE username = ?`;
        const VALUES1 = [username];

        const result1 = await client.execute(QUERY1, VALUES1);
        if (result1.rowLength < 1)
          return res.status(400).json("Account not found");

        const user = result1.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid)
          return res.status(400).json("Invalid login credentials");
        if (await isUserLoggedIn(user.id))
          return res.status(400).json("Already logged in");

        const sessionToken = await generateAccessToken(user.id);
        return res.status(200).json({ 
            id: user.id, 
            token: sessionToken, 
            currentGame: user.current_game || ''
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// generating refresh token
router.post("/refresh", async (req, res) => {
    try {
        const token = await generateRefreshToken(req.userId);
        if (!token)
            return res.status(400).json("Cannot refresh token");
        return res.status(200).json({token});
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// logging out user
router.delete("/logout", async (req, res) => {
    const {userId} = req;
    try {
        const isLogged = await isUserLoggedIn(userId);
        if (!isLogged)
            return res.status(400).json("Not logged in");
        await removeUser(userId);
        return res.status(200).json("Logged out successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

module.exports = router;
