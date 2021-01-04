const Config = {
    bot: {
        token: '1408540427:AAG59xmYctTOKiOlzjq4AGObpeKifg4D4VU',
        owners: [
            298784500,
            455387394
        ],
        message: 'Bot has been launched',
    },
    database: {
        filename: 'verandakava.sqlite',
        queries: [
            `CREATE TABLE IF NOT EXISTS "users" (
                "id"	    INTEGER UNIQUE,
                "username"	TEXT,
                "phone"	    TEXT,
                "date"	    INTEGER,
                "status"	TEXT,
                PRIMARY KEY("id")
            )`,
            `CREATE TABLE IF NOT EXISTS "qrcodes" (
                "uuid"	    TEXT UNIQUE,
                "type"	    TEXT,
                "data"	    TEXT,
                "date"	    INTEGER,
                "owner"	    INTEGER,
                "status"	INTEGER,
                PRIMARY KEY("uuid")
            )`,
            `CREATE TABLE IF NOT EXISTS "orders" (
                "id"	        TEXT UNIQUE,
                "date"	        INTEGER,
                "user"	        INTEGER,
                "phone"	        TEXT,
                "name"	        TEXT,
                "cart_JSON"	    TEXT,
                "location_JSON"	TEXT,
                "status"        TEXT,
                PRIMARY KEY("id")
            )`
        ]
    },
    statistics: {
        channel: {
            id: -1001490455951
        },
        timeout: 360000
    },
    orders: {
        channel: {
            id: -1001442033120
        }
    },
    delivery: {
        price: 0
    },
    products: {
        coffe: [
            {
                name: 'Американо',
                image: 'americano.jpg',
                sizes: [
                    {
                        type: 'S',
                        price: 15
                    },
                    {
                        type: 'M',
                        price: 20
                    },
                    {
                        type: 'L',
                        price: 25
                    }
                ]
            },
            {
                name: 'Еспресо',
                image: 'americano.jpg',
                sizes: [
                    {
                        type: 'S',
                        price: 30
                    },
                    {
                        type: 'фредо',
                        price: 25
                    },
                    {
                        type: 'L',
                        price: 40
                    }
                ]
            },
            {
                name: 'Лунго',
                image: 'americano.jpg',
                sizes: [
                    {
                        type: 'S',
                        price: 15
                    },
                    {
                        type: 'M',
                        price: 20
                    },
                    {
                        type: 'L',
                        price: 25
                    }
                ]
            },
        ],
        interesting: [
            {
                name: 'Амеркано Interesting',
                image: 'americano.jpg',
                sizes: [
                    {
                        type: 'S',
                        price: 15
                    },
                    {
                        type: 'M',
                        price: 20
                    },
                    {
                        type: 'L',
                        price: 25
                    }
                ]
            },
        ],
        food: [
            {
                name: 'Паніні',
                image: 'americano.jpg',
                sizes: [
                    {
                        type: 'Стандарт',
                        price: 30
                    }
                ]
            }
        ]
    }
};

module.exports = { Config };