// handlers/audienciaMenuHandler.js
import { Markup } from 'telegraf';
import { pushState } from '../utils/stateManager.js';

export function setupAudienciaMenu(bot) {
  bot.action('audiencias_pericias', async (ctx) => {
    console.log('📂 Menu de Audiências e Perícias aberto');
    
    // ✅ Responde ao clique no botão
    await ctx.answerCbQuery();

    // ✅ Atualiza o estado
    pushState(ctx, 'audiencia_menu');

    // ✅ Força edição com conteúdo diferente (mesmo que imperceptível ao usuário)
    await ctx.editMessageText('⏳ *Audiências e Perícias*\u200B', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('📅 Pauta do Dia', 'pauta_dia')],
        [Markup.button.callback('📂 Todas as Audiências/Perícias', 'todas_audiencias')],
        [Markup.button.callback('➕ Cadastrar Nova Audiência', 'cadastrar_audiencia')],
        [Markup.button.callback('🧪 Cadastrar Nova Perícia', 'cadastrar_pericia')],
        [Markup.button.callback('🖨️ Gerar PDF da Pauta do Dia', 'gerar_pdf')],
        [Markup.button.callback('⏰ Lembretes Definidos', 'lembretes_definidos')],
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ])
    });
  });
}
