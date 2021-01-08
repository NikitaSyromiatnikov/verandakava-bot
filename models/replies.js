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
        text: '<b>Чого бажаєте?</b>',
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
    onAccountMenu: {
        text: '👤 <b>Кабінет</b>',
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
    },
    onCallMe: {
        text: '<i>Якщо вагаєтесь та не знаєте, що ви хотіли б скуштувати - бариста вас <b>залюбки проконсультує 🖤</b></i>',
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Передзвоніть мені', callback_data: 'callme' }],
                    [{ text: '😎 Оберу сам', callback_data: 'pissof' }]
                ]
            },
            parse_mode: 'HTML'
        }
    }
}

module.exports = { Reply };