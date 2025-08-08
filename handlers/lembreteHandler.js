// handlers/lembreteHandler.js
import { Markup } from 'telegraf';
import { pushState, popState } from '../utils/stateManager.js';
import { authUrl, createGoogleCalendarEvent } from '../utils/googleCalendar.js';
import { audienciaPericiaMenu } from '../menu/audienciaPericiaMenu.js';

// Simula as pautas cadastradas localmente
const cadastredPericias = [
  { id: 1, poloAtivo: 'SAMUEL', poloPassivo: 'ITAÚ', representado: 'ativo', comarca: 'ITAPERUNA-RJ', dia: '05/08/2025', horario: '14:00', nota: 'Reunião pré-audiência com o cliente.' },
  { id: 2, poloAtivo: 'MARIA', poloPassivo: 'LOJA DA ESQUINA', representado: 'passivo', comarca: 'NATIVIDADE-RJ', dia: '10/08/2025', horario: '10:30', nota: '' },
  { id: 3, poloAtivo: 'PEDRO', poloPassivo: 'BANCO S.A.', representado: 'ativo', comarca: 'RIO DE JANEIRO-RJ', dia: '15/08/2025', horario: '09:00', nota: 'Verificar documentos pendentes.' },
  { id: 4, poloAtivo: 'ANA', poloPassivo: 'SUPERMERCADO', representado: 'passivo', comarca: 'RIO DE JANEIRO-RJ', dia: '05/08/2025', horario: '10:00', nota: 'Ligar para a parte.' },
  { id: 5, poloAtivo: 'JOÃO', poloPassivo: 'FABRICA S.A.', representado: 'ativo', comarca: 'SÃO PAULO-SP', dia: '05/08/2025', horario: '16:30', nota: '' },
];

export function setupLembreteActions(bot, userTokens) {
  bot.action('agendar_lembrete', async (ctx) => {
    const userId = ctx.from.id;
    const tokens = userTokens.get(userId);

    if (!tokens) {
      pushState(ctx, 'awaiting_google_auth');
      const message = 'Para agendar um lembrete no seu Google Calendar, preciso da sua permissão. Clique no link abaixo para autorizar:';
      await ctx.editMessageText(message, Markup.inlineKeyboard([
        [Markup.button.url('🔗 Autorizar Google Calendar', authUrl)],
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ]));
    } else {
      pushState(ctx, 'select_pauta_to_remind');

      if (cadastredPericias.length === 0) {
        ctx.editMessageText('Nenhuma pauta cadastrada para agendar lembrete.', audienciaPericiaMenu());
        return;
      }

      const pautaButtons = cadastredPericias.map(pauta => {
        const buttonText = `${pauta.poloAtivo} x ${pauta.poloPassivo} - ${pauta.dia} - ${pauta.horario}`;
        return [Markup.button.callback(buttonText, `agendar_lembrete_for_pauta_${pauta.id}`)];
      });

      await ctx.editMessageText('📅 **Selecione a pauta para agendar um lembrete:**\n\n', {
        reply_markup: Markup.inlineKeyboard([...pautaButtons, [Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup,
        parse_mode: 'Markdown'
      });
    }
  });

  bot.action(/agendar_lembrete_for_pauta_(.+)/, async (ctx) => {
    const userId = ctx.from.id;
    const pautaId = parseInt(ctx.match[1], 10);
    const pauta = cadastredPericias.find(p => p.id === pautaId);

    if (!pauta) {
      return ctx.reply('❌ Pauta não encontrada para agendar lembrete.');
    }

    try {
      const tokens = userTokens.get(userId);
      await createGoogleCalendarEvent(tokens, pauta);
      await ctx.editMessageText(`✅ Lembrete para a pauta de **${pauta.poloAtivo} x ${pauta.poloPassivo}** agendado com sucesso no seu Google Calendar.`, {
        parse_mode: 'Markdown',
        ...audienciaPericiaMenu()
      });
    } catch (error) {
      console.error('Erro ao agendar lembrete:', error);
      await ctx.editMessageText('❌ Ocorreu um erro ao agendar o lembrete. Por favor, tente novamente.', audienciaPericiaMenu());
    }
    popState(ctx);
  });
}
