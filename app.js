const express = require("express");
const bodyparser = require("body-parser");
const mustache = require("mustache-express");
const crypto = require('crypto');
const cookieSession = require("cookie-session");
const multer = require("multer");
const uploadProfilePicture = multer({ dest: 'public/profiles_pictures/' });
const uploadCSVFiles = multer({ dest: './csv/' });

const fs = require('fs');
const { parse } = require("csv-parse");

const app = express();


app.use(bodyparser.urlencoded({ extended: true, parameterLimit: 1000000 }));
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
var products = require('./js/products');

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

function now(nBdays = 0) {
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + nBdays);
    let day = currentDate.getDate();
    let month = currentDate.getMonth() + 1;
    let year = currentDate.getFullYear();

    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }

    let date = year + "-" + month + "-" + day;
    return date;
}

// GET

app.get("/", (req, res) => {
    res.redirect("./en")
})

app.get("/:lang", (req, res) => {
    if (req.params.lang === 'en' || req.params.lang === 'fr') {
        return res.redirect("/" + req.params.lang + "/home");
    } else {
        return res.send('404 Not Found');
    }
});

app.get("/:lang/home", (req, res) => {
    res.render("./" + req.params.lang + "/home.html", { css: '/home.css' });
})

app.get("/:lang/signin", (req, res) => {
    res.render("./" + req.params.lang + "/signin.html", { css: "/signin.css" });
});


app.get("/:lang/signup", (req, res) => {
    res.render("./" + req.params.lang + "/signup.html", { css: "/signup.css" });
});

app.get("/:lang/account", (req, res) => {
    if (req.session.authenticated) {
        let id = req.session.id;
        let account = accounts.get(id)
        let lastCrossOrdersList = orders.getLastCrossOrdersFromOwnerIndex(id);
        for (let i = 0; i < lastCrossOrdersList.length; i++) {
            lastCrossOrdersList[i].orderIndex = lastCrossOrdersList[i].originalOrderIndex;
            lastCrossOrdersList[i].openDate = orders.getOrder(lastCrossOrdersList[i].orderIndex).openDate;
            lastCrossOrdersList[i].closeDate = orders.getOrder(lastCrossOrdersList[i].orderIndex).closeDate;
            lastCrossOrdersList[i].state = orders.getOrder(lastCrossOrdersList[i].orderIndex).state;
        }
        let unverifiedAccounts = accounts.getUnverifiedAccounts();
        return res.render("./" + req.params.lang + "/account.html", { css: "/account.css", 
            account: account, admin: account.admin, unverifiedAccounts: unverifiedAccounts, orders : lastCrossOrdersList });
    } res.redirect('/' + req.params.lang + '/signin')
});

app.get("/:lang/updateCrossOrder/:crossOrderIndex", (req, res) => {
    if(req.session.authenticated) {
        let crossOrderIndex = req.params.crossOrderIndex;
        let crossOrder = orders.getCrossOrder(crossOrderIndex)[0];
        let order = orders.getOrder(crossOrder.originalOrderIndex);
        let productsList = orders.getProductsListFromOrderIndex(order.orderIndex);
        crossOrder = orders.getProductsListFromCrossOrderIndex(crossOrder.crossOrderIndex);
        for (let i = 0; i < productsList.length; i++) {
            for(let j = 0; j < crossOrder.length; j++) {
                if(productsList[i].ean13 == crossOrder[j].ean13) {
                    productsList[i].quantity = crossOrder[j].quantity;
                } else {
                    productsList[i].quantity = 0;   
                }
            }
        }
        console.log("pd",productsList)
        if (crossOrder.crossOrderOwner == req.session.id) {
            return res.render("./" + req.params.lang + "/updateCrossOrder.html", { css: "/updateCrossOrder.css", laboratories : products.getLaboratories(), crossOrderIndex : crossOrderIndex });
        } 
    } res.redirect('/' + req.params.lang + '/signin');
});

app.get("/:lang/orders", (req, res) => {
    if (req.session.authenticated) {
        let order = orders.getOrders();
        for (let i = 0; i < order.length; i++) {
            order[i].ownerName = accounts.get(order[i].ownerIndex).userName;
            if(new Date(order[i].closeDate) - new Date() < 0) {
                order[i].state = 0;
                orders.setState(order[i].orderIndex, 0)
            }
        }
        return res.render("./" + req.params.lang + "/orders.html", { css: "/orders.css", ordersList: order });
    } res.redirect('/' + req.params.lang + '/signin')
});

app.get("/:lang/insertFile", (req, res) => {
    if (req.session.authenticated) {
        return res.render("./" + req.params.lang + "/insertFile.html", { css: "/insertFile.css", currentDate: now() });
    } res.redirect('/' + req.params.lang + '/signin')
});

app.get("/:lang/newOrder", (req, res) => {
    if (req.session.authenticated) {
        return res.render("./" + req.params.lang + "/newOrder.html", { css: "/newOrder.css", laboratories: products.getLaboratories(), products: products.list(), currentDate: now(), endDate: now(1)});
    } res.redirect('/' + req.params.lang + '/signin');
});

app.get("/:lang/editAccount", (req, res) => {
    if (req.session.authenticated) {
        let account = accounts.get(req.session.id);
        return res.render("./" + req.params.lang + "/editAccount.html", { css: "/editAccount.css", account: account });
    } res.redirect('/' + req.params.lang + '/signin')
})

app.get("/:lang/order/:orderIndex", (req, res) => {
    if (req.session.authenticated) {
        let orderIndex = req.params.orderIndex;
        let order = orders.getOrder(orderIndex);
        let productsList = orders.getProductsListFromOrderIndex(orderIndex);
        let owner = false;
        if (order.ownerIndex == req.session.id) {
            owner = true;
        }
        return res.render("./" + req.params.lang + "/newCrossOrder.html", { css: "/orderDetails.css", laboratories : products.getLaboratories(), orderIndex : orderIndex, order: order, products: productsList, owner : owner });
    } res.redirect('/' + req.params.lang + '/signin')
});

// POST

app.post("/:lang/signin", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    if (email == undefined || password == undefined) {
        console.log("email or password is undefined")
        return res.render("./" + req.params.lang + '/signin.html', { errorMessage: "Invalid email or password", css: '/signIn.css' });
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

        return res.redirect("/" + req.params.lang + '/home');
    }
    else if (!accounts.authenticate(email, password)) {
        console.log("Invalid username or password")
        return res.render("./" + req.params.lang + '/signin.html', { errorMessage: "Wrong username or password", css: '/signin.css' });
    }
});

app.post("/:lang/signout", (req, res) => {
    console.log(req.session.username + " logged out");
    req.session.username = null;
    req.session.email = null;
    req.session.authenticated = false;
    req.session.admin = false;
    req.session.id = null;
    res.redirect('/' + req.params.lang + '/home');
});

app.post("/:lang/signup", (req, res) => {
    let username = req.body.name;
    let email = req.body.email;
    let password = req.body.passwordField;
    let confirmPassword = req.body.confirmPasswordField;
    let id = crypto.randomBytes(32).toString("hex");
    let token = crypto.randomBytes(128).toString("hex");

    if (email == undefined || username == undefined || password == undefined) {
        console.log("Invalid username or password")
        return res.render("./" + req.params.lang + '/signup', { msg: "Invalid email, username or password", css: '/signup.css' });
    }
    else if (confirmPassword != password) {
        console.log("Password aren't matching")
        return res.render("./" + req.params.lang + '/signup', { msg: "Wrong password", css: '/register.css' })
    }
    else if (accounts.get(id) == undefined && accounts.checkEmail(email) == 'false') {
        accounts.create(id, email, username, password, token);
        return res.redirect("/" + req.params.lang + '/signin');
    }
    else if (accounts.get(email) != undefined) {
        console.log("An account already exists with this email")
        return res.render("./" + req.params.lang + '/singup', { msg: "An account already exists with this email", css: '/signup.css' });
    }
});


app.post("/:lang/updatePassword/:token", (req, res) => {
    let token = req.params.token;
    let email = req.body.emailField;
    let oldPassword = req.body.oldPasswordField;
    let newPassword = req.body.newPasswordField;
    let confirmPassword = req.body.confirmPasswordField;
    if (accounts.authenticate(email, oldPassword) && newPassword === confirmPassword) {
        accounts.updateAccountPassword(confirmPassword, token);
        return res.redirect("/" + req.params.lang + '/account');
    }
    let account = accounts.get(req.session.id);
    res.render("./" + req.params.lang + '/account.html', { css: '/account.css', account: account, script: true })
});

app.post("/:lang/editAccount", uploadProfilePicture.single('updateProfilePicture'), (req, res) => {
    if (req.session.authenticated) {
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
            console.log(req.file)
            profilePictureName = sanitize(req.file.originalname) + '_' + id + '.png';
        }

        if (name == undefined) {
            console.log("Invalid username or password")
            return res.render("./" + req.params.lang + '/updateAccount', { msg: "Invalid email, username or password", css: '/updateAccount.css' });
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

            return res.redirect('/' + req.params.lang + '/account');
        }
    } res.redirect('/' + req.params.lang + '/signin')
});

app.post("/:lang/verifyAccount/:token", (req, res) => {
    if (req.session.authenticated) {
        let token = req.params.token;
        accounts.verifyAccount(token);
        return res.redirect('/' + req.params.lang + '/account');
    } res.redirect('/' + req.params.lang + '/signin');
});

app.post("/:lang/rejectAccount/:token", (req, res) => {
    if (req.session.authenticated) {
        let token = req.params.token;
        accounts.rejectAccount(token);
        return res.redirect('/' + req.params.lang + '/account');
    } res.redirect('/' + req.params.lang + '/signin');
});


app.post("/:lang/insertFile", uploadCSVFiles.single('fileField'), (req, res) => {
    if (req.session.authenticated) {
        if (req.file == undefined) {
            console.log("No files uploaded");
        } else {
            let file = req.file;
            let fileName = req.file.originalname;
            let tmp_path = file.path;
            let target_path = 'csv/' + fileName;
            let src = fs.createReadStream(tmp_path);
            let dest = fs.createWriteStream(target_path);
            src.pipe(dest);
            fs.readFile(tmp_path, "utf8", (err, data) => {
                if (err) {
                    console.error("Error while reading:", err);
                    return;
                }
                const lines = data.split("\n");
                for (let i = 1; i < lines.length; i++) {
                    let fields = lines[i].split(";");
                    try {
                        fields[10] = fields[10].replace("\r", "");
                        products.insertProduct(fields[2], fields[4], fields[5], fields[7], fields[9], fields[10]);
                    } catch {
                        console.log("ok");
                        continue;
                    }
                }
            });
        } return res.redirect("/" + req.params.lang + '/insertFile');
    } res.redirect('/' + req.params.lang + '/signin')
});

app.post('/:lang/getProducts', (req, res) => {
    if (req.session.authenticated) {
        let laboratoryName = req.body.laboratorySelect;
        let startDate = req.body.dateStartField;
        let endDate = req.body.dateEndField;
        let productsList = products.getLaboratoryProducts(laboratoryName);
        return res.render("./" + req.params.lang + "/newOrder.html", { css: "/newOrder.css", laboratories: products.getLaboratories(), products: productsList, currentDate: startDate, endDate: endDate });
    } res.redirect('/' + req.params.lang + '/signin');
});

app.post('/:lang/createOrder', (req, res) => {
    if (req.session.authenticated) {
        let table = req.body;
        let productsIndex = [];
        let listSize = table.quantity.length;
        let ownerIndex = req.session.id;
        let openDate = req.body.dateStartField;
        let closeDate = req.body.dateEndField;
        console.log(table)
        for (let i = 0; i < listSize; i++) {
            if (table.quantity[i] != 0) {
                console.log(parseInt(table.quantity[i]) * parseInt(table.packaging[i]))
                productsIndex.push([table.ean13[i], parseInt(table.quantity[i]) * parseInt(table.packaging[i])]);
            }
        }
        orders.createOrder(ownerIndex, productsIndex, openDate, closeDate);
        return res.redirect('/' + req.params.lang + '/orders');
    } res.redirect('/' + req.params.lang + '/signin');
});

app.post('/:lang/createCrossOrder/:orderIndex', (req, res) => {
    if (req.session.authenticated) {
        let orderIndex = req.params.orderIndex;
        let table = req.body;
        let productsIndex = [];
        let listSize = table.quantity.length;
        for (let i = 0; i < listSize; i++) {
            if (table.quantity[i] != 0) {
                productsIndex.push([table.ean13[i], parseInt(table.quantity[i])]);
            }
        }
        orders.createCrossOrder(orderIndex, req.session.id, productsIndex);
        return res.redirect('/' + req.params.lang + '/orders');
    } res.redirect('/' + req.params.lang + '/signin');
});

// LISTEN

app.listen(3000, () => {
    console.log("Server is running on port 3000");
    console.log("Click on http://localhost:3000");
});