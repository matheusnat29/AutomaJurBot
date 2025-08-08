import { Markup } from 'telegraf';
import { initialMenu } from '../menu/initialMenu.js';
import { pushState, popState, getCurrentState } from '../utils/stateManager.js';
import { oabResultsCache } from './lawyerHandler.js'; // Corrigido caminho relativo

export function setupStartHandler(bot) {
  console.log('⚙️ startHandler carregado ✅'); // ← Verificação no terminal

  // ✅ Teste básico de resposta do bot
  bot.command('ping', async (ctx) => {
    console.log('📡 Comando /ping recebido');
    await ctx.reply('🏓 pong');
  });

  // ✅ Comando para testar submenu de audiências
  bot.command('teste_menu', async (ctx) => {
    console.log('🧪 Comando /teste_menu acionado');

    await ctx.reply('⏳ *Audiências e Perícias*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📅 Pauta do Dia', callback_data: 'pauta_dia' }],
          [{ text: '📂 Todas as Audiências/Perícias', callback_data: 'todas_audiencias' }],
          [{ text: '➕ Cadastrar Nova Audiência', callback_data: 'cadastrar_audiencia' }],
          [{ text: '🧪 Cadastrar Nova Perícia', callback_data: 'cadastrar_pericia' }],
          [{ text: '🖨️ Gerar PDF da Pauta do Dia', callback_data: 'gerar_pdf' }],
          [{ text: '⏰ Lembretes Definidos', callback_data: 'lembretes_definidos' }],
          [{ text: '⬅️ Voltar', callback_data: 'back' }]
        ]
      }
    });
  });

  // ⚙️ Comando /start
  bot.start((ctx) => {
    console.log('🚀 Comando /start acionado');
    pushState(ctx, 'main_menu');
    ctx.reply(
      '👋 Olá! Seja bem-vindo ao LegalPulseBot. Como posso te ajudar hoje?',
      initialMenu()
    );
  });

  // ⚙️ Comando /menu
  bot.command('menu', (ctx) => {
    console.log('📥 Comando /menu acionado');
    pushState(ctx, 'main_menu');
    ctx.reply('⬅️ Voltando para o Menu Principal:', initialMenu());
  });

  // 🔙 Botão "Voltar"
  bot.action('back', async (ctx) => {
    console.log('🔙 Botão "Voltar" pressionado');
    popState(ctx);
    const previousState = getCurrentState(ctx);

    if (!previousState) {
      console.log('📦 Nenhum estado anterior, voltando ao menu principal');
      return ctx.editMessageText('⬅️ Menu Principal:', initialMenu());
    }

    console.log('↩️ Voltando para o estado:', previousState.state);

    try {
      switch (previousState.state) {
        case 'awaiting_oab':
          await ctx.editMessageText(
            '🆔 Envie o número da OAB que você deseja consultar (somente números).',
            {
              reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Voltar', 'back')]
              ]).reply_markup
            }
          );
          break;

        case 'selecting_advogado': {
          const userId = ctx.from.id;
          const resultados = oabResultsCache.get(userId);

          if (resultados && resultados.length > 0) {
            const buttons = resultados.map((adv, index) => [
              Markup.button.callback(`${adv.name} (${adv.inscription})`, `select_advogado_${index}`)
            ]);

            await ctx.editMessageText('👤 Selecione o advogado que deseja cadastrar:', {
              reply_markup: Markup.inlineKeyboard([...buttons, [Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup
            });
          } else {
            await ctx.editMessageText('⚠️ Não há dados de advogados em cache.', initialMenu());
          }
          break;
        }

        case 'main_menu':
        default:
          console.log('🧭 Estado não reconhecido, voltando para o menu principal');
          await ctx.editMessageText('⬅️ Menu Principal:', initialMenu());
      }
    } catch (err) {
      console.error('❌ Erro ao voltar para estado anterior:', err);
      await ctx.reply('❌ Ocorreu um erro ao retornar.');
    }
  });
}
