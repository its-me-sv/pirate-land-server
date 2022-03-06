// packages
const router = require("express").Router();

// checking whether server is running
router.get("/server", (req, res) => {
    return res.status(200).json("SERVER - Check SUCCESS");
});

module.exports = router;
