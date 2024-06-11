const express = require("express");
const bodyparser = require("body-parser");
const mustache = require("mustache-express");
const cookieSession = require("cookie-session");
const multer = require("multer");
const fs = require('fs');

const app = express();

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(express.static("views"));

app.engine("html", mustache());

app.get("/", (req, res) => {
    res.render("home.html");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
    console.log("http://localhost:3000");
});