// handlers/lembreteHandler.js
import { Markup } from 'telegraf';
import { pushState, popState, isInState } from '../utils/stateManager.js';
import { authUrl, createGoogleCalendarEvent } from '../utils/googleCalendar.js';
import { addReminder } from '../utils/reminderScheduler.js';
import '../utils/ensureDataDir.js';
import { audienciaPericiaMenu } from '../menu/audienciaPericiaMenu.js';

// Simulação de pautas cadastradas
const cadastredPericias = [
  { id: 1, poloAtivo: 'SAMUEL', poloPassivo: 'ITAÚ', representado: 'ativo', comarca: 'ITAPERUNA-RJ', dia: '05/08/2025', horario: '14:00', nota: 'Reunião pré-audiência com o cliente.' },
  { id: 2, poloAtivo: 'MARIA', poloPassivo: 'LOJA DA ESQUINA', representado: 'passivo', comarca: 'NATIVIDADE-RJ', dia: '10/08/2025', horario: '10:30', nota: '' },
  { id: 3, poloAtivo: 'PEDRO', poloPassivo: 'BANCO S.A.', representado: 'ativo', comarca: 'RIO DE JANEIRO-RJ', dia: '15/08/2025', horario: '09:00', nota: 'Verificar documentos pendentes.' },
  { id: 4, poloAtivo: 'ANA', poloPassivo: 'SUPERMERCADO', representado: 'passivo', comarca: 'RIO DE JANEIRO-RJ', dia: '05/08/2025', horario: '10:00', nota: 'Ligar para a parte.' },
  { id: 5, poloAtivo: 'JOÃO', poloPassivo: 'FABRICA S.A.', representado: 'ativo', comarca: 'SÃO PAULO-SP', dia: '05/08/2025', horario: '16:30', nota: '' },
];

export function setupLembreteActions(bot, userTokens) {
  // LEMBRETE INTERNO SEPARADO
  bot.action('agendar_lembrete_interno', async (ctx) => {
    pushState(ctx, 'select_pauta_to_remind_interno');
    if (cadastredPericias.length === 0) {
      return ctx.reply('Nenhuma pauta cadastrada para agendar lembrete.',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
      );
    }
    const pautaButtons = cadastredPericias.map((pauta) => {
      const buttonText = `${pauta.poloAtivo} x ${pauta.poloPassivo} - ${pauta.dia} - ${pauta.horario}`;
      return [Markup.button.callback(buttonText, `agendar_lembrete_interno_for_pauta_${pauta.id}`)];
    });
    await ctx.editMessageText('⏰ Selecione a pauta para agendar um lembrete interno:', {
      reply_markup: Markup.inlineKeyboard([...pautaButtons, [Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup,
      parse_mode: 'Markdown'
    });
  });

  // Selecionar pauta e escolher momento do lembrete interno
  bot.action(/agendar_lembrete_interno_for_pauta_(.+)/, async (ctx) => {
    if (!isInState(ctx, 'select_pauta_to_remind_interno')) return;
    const pautaId = parseInt(ctx.match[1], 10);
    const pauta = cadastredPericias.find((p) => p.id === pautaId);
    if (!pauta) {
      return ctx.reply('❌ Pauta não encontrada para agendar lembrete.',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
      );
    }
    pushState(ctx, 'select_tempo_lembrete_interno', { pautaId });
    await ctx.editMessageText(
      `⏰ Quando deseja ser avisado sobre a audiência/perícia de *${pauta.poloAtivo} x ${pauta.poloPassivo}*?`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('1 dia antes', `lembrete_interno_tempo_1d_${pautaId}`)],
          [Markup.button.callback('2 horas antes', `lembrete_interno_tempo_2h_${pautaId}`)],
          [Markup.button.callback('30 minutos antes', `lembrete_interno_tempo_30m_${pautaId}`)],
          [Markup.button.callback('No horário', `lembrete_interno_tempo_0_${pautaId}`)],
          [Markup.button.callback('⬅️ Voltar', 'agendar_lembrete_interno')]
        ]).reply_markup
      }
    );
  });

  // Agendar lembrete interno para o tempo escolhido
  bot.action(/lembrete_interno_tempo_(\w+)_(\d+)/, async (ctx) => {
    const tempo = ctx.match[1];
    const pautaId = parseInt(ctx.match[2], 10);
    const pauta = cadastredPericias.find((p) => p.id === pautaId);
    if (!pauta) {
      return ctx.reply('❌ Pauta não encontrada para agendar lembrete.',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
      );
    }
    // Calcular data/hora do lembrete
    const [dia, mes, ano] = pauta.dia.split('/');
    const [hora, minuto] = pauta.horario.split(':');
    let datetime = new Date(`${ano}-${mes}-${dia}T${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}:00-03:00`);
    let label = '';
    if (tempo === '1d') {
      datetime = new Date(datetime.getTime() - 24 * 60 * 60 * 1000);
      label = '1 dia antes';
    } else if (tempo === '2h') {
      datetime = new Date(datetime.getTime() - 2 * 60 * 60 * 1000);
      label = '2 horas antes';
    } else if (tempo === '30m') {
      datetime = new Date(datetime.getTime() - 30 * 60 * 1000);
      label = '30 minutos antes';
    } else {
      label = 'no horário';
    }
    addReminder({
      chatId: ctx.chat.id,
      message: `⏰ Lembrete (${label}): audiência/perícia de ${pauta.poloAtivo} x ${pauta.poloPassivo} (${pauta.dia} ${pauta.horario})`,
      datetime,
      sent: false
    });
    await ctx.editMessageText(
      `✅ Lembrete interno agendado para *${pauta.poloAtivo} x ${pauta.poloPassivo}* (${label})! Você receberá uma notificação no Telegram no horário escolhido.`,
      { parse_mode: 'Markdown', ...audienciaPericiaMenu() }
    );
    popState(ctx);
  });

  // 📌 Ação para iniciar agendamento
  bot.action('agendar_lembrete', async (ctx) => {
    const tokens = userTokens.get(ctx.from.id);

    if (!tokens) {
      pushState(ctx, 'awaiting_google_auth');
      const message = '⚠️ Você ainda não conectou seu Google Calendar. Autorize para prosseguir:';

      try {
        await ctx.editMessageText(message, Markup.inlineKeyboard([
          [Markup.button.callback('🔗 Autorizar Google Calendar', 'autorizar_google_calendar')],
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]));
      } catch (err) {
        console.error('⚠️ Erro ao editar mensagem em agendar_lembrete (Google Auth):', err.message);
        await ctx.reply(message, Markup.inlineKeyboard([
          [Markup.button.callback('🔗 Autorizar Google Calendar', 'autorizar_google_calendar')],
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]));
      }
      return; // Interrompe fluxo aqui até o usuário autorizar
    }

    // Se já tiver tokens → segue para selecionar pauta
    pushState(ctx, 'select_pauta_to_remind');

    if (cadastredPericias.length === 0) {
      return ctx.reply('Nenhuma pauta cadastrada para agendar lembrete.',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
      );
    }

    const pautaButtons = cadastredPericias.map((pauta) => {
      const buttonText = `${pauta.poloAtivo} x ${pauta.poloPassivo} - ${pauta.dia} - ${pauta.horario}`;
      return [Markup.button.callback(buttonText, `agendar_lembrete_for_pauta_${pauta.id}`)];
    });

    try {
      await ctx.editMessageText('📅 **Selecione a pauta para agendar um lembrete:**\n\n', {
        reply_markup: Markup.inlineKeyboard([...pautaButtons, [Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup,
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error('⚠️ Erro ao editar mensagem em agendar_lembrete (Lista Pautas):', err.message);
      await ctx.reply('📅 **Selecione a pauta para agendar um lembrete:**\n\n', {
        reply_markup: Markup.inlineKeyboard([...pautaButtons, [Markup.button.callback('⬅️ Voltar', 'back')]]).reply_markup,
        parse_mode: 'Markdown'
      });
    }
  });

  // 📌 Botão para realmente autorizar Google Calendar
  bot.action('autorizar_google_calendar', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      '🔗 Clique no link abaixo para autorizar o acesso ao Google Calendar:',
      Markup.inlineKeyboard([
        [Markup.button.url('✅ Autorizar Google Calendar', authUrl)],
        [Markup.button.callback('⬅️ Voltar', 'back')]
      ])
    );
  });

  // 📌 Selecionar pauta e criar evento no Google Calendar
  bot.action(/agendar_lembrete_for_pauta_(.+)/, async (ctx) => {
    if (!isInState(ctx, 'select_pauta_to_remind')) return; // Proteção contra ação fora de fluxo

    const pautaId = parseInt(ctx.match[1], 10);
    const pauta = cadastredPericias.find((p) => p.id === pautaId);

    if (!pauta) {
      return ctx.reply('❌ Pauta não encontrada para agendar lembrete.',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
      );
    }

    try {
      const tokens = userTokens.get(ctx.from.id);
      await createGoogleCalendarEvent(tokens, pauta);

      // Agendar lembrete interno Telegram
      const [dia, mes, ano] = pauta.dia.split('/');
      const [hora, minuto] = pauta.horario.split(':');
      const datetime = new Date(`${ano}-${mes}-${dia}T${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}:00-03:00`);
      addReminder({
        chatId: ctx.chat.id,
        message: `⏰ Lembrete: audiência de ${pauta.poloAtivo} x ${pauta.poloPassivo} agora!`,
        datetime,
        sent: false
      });

      await ctx.editMessageText(
        `✅ Lembrete para a pauta de **${pauta.poloAtivo} x ${pauta.poloPassivo}** agendado com sucesso no seu Google Calendar e você receberá uma notificação interna no Telegram no horário!`,
        { parse_mode: 'Markdown', ...audienciaPericiaMenu() }
      );
    } catch (error) {
      console.error('❌ Erro ao agendar lembrete:', error.message);
      await ctx.reply('❌ Ocorreu um erro ao agendar o lembrete. Por favor, tente novamente.',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', 'back')]])
      );
    }
    popState(ctx);
  });
}
