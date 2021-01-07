const Services = require('./models/services');

const { Telegraf, session } = require('telegraf');
const { banUser } = require('./models/database');
const { Stages } = require('./models/stages');
const { Config } = require('./config');


const Bot = new Telegraf(Config.bot.token);

Bot.use(session());
Bot.use(Stages.middleware());

Bot.on('message', async (ctx) => {
    return ctx.scene.enter('start-scene');
});

Bot.on('callback_query', async function (ctx) {
    let array = String(ctx.update.callback_query.data).split('-');
    let query = {
        payload: array[0],
        data: Number(array[1])
    };

    switch (query.payload) {
        case 'ban':
            await banUser(query.data);
            return ctx.answerCbQuery('👌 Користувач заблокований', true);

        default:
            try {
                ctx.answerCbQuery('Сталася помилка...');
            } catch (error) {
                console.log(error);
            }
    }
});

Bot.launch().then(() => {
    Services.scheduleStatistics(Bot.telegram);
});