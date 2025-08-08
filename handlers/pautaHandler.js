// handlers/pautaHandler.js
import { Markup } from 'telegraf';
import { pushState, popState, getCurrentState } from '../utils/stateManager.js';
import { audienciaPericiaMenu } from '../menu/audienciaPericiaMenu.js';
import { pautaOptionsMenu } from '../menu/pautaOptionsMenu.js';

// Lista de pautas simuladas (poderá ser substituída por banco de dados futuramente)
const cadastredPericias = [
  { id: 1, poloAtivo: 'SAMUEL', poloPassivo: 'ITAÚ', comarca: 'ITAPERUNA-RJ', dia: '05/08/2025', horario: '14:00', nota: 'Reunião pré-audiência com o cliente.' },
  { id: 2, poloAtivo: 'MARIA', poloPassivo: 'LOJA DA ESQUINA', comarca: 'NATIVIDADE-RJ', dia: '10/08/2025', horario: '10:30', nota: '' }
];

export function setupPautaHandlers(bot) {
  bot.action('pautas_do_dia', async (ctx) => {
    pushState(ctx, 'pautas_do_dia');
    const hoje = '05/08/2025'; // Simulado para teste
    const pautasHoje = cadastredPericias.filter(p => p.dia === hoje);

    if (pautasHoje.length === 0) {
      await ctx.editMessageText('📅 Nenhuma pauta cadastrada para hoje.', audienciaPericiaMenu());
      return;
    }

    const pautaButtons = pautasHoje.map(pauta => {
      const buttonText = `${pauta.poloAtivo} x ${pauta.poloPassivo} - ${pauta.horario}`;
      return [Markup.button.callback(buttonText, `view_pauta_${pauta.id}`)];
    });

    await ctx.editMessageText('📅 **Pautas de hoje:**\n\n', {
      reply_markup: Markup.inlineKeyboard([...pautaButtons, [Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup,
      parse_mode: 'Markdown'
    });
  });

  bot.action(/view_pauta_(.+)/, async (ctx) => {
    const pautaId = parseInt(ctx.match[1], 10);
    const pauta = cadastredPericias.find(p => p.id === pautaId);

    if (!pauta) {
      return ctx.reply('❌ Pauta não encontrada.');
    }

    await ctx.editMessageText(
      `**${pauta.poloAtivo} x ${pauta.poloPassivo}**\nComarca: ${pauta.comarca}\nDia: ${pauta.dia} - ${pauta.horario}`,
      {
        reply_markup: pautaOptionsMenu(pauta.id, Boolean(pauta.nota)).reply_markup,
        parse_mode: 'Markdown'
      }
    );
  });

  bot.action(/add_note_(.+)/, async (ctx) => {
    const pautaId = parseInt(ctx.match[1], 10);
    pushState(ctx, 'awaiting_note_input', { pautaId });
    await ctx.reply('✏️ Envie a nota que deseja adicionar para esta pauta:');
  });

  bot.action(/edit_note_(.+)/, async (ctx) => {
    const pautaId = parseInt(ctx.match[1], 10);
    pushState(ctx, 'awaiting_note_input', { pautaId });
    await ctx.reply('✏️ Envie a nova nota para esta pauta:');
  });

  bot.action(/view_note_(.+)/, async (ctx) => {
    const pautaId = parseInt(ctx.match[1], 10);
    const pauta = cadastredPericias.find(p => p.id === pautaId);

    if (!pauta) {
      return ctx.reply('❌ Pauta não encontrada.');
    }

    await ctx.reply(`📝 Nota atual: ${pauta.nota || 'Nenhuma nota adicionada.'}`);
  });

  bot.action(/confirm_delete_pauta_(.+)/, async (ctx) => {
    const pautaId = parseInt(ctx.match[1], 10);
    pushState(ctx, 'confirm_delete', { pautaId });
    await ctx.editMessageText('Tem certeza que deseja excluir esta pauta?', Markup.inlineKeyboard([
      [Markup.button.callback('Sim, excluir', `delete_pauta_${pautaId}`)],
      [Markup.button.callback('Cancelar', 'back')]
    ]));
  });

  bot.action(/delete_pauta_(.+)/, async (ctx) => {
    const pautaId = parseInt(ctx.match[1], 10);
    const index = cadastredPericias.findIndex(p => p.id === pautaId);
    if (index !== -1) {
      cadastredPericias.splice(index, 1);
      await ctx.editMessageText('✅ Pauta excluída com sucesso.', audienciaPericiaMenu());
    } else {
      await ctx.editMessageText('❌ Pauta não encontrada.', audienciaPericiaMenu());
    }
    popState(ctx);
  });

    bot.on('text', async (ctx, next) => {
    const currentState = getCurrentState(ctx);

    if (currentState?.state === 'awaiting_note_input') {
      const { pautaId } = currentState.data;
      const pauta = cadastredPericias.find(p => p.id === pautaId);

      if (pauta) {
        pauta.nota = ctx.message.text;
        await ctx.reply(`✅ Nota salva para a pauta **${pauta.poloAtivo} x ${pauta.poloPassivo}**.`);
      }

      popState(ctx);
      return; // <- FIM do fluxo, não precisa passar para próximo handler aqui
    }

    return next(); // <- ESSENCIAL para que outros bot.on('text') funcionem
  });

}