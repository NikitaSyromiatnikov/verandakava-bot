const Services = require('./models/services');

const { Telegraf, session } = require('telegraf');
const { Stages } = require('./models/stages');
const { Config } = require('./config');

const Bot = new Telegraf(Config.bot.token);

Bot.use(session());
Bot.use(Stages.middleware());

Bot.on('message', async (ctx) => {
    return ctx.scene.enter('start-scene');
});

Bot.launch().then(() => {
    Services.scheduleStatistics(Bot.telegram);
});