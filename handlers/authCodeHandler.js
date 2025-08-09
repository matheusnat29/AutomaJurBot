// handlers/authCodeHandler.js

import { getCurrentState, popState, pushState } from '../utils/stateManager.js';
import { oauth2Client } from '../utils/googleCalendar.js';
import { initialMenu } from '../menu/initialMenu.js';
import AuthorizedUser from '../database/models/AuthorizedUser.js';

export function setupAuthCodeHandler(bot, userTokens) {
  bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();
    const currentState = getCurrentState(ctx);

    // 1️⃣ Fluxo: Código de autenticação Google
    if (currentState?.state === 'awaiting_google_auth_code') {
      try {
        const { tokens } = await oauth2Client.getToken(text);
        userTokens.set(userId, tokens);
        popState(ctx);
        await ctx.reply('✅ Autorização concedida! Agora você pode agendar lembretes no Google Calendar.',
          { ...initialMenu(), ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) }
        );
      } catch (error) {
        console.error('❌ Erro ao obter tokens:', error);
        await ctx.reply('❌ Código de autorização inválido. Por favor, tente novamente.',
          { ...initialMenu(), ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]]) }
        );
      }
      return;
    }

    // 2️⃣ Fluxo: Código de acesso (primeiro uso do bot)
    if (text === process.env.ACCESS_CODE) {
      const existing = await AuthorizedUser.findOne({ telegramId: userId });

      if (existing) {
        await ctx.reply('🔓 Você já está autorizado. Use /start para continuar.',
          Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
        );
      } else {
        const user = new AuthorizedUser({
          telegramId: userId,
          username: ctx.from.username || '',
          firstName: ctx.from.first_name || '',
          lastName: ctx.from.last_name || '',
        });

        await user.save();
        pushState(ctx, 'main_menu');
        await ctx.reply('✅ Acesso concedido! Agora envie /start para começar.',
          Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
        );
      }
      return;
    }

    // 3️⃣ Fluxo: Bloqueio se usuário não autorizado e mandou qualquer outra coisa
    const authorized = await AuthorizedUser.findOne({ telegramId: userId });
if (!authorized) {
  return ctx.reply('🔒 Você não tem permissão para usar este bot. Envie o código de acesso para continuar.',
    Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
  );
}

return next();

    // Aqui você pode tratar textos adicionais para usuários autorizados
  });
}
