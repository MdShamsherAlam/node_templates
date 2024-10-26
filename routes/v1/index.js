const express = require("express");
const app = express();

// const { stageTwo } = require("./stage-two");
const {auth}=require('./auth')

app.use("/auth", auth);

module.exports = app;
