// custom
const validationRoute = require('./validation.route');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const scoreboard = require('./scoreboard.route');
const games = require('./games.route');
const boards = require('./boards.route');
const teams = require('./teams.route');

// combining all custom routes
const combineRoutes = app => {
    app.use("/api/validation", validationRoute);
    app.use("/api/auth", authRoute);
    app.use("/api/users", userRoute);
    app.use("/api/scoreboard", scoreboard);
    app.use("/api/games", games);
    app.use("/api/boards", boards);
    app.use("/api/teams", teams);
};

module.exports = combineRoutes;
