const path = require('path');

const { Config } = require('../config');
const { Database } = require('sqlite3');

const database = new Database(path.resolve(__dirname, '..', 'data', Config.database.filename), function (error) {
    if (error)
        throw new Error(error.message);

    Config.database.queries.map(function (query, index) {
        database.run(query, function (error) {
            if (error)
                throw new Error(`Failed to prepare database - invalid query: ${index}, reason: ${error.message}`);
        });
    });
});

async function addUser(user) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT INTO "users" VALUES (:id, :username, :phone, :date, :status)`, {
            ':id': user.id,
            ':username': user.username,
            ':phone': user.phone,
            ':date': user.date,
            ':status': user.status
        }, function (error) {
            if (error)
                reject(error);

            resolve(user);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

async function getUser(id) {
    return new Promise(function (resolve, reject) {
        database.get(`SELECT * FROM "users" WHERE id = :id`, {
            ':id': id
        }, function (error, row) {
            if (error)
                reject(error);

            resolve(row);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

async function updateUser(user) {
    return new Promise(function (resolve, reject) {
        database.run(`UPDATE "users" SET phone = :phone, status = :status WHERE id = :id`, {
            ':id': user.id,
            ':phone': user.phone,
            ':status': user.status
        }, function (error) {
            if (error)
                reject(error);

            resolve(user);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

async function deleteUser(id) {
    return new Promise(function (resolve, reject) {
        database.run(`DELETE FROM "users" WHERE id = :id`, {
            ':id': id
        }, function (error) {
            if (error)
                reject(error);

            resolve(id);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

async function countUsers() {
    return new Promise(function (resolve, reject) {
        database.get(`SELECT count() FROM "users"`, function (error, row) {
            if (error)
                reject(error);

            resolve(row);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

async function addOrder(order) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT INTO "orders" VALUES (:id, :date, :user, :phone, :name, :cart_JSON, :location_JSON, :status)`, {
            ':id': order.id,
            ':date': order.date,
            ':user': order.user.user_id,
            ':phone': order.user.phone_number,
            ':name': order.user.first_name,
            ':cart_JSON': JSON.stringify(order.cart),
            ':location_JSON': JSON.stringify(order.location),
            ':status': 'pending'
        }, function (error) {
            if (error)
                reject(error);

            resolve(order);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

async function getOrder(uuid) {
    return new Promise(function (resolve, reject) {
        database.get(`SELECT * FROM "orders" WHERE id = :id`, {
            ':id': uuid
        }, function (error, row) {
            if (error)
                reject(error);

            resolve(row);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

async function updateOrder(order) {
    return new Promise(function (resolve, reject) {
        database.run(`UPDATE "orders" SET status = :status WHERE id = :id`, {
            ':id': order.id,
            ':status': order.status
        }, function (error) {
            if (error)
                reject(error);

            resolve(order);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

async function getUserOrders(id) {
    return new Promise(function (resolve, reject) {
        database.all(`SELECT * FROM "orders" WHERE user = :id`, {
            ':id': id
        }, function (error, rows) {
            if (error)
                reject(error);

            resolve(rows);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

async function banUser(id) {
    return new Promise(function (resolve, reject) {
        database.run(`UPDATE "users" SET status = :status WHERE id = :id`, {
            ':id': id,
            ':status': 'banned'
        }, function (error) {
            if (error)
                reject(error);

            resolve(id);
        });
    }).catch(function (error) {
        console.error(error.message);
    });
}

module.exports = {
    addUser,
    getUser,
    banUser,
    updateUser,
    deleteUser,
    countUsers,
    addOrder,
    getOrder,
    updateOrder,
    getUserOrders,
}