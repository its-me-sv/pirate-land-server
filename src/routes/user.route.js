// packages
const router = require('express').Router();
const bcrypt = require("bcrypt");

// create new user
router.post("/create", async (req, res) => {
    return res.status(200).json("Create user with this route");
});

module.exports = router;
