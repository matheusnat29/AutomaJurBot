// handlers/authCodeHandler.js
import { exchangeCodeForTokens } from '../utils/googleCalendar.js';

export function setupAuthCodeHandler(bot, userTokens) {
  console.log('⚙️ authCodeHandler carregado ✅');

  // Comando para processar o código enviado pelo usuário
  bot.on('text', async (ctx, next) => {
    // Verifica se o usuário está no estado de aguardar código
    if (!ctx.session || ctx.session.awaitingGoogleCode !== true) {
      return next();
    }

    const code = ctx.message.text.trim();
    if (!code) {
      return ctx.reply('⚠️ Código inválido. Por favor, cole o código de autorização do Google.');
    }

    try {
      // Troca o código pelos tokens
      const tokens = await exchangeCodeForTokens(code);

      // Salva tokens em memória (Map)
      userTokens.set(ctx.from.id, tokens);

      // Limpa estado
      ctx.session.awaitingGoogleCode = false;

      console.log(`✅ Tokens salvos para usuário ${ctx.from.id}`);
      await ctx.reply('✅ Conta vinculada com sucesso! Agora você já pode agendar lembretes no Google Calendar.');

    } catch (error) {
      console.error('❌ Erro ao processar código do Google:', error);
      await ctx.reply('⚠️ Ocorreu um erro ao vincular sua conta. Tente novamente.');
    }
  });

  // Botão para iniciar fluxo de autenticação
  bot.action('autorizar_google_calendar', async (ctx) => {
    ctx.session = ctx.session || {};
    ctx.session.awaitingGoogleCode = true;

    await ctx.reply(
      '🔗 Clique no link para autorizar: <link_gerado_aqui>\n\nDepois, cole aqui o código que receber.',
      { parse_mode: 'Markdown' }
    );
  });
}
