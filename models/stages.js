const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const uuid = require('uuid').v4;

const Database = require('./database');
const Services = require('./services');

const { Reply } = require('./replies');
const { Config } = require('../config');
const { Products } = require('../data/products');

const Stages = new Stage();

const StartScene = new Scene('start-scene');
const MainMenuScene = new Scene('main-menu-scene');
const CartMenuScene = new Scene('cart-menu-scene');
const HelpMenuScene = new Scene('help-menu-scene');
const AdminMenuScene = new Scene('admin-menu-scene');
const ProductMenuScene = new Scene('product-menu-scene');
const AccountMenuScene = new Scene('account-menu-scene');

StartScene.enter(async function (ctx) {
    await Services.registerUser(ctx);
    let checker = await Services.checkMetadata(ctx);

    if (checker == 'accepted')
        return ctx.reply('Замовлення підтверджено');
    else if (checker == 'declined')
        return ctx.reply('Замовлення відхилено');

    return ctx.scene.enter('main-menu-scene');
});

MainMenuScene.enter(async function (ctx) {
    return ctx.reply(Reply.onMainMenu.text, Reply.onMainMenu.options);
});

MainMenuScene.on('text', async function (ctx) {
    switch (ctx.update.message.text) {
        case '☕️ Меню':
            return ctx.scene.enter('product-menu-scene');

        case '🛒 Кошик':
            return ctx.scene.enter('cart-menu-scene');

        case '👤 Особистий кабінет':
            return ctx.scene.enter('account-menu-scene');

        default:
            let checker = await Services.checkMetadata(ctx);

            if (checker == 'accepted')
                return ctx.reply('Замовлення підтверджено');
            else if (checker == 'declined')
                return ctx.reply('Замовлення відхилено');

            return ctx.reply(Reply.onWrong.text, Reply.onMainMenu.options);
    }
});

CartMenuScene.enter(async function (ctx) {
    await ctx.reply(Reply.onCartMenu.text, Reply.onCartMenu.options);
    return Services.getCartResponse(ctx);
});

CartMenuScene.on('callback_query', async function (ctx) {
    let array = String(ctx.update.callback_query.data).split('-');
    let query = {
        payload: array[0],
        data: array[1]
    };

    switch (query.payload) {
        case 'product':
            await ctx.answerCbQuery('Секунду...', true);
            return ctx.scene.enter('product-menu-scene');

        case 'submit':
            let user = await Database.getUser(ctx.from.id);

            if (user.status == 'banned')
                return ctx.answerCbQuery('Ви не можете робити замовлення бо були заблоковані');

            let consult = false;
            let price = 0;

            for (let i = 0; i < ctx.session.cart.length; i++) {
                price += ctx.session.cart[i].options.price

                if (ctx.session.cart[i].options.type == 'консультація' || ctx.session.cart[i].options.price == 0)
                    consult = true;
            }

            if (consult == false && price < Config.minOrderPrice)
                return ctx.answerCbQuery('Мінімальна сума замовлення 60 грн', true);

            await ctx.answerCbQuery('Створюю замовлення');
            return Services.requestPhoneNumber(ctx);

        case 'show':
            return Services.showProductDetails(ctx);

        case 'clear':
            ctx.session.cart = [];
            await ctx.answerCbQuery(`Готово`);
            return ctx.scene.enter('main-menu-scene');

        default:
            return ctx.answerCbQuery(`Щось пішло не так`, true);
    }
});

CartMenuScene.on('text', async function (ctx) {
    switch (ctx.update.message.text) {
        case '◀️ Назад':
        case '❌ Скасувати':
            return ctx.scene.enter('main-menu-scene');

        default:
            return ctx.reply(Reply.onWrong.text, Reply.onProductMenu.options);
    }
});

CartMenuScene.on('contact', async function (ctx) {
    if (ctx.from.id == ctx.update.message.contact.user_id) {
        ctx.session.contact = ctx.update.message.contact;
    } else {
        await ctx.reply(`🙈 Цей номер телефону не пов'язаний з вашим акаунтом, будь ласка відправте власний`);
        return Services.requestPhoneNumber(ctx);
    }

    return Services.requestLocation(ctx);
});

CartMenuScene.on('location', async function (ctx) {
    ctx.session.location = ctx.update.message.location;

    let order = {
        id: uuid(),
        date: new Date().getTime(),
        user: ctx.session.contact,
        cart: ctx.session.cart,
        location: ctx.session.location
    };

    await Services.placeOrder(ctx, order);

    await ctx.reply(`Чекайте дзвінка для підтвердження замовлення`);
    return ctx.scene.enter('main-menu-scene');
});

ProductMenuScene.enter(async function (ctx) {
    await ctx.reply(Reply.onProductMenu.text, Reply.onProductMenu.options);
    await ctx.reply(Reply.onCallMe.text, Reply.onCallMe.options);

    ctx.session.products = Products;
    ctx.session.current = 0;
});

ProductMenuScene.on('callback_query', async function (ctx) {
    let array = String(ctx.update.callback_query.data).split('-');

    let query = {
        payload: array[0],
        data: array[1]
    };

    switch (query.payload) {
        case 'coffe':
            await ctx.deleteMessage();
            return ctx.reply(`☕️ <b>Кава</b>`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Чорна', callback_data: 'black' }],
                        [{ text: 'Біла', callback_data: 'white' }],
                        [{ text: 'Цікава', callback_data: 'smart' }],
                        [{ text: 'Вагова', callback_data: 'weight' }],
                        [{ text: '◀️ Назад', callback_data: 'sendmainoptions' }]
                    ]
                },
                parse_mode: 'HTML'
            });

        case 'food':
            await ctx.deleteMessage();
            return ctx.reply(`🥙 <b>Їжа</b>`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Солоне', callback_data: 'salty' }],
                        [{ text: 'Домашні випічка/кондитерка', callback_data: 'bakery' }],
                        [{ text: 'Снеки', callback_data: 'snacks' }],
                        [{ text: '◀️ Назад', callback_data: 'sendmainoptions' }]
                    ]
                },
                parse_mode: 'HTML'
            });

        case 'smart':
        case 'black':
        case 'white':
        case 'weight':
        case 'drinks':
        case 'salty':
        case 'bakery':
        case 'snacks':
            ctx.session.choice = ctx.update.callback_query.data;
            return Services.sendProductsResponse(ctx);

        case 'next':
            if (ctx.session.current < ctx.session.products[`${ctx.session.choice}`].length)
                ctx.session.current++;

            if (ctx.session.current == ctx.session.products[`${ctx.session.choice}`].length)
                ctx.session.current = 0;

            return Services.sendOtherProduct(ctx);

        case 'previous':
            if (ctx.session.current <= 0) {
                ctx.session.current = ctx.session.products[`${ctx.session.choice}`].length - 1;
                return Services.sendOtherProduct(ctx);
            }

            if (ctx.session.current > 0) {
                ctx.session.current--;
                return Services.sendOtherProduct(ctx);
            }

        case 'current':
            return ctx.answerCbQuery('Щоб додати товар натисніть кнопку з бажаним типом продукту S/M/L', true);

        case 'tocart':
            return Services.addProductToCart(ctx);

        case 'cart':
            if (ctx.session.cart)
                if (ctx.session.cart.length == 0)
                    return ctx.answerCbQuery(`Спочатку оберіть хоча б один товар`);

            await ctx.answerCbQuery(`Зачекайте...`);
            return ctx.scene.enter('cart-menu-scene');

        case 'callme':
            let call_me = {
                name: 'Дзвінок',
                options: {
                    type: 'консультація',
                    price: 0
                }
            }

            ctx.session.cart = [];
            ctx.session.cart.push(call_me);

            await ctx.deleteMessage();
            return Services.requestPhoneNumber(ctx);

        case 'pissof':
        case 'sendmainoptions':
            await ctx.deleteMessage();
            let response = {
                text: '🥣 <b>Оберіть категорію:</b>',
                options: {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '☕️ Кава', callback_data: 'coffe' }],
                            [{ text: '🍵 Некава', callback_data: 'drinks' }],
                            [{ text: '🥙 Їжа', callback_data: 'food' }],
                        ]
                    },
                    parse_mode: 'HTML'
                }
            }

            return ctx.reply(response.text, response.options);

        default:
            return ctx.answerCbQuery(`Unknown query error! - ${query.payload}`);
    }
});

ProductMenuScene.on('contact', async function (ctx) {
    if (ctx.from.id == ctx.update.message.contact.user_id) {
        ctx.session.contact = ctx.update.message.contact;
    } else {
        await ctx.reply(`🙈 Цей номер телефону не пов'язаний з вашим акаунтом, будь ласка відправте власний`);
        return Services.requestPhoneNumber(ctx);
    }

    let order = {
        id: uuid(),
        date: new Date().getTime(),
        user: ctx.session.contact,
        cart: ctx.session.cart,
        location: {
            latitude: 0.1,
            longitude: 1.2,
        }
    };

    await Services.placeOrder(ctx, order);
    await ctx.reply('Ми скоро вам зателефонуємо');
    return ctx.scene.enter('main-menu-scene');
});

AccountMenuScene.enter(async function (ctx) {
    await ctx.reply(Reply.onAccountMenu.text, Reply.onAccountMenu.options);
    return Services.getAccountResponse(ctx);
});

AccountMenuScene.on('text', async function (ctx) {
    switch (ctx.update.message.text) {
        case '◀️ Назад':
            return ctx.scene.enter('main-menu-scene');

        default:
            return ctx.reply(Reply.onWrong.text, Reply.onAccountMenu.options);
    }
});

AccountMenuScene.on('callback_query', async function (ctx) {
    if (ctx.update.callback_query.data == 'hide')
        return ctx.deleteMessage();

    if (String(ctx.update.callback_query.data).includes('repeat'))
        return Services.repeatOrder(ctx);

    return Services.getOrderDetails(ctx);
});

Stages.register(
    StartScene,         // DONE 100%
    MainMenuScene,      // DONE 100%
    CartMenuScene,      // DONE 50%
    HelpMenuScene,      // DONE 0%
    AdminMenuScene,     // DONE 0%
    AccountMenuScene,   // DONE 99%
    ProductMenuScene    // DONE 99%
);

module.exports = { Stages }