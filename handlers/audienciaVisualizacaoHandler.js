// handlers/audienciaVisualizacaoHandler.js

import { Markup } from 'telegraf';
import { getCurrentState, pushState, popState } from '../utils/stateManager.js';
import Audiencia from '../database/models/Audiencia.js';
import { initialMenu } from '../menu/initialMenu.js';

function formatStatus(audiencia) {
  const parteEmoji = '🧑‍💼';
  const statusEmoji = audiencia.concluida ? '✅' : '⚖️';
  return `${statusEmoji} ${parteEmoji} ${audiencia.parteRepresentada || '—'}`;
}

function formatLabel(audiencia, index) {
  const statusEmoji = audiencia.concluida ? '✅' : '⚖️';
  return `${statusEmoji} ${index + 1}. ${audiencia.autor} x ${audiencia.reu} | 📅 ${audiencia.data || audiencia.dia || '—'} ⏰ ${audiencia.horario || '—'}`;
}

export function setupAudienciaVisualizacaoHandler(bot) {
  // Função utilitária para sanitizar campos de texto
  function sanitize(text) {
    if (!text) return '—';
    return String(text)
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove caracteres invisíveis Unicode
      .replace(/[\r\n]+/g, ' ') // Remove quebras de linha
      .replace(/\s{2,}/g, ' ') // Remove espaços duplos
      .trim();
  }
  // Teste: comando /detalhereal para enviar o template do detalhe com dados reais da primeira audiência do banco
  bot.command('detalhereal', async (ctx) => {
    const audiencia = await Audiencia.findOne();
    if (!audiencia) {
      await ctx.reply('Nenhuma audiência encontrada no banco.');
      return;
    }
    let acordoInfo = '';
    let dataStr = sanitize(audiencia.data);
    let horaStr = sanitize(audiencia.horario);
    await ctx.reply(
      `${audiencia.concluida ? '✅' : '⚖️'} Audiência\n` +
      `👥 Autor: ${sanitize(audiencia.autor)}\n` +
      `👤 Réu: ${sanitize(audiencia.reu)}\n` +
      `🧑‍💼 Parte Representada: ${sanitize(audiencia.parteRepresentada)}\n` +
      `📅 Dia: ${dataStr}\n` +
      `⏰ Horário: ${horaStr}\n` +
      `📄 Processo: ${sanitize(audiencia.processo)}\n` +
      `🏛️ Comarca: ${sanitize(audiencia.comarca)}${acordoInfo ? '\n' + acordoInfo.replace(/\n/g, '\n') : ''}`
    );
  });
  // Teste: comando /detalhelinhas4 para enviar todas as linhas do template do detalhe
  bot.command('detalhelinhas4', async (ctx) => {
    await ctx.reply(
      '⚖️ Audiência\n👥 Autor: Exemplo Autor\n👤 Réu: Exemplo Réu\n🧑‍💼 Parte Representada: Exemplo Parte\n📅 Dia: 10/08/2025\n⏰ Horário: 14:00\n📄 Processo: 1234567-89.2025.8.19.0001\n🏛️ Comarca: Rio de Janeiro'
    );
  });
  // Teste: comando /detalhelinhas3 para enviar as sete primeiras linhas do template do detalhe
  bot.command('detalhelinhas3', async (ctx) => {
    await ctx.reply(
      '⚖️ Audiência\n👥 Autor: Exemplo Autor\n👤 Réu: Exemplo Réu\n🧑‍💼 Parte Representada: Exemplo Parte\n📅 Dia: 10/08/2025\n⏰ Horário: 14:00\n📄 Processo: 1234567-89.2025.8.19.0001'
    );
  });
  // Teste: comando /detalhelinhas2 para enviar as quatro primeiras linhas do template do detalhe
  bot.command('detalhelinhas2', async (ctx) => {
    await ctx.reply(
      '⚖️ Audiência\n👥 Autor: Exemplo Autor\n👤 Réu: Exemplo Réu\n🧑‍💼 Parte Representada: Exemplo Parte'
    );
  });
  // Teste: comando /detalhelinhas1 para enviar as duas primeiras linhas do template do detalhe
  bot.command('detalhelinhas1', async (ctx) => {
    await ctx.reply(
      '⚖️ Audiência\n👥 Autor: Exemplo Autor'
    );
  });
  // Teste: comando /emojilinhas para enviar só os emojis do detalhe, um por linha
  bot.command('emojilinhas', async (ctx) => {
    await ctx.reply(
      '✅\n⚖️\n👥\n👤\n🧑‍💼\n📅\n⏰\n📄\n🏛️\n🤝\n💰\n❌\n🔔\n✏️\n⏰\n✅\n🗑️\n⬅️'
    );
  });
  // Teste: comando /detalheteste para enviar o template do detalhe como mensagem nova
  bot.command('detalheteste', async (ctx) => {
    // Exemplo de dados fictícios
    const audiencia = {
      concluida: false,
      autor: 'Exemplo Autor',
      reu: 'Exemplo Réu',
      parteRepresentada: 'Exemplo Parte',
      data: '10/08/2025',
      horario: '14:00',
      processo: '1234567-89.2025.8.19.0001',
      comarca: 'Rio de Janeiro',
    };
    let acordoInfo = '';
    // Template igual ao detalhe, texto puro
    let dataStr = audiencia.data || '—';
    let horaStr = audiencia.horario || '—';
    await ctx.reply(
`${audiencia.concluida ? '✅' : '⚖️'} Audiência\n` +
`👥 Autor: ${audiencia.autor || '—'}\n` +
`👤 Réu: ${audiencia.reu || '—'}\n` +
`🧑‍💼 Parte Representada: ${audiencia.parteRepresentada || '—'}\n` +
`📅 Dia: ${dataStr}\n` +
`⏰ Horário: ${horaStr}\n` +
`📄 Processo: ${audiencia.processo || '—'}\n` +
`🏛️ Comarca: ${audiencia.comarca || '—'}${acordoInfo ? '\n' + acordoInfo.replace(/\n/g, '\n') : ''}`
    );
  });
  // Teste: comando /emojiedit para enviar só emojis usando editMessageText
  bot.command('emojiedit', async (ctx) => {
    // Só funciona em reply a uma mensagem do bot (inline), então tenta editar a última mensagem
    try {
      await ctx.editMessageText('✅⚖️👥👤🧑‍💼📅⏰📄🏛️🤝💰❌🔔✏️⏰✅🗑️⬅️');
    } catch (e) {
      await ctx.reply('Para testar, envie um comando inline ou pressione um botão do bot e depois envie /emojiedit como resposta.');
    }
  });
  // Teste: comando /emojitest para enviar só emojis
  bot.command('emojitest', async (ctx) => {
    await ctx.reply('✅⚖️👥👤🧑‍💼📅⏰📄🏛️🤝💰❌🔔✏️⏰✅🗑️⬅️', { parse_mode: 'HTML' });
  });
  // Handler para botão de agendar notificação interna direto do detalhe da audiência
  bot.action(/agendar_notificacao_audiencia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    const audiencia = await Audiencia.findById(id);
    if (!audiencia) {
      return ctx.reply('❌ Audiência não encontrada para agendar notificação.');
    }
    await ctx.editMessageText(
      `🔔 Quando deseja ser avisado sobre a audiência de *${audiencia.autor} x ${audiencia.reu}*?`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('1 dia antes', `notificacao_audiencia_tempo_1d_${id}`)],
          [Markup.button.callback('2 horas antes', `notificacao_audiencia_tempo_2h_${id}`)],
          [Markup.button.callback('30 minutos antes', `notificacao_audiencia_tempo_30m_${id}`)],
          [Markup.button.callback('No horário', `notificacao_audiencia_tempo_0_${id}`)],
          [Markup.button.callback('⬅️ Voltar', `abrir_audiencia_${id}`)]
        ]).reply_markup
      }
    );
  });

  // Handler para agendar notificação interna
  bot.action(/notificacao_audiencia_tempo_(\w+)_(.+)/, async (ctx) => {
    const tempo = ctx.match[1];
    const id = ctx.match[2];
    const audiencia = await Audiencia.findById(id);
    if (!audiencia) {
      return ctx.reply('❌ Audiência não encontrada para agendar notificação.');
    }

    const [dia, mes, ano] = (audiencia.data || '01/01/1970').split('/');
    const [hora, minuto] = (audiencia.horario || '00:00').split(':');
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

    const { addReminder } = await import('../utils/reminderScheduler.js');
    addReminder({
      chatId: ctx.chat.id,
      message: `🔔 Notificação (${label}): audiência de ${audiencia.autor} x ${audiencia.reu} (📅 ${audiencia.data} ⏰ ${audiencia.horario})`,
      datetime,
      sent: false
    });

    await ctx.editMessageText(
      `✅ Notificação agendada para *${audiencia.autor} x ${audiencia.reu}* (${label})!`,
      { parse_mode: 'Markdown', reply_markup: Markup.inlineKeyboard([[Markup.button.callback('⬅️ Voltar', `abrir_audiencia_${id}`)]]) }
    );
  });

  // Abre uma audiência (DETALHE)
  bot.action(/abrir_audiencia_(.+)/, async (ctx) => {
    // Logar todos os campos usados no template para depuração
    console.log('DETALHE AUDIÊNCIA DEBUG:', {
      concluida: audiencia.concluida,
      autor: audiencia.autor,
      reu: audiencia.reu,
      parteRepresentada: audiencia.parteRepresentada,
      data: audiencia.data,
      horario: audiencia.horario,
      processo: audiencia.processo,
      comarca: audiencia.comarca,
      acordo: audiencia.acordo,
      valorAcordo: audiencia.valorAcordo
    });
    const id = ctx.match[1];
    const audiencia = await Audiencia.findById(id);
    if (!audiencia) {
      await ctx.reply('❌ Audiência não encontrada.');
      return;
    }

    pushState(ctx, 'abrindo_audiencia', { id });

    let acordoInfo = '';
    if (audiencia.concluida) {
      if (audiencia.acordo === true) {
        acordoInfo = '\n🤝 *Acordo realizado*';
        if (audiencia.valorAcordo) acordoInfo += `\n💰 Valor: R$ ${sanitize(audiencia.valorAcordo)}`;
      } else if (audiencia.acordo === false) {
        acordoInfo = '\n❌ Sem acordo';
      }
    }
    acordoInfo = acordoInfo.replace(/\\n/g, '\n');

    let dataStr = sanitize(audiencia.data);
    let horaStr = sanitize(audiencia.horario);

    await ctx.reply(
      `${audiencia.concluida ? '✅' : '⚖️'} Audiência\n` +
      `👥 Autor: ${sanitize(audiencia.autor)}\n` +
      `👤 Réu: ${sanitize(audiencia.reu)}\n` +
      `🧑‍💼 Parte Representada: ${sanitize(audiencia.parteRepresentada)}\n` +
      `📅 Dia: ${dataStr}\n` +
      `⏰ Horário: ${horaStr}\n` +
      `📄 Processo: ${sanitize(audiencia.processo)}\n` +
      `🏛️ Comarca: ${sanitize(audiencia.comarca)}${acordoInfo ? '\n' + acordoInfo.replace(/\n/g, '\n') : ''}`,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔔 Agendar Notificação', `agendar_notificacao_audiencia_${id}`)],
          [Markup.button.callback('✏️ Editar', `editar_audiencia_${id}`)],
          [Markup.button.callback('⏰ Definir Lembrete', `definir_lembrete_audiencia_${id}`)],
          [Markup.button.callback('✅ Concluir', `concluir_audiencia_${id}`)],
          [Markup.button.callback('🗑️ Excluir', `confirmar_excluir_audiencia_${id}`)],
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]).reply_markup,
      }
    );

    // Função utilitária para escapar HTML
    function escapeHtml(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  });

  // Botão concluir audiência
  bot.action(/concluir_audiencia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    ctx.session = ctx.session || {};
    ctx.session.concluirId = id;
    await ctx.editMessageText('A audiência foi concluída com acordo?', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('✅ Sim', 'acordo_sim')],
        [Markup.button.callback('❌ Não', 'acordo_nao')],
        [Markup.button.callback('⬅️ Voltar', `abrir_audiencia_${id}`)]
      ]).reply_markup,
    });
  });

  // Resposta: acordo SIM
  bot.action('acordo_sim', async (ctx) => {
    ctx.session = ctx.session || {};
    ctx.session.aguardandoValorAcordo = true;
    await ctx.editMessageText('Qual o valor do acordo? (ex: 1000.00)', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', `abrir_audiencia_${ctx.session.concluirId}`)]
      ]).reply_markup,
    });
  });

  // Resposta: acordo NÃO
  bot.action('acordo_nao', async (ctx) => {
    ctx.session = ctx.session || {};
    const id = ctx.session.concluirId;
    await Audiencia.findByIdAndUpdate(id, { concluida: true, acordo: false });
    await ctx.editMessageText('Audiência marcada como concluída (sem acordo).', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Voltar', `abrir_audiencia_${id}`)]
      ]).reply_markup,
    });
  });

  // Recebe valor do acordo
  bot.on('text', async (ctx, next) => {
    ctx.session = ctx.session || {};
    if (ctx.session.aguardandoValorAcordo && ctx.session.concluirId) {
      const valor = ctx.message.text.replace(/[^\d.,]/g, '').replace(',', '.');
      const id = ctx.session.concluirId;
      await Audiencia.findByIdAndUpdate(id, { concluida: true, acordo: true, valorAcordo: valor });
      ctx.session.aguardandoValorAcordo = false;
      await ctx.reply('Audiência marcada como concluída com acordo.');
      await ctx.answerCbQuery?.();
      return;
    }
    return next();
  });

  // Confirma exclusão
  bot.action(/confirmar_excluir_audiencia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    pushState(ctx, 'confirmando_exclusao_audiencia', { id });
    await ctx.editMessageText('❓ Tem certeza que deseja excluir esta audiência?', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('✅ Sim, excluir', `excluir_audiencia_${id}`)],
        [Markup.button.callback('❌ Cancelar', 'back')],
      ]).reply_markup,
    });
  });

  // Exclui audiência
  bot.action(/excluir_audiencia_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    await Audiencia.findByIdAndDelete(id);
    await ctx.editMessageText('✅ Audiência excluída com sucesso.');
    await initialMenu(ctx);
    popState(ctx);
  });
}
