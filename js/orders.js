'use strict';

const Sqlite = require('better-sqlite3');
const { Console } = require('console');
const fs = require('fs');
let db = new Sqlite('db.sqlite');


let initDatabase = function() {

    db.prepare('DROP TABLE IF EXISTS productInventory').run();
    console.log("Product Inventory table dropped");
    db.prepare('DROP TABLE IF EXISTS crossOrders').run();
    console.log('Cross Orders table dropped');
    db.prepare('DROP TABLE IF EXISTS orders').run();
    console.log('orders table dropped');

    db.prepare('CREATE TABLE IF NOT EXISTS orders (orderIndex INTEGER PRIMARY KEY AUTOINCREMENT, ownerIndex TEXT, openDate TEXT, closeDate TEXT, state boolean)').run();
    db.prepare('CREATE TABLE IF NOT EXISTS crossOrders (crossOrderIndex INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'originalOrderIndex INTEGER, crossOrderOwner TEXT,' +
        'FOREIGN KEY(originalOrderIndex) REFERENCES orders(orderIndex))').run();
    db.prepare('CREATE TABLE IF NOT EXISTS productInventory (orderIndex INTEGER, crossOrderIndex INTEGER, productIndex TEXT, quantity INT,' +
        'FOREIGN KEY(crossOrderIndex) REFERENCES crossOrders(crossOrderIndex),' + 
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
    fs.readFile('./json/orders.json', (err, data) => {
        let newCrossOrder = {
            "crossOrderIndex": crossOrderOwnerIndex,
            "originalOrderIndex": originalOrderIndex,
            "crossOrderOwner": ownerIndex,
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

exports.getCrossOrders = function (){
    return db.prepare('SELECT * FROM crossOrders ORDER BY crossOrderIndex DESC').all();
}

exports.getCrossOrder = function (crossOrderIndex) {
    return db.prepare('SELECT * FROM crossOrders WHERE originalOrderIndex = ?').all(crossOrderIndex);
}

exports.getProductsListFromOrderIndex = function (orderIndex) {
    return db.prepare('SELECT * FROM productInventory WHERE orderIndex = ?').all(orderIndex)
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

exports.setState = function(orderIndex, state) {
    db.prepare('UPDATE orders SET state = ? WHERE orderIndex = ?').run(state, orderIndex);
}

// DELETE

exports.deleteOrderFromId = function (id) {
    fs.readFile('./json/orders.json', (err, data) => {
        if (err) throw err;
        let orders = JSON.parse(data);
        orders.splice(id - 1, 1);
        fs.writeFileSync('./json/orders.json', JSON.stringify(orders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    console.log('Order deleted');
}