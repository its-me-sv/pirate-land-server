// custom
const validationRoute = require('./validation.route');
const usersRoute = require('./user.route');

// combining all custom routes
const combineRoutes = app => {
    app.use("/api/validation", validationRoute);
    app.use("/api/users", usersRoute);
};

module.exports = combineRoutes;
