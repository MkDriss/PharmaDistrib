const express = require("express");
const bodyparser = require("body-parser");
const mustache = require("mustache-express");
const cookieSession = require("cookie-session");
const multer = require("multer");
const fs = require('fs');

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
    console.log("http://localhost:3000");
});