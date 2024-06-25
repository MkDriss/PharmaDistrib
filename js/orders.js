'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

let loadProduct = function (filename) {

    const orders = JSON.parse(fs.readFileSync(filename));

    db.prepare('DROP TABLE IF EXISTS orders').run();
    console.log('orders table dropped');
    db.prepare('CREATE TABLE IF NOT EXISTS orders (id INT, owner TEXT, productsListId INT)').run();
    let insertOrder = db.prepare('INSERT INTO orders VALUES (?, ?, ?)');
    let transaction = db.transaction((orders) => {
        for (let tempOrder = 0; tempOrder < orders.length; tempOrder++) {
            let order = orders[tempOrder];
            insertOrder.run(order.id, order.userId, order.userEmail, order.userName, order.userLastName, order.userAdress, order.userCity, order.userPostCode, order.userPhoneNumber, order.products, order.price, order.commentary, order.date, order.state);
        }
    });

    transaction(orders);
}

loadProduct('./json/orders.json');

//CREATE

exports.createOrder = function (userId, userEmail, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, products, price, commentary, date, state) {
    let newOrder = {
        "userId": userId,
        "userEmail": userEmail,
        "userName": userName,
        "userLastName": userLastName,
        "userAdress": userAdress,
        "userCity": userCity,
        "userPostCode": userPostCode,
        "userPhoneNumber": userPhoneNumber,
        "products": products,
        "price": price,
        "commentary": commentary,
        "date": date,
        "state": state
    };
    try {
        fs.readFile('./json/orders.json', (err, data) => {
            if (err) throw err;
            let orders = JSON.parse(data);
            orders.push(newOrder)
            fs.writeFileSync('./json/orders.json', JSON.stringify(orders, null, 2), function (err) {
                if (err) throw err;
                console.log(err);
            });

        });
        db.prepare('INSERT INTO orderList (userId, userEmail, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, products, price, commentary, date,  state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(userId, userEmail, userName, userLastName, userAdress, userCity, userPostCode, userPhoneNumber, products, price, commentary, date, state);
        console.log('Order created');
    } catch (err) {
        console.log(err);
    }

}

// GET

exports.getOrderFromId = function (id) {
    return db.prepare('SELECT * FROM orderList WHERE id = ?').get(id);
}

exports.getOrdersFromUserId = function (userId) {
    return db.prepare('SELECT * FROM orderList WHERE userId = ?').all(userId);
}

//UPDATE

exports.updateOrderCommentary = function (id, commentary) {
    db.prepare('UPDATE orderList SET commentary = ? where id = ?').run(commentary, id);
}

exports.updateOrderState = function (id, state) {
    fs.readFile('./json/orders.json', (err, data) => {
        if (err) throw err;
        let orders = JSON.parse(data);
        console.log(id);
        console.log(state);
        orders[id - 1].state = state;
        fs.writeFileSync('./json/orders.json', JSON.stringify(orders, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
        });
    });

    db.prepare('UPDATE orderList SET state = ? WHERE id = ?').run(state, id);
}


// LIST
exports.listOrders = function () {
    return db.prepare('SELECT * FROM orderList').all();
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
    db.prepare('DELETE FROM orderList WHERE id = ?').run(id);
    console.log('Order deleted');
}