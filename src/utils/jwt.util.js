// packages
const jwt = require("jsonwebtoken");

// endpoints that need not require token
const whitelist = [
    "/api/validation/server",
    "/api/validation/db",
    "/api/auth/login",
    "/api/users/create",
];

const isUserLoggedIn = async param => {
    return "check whether user has already been logged in";
};

const loginUser = async params => {
    return "login the user";
};

const removeUser = async param => {
    return "remove user from login";
};

const generateAccessToken = async param => {
    if (await isUserLoggedIn(user.id)) return null;

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    await loginUser(user.id, token);
    return token;
};

const generateRefreshToken = async param => {
    if (!(await isUserLoggedIn(user.id))) return null;
    await removeUser(user.id);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    await loginUser(user.id, token);
    return token;
};

const verifyUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (whitelist.includes(req.path))
        return next();
    
    if (!authHeader)
        return res.status(400).json("You are NOT Authenticated");
    
    const token = authHeader.split(" ")[1];
    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        // check with tokens table
        return next();
    } catch (err) {
        return res.status(400).json("You are NOT Authorized");
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyUser,
    isUserLoggedIn,
    removeUser
};