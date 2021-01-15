async function processCallbackQuery(ctx) {
    let array = String(ctx.update.callback_query.data).split('-');
    let query = {
        payload: array[0],
        data: array[1]
    };

    switch (query.payload) {
        case 'ban':
            
            break;

        default:
            try {
                ctx.answerCbQuery('Сталася невідома помилка', true);
            } catch (error) {
                console.log(error.message);
                console.log('Reason - unknown query:', query);
            }
    }
}