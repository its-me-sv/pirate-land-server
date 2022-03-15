// packages
const router = require("express").Router();

// custom
const client = require("../utils/astra-database.util");

// get messages by chat id
router.post(`/by_chat_id`, async (req, res) => {
    try {
        const {chatId, page} = req.body;
        const QUERY = `SELECT toTimestamp(id) as id, message, sender_id FROM messages WHERE chat_id = ?;`;
        const VALUE = [chatId];
        const queryOptions = {
            prepare: true,
            fetchSize: 3
        };
        if (page?.length > 0) queryOptions.pageState = page;
        const {rows, pageState} = await client.execute(QUERY, VALUE, {...queryOptions});
        return res.status(200).json({messages: rows, pageState});
    } catch (err) {
        return res.status(500).json(err);
    }
});

// add new message
router.post(`/new`, async (req, res) => {
    try {

    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;