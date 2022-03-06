// packages
const morgan = require("morgan");
const cors = require("cors");

// custom
const morganConfig = require("../configs/morgan.config");
const {verifyUser} = require("./jwt.util");

// combinig all custom middlewares
const combineMiddlewares = (app, expressJSON) => {
    app.use(cors());
    app.use(verifyUser);
    app.use(morgan(morganConfig));
    app.use(expressJSON);
};

module.exports = combineMiddlewares;
