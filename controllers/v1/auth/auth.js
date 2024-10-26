const { Auth } = require("../../../service/v1");

const login = async (req, res, next) => {
    try {
        const user = await new Auth().login(req.body,req);
        return user;
    } catch (error) {
        next(error)
    }
}


const sendLoginOtp = async (req, res, next) => {
    try {
        const seats = await new Auth().sendLoginOtp(req.body);
        return seats;
    } catch (error) {
        next(error)
    }
}

const verifyLoginOtp = async (req, res, next) => {
    try {
        const seats = await new Auth().verifyLoginOtp(req.body,req);
        return seats;
    } catch (error) {
        next(error)
    }
}
const resetPassword = async (req, res, next) => {
    try {
        const seats = await new Auth().resetPassword(req.body,req);
        return seats;
    } catch (error) {
        next(error)
    }
}
const mapNumber = async (req, res, next) => {
    try {
        const seats = await new Auth().mapNumber(req.body,req.user);
        return seats;
    } catch (error) {
        next(error)
    }
}

module.exports = {
    login,
    sendLoginOtp,
    verifyLoginOtp,
    resetPassword,
    mapNumber
}