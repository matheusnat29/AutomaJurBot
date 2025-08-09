// handlers/audienciaMenuHandler.js
import { Markup } from 'telegraf';
import { pushState, popState } from '../utils/stateManager.js';

export function setupAudienciaMenuHandler(bot) {
  console.log('⚙️ audienciaMenuHandler carregado ✅');

  bot.action('audiencias_menu', async (ctx) => {
    console.log(`📌 Usuário ${ctx.from.id} abriu o submenu Audiências e Perícias`);
    pushState(ctx, 'audiencias_menu');

    try {
      await ctx.editMessageText(
        '📂 **Audiências e Perícias**\nEscolha uma das opções abaixo:',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📅 Pauta do Dia', 'pauta_dia')],
            [Markup.button.callback('📂 Todas as Audiências/Perícias', 'todas_audiencias')],
            [Markup.button.callback('➕ Cadastrar Nova Audiência', 'nova_audiencia')],
            [Markup.button.callback('🧪 Cadastrar Nova Perícia', 'nova_pericia')],
            [Markup.button.callback('🖨️ Gerar PDF da Pauta do Dia', 'gerar_pdf_pauta')],
            [Markup.button.callback('⏰ Lembrete Interno', 'agendar_lembrete_interno')],
            [Markup.button.callback('⏰ Lembrete Google Calendar', 'agendar_lembrete')],
            [Markup.button.callback('⬅️ Voltar ao Menu Inicial', 'voltar_menu')]
          ])
        }
      );
    } catch (err) {
      console.error('❌ Erro ao exibir submenu Audiências e Perícias:', err);
      await ctx.reply('⚠️ Não foi possível abrir o submenu. Tente novamente.');
    }
  });

  // Voltar ao menu inicial
  bot.action('voltar_menu', async (ctx) => {
    popState(ctx);
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    ctx.scene?.leave?.();
    ctx.telegram.sendMessage(ctx.chat.id, '🏠 Menu Principal:', {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('👨‍⚖️ Meus Advogados', 'meus_advogados')],
        [Markup.button.callback('⏳ Audiências e Perícias', 'audiencias_menu')],
        [Markup.button.callback('📊 Estatísticas', 'estatisticas')],
        [Markup.button.callback('⚙️ Configurações', 'configuracoes')]
      ])
    });
  });
}
