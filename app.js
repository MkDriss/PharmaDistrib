const express = require("express");
const bodyparser = require("body-parser");
const mustache = require("mustache-express");
const crypto = require('crypto');
const cookieSession = require("cookie-session");
const multer = require("multer");
const uploadProfilePicture = multer({ dest: 'public/profiles_pictures/' });
const fs = require('fs');

const app = express();


app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static('public/medic_pictures/'));
app.use(express.static('public/icons/'));
app.use(express.static('public/css/'));
app.use(express.static('public/pictures/'));
app.use(express.static('public/profiles_pictures'));
app.use(express.static('js'));

app.engine("html", mustache());
app.set('view engine', 'html');
app.set('views', './views');

var accounts = require('./js/accounts');
var orders = require('./js/orders');
var medics = require('./js/medics');

app.use(cookieSession({ secret: 'j7G!wA4t&L,_T9kq5}M(NBF' }));
app.use(middleware);

// MIDDLEWARE

function middleware(req, res, next) {
    if (req.session.username) {
        res.locals.authenticated = true;
        res.locals.name = req.session.username;
    } else
        res.locals.authenticated = false;
    next();
}

// FUNCTIONS

function sanitize(str) {
    let alphabet = "abcdefghijklmnopqrstuvwxyz0123456789@_-";
    let newStr = "";
    for (let i = 0; i < str.length; i++) {
        if (alphabet.includes(str[i].toLowerCase())) {
            newStr += str[i];
        }
    }
    return newStr;
};

// GET

app.get("/", (req, res) => {
    res.render("home.html", { css: '/home.css' });
});

app.get("/home", (req, res) => {
    res.redirect("/");
})

app.get("/signin", (req, res) => {
    res.render("signin.html", {css : "/signin.css"});
});


app.get("/signup", (req, res) => {
    res.render("signup.html");
});

app.get("/account", (req, res) => {
    let id = req.session.id;
    let account = accounts.get(id)
    res.render("account.html", { css: "/account.css", account: account });
});

app.get("/orders", (req, res) => {
    res.render("orders.html", { css: "/orders.css" });
});

app.get('/newOrder', (req, res) => {
    res.render("newOrder.html", { css: "/newOrder.css" });
});

app.get('/editAccount', (req, res) => {
    let account = accounts.get(req.session.id);
    res.render("editAccount.html", { css: "/editAccount.css", account: account });
})

// POST

app.post("/signin", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    if (email == undefined || password == undefined) {
        console.log("email or password is undefined")
        return res.render('signin.html', { errorMessage: "Invalid email or password", css: '/signIn.css' });
    }
    else if (accounts.authenticate(email, password)) {
        req.session.id = (accounts.getIdFromEmail(email)).id;
        req.session.email = email;
        req.session.username = accounts.get(req.session.id).userName;
        req.session.authenticated = true;
        if (accounts.get(req.session.id).admin === 1) {
            req.session.admin = true;
        } else { req.session.admin = false; }

        console.log(req.session.username + ' connected');

        return res.redirect('/home');
    }
    else if (!accounts.authenticate(email, password)) {
        console.log("Invalid username or password")
        return res.render('signin.html', { errorMessage: "Wrong username or password", css: '/signin.css' });
    }
});

app.post("/signout", (req, res) => {
    console.log(req.session.username + " logged out");
    req.session.username = null;
    req.session.email = null;
    req.session.authenticated = false;
    req.session.admin = false;
    req.session.id = null;
    res.redirect('/home');
});

app.post("/signup", (req, res) => {
    let username = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    let id = crypto.randomBytes(32).toString("hex");
    let token = crypto.randomBytes(128).toString("hex");

    if (email == undefined || username == undefined || password == undefined) {
        console.log("Invalid username or password")
        return res.render('signup', { msg: "Invalid email, username or password", css: '/signup.css' });
    }
    else if (confirmPassword != password) {
        console.log("Password aren't matching")
        return res.render('signup', { msg: "Wrong password", css: '/register.css' })
    }
    else if (accounts.get(id) == undefined && accounts.checkEmail(email) == 'false') {
        accounts.create(id, email, username, password, token);
        return res.redirect('/signin');
    }
    else if (accounts.get(email) != undefined) {
        console.log("An account already exists with this email")
        return res.render('singup', { msg: "An account already exists with this email", css: '/signup.css' });
    }
});


app.post("/updatePassword/:token", (req, res) => {
    let token = req.params.token;
    let email = req.body.emailField;
    let oldPassword = req.body.oldPasswordField;
    let newPassword = req.body.newPasswordField;
    let confirmPassword = req.body.confirmPasswordField;
    if (accounts.authenticate(email, oldPassword) && newPassword === confirmPassword) {
        accounts.updateAccountPassword(confirmPassword, token);
        res.redirect('/account');
    } else {

        let account = accounts.get(req.session.id);
        res.render('account.html', { css: '/account.css', account: account, script: true })
    }
})

app.post("/editAccount", uploadProfilePicture.single('updateProfilePicture'), (req, res) => {
    let name = req.body.nameField;
    let lastName = req.body.lastNameField;
    let phone = req.body.phoneNumberField;
    let adress = req.body.adressField;
    let city = req.body.cityField;
    let zipCode = req.body.zipCodeField
    let id = req.session.id;
    let email = req.body.email;

    let profilePictureName;
    if (req.file == undefined) {
        profilePictureName = accounts.get(id).profilePicture;
    } else {
        profilePictureName = sanitize(req.file.originalname) + '_' + id + '.png';
    }

    if (name == undefined) {
        console.log("Invalid username or password")
        return res.render('updateAccount', { msg: "Invalid email, username or password", css: '/updateAccount.css' });
    }
    else if (accounts.get(email) == undefined) {
        accounts.updateAccount(id, name, lastName, adress, city, zipCode, phone, profilePictureName);

        if (req.file == undefined) {
            console.log("No profile picture uploaded");
        } else {
            let tmp_path = req.file.path;
            let target_path = 'public/profiles_pictures/' + profilePictureName;
            let src = fs.createReadStream(tmp_path);
            let dest = fs.createWriteStream(target_path);
            src.pipe(dest);
        }

        return res.redirect('/account');
    }
})

app.post("/searchMedic", (req, res) => {
    // TO DO
})

// LISTEN

app.listen(3000, () => {
    console.log("Server is running on port 3000");
    console.log("Click on http://localhost:3000");
});