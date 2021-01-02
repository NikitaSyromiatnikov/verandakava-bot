const Reply = {
    onMainMenu: {
        text: '▫️ <b>Головне меню</b>\n\n<i>Щоб замовити доставку - перегляньте меню, виберіть що вам сподобалося і підтвердіть замовлення</i>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '☕️ Меню' }, { text: '🛒 Кошик' }],
                    [{ text: '👤 Особистий кабінет' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    },
    onProductMenu: {
        text: '<b>Шо ти хочеш?</b>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '◀️ Назад' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    },
    onCartMenu: {
        text: '🛒 <b>Кошик</b>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '◀️ Назад' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    },
    onWrong: {
        text: '😢 <b>От халепа!</b>\n\n<i>Здається ви написали щось чого я не розумію - краще користуйтеся вбудованю клавіатурою</i>'
    }
}

module.exports = { Reply };