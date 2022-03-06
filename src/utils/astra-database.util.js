// packages
const {Client} = require("cassandra-driver");

// custom
const clientConfig = require("../configs/db.config");

const client = new Client(clientConfig);

client.connect();

module.exports = client;