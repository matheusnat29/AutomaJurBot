// ...existing code...
// ...existing code...
// handlers/audienciaCadastroHandler.js
import { Markup } from 'telegraf';
import { pushState, popState, resetState, isInState } from '../utils/stateManager.js';
import { initialMenu } from '../menu/initialMenu.js';
import Audiencia from '../database/models/Audiencia.js';

export function setupAudienciaCadastroHandler(bot) {
  // Handler global para botão 'Voltar' em qualquer etapa do cadastro
  bot.action('back', async (ctx) => {
    popState(ctx);
    // Descobre a etapa anterior e reenvia a pergunta correspondente
    const state = ctx.session && ctx.session.novaAudiencia ? getCurrentState(ctx) : null;
    if (!state) {
      resetState(ctx);
      return initialMenu(ctx);
    }
    switch (state.state) {
      case 'cadastro_audiencia_partes':
        return ctx.reply('✏️ Informe apenas o nome do Polo Ativo (Autor):', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'menu_audiencias')]]));
      case 'cadastro_audiencia_reu':
        return ctx.reply('✏️ Agora informe apenas o nome do Polo Passivo (Réu):', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      case 'cadastro_audiencia_parte_representada':
        return ctx.reply('💼 Qual parte você representa? (Ex: Autor ou Réu)', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      case 'cadastro_audiencia_dia':
        return ctx.reply('📅 Informe o dia da audiência (DD/MM/AAAA):', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      case 'cadastro_audiencia_hora':
        return ctx.reply('⏰ Informe o horário da audiência (HH:MM):', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      case 'cadastro_audiencia_processo':
        return ctx.reply('📄 Informe o número do processo:', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      case 'cadastro_audiencia_comarca':
        return ctx.reply('🏛 Informe a comarca da audiência:', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      default:
        resetState(ctx);
        return initialMenu(ctx);
    }
  });
  // Inicia cadastro de audiência ao clicar no botão do menu
  bot.action(['add_audiencia', 'nova_audiencia'], async (ctx) => {
    ctx.session = ctx.session || {};
    ctx.session.novaAudiencia = {};
    pushState(ctx, 'cadastro_audiencia_partes');
    const message = '✏️ Informe apenas o nome do Polo Ativo (Autor):';
    try {
      await ctx.editMessageText(
        message,
        Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'menu_audiencias')]])
      );
    } catch {
      await ctx.reply(
        message,
        Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'menu_audiencias')]])
      );
    }
  });

  // Permitir que o botão '⬅ Voltar' funcione tanto por callback quanto por texto digitado
  bot.hears('⬅ Voltar', async (ctx) => {
    // Deleta mensagens antigas do bot e do usuário
    if (Array.isArray(ctx.session.botMessageIds)) {
      for (const msgId of ctx.session.botMessageIds) {
        try { await ctx.deleteMessage(msgId); } catch {}
      }
    }
    if (ctx.session.lastUserMessageId) {
      try { await ctx.deleteMessage(ctx.session.lastUserMessageId); } catch {}
      ctx.session.lastUserMessageId = null;
    }
    ctx.session.botMessageIds = [];
    // Simula o clique no botão voltar
  const state = ctx.session && ctx.session.novaAudiencia ? require('../utils/stateManager.js').getCurrentState(ctx) : null;
    if (!state) {
      resetState(ctx);
      return initialMenu(ctx);
    }
    switch (state.state) {
      case 'cadastro_audiencia_partes':
        resetState(ctx);
        return initialMenu(ctx);
      case 'cadastro_audiencia_reu':
        popState(ctx);
        return ctx.reply('✏️ Informe apenas o nome do Polo Ativo (Autor):', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'menu_audiencias')]]));
      case 'cadastro_audiencia_parte_representada':
        popState(ctx);
        return ctx.reply('✏️ Agora informe apenas o nome do Polo Passivo (Réu):', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      case 'cadastro_audiencia_dia':
        popState(ctx);
        return ctx.reply('💼 Qual parte você representa? (Ex: Autor ou Réu)', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      case 'cadastro_audiencia_hora':
        popState(ctx);
        return ctx.reply('📅 Informe o dia da audiência (DD/MM/AAAA):', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      case 'cadastro_audiencia_processo':
        popState(ctx);
        return ctx.reply('⏰ Informe o horário da audiência (HH:MM):', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      case 'cadastro_audiencia_comarca':
        popState(ctx);
        return ctx.reply('📄 Informe o número do processo:', Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]]));
      default:
        resetState(ctx);
        return initialMenu(ctx);
    }
  });

  bot.on('text', async (ctx, next) => {
    ctx.session = ctx.session || {};
    const text = ctx.message.text.trim();
    // Deleta todas as mensagens anteriores do bot e do usuário
    if (Array.isArray(ctx.session.botMessageIds)) {
      for (const msgId of ctx.session.botMessageIds) {
        try { await ctx.deleteMessage(msgId); } catch {}
      }
    }
    if (ctx.session.lastUserMessageId) {
      try { await ctx.deleteMessage(ctx.session.lastUserMessageId); } catch {}
      ctx.session.lastUserMessageId = null;
    }
    ctx.session.botMessageIds = [];
    // Salva o id da mensagem do usuário para deletar depois
    ctx.session.lastUserMessageId = ctx.message.message_id;
    console.log('[LOG] Mensagem recebida:', text, '| State:', ctx.session, '| ctx.state:', ctx.state);
    console.log('[LOG] Mensagem recebida:', text, '| State:', ctx.session, '| ctx.state:', ctx.state);

    // FLUXO ALTERNATIVO DE CADASTRO DE AUDIÊNCIA
    if (isInState(ctx, 'cadastro_audiencia_partes')) {
      if (text === '⬅ Voltar') {
        resetState(ctx);
        return initialMenu(ctx);
      }
      ctx.session.novaAudiencia = ctx.session.novaAudiencia || {};
      ctx.session.novaAudiencia.autor = text;
      console.log('[LOG] Polo Ativo (autor) registrado:', ctx.session.novaAudiencia);
      pushState(ctx, 'cadastro_audiencia_reu');
    const sent = await ctx.reply(
      '✏️ Agora informe apenas o nome do Polo Passivo (Réu):',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]
      ])
    );
    ctx.session.botMessageIds.push(sent.message_id);
    return;
    }

    if (isInState(ctx, 'cadastro_audiencia_reu')) {
      if (text === '⬅ Voltar') {
        popState(ctx);
        return ctx.reply(
          '✏️ Informe o nome da parte do Polo Ativo (Autor):',
          Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]])
        );
      }
      ctx.session.novaAudiencia = ctx.session.novaAudiencia || {};
      ctx.session.novaAudiencia.reu = text;
      console.log('[LOG] Polo Passivo (réu) registrado:', ctx.session.novaAudiencia);
      pushState(ctx, 'cadastro_audiencia_parte_representada');
    const sent = await ctx.reply(
      '💼 Qual parte você representa? (Ex: Autor ou Réu)',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]
      ])
    );
    ctx.session.botMessageIds.push(sent.message_id);
    return;
    }

    if (isInState(ctx, 'cadastro_audiencia_parte_representada')) {
      if (text === '⬅ Voltar') {
        popState(ctx);
        return ctx.reply(
          '✏️ Informe o nome da parte do Polo Passivo (Réu):',
          Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]])
        );
      }
      ctx.session.novaAudiencia = ctx.session.novaAudiencia || {};
      ctx.session.novaAudiencia.parteRepresentada = text;
      console.log('[LOG] Parte representada registrada:', ctx.session.novaAudiencia);
      pushState(ctx, 'cadastro_audiencia_dia');
      const sent = await ctx.reply(
        '📅 Informe o dia da audiência (DD/MM/AAAA):',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]
        ])
      );
      ctx.session.botMessageIds.push(sent.message_id);
      return;
    }

    if (isInState(ctx, 'cadastro_audiencia_dia')) {
  // (bloco removido, fluxo correto segue abaixo)
    }

    // Etapa 3 - Dia
    if (isInState(ctx, 'cadastro_audiencia_dia')) {
      if (text === '⬅ Voltar') {
        popState(ctx);
        return ctx.reply(
          '💼 Qual parte você representa? (Ex: Autor ou Réu)',
          Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]])
        );
      }

      // Validação de data DD/MM/AAAA
      const regexData = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
      if (!regexData.test(text)) {
        return ctx.reply('❌ Data inválida! Use o formato DD/MM/AAAA.',
          Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]])
        );
      }
      // Salvar como string (compatível com o schema)
      ctx.session.novaAudiencia = ctx.session.novaAudiencia || {};
      ctx.session.novaAudiencia.data = text;
      console.log('[LOG] Dia registrado:', ctx.session.novaAudiencia);
      pushState(ctx, 'cadastro_audiencia_hora');
      return ctx.reply(
        '⏰ Informe o horário da audiência (HH:MM):',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]
        ])
      );
    }

    // Etapa 4 - Horário


    if (isInState(ctx, 'cadastro_audiencia_hora')) {
      if (text === '⬅ Voltar') {
        popState(ctx);
        return ctx.reply(
          '📅 Informe o dia da audiência (DD/MM/AAAA):',
          Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]])
        );
      }
      ctx.session.novaAudiencia = ctx.session.novaAudiencia || {};
      ctx.session.novaAudiencia.horario = text;
      console.log('[LOG] Horário registrado:', ctx.session.novaAudiencia);
      pushState(ctx, 'cadastro_audiencia_processo');
      return ctx.reply(
        '📄 Informe o número do processo:',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]
        ])
      );
    }

    if (isInState(ctx, 'cadastro_audiencia_processo')) {
      if (text === '⬅ Voltar') {
        popState(ctx);
        return ctx.reply(
          '⏰ Informe o horário da audiência (HH:MM):',
          Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]])
        );
      }
      ctx.session.novaAudiencia = ctx.session.novaAudiencia || {};
      ctx.session.novaAudiencia.processo = text;
      console.log('[LOG] Processo registrado:', ctx.session.novaAudiencia);
      pushState(ctx, 'cadastro_audiencia_comarca');
      return ctx.reply(
        '🏛 Informe a comarca da audiência:',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]
        ])
      );
    }

    // Etapa 5 - Comarca (Finalização)
    if (isInState(ctx, 'cadastro_audiencia_comarca')) {
      if (text === '⬅ Voltar') {
        popState(ctx);
        return ctx.reply(
          '⏰ Informe o horário da audiência (HH:MM):',
          Markup.inlineKeyboard([[Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]])
        );
      }

      ctx.session.novaAudiencia = ctx.session.novaAudiencia || {};
      ctx.session.novaAudiencia.comarca = text;
      console.log('[LOG] Comarca registrada:', ctx.session.novaAudiencia);

      // Corrigir: definir userId
      const userId = ctx.from && ctx.from.id ? ctx.from.id : null;
      try {
        // Log final antes de salvar
        const dados = ctx.session.novaAudiencia;
        console.log('[LOG] Dados finais para salvar:', dados);
        const novaAudiencia = new Audiencia({
          autor: dados.autor,
          reu: dados.reu,
          parteRepresentada: dados.parteRepresentada,
          data: dados.data,
          horario: dados.horario,
          comarca: dados.comarca,
          processo: dados.processo || '',
          userId,
        });
        await novaAudiencia.save();
        console.log(`💾 Audiência salva no banco para usuário ${userId}`);
      } catch (error) {
        console.error('❌ Erro ao salvar audiência:', error, ctx.session.novaAudiencia);
        await ctx.reply(`❌ Ocorreu um erro ao salvar a audiência.\n${error.message || error}`);
      }

      resetState(ctx);
      ctx.session.novaAudiencia = null;

      await ctx.reply('✅ Audiência cadastrada com sucesso!',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('➕ Cadastrar Nova Audiência', 'add_audiencia'),
            Markup.button.callback('✅ Concluir', 'menu_audiencia_pericia')
          ],
          [Markup.button.callback('⬅ Voltar', 'cadastrar_audiencia')]
        ])
      );
      return;
    }

    return next();
  });
}
