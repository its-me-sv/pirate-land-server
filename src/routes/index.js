// custom
const validationRoute = require('./validation.route');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const scoreboard = require('./scoreboard.route');

// combining all custom routes
const combineRoutes = app => {
    app.use("/api/validation", validationRoute);
    app.use("/api/auth", authRoute);
    app.use("/api/users", userRoute);
    app.use("/api/scoreboard", scoreboard);
};

module.exports = combineRoutes;
