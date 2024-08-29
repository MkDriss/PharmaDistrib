'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

let loadAccount = function (filename) {

      const accounts = JSON.parse(fs.readFileSync(filename));
      db.prepare('DROP TABLE IF EXISTS user').run();
      console.log('Account table dropped');
      db.prepare('CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY,' +
            'userName TEXT, userLastName TEXT, email TEXT, password TEXT, token TEXT, admin BOOLEAN, adress TEXT, city TEXT, zipCode TEXT, phone TEXT, profilePicture TEXT, verified BOOLEAN)').run();
      db.prepare('DROP TABLE IF EXISTS whishlist').run();

      let insertAccount = db.prepare('INSERT INTO user VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      let transaction = db.transaction((accounts) => {
            for (let i = 0; i < accounts.length; i++) {
                  let account = accounts[i];
                  insertAccount.run(account.id, account.username, account.userLastName, account.email, account.password, account.token, account.admin, account.adress, account.city, account.zipCode, account.phone, account.profilePicture, account.verified);
            }
      });

      transaction(accounts);
}

loadAccount('json/accounts.json');

//CREATE

exports.create = function (id, email, username, password, token) {
      let newAccount = {
            "id": id,
            "username": username,
            "userLastName": "",
            "email": email,
            "token": token,
            "password": password,
            "admin": 0,
            "adress": "",
            "city": "",
            "zipCode": "",
            "phone": "",
            "profilePicture": "account.svg",
            "verified": 0
      };

      fs.readFile('./json/accounts.json', (err, data) => {
            if (err) throw err;
            let accountsList = JSON.parse(data);
            accountsList.push(newAccount);
            fs.writeFile('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                  if (err) console.log(err);
            });
      });
      try {
            db.prepare('INSERT INTO user VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, username, "", email, password, token, 0, "", "", "", "", "defaultAccountIco.png", 0);
            console.log('Account created');
      } catch (err) {
            console.log(err);
      }
};

//GET

exports.getPasswordFromId = function (id) {
      return db.prepare('SELECT password FROM user WHERE id = ?').get(id).password;
}

exports.getIdFromEmail = function (email) {
      return db.prepare('SELECT id FROM user WHERE email = ?').get(email);
}

exports.get = function (id) {
      return db.prepare('SELECT * FROM user WHERE id = ?').get(id);
}

exports.getName = function (id) {
      return db.prepare('SELECT username FROM user WHERE id = ?').get(id);
}

exports.getProfilePicture = function (id) {
      return db.prepare('SELECT profilePicture FROM user WHERE id = ?').get(id);
}

exports.getLastName = function (id) {
      return db.prepare('SELECT userLastName FROM user WHERE id = ?').get(id);
}

exports.getAdress = function (id) {
      return db.prepare('SELECT adress FROM user WHERE id = ?').get(id);
}

exports.getCity = function (id) {
      return db.prepare('SELECT city FROM user WHERE id = ?').get(id);
}
exports.getPostalCode = function (id) {
      return db.prepare('SELECT zipCode FROM user WHERE id = ?').get(id);
}

exports.list = function () {
      return db.prepare('SELECT * FROM user').all();
}

exports.getUnverifiedAccounts = function () {
      return db.prepare('SELECT * FROM user WHERE verified = 0').all();
}

exports.getLastAccounts = function () {
      return db.prepare('SELECT * FROM user WHERE verified = 1 LIMIT 3').all();
}


// SET

exports.setAdmin = function (id) {
      fs.readFile('json/accounts.json', function (err, data) {
            if (err) throw err;
            let accountsList = JSON.parse(data);
            for (let i = 0; i < accountsList.length; i++) {
                  let account = accountsList[i];
                  if (account.id === userId) {
                        account.admin = 1;
                  }
            }
            fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      db.prepare('UPDATE user SET admin = 1 WHERE id = ?').run(id);
}

//CHECK 

exports.checkEmail = function (email) {
      if (db.prepare('SELECT * FROM user WHERE email = ?').get(email) == undefined) {
            return 'false';
      }
      return 'true';
};

exports.authenticate = function (email, password) {
      let account = db.prepare('SELECT * FROM user WHERE email = ?').get(email)
      if (account === undefined || account.verified != 1) {
            console.log('An error occured, please try again.');
            return false;
      }
      let pass = db.prepare('SELECT password FROM user WHERE email = ?').get(email).password;
      if (pass == password) {
            return true;
      }
      return false;
}

//UPDATE

exports.updateAccount = function (id, username, userLastName, adress, city, zipCode, phone, pictureName) {

      try {


            fs.readFile('json/accounts.json', function (err, data) {
                  if (err) throw err;
                  let accountsList = JSON.parse(data);
                  for (let i = 0; i < accountsList.length; i++) {
                        let account = accountsList[i];
                        if (account.id === id) {
                              account.username = username;
                              account.userLastName = userLastName;
                              account.adress = adress;
                              account.city = city;
                              account.zipCode = zipCode;
                              account.phone = phone;
                              account.profilePicture = pictureName;
                        }
                  }
                  fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                        if (err) throw err;
                        console.log(err);
                  });
            });

            db.prepare('UPDATE user SET username = ?, userLastName = ?, adress = ?, city = ?, zipCode = ?, phone = ?, profilePicture = ? WHERE id = ?').run(username, userLastName, adress, city, zipCode, phone, pictureName, id);
            console.log("Account updated");
      } catch (err) {
            console.log(err)
      }
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

exports.updtateAccountAdmin = function (id, name, lastName, address, city, postCode, phone, state, role) {
      console.log(name, lastName)
      try {
            fs.readFile('json/accounts.json', function (err, data) {
                  if (err) throw err;
                  let accountsList = JSON.parse(data);
                  for (let i = 0; i < accountsList.length; i++) {
                        let account = accountsList[i];
                        if (account.id === id) {
                              account.username = name;
                              account.userLastName = lastName;
                              account.adress = address;
                              account.city = city;
                              account.zipCode = postCode;
                              account.phone = phone;
                              account.verified = parseInt(state);
                              account.admin = parseInt(role);
                        }
                  }
                  fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                        if (err) throw err;
                        console.log(err);
                  });
            });

            db.prepare('UPDATE user SET username = ?, userLastName = ?, adress = ?, city = ?, zipCode = ?, phone = ?, admin = ?, verified = ? WHERE id = ?').run(name, lastName, address, city, postCode, phone, role, state, id);
            console.log("Account updated");
      } catch (err) {
            console.log(err)
      }
}

exports.verifyAccount = function (token) {
      try {
            fs.readFile('json/accounts.json', function (err, data) {
                  if (err) throw err;
                  let accountsList = JSON.parse(data);
                  for (let i = 0; i < accountsList.length; i++) {
                        let account = accountsList[i];
                        if (account.token === token) {
                              account.verified = 1;
                        }
                  }
                  fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                        if (err) throw err;
                        console.log(err);
                  });
            });
            db.prepare('UPDATE user SET verified = 1 WHERE token = ?').run(token);
      } catch (err) {
            console.log(err);
      }
}

//DELETE

exports.delete = function (id) {
      db.prepare('DELETE FROM user WHERE id = ?').run(id);
}

exports.rejectAccount = function (token) {
      try {
            db.prepare('DELETE FROM user WHERE token = ?').run(token);
            fs.readFile('json/accounts.json', function (err, data) {
                  if (err) throw err;
                  let accountsList = JSON.parse(data);
                  for (let i = 0; i < accountsList.length; i++) {
                        let account = accountsList[i];
                        if (account.token === token) {
                              accountsList.splice(i, 1);
                        }
                  }
                  fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                        if (err) throw err;
                        console.log(err);
                  });
            });
      } catch (err) {
            console.log(err);
      }
}



