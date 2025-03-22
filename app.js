const express = require('express');
const bodyparser = require('body-parser');
const mustache = require('mustache-express');
const crypto = require('crypto');
const cookieSession = require('cookie-session');
const multer = require('multer');
const uploadProfilePicture = multer({ dest: 'public/profiles_pictures/' });
const uploadCSVFiles = multer({ dest: './csv/' });

const fs = require('fs');
const app = express();


app.use(bodyparser.urlencoded({ extended: true, parameterLimit: 1000000 }));
app.use(express.static('public/icons/'));
app.use(express.static('public/css/'));
app.use(express.static('public/pictures/'));
app.use(express.static('public/profiles_pictures'));
app.use(express.static('scripts'));
app.use(express.static('js'));


app.engine('html', mustache());
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
    let alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789@_-!$%&*+';
    let newStr = '';
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
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }

    let date = year + '-' + month + '-' + day;
    return date;
}

// GET

app.get('/', (req, res) => {
    res.redirect('./en')
})

app.get('/:lang', (req, res) => {
    if (req.params.lang === 'en' || req.params.lang === 'fr') {
        return res.redirect('/' + req.params.lang + '/home');
    } else {
        return res.send('404 Not Found');
    }
});

app.get('/:lang/home', (req, res) => {
    if (req.session.authenticated) {
        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/home'
    }
    res.render('./' + req.params.lang + '/home.html', { css: '/home.css' });
})

app.get('/:lang/signin', (req, res) => {
    res.render('./' + req.params.lang + '/signin.html', { css: '/signin.css' });
});


app.get('/:lang/signup', (req, res) => {
    res.render('./' + req.params.lang + '/signup.html', { css: '/signup.css' });
});

app.get('/:lang/account', (req, res) => {
    if (req.session.authenticated) {

        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/account'

        let id = req.session.id;
        let account = accounts.get(id)
        let seeMoreBtn = false;
        let lastCrossOrdersList = orders.getLastCrossOrdersFromOwnerIndex(id);
        if (lastCrossOrdersList.length > 0) {
            seeMoreBtn = true;
        }
        for (let i = 0; i < lastCrossOrdersList.length; i++) {
            lastCrossOrdersList[i].orderIndex = lastCrossOrdersList[i].originalOrderIndex;
            lastCrossOrdersList[i].openDate = orders.getOrder(lastCrossOrdersList[i].orderIndex).openDate;
            lastCrossOrdersList[i].closeDate = orders.getOrder(lastCrossOrdersList[i].orderIndex).closeDate;
            lastCrossOrdersList[i].state = orders.getOrder(lastCrossOrdersList[i].orderIndex).state;
        }

        if (account.admin) {
            let files = products.getFiles();
            let accountsList = accounts.getLastAccounts();
            let unverifiedAccounts = accounts.getUnverifiedAccounts();
            return res.render('./' + req.params.lang + '/account.html', {
                css: '/account.css', account: account, admin: account.admin, orders: lastCrossOrdersList, seeMoreBtn: seeMoreBtn,
                unverifiedAccounts: unverifiedAccounts, files: files, accounts: accountsList
            });
        }

        return res.render('./' + req.params.lang + '/account.html', {
            css: '/account.css', account: account,
            orders: lastCrossOrdersList, seeMoreBtn: seeMoreBtn,
        });
    } res.redirect('/' + req.params.lang + '/signin');
});

app.get('/:lang/allAccounts', (req, res) => {
    if (req.session.authenticated) {
        if (req.session.admin === true) {
            let accountsList = accounts.getAllAccounts();
            return res.render('./' + req.params.lang + '/allAccounts.html', { css: '/allAccounts.css', accountsList: accountsList, admin: req.session.admin });
        }
    } res.redirect('/' + req.params.lang + '/signin');
});

app.get('/:lang/account-admin-view/:id', (req, res) => {
    if (req.session.authenticated) {
        if (req.session.admin === true) {
            let account = accounts.get(req.params.id);
            return res.render('./' + req.params.lang + '/account-admin-view.html', {
                css: '/account-admin-view.css',
                account: account, admin: req.session.admin
            });
        } return res.redirect('/' + req.params.lang + '/home');
    } res.redirect('/' + req.params.lang + '/signin');
});

app.get('/:lang/crossOrder/:crossOrderIndex', (req, res) => {
    if (req.session.authenticated) {

        let crossOrderIndex = req.params.crossOrderIndex;
        let crossOrder = orders.getCrossOrder(crossOrderIndex)[0];
        let order = orders.getOrder(crossOrder.originalOrderIndex);
        order.crossOrderIndex = crossOrderIndex;

        if (order.ownerIndex === req.session.id && order.state === 0) {
            return res.redirect('/' + req.params.lang + '/orderSummary/' + order.orderIndex);
        }

        req.session.previousPage = req.session.currentPage;
        req.session.currentPage = '/' + req.params.lang + '/crossOrder/' + req.params.crossOrderIndex;


        let owner = false;
        if (order.ownerIndex === req.session.id) {
            owner = true;
        }
        let productsList = orders.getProductsListFromCrossOrderIndex(order.orderIndex, crossOrder.crossOrderIndex);
        console.log(order.state)
        return res.render('./' + req.params.lang + '/crossOrder.html',
            {
                css: '/crossOrder.css', laboratories: orders.getLaboratoriesFromCrossOrder(crossOrderIndex), orderIndex: order.orderIndex, order: order,
                products: productsList, owner: owner
            });
    } res.redirect('/' + req.params.lang + '/signin');
});

app.get('/:lang/orders', (req, res) => {
    if (req.session.authenticated) {

        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/orders'

        orders.updateOrderState();
        let order = orders.getOrders();
        let hasOrders;
        if (order.length > 0) {
            hasOrders = 1
        } else {
            hasOrders = 0
        }
        for (let i = 0; i < order.length; i++) {
            order[i].ownerName = accounts.get(order[i].ownerIndex).userName;
        }
        return res.render('./' + req.params.lang + '/orders.html', { css: '/orders.css', ordersList: order, hasOrders: hasOrders });
    } res.redirect('/' + req.params.lang + '/signin')
});

app.get('/:lang/insertFile', (req, res) => {
    if (req.session.authenticated) {
        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/insertFile'
        return res.render('./' + req.params.lang + '/insertFile.html', { css: '/insertFile.css', currentDate: now() });
    } res.redirect('/' + req.params.lang + '/signin')
});

app.get('/:lang/newOrder', (req, res) => {
    if (req.session.authenticated) {
        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/newOrder'
        return res.render('./' + req.params.lang + '/newOrder.html', { css: '/newOrder.css', laboratories: products.getLaboratories(), products: products.list(), currentDate: now(), endDate: now(1) });
    } res.redirect('/' + req.params.lang + '/signin');
});

app.get('/:lang/editAccount', (req, res) => {
    if (req.session.authenticated) {
        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/editAccount'
        let account = accounts.get(req.session.id);
        return res.render('./' + req.params.lang + '/editAccount.html', { css: '/editAccount.css', account: account });
    } res.redirect('/' + req.params.lang + '/signin')
})

app.get('/:lang/order/:orderIndex', (req, res) => {
    if (req.session.authenticated) {
        let orderIndex = req.params.orderIndex;
        let order = orders.getOrder(orderIndex);

        req.session.previousPage = req.session.currentPage

        if (orders.hasCrossOrder(orderIndex, req.session.id)) {

            let crossOrderIndex = orders.getCrossOrderIndexFromOrderIndex(orderIndex, req.session.id);
            return res.redirect('/' + req.params.lang + '/crossOrder/' + crossOrderIndex);
        }


        req.session.currentPage = '/' + req.params.lang + '/order/' + req.params.orderIndex

        let productsList = orders.getProductsListFromOrderIndex(orderIndex);
        return res.render('./' + req.params.lang + '/order.html', { css: '/order.css', laboratories: products.getLaboratories(), orderIndex: orderIndex, order: order, products: productsList });
    } res.redirect('/' + req.params.lang + '/signin')
});

app.get('/:lang/orderSummary/:orderIndex', (req, res) => {
    if (req.session.authenticated) {
        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/orderSummary/' + req.params.orderIndex;
        let orderIndex = req.params.orderIndex;
        let order = orders.getOrder(orderIndex);
        if (order.ownerIndex === req.session.id) {
            let orderSummary = orders.getOrderSummary(orderIndex);
            let globalAmount = 0;
            for (let i = 0; i < orderSummary.length; i++) {
                globalAmount += orderSummary[i].totalPrice;
            }
            return res.render('./' + req.params.lang + '/orderSummary.html', { css: '/orderSummary.css', orderIndex: orderIndex, orderSummary: orderSummary, globalAmount: globalAmount, state: order.state });
        }
    } return res.redirect('/' + req.params.lang + '/signin');
});

app.get('/:lang/myOrders', (req, res) => {
    if (req.session.authenticated) {
        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/myOrders'
        let ordersList = orders.getCrossOrderFromUserId(req.session.id);
        for (let i = 0; i < ordersList.length; i++) {
            ordersList[i].ownerName = accounts.get(ordersList[i].ownerIndex).userName;
        }
        return res.render('./' + req.params.lang + '/myOrders.html', { css: '/myOrders.css', ordersList: ordersList });
    } return res.redirect('/' + req.params.lang + '/signin');
});

app.get('/:lang/previousUrl', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect(req.session.previousPage);
    } return res.redirect('/' + req.params.lang + '/signin');
});

app.get('/:lang/account/:id', (req, res) => {
    if (req.session.authenticated) {
        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/account/' + req.params.id;
        if (req.session.admin === true) {
            let account = accounts.get(req.params.id);
            let verifiedState;
            account.verified ? verifiedState = 0 : verifiedState = 1
            let otherRoles;
            account.admin ? otherRoles = 0 : otherRoles = 1;
            return res.render('./' + req.params.lang + '/account-admin-view.html',
                { css: '/account-admin-view.css', account: account, otherRoles: otherRoles, verifiedState: verifiedState })
        }
        return res.sendStatus(403)
    } return res.redirect('/' + req.params.lang + '/signin');
});

app.get('/:lang/file/:fileIndex', (req, res) => {
    if (req.session.authenticated) {
        req.session.previousPage = req.session.currentPage
        req.session.currentPage = '/' + req.params.lang + '/account/' + req.params.id;
        if (req.session.admin === true) {
            let fileName = products.getFileName(req.params.fileIndex);
            let productsList = products.getProductsFromFile(req.params.fileIndex)
            console.log(productsList)
        } return res.sendStatus(403)
    } return res.redirect('/' + req.params.lang + '/signin')
});

// POST

app.post('/:lang/signin', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    if (email == undefined || password == undefined) {
        console.log('email or password is undefined')
        return res.render('./' + req.params.lang + '/signin.html', { errorMessage: 'Invalid email or password', css: '/signIn.css' });
    }
    else if (accounts.authenticate(email, password)) {
        req.session.id = (accounts.getIdFromEmail(email)).id;
        req.session.email = email;
        req.session.username = accounts.get(req.session.id).userName;
        req.session.authenticated = true;
        req.session.previousPage = req.headers.referer;
        req.session.currentPage = req.headers.referer;
        if (accounts.get(req.session.id).admin === 1) {
            req.session.admin = true;
        } else { req.session.admin = false; }

        console.log(req.session.username + ' connected');

        return res.redirect('/' + req.params.lang + '/home');
    }
    else if (!accounts.authenticate(email, password)) {
        console.log('Invalid username or password')
        return res.render('./' + req.params.lang + '/signin.html', { errorMessage: 'Wrong username or password', css: '/signin.css' });
    }
});

app.post('/:lang/signout', (req, res) => {
    console.log(req.session.username + ' logged out');
    req.session.username = null;
    req.session.email = null;
    req.session.authenticated = false;
    req.session.admin = false;
    req.session.id = null;
    res.redirect('/' + req.params.lang + '/home');
});

app.post('/:lang/signup', (req, res) => {
    let username = req.body.name;
    let email = req.body.email;
    let password = req.body.passwordField;
    let confirmPassword = req.body.confirmPasswordField;
    let id = crypto.randomBytes(32).toString('hex');
    let token = crypto.randomBytes(128).toString('hex');

    if (email == undefined || username == undefined || password == undefined) {
        console.log('Invalid username or password')
        return res.render('./' + req.params.lang + '/signup', { msg: 'Invalid email, username or password', css: '/signup.css' });
    }
    else if (confirmPassword != password) {
        console.log("Password aren't matching");
        return res.render('./' + req.params.lang + '/signup', { msg: 'Wrong password', css: '/register.css' })
    }
    else if (accounts.get(id) == undefined && accounts.checkEmail(email) == 'false') {
        accounts.create(id, email, username, password, token);
        return res.redirect('/' + req.params.lang + '/signin');
    }
    else if (accounts.get(email) != undefined) {
        console.log('An account already exists with this email')
        return res.render('./' + req.params.lang + '/singup', { msg: 'An account already exists with this email', css: '/signup.css' });
    }
});


app.post('/:lang/updatePassword/:token', (req, res) => {
    let token = req.params.token;
    let email = req.body.emailField;
    let oldPassword = req.body.oldPasswordField;
    let newPassword = req.body.newPasswordField;
    let confirmPassword = req.body.confirmPasswordField;
    if (accounts.authenticate(email, oldPassword) && newPassword === confirmPassword) {
        accounts.updateAccountPassword(confirmPassword, token);
        return res.redirect('/' + req.params.lang + '/account');
    }
    let account = accounts.get(req.session.id);
    res.render('./' + req.params.lang + '/account.html', { css: '/account.css', account: account, script: true })
});

app.post('/:lang/editAccount', uploadProfilePicture.single('updateProfilePicture'), (req, res) => {
    if (req.session.authenticated) {
        let name = req.body.nameField;
        let lastName = req.body.lastNameField;
        let phone = req.body.phoneNumberField;
        let address = req.body.adressField;
        let city = req.body.cityField;
        let zipCode = req.body.zipCodeField
        let id = req.session.id;
        let profilePictureName;

        req.file == undefined ? profilePictureName = accounts.get(id).profilePicture : profilePictureName = sanitize(req.file.originalname) + '_' + id + '.png';

        if (name == undefined) {
            console.log('Invalid username or password')
            return res.render('./' + req.params.lang + '/updateAccount', { msg: 'Invalid email, username or password', css: '/updateAccount.css' });
        }
        else if (accounts.get(id) != undefined) {
            accounts.updateAccount(id, name, lastName, address, city, zipCode, phone, profilePictureName);

            if (req.file == undefined) {
                console.log('No profile picture uploaded');
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

app.post('/:lang/admin-update-account/:accountId', (req, res) => {
    if (req.session.authenticated) {
        if (req.session.admin === true) {
            let id = req.params.accountId;
            if (accounts.get(id) != undefined) {
                let name = req.body.nameField;
                let lastName = req.body.lastNameField;
                let address = req.body.addressField;
                let city = req.body.cityField;
                let postCode = req.body.postCodeField;
                let phone = req.body.phoneNumberField;
                let state = req.body.stateSelect;
                let role = req.body.roleSelect;
                role === 1 ? req.session.admin = true : req.session.admin = 0;
                accounts.updtateAccountAdmin(id, name, lastName, address, city, postCode, phone, state, role);
                return res.redirect('/' + req.params.lang + '/account')
            }
        }

    } res.redirect('/' + req.params.lang + '/signin')
})

app.post('/:lang/verifyAccount/:token', (req, res) => {
    if (req.session.authenticated) {
        let token = req.params.token;
        accounts.verifyAccount(token);
        return res.redirect('/' + req.params.lang + '/account');
    } res.redirect('/' + req.params.lang + '/signin');
});

app.post('/:lang/rejectAccount/:token', (req, res) => {
    if (req.session.authenticated) {
        let token = req.params.token;
        accounts.rejectAccount(token);
        return res.redirect('/' + req.params.lang + '/account');
    } res.redirect('/' + req.params.lang + '/signin');
});


app.post('/:lang/uploadFile', uploadCSVFiles.single('fileField'), (req, res) => {
    if (req.session.authenticated) {
        if (req.file == undefined) {
            console.log('No files uploaded');
        } else {
            let file = req.file;
            let fileName = req.file.originalname;
            let tmp_path = file.path;
            let target_path = 'csv/' + fileName;
            let src = fs.createReadStream(tmp_path);
            let dest = fs.createWriteStream(target_path);
            src.pipe(dest);
            fs.readFile(tmp_path, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error while reading:', err);
                    return;
                }
                const lines = data.split('\n');
                for (let i = 1; i < lines.length; i++) {
                    let fields = lines[i].split(';');
                    try {
                        fields[10] = fields[10].replace('\r', '');
                        products.insertProduct(fields[2], fields[4], fields[5], fields[7], fields[9], fields[10]);
                    } catch {
                        continue;
                    }
                }
            });
        } return res.redirect('/' + req.params.lang + '/insertFile');
    } res.redirect('/' + req.params.lang + '/signin')
});

app.post('/:lang/createOrder', (req, res) => {
    if (req.session.authenticated) {
        let table = req.body;
        let productsIndex = [];
        let listSize = table.quantity.length;
        let ownerIndex = req.session.id;
        let openDate = req.body.dateStartField;
        let closeDate = req.body.dateEndField;
        for (let i = 0; i < listSize; i++) {
            if (table.quantity[i] != 0) {
                productsIndex.push([table.ean13[i], parseInt(table.quantity[i])]);
            }
        }
        if (productsIndex.length === 0) {
            return res.redirect('/' + req.params.lang + '/newOrder');
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
                console.log(table.ean13[i]);
                productsIndex.push([table.ean13[i], parseInt(table.quantity[i])]);
            }
        }
        if (productsIndex.length === 0) {
            return res.redirect('/' + req.params.lang + '/order/' + orderIndex);
        }
        orders.createCrossOrder(orderIndex, req.session.id, productsIndex);
        return res.redirect('/' + req.params.lang + '/orders');
    } res.redirect('/' + req.params.lang + '/signin');
});

app.post('/:lang/updateCrossOrder/:crossOrderIndex', (req, res) => {
    if (req.session.authenticated) {
        let crossOrderIndex = req.params.crossOrderIndex;
        let crossOrder = orders.getCrossOrder(crossOrderIndex)[0];
        if (crossOrder.crossOrderOwner !== req.session.id) {
            console.log('You are not the owner of this cross order');
            return res.redirect('/' + req.params.lang + '/crossOrder/' + req.params.crossOrderIndex);
        } else {
            let table = req.body;
            let closeDate = req.body.dateEndField;
            let productsIndex = [];
            let listSize = table.quantity.length;
            for (let i = 0; i < listSize; i++) {
                if (table.quantity[i] != 0) {
                    productsIndex.push([table.ean13[i], parseInt(table.quantity[i])]);
                }
            }
            orders.updateCrossOrder(crossOrderIndex, productsIndex, closeDate);
            return res.redirect('/' + req.params.lang + '/orders');
        }
    } return res.redirect('/' + req.params.lang + '/signin');
});

app.post('/:lang/deleteOrder/:orderIndex', (req, res) => {
    if (req.session.authenticated) {
        let orderIndex = req.params.orderIndex;
        if (orders.getOrder(orderIndex).ownerIndex === req.session.id) {
            orders.deleteOrder(orderIndex);
            return res.redirect('/' + req.params.lang + '/orders');
        }
    } return res.redirect('/' + req.params.lang + '/signin');
});

app.post('/:lang/deleteCrossOrder/:crossOrderIndex', (req, res) => {
    if (req.session.authenticated) {
        let crossOrderIndex = req.params.crossOrderIndex;
        if (orders.getCrossOrder(crossOrderIndex)[0].crossOrderOwner === req.session.id) {
            orders.deleteCrossOrder(crossOrderIndex);
            return res.redirect('/' + req.params.lang + '/orders');
        }
    } return res.redirect('/' + req.params.lang + '/signin');
});

app.post('/:lang/deleteFile/:fileIndex', (req, res) =>{
    if (req.session.authenticated) {
        if (req.session.admin === true){
            console.log('fileDeleted')
            products.deleteFile(req.params.fileIndex)
            return res.redirect('/' + req.params.lang + '/account');
        }
    } return res.redirect('/' + req.params.lang + '/signin');
})


app.post('/:lang/orderSummary/:orderIndex', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/' + req.params.lang + '/orderSummary/' + req.params.orderIndex);
    } return res.redirect('/.' + req.params.lang + '/signin');
});

app.post('/:lang/closeOrder/:orderIndex', (req, res) => {
    if (req.session.authenticated) {
        let orderIndex = req.params.orderIndex;
        if (orders.getOrder(orderIndex).ownerIndex === req.session.id) {
            orders.closeOrder(orderIndex);
            return res.redirect('/' + req.params.lang + '/orders');
        }
    } return res.redirect('/' + req.params.lang + '/signin');
});

app.post('/:lang/previousUrl', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect(req.session.previousPage);
    } return res.redirect('/' + req.params.lang + '/signin');
})

// LISTEN

app.listen(3001, () => {
    console.log('Server is running on port 3001');
    console.log('Click on http://localhost:3001');
});