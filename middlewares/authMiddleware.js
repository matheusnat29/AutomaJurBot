// middlewares/authMiddleware.js
import AuthorizedUser from '../database/models/AuthorizedUser.js';
import { getCurrentState, pushState } from '../utils/stateManager.js';

export const authMiddleware = (ACCESS_CODE) => async (ctx, next) => {
  const userId = ctx.from.id;
  const text = ctx.message?.text?.trim();

  const authorizedUser = await AuthorizedUser.findOne({ telegramId: userId });

  if (authorizedUser) {
    return next(); // Usuário já autorizado
  }

  if (text === ACCESS_CODE) {
    // Autoriza e salva no banco
    await AuthorizedUser.create({ telegramId: userId });
    await ctx.reply('✅ Código aceito! Agora você pode usar o bot.');
    return next();
  }

  if (text === '/start') {
    pushState(ctx, 'awaiting_access_code');
    await ctx.reply('🔐 Envie seu código de acesso para continuar.');
    return; // Interrompe até o código ser enviado
  }

  const currentState = getCurrentState(ctx);
  const isAwaitingAccessCode = currentState?.state === 'awaiting_access_code';

  if (isAwaitingAccessCode) {
    await ctx.reply('❌ Código incorreto. Tente novamente.');
    return;
  }

  // Bloqueia todo o restante
  await ctx.reply('🔒 Você não tem permissão para usar este bot. Envie /start para começar.');
};
