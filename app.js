const express = require("express");
const bodyparser = require("body-parser");
const mustache = require("mustache-express");
const crypto = require('crypto');
const cookieSession = require("cookie-session");
const multer = require("multer");
const fs = require('fs');

const app = express();

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static('public/medic_pictures/'));
app.use(express.static('public/icons/'));
app.use(express.static('public/css/'));
app.use(express.static('public/pictures/'));
app.use(express.static('js'));

app.engine("html", mustache());
app.set('view engine', 'html');
app.set('views', './views');

var account = require('./js/accounts');
var orders = require('./js/orders');
var medics = require('./js/medics');

// GET

app.get("/", (req, res) => {
    res.render("home.html");
});

app.get("/home", (req, res) => {
    res.redirect("/");
})

app.get("/signin", (req, res) => {
    res.render("signin.html")
});

app.get("/signout", (req, res) => {

});

app.get("/signup", (req, res) => {
    res.render("signup.html")
});

app.get("/account", (req, res) => {
    res.render("account.html")
});

app.get("/orders", (req, res) => {
    res.render("orders.html");
});

// POST

app.post("/signin", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    console.log(email, password)
});

app.post("/signout", (req, res) => {

});

app.post("/signup", (req, res) => {
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let confirmPassword = req.body.confimPassword;
    let id = crypto.randomBytes(32).toString("hex");
    
    if (email == undefined || username == undefined || password == undefined) {
        console.log("Invalid username or password")
        return res.render('signup', { msg: "Invalid email, username or password", css: '/signup.css' });
    }
    else if (confirmPassword != password) {
        console.log("Password aren't matching")
        return res.render('signup', { msg: "Wrong password", css: '/register.css' })
    }
    else if (account.read(id) == undefined && account.checkEmail(email) == 'false') {
        account.create(id, email, username, password);
        return res.redirect('/signin');
    }
    else if (account.read(email) != undefined) {
        console.log("An account already exists with this email")
        return res.render('singup', { msg: "An account already exists with this email", css: '/signup.css' });
    }
});
// LISTEN

app.listen(3000, () => {
    console.log("Server is running on port 3000");
    console.log("Click on http://localhost:3000");
});