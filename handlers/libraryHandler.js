// handlers/libraryHandler.js
import { Markup } from 'telegraf';
import Biblioteca from '../database/models/Biblioteca.js';

export function setupLibraryHandler(bot) {
  // Listar bibliotecas do usuário
  bot.action('menu_biblioteca_processos', async (ctx) => {
    const userId = ctx.from.id;
    const bibliotecas = await Biblioteca.find({ userId });
    let msg = '📚 Minhas Bibliotecas:';
    const buttons = [
      [Markup.button.callback('➕ Criar Nova Biblioteca', 'criar_biblioteca')]
    ];
    if (bibliotecas.length === 0) {
      msg += '\nVocê ainda não possui bibliotecas.';
    } else {
      bibliotecas.forEach(bib => {
        buttons.push([Markup.button.callback(`📁 ${bib.nome}`, `abrir_biblioteca_${bib._id}`)]);
      });
    }
    buttons.push([Markup.button.callback('⬅️ Voltar', 'back')]);
    await ctx.editMessageText(msg, Markup.inlineKeyboard(buttons));
  });

  // Criar nova biblioteca
  bot.action('criar_biblioteca', async (ctx) => {
    ctx.session = ctx.session || {};
    ctx.session.aguardandoNomeBiblioteca = true;
    await ctx.reply('✏️ Digite o nome da nova biblioteca:');
  });

  // Receber nome da biblioteca
  bot.on('text', async (ctx, next) => {
    if (ctx.session && ctx.session.aguardandoNomeBiblioteca) {
      const nome = ctx.message.text.trim();
      const userId = ctx.from.id;
      const existente = await Biblioteca.findOne({ userId, nome });
      if (existente) {
        await ctx.reply('⚠️ Você já possui uma biblioteca com esse nome. Escolha outro.');
        return;
      }
      const nova = new Biblioteca({ nome, userId, processos: [] });
      await nova.save();
      ctx.session.aguardandoNomeBiblioteca = false;
      await ctx.reply(`✅ Biblioteca "${nome}" criada com sucesso!`);
      // Atualiza lista
      const bibliotecas = await Biblioteca.find({ userId });
      let msg = '📚 Minhas Bibliotecas:';
      const buttons = [
        [Markup.button.callback('➕ Criar Nova Biblioteca', 'criar_biblioteca')]
      ];
      bibliotecas.forEach(bib => {
        buttons.push([Markup.button.callback(`📁 ${bib.nome}`, `abrir_biblioteca_${bib._id}`)]);
      });
      buttons.push([Markup.button.callback('⬅️ Voltar', 'back')]);
      await ctx.reply(msg, Markup.inlineKeyboard(buttons));
      return;
    }
    return next();
  });

  // Cadastrar processo em biblioteca
  bot.action(/cadastrar_processo_(.+)/, async (ctx) => {
    ctx.session = ctx.session || {};
    ctx.session.cadastrandoProcessoBibliotecaId = ctx.match[1];
    ctx.session.cadastrandoProcessoEtapa = 'parte_autora';
    await ctx.reply('✏️ Digite o nome da parte autora do processo:');
  });

  // ...existing code...

  // Handler único para todos os fluxos de texto
  bot.on('text', async (ctx, next) => {
    // Fluxo de resultado do processo (ganhou)
    if (ctx.session && ctx.session.resultadoProcessoBibliotecaId !== undefined && ctx.session.resultadoProcessoIdx !== undefined) {
      const bibliotecaId = ctx.session.resultadoProcessoBibliotecaId;
      const idx = ctx.session.resultadoProcessoIdx;
      const biblioteca = await Biblioteca.findById(bibliotecaId);
      if (!biblioteca || !biblioteca.processos[idx]) {
        await ctx.reply('❌ Processo não encontrado.');
        ctx.session.resultadoProcessoBibliotecaId = undefined;
        ctx.session.resultadoProcessoIdx = undefined;
        ctx.session.resultadoPergunta = undefined;
        return;
      }
      const proc = biblioteca.processos[idx];
      if (ctx.session.resultadoPergunta === 'valorCondenacao') {
        // Aceita apenas números inteiros
        const valorStr = ctx.message.text.replace(/\D/g, '');
        const valor = parseInt(valorStr, 10);
        if (isNaN(valor) || valor <= 0) {
          await ctx.reply('Digite apenas números inteiros para o valor da condenação.');
          return;
        }
        proc.valorCondenacao = valor;
        ctx.session.resultadoPergunta = 'honorarioContratualPercentual';
        await ctx.reply('Qual o percentual (%) do honorário contratual? (apenas número, ex: 30)');
        await biblioteca.save();
        return;
      } else if (ctx.session.resultadoPergunta === 'honorarioContratualPercentual') {
        const percentual = parseFloat(ctx.message.text.replace(',', '.'));
        if (isNaN(percentual) || percentual < 0 || percentual > 100) {
          await ctx.reply('Digite um percentual válido entre 0 e 100.');
          return;
        }
        proc.honorarioContratualPercentual = percentual;
        proc.honorarioContratual = (proc.valorCondenacao || 0) * (percentual / 100);
        ctx.session.resultadoPergunta = 'honorarioSucumbencialPercentual';
        await ctx.reply('Qual o percentual (%) do honorário sucumbencial? (apenas número, ex: 10)');
        await biblioteca.save();
        return;
      } else if (ctx.session.resultadoPergunta === 'honorarioSucumbencialPercentual') {
        const percentual = parseFloat(ctx.message.text.replace(',', '.'));
        if (isNaN(percentual) || percentual < 0 || percentual > 100) {
          await ctx.reply('Digite um percentual válido entre 0 e 100.');
          return;
        }
        // Corrigir para garantir que o percentual seja salvo corretamente
        proc.honorarioSucumbencialPercentual = percentual;
        proc.honorarioSucumbencial = (proc.valorCondenacao || 0) * (percentual / 100);
        // Calcular valor do cliente e total de honorários
        proc.honorarioTotal = (proc.honorarioContratual || 0) + (proc.honorarioSucumbencial || 0);
        proc.valorCliente = (proc.valorCondenacao || 0) - (proc.honorarioContratual || 0);
        await biblioteca.save();
        // Limpar sessão ANTES de qualquer reply para evitar duplicidade
        ctx.session.resultadoProcessoBibliotecaId = undefined;
        ctx.session.resultadoProcessoIdx = undefined;
        ctx.session.resultadoPergunta = undefined;
        // Voltar para detalhes do processo
        ctx.match = [`ver_processo_${bibliotecaId}_${idx}`, bibliotecaId, idx];
        await bot.handleUpdate({
          ...ctx.update,
          message: {
            ...ctx.update.message,
            text: `/ver_processo_${bibliotecaId}_${idx}`
          }
        }, ctx);
        // Botão Voltar após valores salvos
        await ctx.reply('✅ Valores salvos!', {
          reply_markup: {
            inline_keyboard: [
              [ { text: '🔄 Atualizar valores', callback_data: `ver_processo_${bibliotecaId}_${idx}` } ]
            ]
          }
        });
        return;
      }
    }
    // Fluxo de cadastro de processo
    if (ctx.session && ctx.session.cadastrandoProcessoBibliotecaId) {
      const bibliotecaId = ctx.session.cadastrandoProcessoBibliotecaId;
      if (ctx.session.cadastrandoProcessoEtapa === 'parte_autora') {
        ctx.session.cadastrandoProcessoParteAutora = ctx.message.text.trim();
        if (ctx.session.cadastrandoProcessoParte) delete ctx.session.cadastrandoProcessoParte;
        ctx.session.cadastrandoProcessoEtapa = 'parte_adversa';
        await ctx.reply('✏️ Agora digite o nome da parte adversa:');
        return;
      } else if (ctx.session.cadastrandoProcessoEtapa === 'parte_adversa') {
        ctx.session.cadastrandoProcessoParteAdversa = ctx.message.text.trim();
        ctx.session.cadastrandoProcessoEtapa = 'numero';
        await ctx.reply('🔢 Agora digite o número do processo:');
        return;
      } else if (ctx.session.cadastrandoProcessoEtapa === 'numero') {
        const numero = ctx.message.text.trim();
        const parteAutora = ctx.session.cadastrandoProcessoParteAutora;
        const parteAdversa = ctx.session.cadastrandoProcessoParteAdversa;
        if (!parteAutora || !parteAdversa || !numero) {
          await ctx.reply('❌ Todos os campos (parte autora, parte adversa e número) são obrigatórios. Tente novamente.');
          ctx.session.cadastrandoProcessoEtapa = 'parte_autora';
          return;
        }
        const biblioteca = await Biblioteca.findById(bibliotecaId);
        if (!biblioteca) {
          await ctx.reply('❌ Biblioteca não encontrada.');
        } else {
          biblioteca.processos = (biblioteca.processos || []).filter(proc => proc && proc.parteAutora && proc.parteAdversa && proc.numero);
          biblioteca.processos.push({ parteAutora, parteAdversa, numero });
          await biblioteca.save();
          await ctx.reply(`✅ Processo cadastrado na biblioteca \"${biblioteca.nome}\"!`);
        }
        ctx.session.cadastrandoProcessoEtapa = 'pergunta_final';
        await ctx.reply('Deseja cadastrar outro processo?', Markup.inlineKeyboard([
          [Markup.button.callback('➕ Novo Processo', `cadastrar_processo_${bibliotecaId}`)],
          [Markup.button.callback('✅ Concluir', `abrir_biblioteca_${bibliotecaId}`)]
        ]));
        delete ctx.session.cadastrandoProcessoParteAutora;
        delete ctx.session.cadastrandoProcessoParteAdversa;
        return;
      }
    }
    return next();
  });

  // Menu: Biblioteca
  bot.action(/abrir_biblioteca_(.+)/, async (ctx) => {
    const bibliotecaId = ctx.match[1];
    const biblioteca = await Biblioteca.findById(bibliotecaId);
    if (!biblioteca) {
      await ctx.reply('❌ Biblioteca não encontrada.');
      return;
    }
    let msg = `📁 Biblioteca: <b>${biblioteca.nome}</b>\n`;
    const buttons = [
      [Markup.button.callback('➕ Cadastrar Processo', `cadastrar_processo_${bibliotecaId}`)],
      [Markup.button.callback('📋 Lista de Processos', `listar_processos_${bibliotecaId}`)],
      [Markup.button.callback('⬅️ Voltar', 'menu_biblioteca_processos')]
    ];
    // Evita erro 400 do Telegram ao tentar editar mensagem sem alteração
    try {
      await ctx.editMessageText(msg, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    } catch (err) {
      if (err && err.description && err.description.includes('message is not modified')) {
        // Ignora erro, pois não houve alteração real
      } else {
        throw err;
      }
    }
  });

  // Lista de Processos
  bot.action(/listar_processos_(.+)/, async (ctx) => {
    const bibliotecaId = ctx.match[1];
    const biblioteca = await Biblioteca.findById(bibliotecaId);
    if (!biblioteca) {
      await ctx.reply('❌ Biblioteca não encontrada.');
      return;
    }
    let msg = `📋 <b>Lista de Processos da Biblioteca: ${biblioteca.nome}</b>\n`;
    msg += '<i>Para ver mais opções, clique sobre o processo desejado.</i>\n';
    let processButtons = [];
    if (biblioteca.processos.length === 0) {
      msg += 'Nenhum processo cadastrado.';
    } else {
      const faseEmojis = {
        sentenciado: '🟢',
        gabinete: '🏛️',
        recurso: '📤',
        cumprimento: '✅',
        default: '🟢'
      };
      const resultadoEmoji = proc => proc.resultadoProcesso === 'ganhou' ? '🟩💲' : (proc.resultadoProcesso === 'perdeu' ? '❌' : '');
      const processosOrdenados = biblioteca.processos
        .filter(proc => proc && proc.parteAutora && proc.numero)
        .sort((a, b) => a.parteAutora.localeCompare(b.parteAutora, 'pt-BR'));
      msg += 'Selecione um processo:';
      processosOrdenados.forEach((proc, idx) => {
        const emoji = faseEmojis[proc.faseProcessual] || faseEmojis.default;
        const label = `${resultadoEmoji(proc)} ${emoji} ${idx + 1}. ${proc.parteAutora} - ${proc.numero}`;
        processButtons.push([Markup.button.callback(label, `ver_processo_${bibliotecaId}_${idx}`)]);
      });
    }
    processButtons.push([Markup.button.callback('⬅️ Voltar', `abrir_biblioteca_${bibliotecaId}`)]);
    await ctx.editMessageText(msg, { parse_mode: 'HTML', ...Markup.inlineKeyboard(processButtons) });
  });

  // Detalhes do Processo
  bot.action(/ver_processo_(.+)_(\d+)/, async (ctx) => {
  // Handler para resultado do processo
  bot.action(/resultado_processo_(.+)_(\d+)_(ganhou|perdeu)/, async (ctx) => {
    const bibliotecaId = ctx.match[1];
    const idx = parseInt(ctx.match[2], 10);
    const resultado = ctx.match[3];
    const biblioteca = await Biblioteca.findById(bibliotecaId);
    if (!biblioteca || !biblioteca.processos[idx]) {
      await ctx.reply('❌ Processo não encontrado.');
      return;
    }
    biblioteca.processos[idx].resultadoProcesso = resultado;
    // Limpa valores se perdeu
    if (resultado === 'perdeu') {
      biblioteca.processos[idx].valorCondenacao = undefined;
      biblioteca.processos[idx].honorarioContratualPercentual = undefined;
      biblioteca.processos[idx].honorarioContratual = undefined;
      biblioteca.processos[idx].honorarioSucumbencial = undefined;
      biblioteca.processos[idx].honorarioSucumbencialPercentual = undefined;
      biblioteca.processos[idx].valorCliente = undefined;
      biblioteca.processos[idx].honorarioTotal = undefined;
      await biblioteca.save();
      await ctx.answerCbQuery('Marcado como PERDEU.');
      // Atualiza detalhes imediatamente
      ctx.match = [`ver_processo_${bibliotecaId}_${idx}`, bibliotecaId, idx];
      await bot.handleUpdate({
        ...ctx.update,
        callback_query: {
          ...ctx.update.callback_query,
          data: `ver_processo_${bibliotecaId}_${idx}`
        }
      }, ctx);
      return;
    }
  // Se ganhou, iniciar perguntas (NÃO atualizar detalhes agora, só após os cálculos)
  await biblioteca.save();
  ctx.session = ctx.session || {};
  ctx.session.resultadoProcessoBibliotecaId = bibliotecaId;
  ctx.session.resultadoProcessoIdx = idx;
  ctx.session.resultadoPergunta = 'valorCondenacao';
  await ctx.answerCbQuery('Informe o valor da condenação.');
  await ctx.reply('💰 Qual o valor da condenação? (apenas números, use apenas números inteiros)');
  });

  // ...existing code...
    const bibliotecaId = ctx.match[1];
    const idx = parseInt(ctx.match[2], 10);
    const biblioteca = await Biblioteca.findById(bibliotecaId);
    if (!biblioteca || !biblioteca.processos[idx]) {
      await ctx.reply('❌ Processo não encontrado.');
      return;
    }
    const proc = biblioteca.processos[idx];
    const resultadoEmoji = proc.resultadoProcesso === 'ganhou' ? '🟩💲' : (proc.resultadoProcesso === 'perdeu' ? '❌' : '');
    let msg = `📄 <b>Detalhes do Processo</b>\n`;
    msg += `👤 Parte autora: <b>${proc.parteAutora}</b>\n`;
    msg += `⚖️ Parte adversa: <b>${proc.parteAdversa}</b>\n`;
    msg += `📑 Número: <b>${proc.numero}</b>\n`;
    // Bloco de resultado
    if (proc.resultadoProcesso) {
      msg += `\n<b>Resultado:</b> ${resultadoEmoji} <b>${proc.resultadoProcesso === 'ganhou' ? 'Ganhou' : 'Perdeu'}</b>`;
      if (proc.resultadoProcesso === 'ganhou') {
  // Emojis
  const emojiCondenacao = '💰';
  const emojiContratual = '📝';
  const emojiSucumbencial = '⚖️';
  const emojiTotal = '🧮';
  const emojiCliente = '👤';
  // Garantir que todos os valores estejam definidos corretamente
  const valorCondenacao = Number(proc.valorCondenacao) || 0;
  const honorarioContratual = Number(proc.honorarioContratual) || 0;
  const honorarioContratualPercentual = Number(proc.honorarioContratualPercentual) || 0;
  const honorarioSucumbencial = Number(proc.honorarioSucumbencial) || 0;
  const honorarioSucumbencialPercentual = Number(proc.honorarioSucumbencialPercentual) || 0;
  // Honorário total é sempre a soma dos dois
  const honorarioTotal = honorarioContratual + honorarioSucumbencial;
  // Valor do cliente é sempre condenação - honorário contratual
  const valorCliente = valorCondenacao - honorarioContratual;
  // Corrigir exibição do percentual de sucumbência (mostrar sempre com 2 casas decimais e garantir valor correto)
  const percentContratual = (typeof proc.honorarioContratualPercentual === 'number' && !isNaN(proc.honorarioContratualPercentual)) ? proc.honorarioContratualPercentual : 0;
  const percentSucumbencial = (typeof proc.honorarioSucumbencialPercentual === 'number' && !isNaN(proc.honorarioSucumbencialPercentual)) ? proc.honorarioSucumbencialPercentual : 0;
  msg += `\n${emojiCondenacao} <b>Valor da condenação:</b> R$ ${valorCondenacao.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
  msg += `\n${emojiContratual} <b>Honorário contratual:</b> R$ ${honorarioContratual.toLocaleString('pt-BR', {minimumFractionDigits:2})} (${percentContratual.toLocaleString('pt-BR', {minimumFractionDigits:2})}%)`;
  msg += `\n${emojiSucumbencial} <b>Honorário sucumbencial:</b> R$ ${honorarioSucumbencial.toLocaleString('pt-BR', {minimumFractionDigits:2})} (${percentSucumbencial.toLocaleString('pt-BR', {minimumFractionDigits:2})}%)`;
  msg += `\n${emojiTotal} <b>Honorário total:</b> R$ ${honorarioTotal.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
  msg += `\n${emojiCliente} <b>Valor do cliente:</b> R$ ${valorCliente.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
      }
    }
    msg += '\n\n<b>Andamentos:</b>\n';
    const fases = [
      { label: '🟢 Sentenciado', value: 'sentenciado' },
      { label: '🏛️ No gabinete', value: 'gabinete' },
      { label: '📤 Recurso', value: 'recurso' },
      { label: '✅ Cumprimento de sentença', value: 'cumprimento' }
    ];
    const faseAtual = proc.faseProcessual || '';
    fases.forEach(fase => {
      msg += `${(faseAtual === fase.value ? '👉 ' : '')}${fase.label}\n`;
    });
    msg += '\n<i>Para alterar a fase processual, clique no menu <b>Status</b> abaixo:</i>';
    const buttons = [
      [Markup.button.callback('📊 Status', `menu_status_${bibliotecaId}_${idx}`)],
      [Markup.button.callback('🟩💲 Ganhou', `resultado_processo_${bibliotecaId}_${idx}_ganhou`), Markup.button.callback('❌ Perdeu', `resultado_processo_${bibliotecaId}_${idx}_perdeu`)],
      [Markup.button.callback('✏️ Editar', `editar_processo_${bibliotecaId}_${idx}`), Markup.button.callback('🗑️ Excluir', `excluir_processo_${bibliotecaId}_${idx}`)],
      [Markup.button.callback('⬅️ Voltar', `listar_processos_${bibliotecaId}`)]
    ];
    try {
      await ctx.editMessageText(msg, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    } catch (err) {
      if (err && err.description && err.description.includes('message is not modified')) {
        // Ignora erro, pois não houve alteração real
      } else {
        throw err;
      }
    }
  // Menu de status com os 4 estágios
  bot.action(/menu_status_(.+)_(\d+)/, async (ctx) => {
    const bibliotecaId = ctx.match[1];
    const idx = parseInt(ctx.match[2], 10);
    const biblioteca = await Biblioteca.findById(bibliotecaId);
    if (!biblioteca || !biblioteca.processos[idx]) {
      await ctx.reply('❌ Processo não encontrado.');
      return;
    }
    const fases = [
      { label: '🟢 Sentenciado', value: 'sentenciado' },
      { label: '🏛️ No gabinete', value: 'gabinete' },
      { label: '📤 Recurso', value: 'recurso' },
      { label: '✅ Cumprimento de sentença', value: 'cumprimento' }
    ];
    const faseButtons = fases.map(fase => [Markup.button.callback(fase.label, `marcar_fase_${bibliotecaId}_${idx}_${fase.value}`)]);
    faseButtons.push([Markup.button.callback('⬅️ Voltar', `ver_processo_${bibliotecaId}_${idx}`)]);
    await ctx.editMessageText('Selecione o novo status do processo:', { ...Markup.inlineKeyboard(faseButtons) });
  });
  });

  // Marcar/alterar fase processual
  bot.action(/marcar_fase_(.+)_(\d+)_(sentenciado|gabinete|recurso|cumprimento)/, async (ctx) => {
    const bibliotecaId = ctx.match[1];
    const idx = parseInt(ctx.match[2], 10);
    const fase = ctx.match[3];
    const biblioteca = await Biblioteca.findById(bibliotecaId);
    if (!biblioteca || !biblioteca.processos[idx]) {
      await ctx.reply('❌ Processo não encontrado.');
      return;
    }
    // Ordenar processos igual à exibição
    const processosOrdenados = biblioteca.processos
      .filter(proc => proc && proc.parteAutora && proc.numero)
      .sort((a, b) => a.parteAutora.localeCompare(b.parteAutora, 'pt-BR'));
    const proc = processosOrdenados[idx];
    if (!proc) {
      await ctx.reply('❌ Processo não encontrado.');
      return;
    }
    if (proc.faseProcessual === fase) {
      await ctx.answerCbQuery('O processo já está nessa fase.');
      return;
    }
    proc.faseProcessual = fase;
    await biblioteca.save();
    await ctx.answerCbQuery('Status alterado! Para mudar novamente, clique no menu Status abaixo.');
    // Voltar para detalhes do processo (já com status atualizado)
    // Reaproveita o handler de detalhes
    ctx.match = [`ver_processo_${bibliotecaId}_${idx}`, bibliotecaId, idx];
    await bot.handleUpdate({
      ...ctx.update,
      callback_query: {
        ...ctx.update.callback_query,
        data: `ver_processo_${bibliotecaId}_${idx}`
      }
    }, ctx);
  });

  // Excluir processo
  bot.action(/excluir_processo_(.+)_(\d+)/, async (ctx) => {
    const bibliotecaId = ctx.match[1];
    const idx = parseInt(ctx.match[2], 10);
    const biblioteca = await Biblioteca.findById(bibliotecaId);
    if (!biblioteca || !biblioteca.processos[idx]) {
      await ctx.reply('❌ Processo não encontrado.');
      return;
    }
    biblioteca.processos.splice(idx, 1);
    await biblioteca.save();
    await ctx.reply('🗑️ Processo excluído com sucesso!');
    // Volta para lista de processos
    const novaBiblioteca = await Biblioteca.findById(bibliotecaId);
    let msg = `📋 <b>Lista de Processos da Biblioteca: ${novaBiblioteca.nome}</b>\n`;
    let processButtons = [];
    if (novaBiblioteca.processos.length === 0) {
      msg += 'Nenhum processo cadastrado.';
    } else {
      const processosOrdenados = novaBiblioteca.processos
        .filter(proc => proc && proc.parteAutora && proc.numero)
        .sort((a, b) => a.parteAutora.localeCompare(b.parteAutora, 'pt-BR'));
      msg += 'Selecione um processo:';
      processosOrdenados.forEach((proc, idx2) => {
        const label = `${idx2 + 1}. ${proc.parteAutora} - ${proc.numero}`;
        processButtons.push([Markup.button.callback(label, `ver_processo_${bibliotecaId}_${idx2}`)]);
      });
    }
    processButtons.push([Markup.button.callback('⬅️ Voltar', `abrir_biblioteca_${bibliotecaId}`)]);
    await ctx.editMessageText(msg, { parse_mode: 'HTML', ...Markup.inlineKeyboard(processButtons) });
  });

  // Editar processo
  bot.action(/editar_processo_(.+)_(\d+)/, async (ctx) => {
    const bibliotecaId = ctx.match[1];
    const idx = parseInt(ctx.match[2], 10);
    const biblioteca = await Biblioteca.findById(bibliotecaId);
    if (!biblioteca || !biblioteca.processos[idx]) {
      await ctx.reply('❌ Processo não encontrado.');
      return;
    }
    ctx.session = ctx.session || {};
    ctx.session.editandoProcessoBibliotecaId = bibliotecaId;
    ctx.session.editandoProcessoIdx = idx;
    ctx.session.editandoProcessoEtapa = 'parte_autora';
    await ctx.reply('✏️ Digite o novo nome da parte autora:');
  });

  // Receber edição do processo
  bot.on('text', async (ctx, next) => {
    if (ctx.session && ctx.session.editandoProcessoBibliotecaId !== undefined && ctx.session.editandoProcessoIdx !== undefined) {
      const bibliotecaId = ctx.session.editandoProcessoBibliotecaId;
      const idx = ctx.session.editandoProcessoIdx;
      const biblioteca = await Biblioteca.findById(bibliotecaId);
      if (!biblioteca || !biblioteca.processos[idx]) {
        await ctx.reply('❌ Processo não encontrado.');
        ctx.session.editandoProcessoBibliotecaId = undefined;
        ctx.session.editandoProcessoIdx = undefined;
        ctx.session.editandoProcessoEtapa = undefined;
        return;
      }
      if (ctx.session.editandoProcessoEtapa === 'parte_autora') {
        biblioteca.processos[idx].parteAutora = ctx.message.text.trim();
        ctx.session.editandoProcessoEtapa = 'parte_adversa';
        await ctx.reply('✏️ Digite o novo nome da parte adversa:');
        await biblioteca.save();
        return;
      } else if (ctx.session.editandoProcessoEtapa === 'parte_adversa') {
        biblioteca.processos[idx].parteAdversa = ctx.message.text.trim();
        ctx.session.editandoProcessoEtapa = 'numero';
        await ctx.reply('🔢 Digite o novo número do processo:');
        await biblioteca.save();
        return;
      } else if (ctx.session.editandoProcessoEtapa === 'numero') {
        biblioteca.processos[idx].numero = ctx.message.text.trim();
        await biblioteca.save();
        await ctx.reply('✅ Processo editado com sucesso!');
        // Limpar sessão de edição
        ctx.session.editandoProcessoBibliotecaId = undefined;
        ctx.session.editandoProcessoIdx = undefined;
        ctx.session.editandoProcessoEtapa = undefined;
        // Voltar para detalhes do processo
        await ctx.reply('Voltando para detalhes do processo...');
        // Reexibir detalhes
        const proc = biblioteca.processos[idx];
        let msg = `<b>Detalhes do Processo</b>\n`;
        msg += `Parte autora: <b>${proc.parteAutora}</b>\n`;
        msg += `Parte adversa: <b>${proc.parteAdversa}</b>\n`;
        msg += `Número: <b>${proc.numero}</b>\n`;
        const buttons = [
          [Markup.button.callback('✏️ Editar', `editar_processo_${bibliotecaId}_${idx}`), Markup.button.callback('🗑️ Excluir', `excluir_processo_${bibliotecaId}_${idx}`)],
          [Markup.button.callback('⬅️ Voltar', `listar_processos_${bibliotecaId}`)]
        ];
        await ctx.reply(msg, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
        return;
      }
    }
    return next();
  });
}
