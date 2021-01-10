const fs = require('fs');
const path = require('path');
const uuid = require('uuid').v4;

const { Config } = require('../config');
const { Products } = require('../data/products');

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
            let order = await Database.getOrder(uuid);

            if (order == undefined)
                return 'unknown';

            order.status = 'accepted';

            ctx.telegram.sendMessage(order.user, `🎉 Ура! Ваше замовлення <b>підтверджено</b>, чекайте доставки`, { parse_mode: 'HTML' });

            await Database.updateOrder(order);
            return 'accepted';
        }

        if (String(ctx.update.message.text).includes('decline')) {
            let uuid = String(ctx.update.message.text).replace('/start decline-', '');
            let order = await Database.getOrder(uuid);

            order.status = 'declined';

            ctx.telegram.sendMessage(order.user, `😢 Ваше засовлення <b>скасовано</b>`, { parse_mode: 'HTML' });

            await Database.updateOrder(order);
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

            options.reply_markup.inline_keyboard.push([{ text: 'Очистити кошик', callback_data: 'clear' }]);
            options.reply_markup.inline_keyboard.push([{ text: 'Підтвердити замовлення', callback_data: 'submit' }]);

            text += `💰 <b><i>Сума: ${sum} грн</i></b>\n`;
            text += `🏃 <b><i>Доставка: ${Config.delivery.price} грн</i></b>`;

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
        let text = `📈 <b>Статистика:</b>\n<b>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</b>\n\n<i>В боті зареєстровано ${users['count()']} користувачів</i>`;

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
    let array = Products[ctx.update.callback_query.data];

    if (ctx.session.cart == undefined)
        ctx.session.cart = [];

    let response = {
        text: `<b>${array[ctx.session.current].name}</b>\n\n<i>${array[ctx.session.current].description}</i>`,
        options: {
            reply_markup: {
                inline_keyboard: [
                    [],
                    [{ text: '⏮', callback_data: 'previous' }, { text: `${ctx.session.current + 1}/${array.length}`, callback_data: 'current' }, { text: '⏭', callback_data: 'next' }],
                    [{ text: `📝 Офомити замовлення (${ctx.session.cart.length})`, callback_data: 'cart' }]
                ]
            },
            parse_mode: 'HTML'
        }
    };

    for (let i = 0; i < array[ctx.session.current].sizes.length; i++) {
        response.options.reply_markup.inline_keyboard[0].push({ text: `${array[ctx.session.current].sizes[i].type} (${array[ctx.session.current].sizes[i].price} грн)`, callback_data: `tocart-${array[ctx.session.current].sizes[i].type}` });
    }

    return ctx.reply(response.text, response.options);
}

function sendOtherProduct(ctx) {
    let array = Products[ctx.session.choice];

    let response = {
        text: `<b>${array[ctx.session.current].name}</b>\n\n<i>${array[ctx.session.current].description}</i>`,
        options: {
            reply_markup: {
                inline_keyboard: [
                    [],
                    [{ text: '⏮', callback_data: 'previous' }, { text: `${ctx.session.current + 1}/${array.length}`, callback_data: 'current' }, { text: '⏭', callback_data: 'next' }],
                    [{ text: `📝 Офомити замовлення (${ctx.session.cart.length})`, callback_data: 'cart' }]
                ]
            },
            parse_mode: 'HTML'
        }
    };

    for (let i = 0; i < array[ctx.session.current].sizes.length; i++) {
        response.options.reply_markup.inline_keyboard[0].push({ text: `${array[ctx.session.current].sizes[i].type} (${array[ctx.session.current].sizes[i].price} грн)`, callback_data: `tocart-${array[ctx.session.current].sizes[i].type}` });
    }

    ctx.deleteMessage();
    return ctx.reply(response.text, response.options);
}

async function addProductToCart(ctx) {
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
            if (item.type == query.data) {
                return item;
            }
        }),
    };

    ctx.session.cart.push(product);

    const inline_keyboard = [
        [],
        [{ text: '⏮', callback_data: 'previous' }, { text: `${ctx.session.current + 1}/${Products[ctx.session.choice].length}`, callback_data: 'current' }, { text: '⏭', callback_data: 'next' }],
        [{ text: `📝 Офомити замовлення (${ctx.session.cart.length})`, callback_data: 'cart' }]
    ];

    let array_kb = Products[ctx.session.choice];

    for (let i = 0; i < array_kb[ctx.session.current].sizes.length; i++)
        inline_keyboard[0].push({ text: `${array_kb[ctx.session.current].sizes[i].type} (${array_kb[ctx.session.current].sizes[i].price} грн)`, callback_data: `tocart-${array_kb[ctx.session.current].sizes[i].type}` });

    await ctx.editMessageReplyMarkup({ inline_keyboard });

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

async function placeOrder(ctx, order) {
    let sum = 0;
    let text = `<b>${new Date().toLocaleTimeString()}</b>\n\n<i>+${order.user.phone_number} ${order.user.first_name}</i>\n\n`;
    let options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ Підтвердити замовлення', url: `t.me/verandakava_bot?start=accept-${order.id}` }],
                [{ text: '❌ Скасувати замовлення', url: `t.me/verandakava_bot?start=decline-${order.id}` }],
                [{ text: '📤 Написати', url: `t.me/${ctx.from.username}` }, { text: '🗺 Карта', url: `https://maps.google.com/maps?q=${order.location.latitude},${order.location.longitude}` }],
                [{ text: '📵 Заблокувати користувача', callback_data: `ban-${ctx.from.id}` }]
            ]
        },
        parse_mode: 'HTML'
    }

    for (let i = 0; i < order.cart.length; i++) {
        text += `${order.cart[i].name} (${order.cart[i].options.type}) <b>${order.cart[i].options.price} грн</b>\n`
        sum += order.cart[i].options.price;
    }

    text += `\n<b>Всього: ${sum} грн</b>\n`;

    ctx.session.cart = [];

    await Database.addOrder(order);
    return ctx.telegram.sendMessage(Config.orders.channel.id, text, options);
}

async function getAccountResponse(ctx) {
    let user = await Database.getUser(ctx.from.id);
    let orders = await Database.getUserOrders(ctx.from.id);

    let response = {
        text: `<b>${user.username || '#' + user.id}</b>\n${new Date(user.date).toLocaleDateString()}\n\n`,
        options: {
            reply_markup: {
                inline_keyboard: []
            },
            parse_mode: 'HTML'
        }
    }

    let status = {
        pending: '🕐',
        accepted: '🏃',
        declined: '❌',
        completed: '✅'
    };

    for (let i = 0; i < orders.length; i++)
        response.options.reply_markup.inline_keyboard.push([{ text: `${status[orders[i].status]} ${new Date(orders[i].date).toLocaleDateString()}`, callback_data: `order-${orders[i].id}` }]);

    if (orders.length == 0)
        response.text += `<i>Ви ще не зробили жодного замовлення</i>`;
    else
        response.text += `<i>Список ваших замовлень:</i>`;

    return ctx.reply(response.text, response.options);
};

async function getOrderDetails(ctx) {
    await ctx.answerCbQuery('Завантаження...');
    let id = String(ctx.update.callback_query.data).replace('order-', '');
    let order = await Database.getOrder(id);

    order.cart = JSON.parse(order.cart_JSON);
    order.location = JSON.parse(order.location_JSON);

    let sum = 0;
    let text = `<b>${new Date(order.date).toLocaleTimeString()}</b>\n\n<i>+${order.phone} ${order.name}</i>\n\n`;
    let options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🗺 Місце доставки', url: `https://maps.google.com/maps?q=${order.location.latitude},${order.location.longitude}` }],
                [{ text: '🔄 Повторити замовлення', callback_data: `repeat-${order.id}` }],
                [{ text: '👻 Приховати', callback_data: 'hide' }],
            ]
        },
        parse_mode: 'HTML'
    }

    for (let i = 0; i < order.cart.length; i++) {
        text += `${order.cart[i].name} (${order.cart[i].options.type}) <b>${order.cart[i].options.price} грн</b>\n`
        sum += order.cart[i].options.price;
    }

    text += `\n<b>Всього: ${sum} грн</b>\n`;

    return ctx.reply(text, options);
}

async function repeatOrder(ctx) {
    let id = String(ctx.update.callback_query.data).replace('repeat-', '');
    let old_order = await Database.getOrder(id);

    let user = await Database.getUser(ctx.from.id);

    if (user.status == 'banned')
        return ctx.answerCbQuery('Ви не можете робити замовлення бо були заблоковані');

    let order = {
        id: uuid(),
        date: new Date().getTime(),
        user: {
            user_id: old_order.user,
            phone_number: old_order.phone,
            first_name: old_order.name
        },
        name: old_order.name,
        cart: JSON.parse(old_order.cart_JSON),
        location: JSON.parse(old_order.location_JSON),
    };

    await Database.addOrder(order);

    let sum = 0;
    let text = `<b>${new Date().toLocaleTimeString()}</b>\n\n<i>+${order.user.phone_number} ${order.user.first_name}</i>\n\n`;
    let options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ Підтвердити замовлення', url: `t.me/verandakava_bot?start=accept-${order.id}` }],
                [{ text: '❌ Скасувати замовлення', url: `t.me/verandakava_bot?start=decline-${order.id}` }],
                [{ text: '📤 Написати', url: `t.me/${ctx.from.username}` }, { text: '🗺 Карта', url: `https://maps.google.com/maps?q=${order.location.latitude},${order.location.longitude}` }],
            ]
        },
        parse_mode: 'HTML'
    }

    for (let i = 0; i < order.cart.length; i++) {
        text += `${order.cart[i].name} (${order.cart[i].options.type}) <b>${order.cart[i].options.price} грн</b>\n`;
        sum += order.cart[i].options.price;
    }

    text += `\n<b>Всього: ${sum} грн</b>\n<b>Доставка: ${Config.delivery.price} грн</b>`;

    await ctx.telegram.sendMessage(Config.orders.channel.id, text, options);
    return ctx.answerCbQuery(`Замовлено повторно! Чекайте на дзвінок`, true);
}

function showProductDetails(ctx) {
    let array = String(ctx.update.callback_query.data).split('-');
    let query = {
        payload: array[0],
        data: Number(array[1])
    };

    let product = ctx.session.cart[query.data];

    return ctx.answerCbQuery(`${product.name} (${product.options.type})\n${product.options.price} грн`, true);
};

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
    placeOrder,
    repeatOrder,
    getOrderDetails,
    getAccountResponse,
    showProductDetails
};