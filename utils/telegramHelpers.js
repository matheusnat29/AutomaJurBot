// utils/telegramHelpers.js

/**
 * Função segura para editar uma mensagem apenas se houver mudança real.
 * Evita erro TelegramError 400: message is not modified.
 * 
 * @param {TelegrafContext} ctx - Contexto do Telegraf
 * @param {string} newText - Novo texto da mensagem
 * @param {Object} options - Objeto com reply_markup e outras opções
 */
async function safeEditMessage(ctx, newText, options = {}) {
  try {
    const message = ctx.update?.callback_query?.message;
    if (!message) return;

    const currentText = message.text;
    const currentMarkup = message.reply_markup;
    const newMarkup = options.reply_markup;

    const sameText = currentText === newText;
    const sameMarkup = JSON.stringify(currentMarkup) === JSON.stringify(newMarkup);

    if (sameText && sameMarkup) {
      console.log('⚠️ safeEditMessage: conteúdo idêntico detectado, edição ignorada.');
      return;
    }

    await ctx.editMessageText(newText, options);
  } catch (err) {
    console.error('❌ Erro em safeEditMessage:', err);
  }
}

module.exports = {
  safeEditMessage
};
