const fs = require('fs');
const path = require('path');

const { Config } = require('../config');

const Database = require('./database');

async function registerUser(ctx) {
    let user = await Database.getUser(ctx.from.id);

    if (user == undefined) {
        user = {
            id: ctx.from.id,
            username: ctx.from.username,
            phone: null,
            date: new Date().getTime(),
            status: isAdmin(ctx.from.id)
        };

        await Database.addUser(user);
    }
}

async function checkMetadata(ctx) {
    if (ctx.update.message.text) {
        if (String(ctx.update.message.text).includes('accept')) {
            let uuid = String(ctx.update.message.text).replace('/start accept-', '');
            // let order = await Database.getOrder();
            return 'accepted';
        }

        if (String(ctx.update.message.text).includes('decline')) {
            console.log('may be declined');
            return 'declined';
        }
    }
}

function isAdmin(id) {
    for (let i = 0; i < Config.bot.owners.length; i++) {
        if (id == Config.bot.owners[i])
            return 'admin';
    }

    return 'user';
}

function getCartResponse(ctx) {
    if (ctx.session.cart) {
        if (ctx.session.cart.length == 0) {
            let text = '🧐 <b>Ви ще нічого не обрали</b>';
            let options = {
                parse_mode: 'HTML'
            }

            return ctx.reply(text, options);
        } else {
            let text = ``
            let options = {
                reply_markup: {
                    inline_keyboard: []
                },
                parse_mode: 'HTML'
            }
            let sum = 0;

            for (let i = 0; i < ctx.session.cart.length; i++) {
                options.reply_markup.inline_keyboard.push([{ text: `${ctx.session.cart[i].name} (${ctx.session.cart[i].options.type}) - ${ctx.session.cart[i].options.price}`, callback_data: `show-${i}` }]);
                sum += ctx.session.cart[i].options.price;
            }

            options.reply_markup.inline_keyboard.push([{ text: 'Підтвердити замовлення', callback_data: 'submit' }]);

            text += `💰 <b><i>Сума: ${sum} грн</i></b>`;

            return ctx.reply(text, options);
        }
    } else {
        let text = '🧐 <b>Спочатку потрібно обрати продукти</b>';
        let options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'В меню', callback_data: 'product' }]
                ]
            },
            parse_mode: 'HTML'
        }

        return ctx.reply(text, options);
    }
}

async function scheduleStatistics(telegram) {
    setInterval(async function () {
        let users = await Database.countUsers();
        let text = `📈 <b>Статистика:</b>\n<b>${new Date().toDateString()} ${new Date().toTimeString()}</b>\n\n<i>В боті зареєстровано ${users['count()']} користувачів</i>`;

        return telegram.sendMessage(Config.statistics.channel.id, text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Перейти в бота', url: 't.me/verandakava_bot' }]
                ]
            },
            parse_mode: 'HTML'
        });
    }, Config.statistics.timeout);
}

function sendProductsResponse(ctx) {
    let array = Config.products[`${ctx.update.callback_query.data}`];

    let response = {
        text: array[ctx.session.current].name,
        image: array[ctx.session.current].image,
        options: {
            reply_markup: {
                inline_keyboard: [
                    [],
                    [{ text: '⏮', callback_data: 'previous' }, { text: `${ctx.session.current + 1}/${array.length}`, callback_data: 'current' }, { text: '⏭', callback_data: 'next' }]
                ]
            },
            parse_mode: 'HTML'
        }
    };

    for (let i = 0; i < array[ctx.session.current].sizes.length; i++) {
        response.options.reply_markup.inline_keyboard[0].push({ text: `${array[ctx.session.current].sizes[i].type} (${array[ctx.session.current].sizes[i].price} грн)`, callback_data: `tocart-${array[ctx.session.current].sizes[i].type}` });
    }

    return ctx.replyWithPhoto({ source: fs.createReadStream(path.resolve(__dirname, '..', 'assets', 'images', 'americano.jpg')) }, { caption: `<b>${array[ctx.session.current].name}</b>`, reply_markup: response.options.reply_markup, parse_mode: 'HTML' });
}

function sendOtherProduct(ctx) {
    let array = Config.products[`${ctx.session.choice}`];

    let response = {
        text: array[ctx.session.current].name,
        image: array[ctx.session.current].image,
        options: {
            reply_markup: {
                inline_keyboard: [
                    [],
                    [{ text: '⏮', callback_data: 'previous' }, { text: `${ctx.session.current + 1}/${array.length}`, callback_data: 'current' }, { text: '⏭', callback_data: 'next' }]
                ]
            },
            parse_mode: 'HTML'
        }
    };

    for (let i = 0; i < array[ctx.session.current].sizes.length; i++) {
        response.options.reply_markup.inline_keyboard[0].push({ text: `${array[ctx.session.current].sizes[i].type} (${array[ctx.session.current].sizes[i].price} грн)`, callback_data: `tocart-${array[ctx.session.current].sizes[i].type}` });
    }

    ctx.deleteMessage();
    return ctx.replyWithPhoto({ source: fs.createReadStream(path.resolve(__dirname, '..', 'assets', 'images', 'americano.jpg')) }, { caption: `<b>${array[ctx.session.current].name}</b>`, reply_markup: response.options.reply_markup, parse_mode: 'HTML' });
}

function addProductToCart(ctx) {
    let array = String(ctx.update.callback_query.data).split('-');

    let query = {
        payload: array[0],
        data: array[1]
    };

    if (ctx.session.cart == undefined)
        ctx.session.cart = [];

    let product = {
        name: ctx.session.products[ctx.session.choice][ctx.session.current].name,
        options: ctx.session.products[ctx.session.choice][ctx.session.current].sizes.find(function (item) {
            if (item.type == query.data)
                return item.price;
        })
    };

    ctx.session.cart.push(product);

    return ctx.answerCbQuery('Товар додано до кошику!', true);
}

function requestPhoneNumber(ctx) {
    let response = {
        text: '<b>Відправте свій номер телефону</b>\n\n<i>Ми швидко вам зателефонуємо щоб підтвердити замовлення</i>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '📱 Відправити номер', request_contact: true }],
                    [{ text: '❌ Скасувати' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    }

    return ctx.reply(response.text, response.options);
}

function requestLocation(ctx) {
    let response = {
        text: '<b>Відправте геолокацію</b>\n\n<i>Ми перевіряємо чи зможемо доставити вам каву до того як вона стане холодною</i>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '🗺 Відправити геолокацію', request_location: true }],
                    [{ text: '❌ Скасувати' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    }

    return ctx.reply(response.text, response.options);
}

function placeOrder(ctx, order) {
    let text = `<b>${new Date().toTimeString()}</b>\n\n<i>+${order.user.phone_number} ${order.user.first_name}</i>\n\n`;
    let options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ Підтвердити замовлення', url: `t.me/verandakava_bot?start=accept-${order.id}` }],
                [{ text: '❌ Скасувати замовлення', url: `t.me/verandakava_bot?start=decline-${order.id}` }],
                [{ text: '📤 Написати клієнту', url: `t.me/${ctx.from.username}` }, { text: '🗺 Maps', url: `https://maps.google.com/maps?q=${order.location.latitude},${order.location.longitude}` }],
            ]
        },
        parse_mode: 'HTML'
    }

    for (let i = 0; i < order.cart.length; i++)
        text += `${order.cart[i].name} (${order.cart[i].options.type}) <b>${order.cart[i].options.price} грн</b>\n`

    ctx.session.cart = [];

    return ctx.telegram.sendMessage(Config.orders.channel.id, text, options);
}

module.exports = {
    registerUser,
    checkMetadata,
    getCartResponse,
    scheduleStatistics,
    addProductToCart,
    sendOtherProduct,
    sendProductsResponse,
    requestPhoneNumber,
    requestLocation,
    placeOrder
};