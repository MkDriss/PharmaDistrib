'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');
const directoryPath = 'D:\\Projets\\PharmaDistrib\\csv';

const fileList = fs.readdirSync(directoryPath);

db.prepare('DROP TABLE IF EXISTS products').run();
console.log('Products table dropped');
db.prepare('CREATE TABLE IF NOT EXISTS products (ean13 INT PRIMARY KEY,' +
      'laboratory TEXT, name TEXT, price FLOAT, packaging TEXT, qtyMin TEXT)').run();

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
      loadProducts(directoryPath + '\\' + file);
}





//CREATE

exports.insertProduct = function (ean13, laboratory, name, packaging, price, qtyMin) {
      try {
            db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)').run(ean13, laboratory, name, packaging, price, qtyMin);
            console.log('Product inserted');
      } catch (err) {
      }
};

//GET

exports.get = function (ean13) {
      return db.prepare('SELECT * FROM products WHERE ean13 = ?').get(ean13);
}

exports.list = function () {
      return db.prepare('SELECT * FROM products').all();
}

//UPDATE

exports.updateProduct = function (ean13, laboratory, name, packaging, price, qtyMin) {

      fs.readFile('json/products.json', function (err, data) {
            if (err) throw err;
            let productsList = JSON.parse(data);
            for (let i = 0; i < productsList.length; i++) {
                  let product = productsList[i];
                  if (product.ean13 === ean13) {
                        product.username = username;
                        product.userLastName = userLastName;
                        product.adress = adress;
                        product.city = city;
                        product.zipCode = zipCode;
                        product.phone = phone;
                        product.profilePicture = pictureName;
                  }
            }
            fs.writeFileSync('json/accounts.json', JSON.stringify(productsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });

      db.prepare('UPDATE user SET username = ?, userLastName = ?, adress = ?, city = ?, zipCode = ?, phone = ?, profilePicture = ? WHERE id = ?').run(username, userLastName, adress, city, zipCode, phone, pictureName, id);
      console.log("Account updated");
}

exports.updateAccountPassword = function (password, token) {
      try {
            console.log(password, token)
            db.prepare('UPDATE user SET password = ? WHERE token = ?').run(password, token);
            console.log('Password updated');
      } catch (err) {
            console.log(err)
      }
}


//DELETE

exports.delete = function (id) {
      db.prepare('DELETE FROM user WHERE id = ?').run(id);
}


