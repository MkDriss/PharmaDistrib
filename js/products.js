'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');
const directoryPath = './csv';

const fileList = fs.readdirSync(directoryPath);

//INIT

db.prepare('DROP TABLE IF EXISTS products').run();
console.log('Products table dropped');
db.prepare('CREATE TABLE IF NOT EXISTS products (ean13 INT PRIMARY KEY,' +
      'laboratoryName TEXT, productName TEXT, price FLOAT, packaging INT, qtyMin INT)').run();
db.prepare('DROP TABLE IF EXISTS files').run();
db.prepare('CREATE TABLE IF NOT EXISTS files (filename TEXT PRIMARY KEY)').run();

let loadProducts = function (filename) {
      let insertProduct = db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)');
      fs.readFile(filename, "utf8", (err, data) => {
            if (err) {
                  console.error("Error while reading:", err);
                  return;
            }
            const lines = data.split("\n");
            for (let i = 1; i < lines.length; i++) {
                  let fields = lines[i].split(";");
                  try {
                        fields[10] = fields[10].replace('\r', '');
                        insertProduct.run(fields[2], fields[3], fields[5], fields[7], fields[9], fields[10]);
                  } catch {
                        continue;
                  }
            }
            console.log('Products loaded')
      });

}

for (let i = 0; i < fileList.length; i++) {
      let file = fileList[i];
      db.prepare('INSERT INTO files VALUES (?)').run(file);
      loadProducts(directoryPath + '/' + file);
}

//INSERT

exports.insertProduct = function (ean13, laboratory, productName, packaging, price, qtyMin) {
      try {
            db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)').run(ean13, laboratory, productName, packaging, price, qtyMin);
            console.log('Product inserted');
      } catch (err) {}
};

//GET

exports.getFromEan = function (ean13) {
      return db.prepare('SELECT * FROM products WHERE ean13 = ?').get(ean13);
}

exports.getLaboratoryProducts = function (laboratoryName) {
      return db.prepare('SELECT * FROM products WHERE laboratoryName = ?').all(laboratoryName);
}

exports.getLaboratories = function () {
      return db.prepare('SELECT DISTINCT laboratoryName FROM products').all();
}

exports.list = function () {
      return db.prepare('SELECT * FROM products').all();
}

exports.getFiles = function () {
      return db.prepare('SELECT * FROM files').all();
}

//UPDATE

exports.updateProduct = function (ean13, laboratoryName, productName, packaging, price, qtyMin) {
      try {
            db.prepare('UPDATE products SET laboratoryName = ?, productName = ?, packaging = ?, price = ?, qtyMin = ? WHERE ean13 = ?').run(laboratoryName, productName, packaging, price, qtyMin, ean13);
            console.log("Account updated");
      } catch {
            console.log(err);
      }
}

exports.delete = function (ean13) {
      db.prepare('DELETE FROM user WHERE ean13 = ?').run(ean13);
}


