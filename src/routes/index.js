// custom
const validationRoute = require('./validation.route');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');

// combining all custom routes
const combineRoutes = app => {
    app.use("/api/validation", validationRoute);
    app.use("/api/auth/login", authRoute);
    app.use("/api/users", userRoute);
};

module.exports = combineRoutes;
