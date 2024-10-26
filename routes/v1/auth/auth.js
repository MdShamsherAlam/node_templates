const express = require("express");
const router = express.Router();
const { dispatcher } = require("../../../middleware");
const { login,sendLoginOtp,verifyLoginOtp,resetPassword,mapNumber } = require("../../../controllers/v1");

router.post("/login", (req, res, next) => dispatcher(req, res, next, login));

router.post("/login-otp", (req, res, next) => dispatcher(req, res, next, sendLoginOtp));
router.post("/verify-login-otp", (req, res, next) => dispatcher(req, res, next, verifyLoginOtp));
router.post("/reset-password", (req, res, next) => dispatcher(req, res, next, resetPassword));
router.post("/map-number", (req, res, next) => dispatcher(req, res, next, mapNumber));

module.exports = router;