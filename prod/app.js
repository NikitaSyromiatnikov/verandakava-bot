const { Telegraf, session } = require('telegraf');
const { Config } = require('./config');

const Services = require('./models/services');

const Bot = new Telegraf(prod.token);

Bot.on('text', async function (ctx) {

});

Bot.on('callback_query', async function (ctx) {

});

Bot.launch().then(function (ctx) {

}); 