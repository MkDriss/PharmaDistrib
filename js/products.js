'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');
const directoryPath = './csv';

const fileList = fs.readdirSync(directoryPath);

//INIT
db.prepare('DROP TABLE IF EXISTS products').run();
console.log('Products table dropped');
db.prepare('DROP TABLE IF EXISTS files').run();
console.log('files table dropped');

db.prepare('CREATE TABLE IF NOT EXISTS files (fileIndex INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, size FLOAT)').run();
db.prepare('CREATE TABLE IF NOT EXISTS products (ean13 INT PRIMARY KEY, laboratoryName TEXT, productName TEXT, price FLOAT,' + 
      'packaging INT, qtyMin INT, fileIndex INTEGER, available boolean)').run();


let loadProducts = function (filename, fileIndex) {
      let insertProduct = db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
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
                        insertProduct.run(fields[2], fields[3], fields[5], fields[7], fields[9], fields[10], fileIndex, 1);
                  } catch {
                        continue;
                  }
            }
            console.log('Products loaded')
      });

}

for (let i = 0; i < fileList.length; i++) {
      let file = fileList[i];
      let size = Math.ceil(fs.statSync(directoryPath + '/' + file).size / 1024);
      db.prepare('INSERT INTO files (filename, size) VALUES (?, ?)').run(file, size);
      let fileIndex = db.prepare('SELECT MAX(fileIndex) FROM files').get()['MAX(fileIndex)']

      loadProducts(directoryPath + '/' + file, fileIndex);
}

//INSERT

exports.insertProduct = function (ean13, laboratory, productName, packaging, price, qtyMin) {
      try {
            db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)').run(ean13, laboratory, productName, packaging, price, qtyMin);
            console.log('Product inserted');
      } catch (err) { }
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
      return db.prepare('SELECT * FROM products where available = 1').all();
}

exports.getFiles = function () {
      return db.prepare('SELECT * FROM files').all();
}

exports.getProductsFromFile = function (fileIndex) {
      return db.prepare('SELECT * FROM products where fileIndex = ?').all(fileIndex)
}

exports.getFileName = function (fileIndex) {
      return db.prepare('SELECT fileName FROM files where fileIndex = ?').get(fileIndex).filename;
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

// DELETE

exports.delete = function (ean13) {
      db.prepare('DELETE FROM user WHERE ean13 = ?').run(ean13);
}

exports.deleteFile = function (fileIndex) {
      let fileName = db.prepare('SELECT fileName FROM files WHERE fileIndex = ?').get(fileIndex).filename;
      console.log(directoryPath + '/' + fileName)
      fs.unlinkSync(directoryPath + '/' + fileName);
      db.prepare('UPDATE products SET available = 0 WHERE fileIndex = ?').run(fileIndex)
      db.prepare('DELETE FROM files WHERE fileIndex = ?').run(fileIndex);
      return console.log(fileName + 'deleted')
}
