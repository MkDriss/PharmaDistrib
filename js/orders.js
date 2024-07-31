'use strict';

const Sqlite = require('better-sqlite3');
const { Console } = require('console');
const fs = require('fs');
let db = new Sqlite('db.sqlite');
var products = require('./products.js');
var accounts = require('./accounts.js');


let initDatabase = function () {

    db.prepare('DROP TABLE IF EXISTS productInventory').run();
    console.log("Product Inventory table dropped");
    db.prepare('DROP TABLE IF EXISTS crossOrders').run();
    console.log('Cross Orders table dropped');
    db.prepare('DROP TABLE IF EXISTS orders').run();
    console.log('orders table dropped');

    db.prepare('CREATE TABLE IF NOT EXISTS orders (orderIndex INTEGER PRIMARY KEY AUTOINCREMENT, ownerIndex TEXT, openDate TEXT, ' +
        'closeDate TEXT, state boolean)').run();

    db.prepare('CREATE TABLE IF NOT EXISTS crossOrders (crossOrderIndex INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'originalOrderIndex INTEGER, crossOrderOwner TEXT,' +
        'FOREIGN KEY(originalOrderIndex) REFERENCES orders(orderIndex))').run();

    db.prepare('CREATE TABLE IF NOT EXISTS productInventory (orderIndex INTEGER, crossOrderIndex INTEGER, productIndex TEXT, quantity INT,'
        + 'FOREIGN KEY(crossOrderIndex) REFERENCES crossOrders(crossOrderIndex),' +
        'FOREIGN KEY(orderIndex) REFERENCES orders(orderIndex))').run();
}

let loadOrder = function (filename) {
    const orders = JSON.parse(fs.readFileSync(filename));
    let insertOrder = db.prepare('INSERT INTO orders(orderIndex, ownerIndex, openDate, closeDate, state) VALUES (?, ?, ?, ?, ?) ');
    let transaction = db.transaction((orders) => {
        for (let indexOrder = 0; indexOrder < orders.length; indexOrder++) {
            insertOrder.run(orders[indexOrder].orderIndex, orders[indexOrder].ownerIndex, orders[indexOrder].openDate, orders[indexOrder].closeDate, orders[indexOrder].state);
        }
    });
    transaction(orders);
}

let loadCrossOrders = function (filename) {
    const crossOrders = JSON.parse(fs.readFileSync(filename));
    let insertCrossOrder = db.prepare('INSERT INTO crossOrders(crossOrderIndex, originalOrderIndex, crossOrderOwner) VALUES (?, ?, ?) ');
    let insertProductInventory = db.prepare('INSERT INTO productInventory(orderIndex, crossOrderIndex, productIndex, quantity) VALUES (?, ?, ?, ?) ');
    let transaction = db.transaction((crossOrders) => {
        for (let crossOrderIndex = 0; crossOrderIndex < crossOrders.length; crossOrderIndex++) {
            insertCrossOrder.run(crossOrders[crossOrderIndex].crossOrderIndex, crossOrders[crossOrderIndex].originalOrderIndex, crossOrders[crossOrderIndex].crossOrderOwner);
            // Insert list of products in 
            for (let indexProduct = 0; indexProduct < (crossOrders[crossOrderIndex].productInventory).length; indexProduct++) {
                insertProductInventory.run(crossOrders[crossOrderIndex].originalOrderIndex, crossOrders[crossOrderIndex].crossOrderIndex, crossOrders[crossOrderIndex].productInventory[indexProduct][0], crossOrders[crossOrderIndex].productInventory[indexProduct][1]);
            }
        }
    });
    transaction(crossOrders);
}

initDatabase();
loadOrder('./json/orders.json');
loadCrossOrders('./json/crossOrders.json');
console.log('Orders loaded');

//CREATE

exports.createOrder = function (ownerIndex, productsList, openDate, closeDate) {
    db.prepare('INSERT INTO orders(ownerIndex, openDate, closeDate, state) VALUES (?, ?, ?, ?)').run(ownerIndex, openDate, closeDate, 1);
    let orderIndex = (db.prepare('SELECT MAX(orderIndex) FROM orders').get()['MAX(orderIndex)']);
    db.prepare('INSERT INTO crossOrders(originalOrderIndex, crossOrderOwner) VALUES (?, ?)').run(orderIndex, ownerIndex);
    let crossOrderIndex = (db.prepare('SELECT MAX(crossOrderIndex) FROM crossOrders').get()['MAX(crossOrderIndex)']);
    for (let indexProduct = 0; indexProduct < productsList.length; indexProduct++) {
        db.prepare('INSERT INTO productInventory(orderIndex, crossOrderIndex, productIndex, quantity) VALUES (?, ?, ?, ?)').run(orderIndex, crossOrderIndex, productsList[indexProduct][0], productsList[indexProduct][1]);
    }

    fs.readFile('./json/orders.json', (err, data) => {
        let newOrder = {
            "orderIndex": orderIndex,
            "ownerIndex": ownerIndex,
            "openDate": openDate,
            "closeDate": closeDate,
            "state": 1
        }
        if (err) throw err;
        let orders = JSON.parse(data);
        orders.push(newOrder);
        fs.writeFileSync('./json/orders.json', JSON.stringify(orders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });

    fs.readFile('./json/crossOrders.json', (err, data) => {
        let newCrossOrder = {
            "crossOrderIndex": crossOrderIndex,
            "originalOrderIndex": orderIndex,
            "crossOrderOwner": ownerIndex,
            "productInventory": productsList
        }
        if (err) throw err;
        let crossOrders = JSON.parse(data);
        crossOrders.push(newCrossOrder);
        fs.writeFileSync('./json/crossOrders.json', JSON.stringify(crossOrders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });
}

exports.createCrossOrder = function (originalOrderIndex, crossOrderOwnerIndex, productsList) {
    db.prepare('INSERT INTO crossOrders(originalOrderIndex, crossOrderOwner) VALUES (?, ?)').run(originalOrderIndex, crossOrderOwnerIndex);
    let crossOrderIndex = (db.prepare('SELECT MAX(crossOrderIndex) FROM crossOrders').get()['MAX(crossOrderIndex)']);
    for (let indexProduct = 0; indexProduct < productsList.length; indexProduct++) {
        db.prepare('INSERT INTO productInventory(orderIndex, crossOrderIndex, productIndex, quantity) VALUES (?, ?, ?, ?)').run(originalOrderIndex, crossOrderIndex, productsList[indexProduct][0], productsList[indexProduct][1]);
    }
    fs.readFile('./json/crossOrders.json', (err, data) => {
        let crossOrderIndex = (db.prepare('SELECT MAX(crossOrderIndex) FROM crossOrders').get()['MAX(crossOrderIndex)']);
        let newCrossOrder = {
            "crossOrderIndex": crossOrderIndex,
            "originalOrderIndex": parseInt(originalOrderIndex),
            "crossOrderOwner": crossOrderOwnerIndex,
            "productInventory": productsList
        }
        if (err) throw err;
        let orders = JSON.parse(data);
        orders.push(newCrossOrder);
        fs.writeFileSync('./json/crossOrders.json', JSON.stringify(orders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });
}

// GET

exports.getOrder = function (orderIndex) {
    return db.prepare('SELECT * FROM orders WHERE orderIndex = ?').get(orderIndex);
}

exports.getLastCrossOrdersFromOwnerIndex = function (ownerIndex) {
    return db.prepare('SELECT * FROM crossOrders WHERE crossOrderOwner = ? ORDER BY originalOrderIndex DESC LIMIT 3').all(ownerIndex);
}

exports.getOrders = function () {
    return db.prepare('SELECT * FROM orders ORDER BY orderIndex DESC').all();
}

exports.getCrossOrderFromUserId = function(ownerIndex) {
    console.log(ownerIndex);
    return db.prepare('SELECT * FROM crossOrders INNER JOIN orders ON crossOrders.originalOrderIndex = orders.orderIndex WHERE crossOrders.crossOrderOwner = ?').all(ownerIndex);
}

exports.getCrossOrders = function () {
    return db.prepare('SELECT * FROM crossOrders ORDER BY crossOrderIndex DESC').all();
}

exports.getCrossOrder = function (crossOrderIndex) {
    return db.prepare('SELECT * FROM crossOrders WHERE crossOrderIndex = ?').all(crossOrderIndex);
}

exports.getProductsListFromOrderIndex = function (orderIndex) {
    //get all crossOrders
    let crossOrders = db.prepare('SELECT * FROM productInventory WHERE orderIndex = ?').all(orderIndex)
    let productsIndexList = []
    let productsList = [];
    //prepare a commande to get the total quantity of a product
    let getTotQty = db.prepare('SELECT SUM(quantity) FROM productInventory WHERE orderIndex = ? AND productIndex = ?')
    //parse all crossOrder
    for (let crossOrderIndex = 0; crossOrderIndex < crossOrders.length; crossOrderIndex++) {
        //parse all products in the crossOrder
        for (let indexProduct = 0; indexProduct < crossOrders.length; indexProduct++) {
            let ean13 = crossOrders[indexProduct].productIndex;
            // check if the product is already in the list
            if (productsIndexList.includes(ean13)) continue;
            productsIndexList.push(ean13);
            //create product object with all the information
            let product = products.getFromEan(ean13);
            let totQty = getTotQty.get(orderIndex, ean13)['SUM(quantity)'];
            let quantity = crossOrders[indexProduct].quantity;
            product.quantity = quantity;
            product.totQty = totQty;
            product.basedPrice = quantity * product.price;
            productsList.push(product);
        }
    }
    return productsList;
}

exports.getProductsListFromCrossOrderIndex = function (orderIndex, userCrossOrderIndex) {
    let productsIndexList = db.prepare('SELECT DISTINCT productIndex FROM productInventory WHERE orderIndex = ?').all(orderIndex);
    let productsList = [];
    //prepare a commande to get the total quantity of a product
    let getTotQty = db.prepare('SELECT SUM(quantity) FROM productInventory WHERE orderIndex = ? AND productIndex = ?')
    let getQty = db.prepare('SELECT quantity FROM productInventory WHERE orderIndex = ? AND productIndex = ? AND crossOrderIndex = ?')
    for (let productIndex = 0; productIndex < productsIndexList.length; productIndex++) {
        let product = products.getFromEan(productsIndexList[productIndex].productIndex);
        let quantity = 0;
        if (getQty.get(orderIndex, productsIndexList[productIndex].productIndex, userCrossOrderIndex) != undefined) {
            quantity = getQty.get(orderIndex, productsIndexList[productIndex].productIndex, userCrossOrderIndex).quantity;
        }
        let totQty = getTotQty.get(orderIndex, productsIndexList[productIndex].productIndex)['SUM(quantity)'];
        product.quantity = quantity;
        product.totQty = totQty;
        product.basedPrice = quantity * product.price;
        productsList.push(product);
    }
    return productsList;
}

exports.getOrderSummary = function (orderIndex) {
    // get all accounts
    let accountsList = db.prepare('SELECT DISTINCT crossOrderOwner FROM crossOrders WHERE originalOrderIndex = ?').all(orderIndex);
    // get all products by accounts
    let getProducts = db.prepare('SELECT productIndex, quantity FROM productInventory INNER JOIN crossOrders ON productInventory.crossOrderIndex = crossOrders.crossOrderIndex WHERE orderIndex = ? AND crossOrderOwner = ?');
    let OrderSummary = [];
    for (let accountIndex = 0; accountIndex < accountsList.length; accountIndex++) {
        let productsList = getProducts.all(orderIndex, accountsList[accountIndex].crossOrderOwner);
        let accountSummary = {
            "account": accounts.getName(accountsList[accountIndex].crossOrderOwner).userName,
            "products": [],
            "totalPrice": 0
        }
        // fill products with product information
        for (let index = 0; index < productsList.length; index++) {
            let product = productsList[index];
            let productInfo = products.getFromEan(product.productIndex);
            productInfo.quantity = product.quantity;
            productInfo.basedPrice = product.quantity * productInfo.price;
            accountSummary.products.push(productInfo);
            accountSummary.totalPrice += productInfo.basedPrice;
        }
        OrderSummary.push(accountSummary);
    }
    return OrderSummary;
}

exports.getCrossOrderIndexFromOrderIndex = function (orderIndex, ownerIndex) {
    return db.prepare('SELECT crossOrderIndex FROM crossOrders WHERE originalOrderIndex = ? AND crossOrderOwner = ?').get(orderIndex, ownerIndex)['crossOrderIndex'];
}

exports.getLaboratoriesFromCrossOrder = function (crossOrderIndex){
    return db.prepare('SELECT DISTINCT laboratoryName FROM productInventory INNER JOIN products ON productInventory.productIndex = products.ean13 WHERE crossOrderIndex = ?').all(crossOrderIndex);
}



//UPDATE
exports.updateOrderCommentary = function (id, commentary) {
    db.prepare('UPDATE orders SET commentary = ? where id = ?').run(commentary, id);
}

exports.updateOrderState = function (id, state) {
    fs.readFile('./json/orders.json', (err, data) => {
        if (err) throw err;
        let orders = JSON.parse(data);
        orders[id - 1].state = state;
        fs.writeFileSync('./json/orders.json', JSON.stringify(orders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });
    db.prepare('UPDATE orders SET state = ? WHERE id = ?').run(state, id);
}

exports.setState = function (orderIndex, state) {
    db.prepare('UPDATE orders SET state = ? WHERE orderIndex = ?').run(state, orderIndex);
}

exports.updateCrossOrder = function(crossOrderIndex, productsList, closeDate){
    //Check if the the productsList is empty
    if(productsList.length == 0){
        //Get the crossOrderOwner Id
        let crossOrderOwner = db.prepare('SELECT crossOrderOwner FROM crossOrders WHERE crossOrderIndex = ?').get(crossOrderIndex).crossOrderOwner;
        //Get the orderOwner Id
        let orderOwner = db.prepare('SELECT ownerIndex FROM orders WHERE orderIndex = (SELECT originalOrderIndex FROM crossOrders WHERE crossOrderIndex = ?)').get(crossOrderIndex).ownerIndex;
        //Check if the crossOrderOwner is the same as the orderOwner, if yes delete the order, else delete the crossOrder
        if(crossOrderOwner == orderOwner){
            return deleteOrderLocal(orderOwner);
        }
        return deleteCrossOrderLocal(crossOrderIndex);
    }
    //Set the quantity of all products in the crossOrder to 0
    db.prepare('UPDATE productInventory SET quantity = 0 WHERE crossOrderIndex = ?').run(crossOrderIndex);
    for (let indexProduct = 0; indexProduct < productsList.length; indexProduct++) {
        //Set the new quantity of the product
        db.prepare('UPDATE productInventory SET quantity = ? WHERE productIndex = ? AND crossOrderIndex = ?').run(productsList[indexProduct][1], productsList[indexProduct][0], crossOrderIndex);
    }
    let orderIndex = db.prepare('SELECT originalOrderIndex FROM crossOrders WHERE crossOrderIndex = ?').get(crossOrderIndex).originalOrderIndex;
    updateOrderDate(orderIndex, closeDate);
    fs.readFile('./json/crossOrders.json', (err, data) => {
        if (err) throw err;
        let crossOrders = JSON.parse(data);
        for (let indexCrossOrder = 0; indexCrossOrder < crossOrders.length; indexCrossOrder++) {
            if (crossOrders[indexCrossOrder].crossOrderIndex == crossOrderIndex) {
                crossOrders[indexCrossOrder].productInventory = productsList;
                break;
            }
            
        }
        fs.writeFileSync('./json/crossOrders.json', JSON.stringify(crossOrders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });
    console.log('Cross Order updated');
}

exports.closeOrder = function (orderIndex) {
    db.prepare('UPDATE orders SET closeDate = ? WHERE orderIndex = ?').run(new Date().toISOString().slice(0, 19).replace('T', ' '), orderIndex);
    db.prepare('UPDATE orders SET state = ? WHERE orderIndex = ?').run(0, orderIndex);
    console.log('Order closed');
}

function updateOrderDate(orderIndex, date) {
    console.log(date)
    //up to date the close date of the order
    db.prepare('UPDATE orders SET closeDate = ? WHERE orderIndex = ?').run(date, orderIndex);
    // up to date the json file
    fs.readFile('./json/orders.json', (err, data) => {
        if (err) throw err;
        let orders = JSON.parse(data);
        for (let indexOrder = 0; indexOrder < orders.length; indexOrder++) {
            if (orders[indexOrder].orderIndex == orderIndex) {
                orders[indexOrder].closeDate = date;
                break;
            }
            
            
        }
        fs.writeFileSync('./json/orders.json', JSON.stringify(orders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });
}

// DELETE

function deleteOrderLocal(orderIndex) {

    //get crossOrders ensued from the order
    let crossOrders = db.prepare('SELECT crossOrderIndex FROM crossOrders WHERE originalOrderIndex = ?').all(orderIndex);
    //delete all products of the crossOrders
    for (let indexCrossOrder = 0; indexCrossOrder < crossOrders.length; indexCrossOrder++) {
        db.prepare('DELETE FROM productInventory WHERE crossOrderIndex = ?').run(crossOrders[indexCrossOrder].crossOrderIndex);
    }
    //delete all crossOrders
    db.prepare('DELETE FROM crossOrders WHERE originalOrderIndex = ?').run(orderIndex);
    //delete the order
    db.prepare('DELETE FROM orders WHERE orderIndex = ?').run(orderIndex);

    //delete the order from the json file
    
    fs.readFile('./json/crossOrders.json', (err, data) => {
        if (err) throw err;
        let crossOrders = JSON.parse(data);
        //parse all the crossOrder to find the one to delete
        for (let indexCrossOrder = 0; indexCrossOrder < crossOrders.length; indexCrossOrder++) {
            if (crossOrders[indexCrossOrder].originalOrderIndex == orderIndex) {
                //delete the crossOrder
                crossOrders.splice(indexCrossOrder, 1);
            }
        }
        //write the new json file
        fs.writeFileSync('./json/crossOrders.json', JSON.stringify(crossOrders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });

    //delete the order from the json file
    fs.readFile('./json/orders.json', (err, data) => {
        if (err) throw err;
        let orders = JSON.parse(data);
        //parse all the order to find the one to delete
        for (let indexOrder = 0; indexOrder < orders.length; indexOrder++) {
            if (orders[indexOrder].orderIndex == orderIndex) {
                //delete the order
                orders.splice(indexOrder, 1);
                break;
            }
        }
        //write the new json file
        fs.writeFileSync('./json/orders.json', JSON.stringify(orders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });

    console.log('Order deleted');
}

exports.deleteOrder = function (orderIndex) {
    return deleteOrderLocal(orderIndex);
}

function deleteCrossOrderLocal(crossOrderIndex) {

    //delete all products of the crossOrder
    db.prepare('DELETE FROM productInventory WHERE crossOrderIndex = ?').run(crossOrderIndex);
    //delete the crossOrder
    db.prepare('DELETE FROM crossOrders WHERE crossOrderIndex = ?').run(crossOrderIndex);
    console.log('Cross Order deleted');

    //delete the crossOrder from the json file
    fs.readFile('./json/crossOrders.json', (err, data) => {
        if (err) throw err;
        let crossOrders = JSON.parse(data);
        //parse all the crossOrder to find the one to delete
        for (let indexCrossOrder = 0; indexCrossOrder < crossOrders.length; indexCrossOrder++) {
            if (crossOrders[indexCrossOrder].crossOrderIndex == crossOrderIndex) {
                //delete the crossOrder
                crossOrders.splice(indexCrossOrder, 1);
                break;
            }
        }
        //write the new json file
        fs.writeFileSync('./json/crossOrders.json', JSON.stringify(crossOrders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });
    
}

exports.deleteCrossOrder = function (crossOrderIndex) {
    return deleteCrossOrderLocal(crossOrderIndex);
}

//CHECK 

exports.hasACrossOrder = function (orderIndex, userIndex) {
    return db.prepare('SELECT COUNT(*) FROM crossOrders WHERE originalOrderIndex = ? AND crossOrderOwner = ?').get(orderIndex, userIndex)['COUNT(*)'];
}