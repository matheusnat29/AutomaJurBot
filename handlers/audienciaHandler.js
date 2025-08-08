// handlers/audienciaHandler.js

import { Markup } from 'telegraf';
import { pushState, getCurrentState, popState } from '../utils/stateManager.js';
import { initialMenu } from '../menu/initialMenu.js';
import Audiencia from '../database/models/Audiencia.js';

export function setupAudienciaHandlers(bot) {
  // Menu principal de audiências e perícias
  bot.action('audiencias_pericias', async (ctx) => {
    console.log('🟢 Menu de Audiências e Perícias acessado');
    pushState(ctx, 'audiencias_menu');
    await ctx.editMessageText('⏳ Menu de Audiências e Perícias:', Markup.inlineKeyboard([
      [Markup.button.callback('📅 Pauta do Dia', 'pauta_dia')],
      [Markup.button.callback('📂 Todas as Audiências/Perícias', 'todas_audiencias')],
      [Markup.button.callback('➕ Cadastrar Nova Audiência', 'nova_audiencia')],
      [Markup.button.callback('🧪 Cadastrar Nova Perícia', 'nova_pericia')],
      [Markup.button.callback('🖨️ Gerar PDF da Pauta do Dia', 'gerar_pdf_pauta')],
      [Markup.button.callback('⏰ Lembretes Definidos', 'lembretes_definidos')],
      [Markup.button.callback('⬅️ Voltar', 'back')]
    ]));
  });

  // Início do cadastro da audiência
  bot.action('nova_audiencia', async (ctx) => {
    console.log('🟢 Iniciando cadastro de nova audiência');
    pushState(ctx, 'cadastro_audiencia_nome_partes', { audiencia: {} });
    await ctx.editMessageText('✍️ Informe o nome das partes (autor x réu):', Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'back')]
    ]));
  });

  // Respostas do usuário no fluxo de cadastro
  bot.on('text', async (ctx, next) => {
    const state = getCurrentState(ctx);
    const userId = ctx.from.id;
    const text = ctx.message.text;

    if (!state || !state.state.startsWith('cadastro_audiencia')) return next();

    const dados = state.data.audiencia;

    switch (state.state) {
      case 'cadastro_audiencia_nome_partes':
        dados.partes = text;
        pushState(ctx, 'cadastro_audiencia_parte_representada', { audiencia: dados });
        return ctx.reply('👤 Qual parte você representa?', Markup.inlineKeyboard([
          [Markup.button.callback('Autor', 'representa_autor')],
          [Markup.button.callback('Réu', 'representa_reu')],
          [Markup.button.callback('⬅️ Voltar', 'back')]
        ]));

      case 'cadastro_audiencia_data':
        dados.data = text;
        pushState(ctx, 'cadastro_audiencia_horario', { audiencia: dados });
        return ctx.reply('⏰ Informe o horário da audiência (ex: 14:30):');

      case 'cadastro_audiencia_horario':
        dados.horario = text;
        pushState(ctx, 'cadastro_audiencia_comarca', { audiencia: dados });
        return ctx.reply('🏛️ Informe a comarca da audiência:');

      case 'cadastro_audiencia_comarca':
        dados.comarca = text;

        const novaAudiencia = new Audiencia({ userId, ...dados });
        await novaAudiencia.save();
        console.log('✅ Nova audiência cadastrada:', novaAudiencia);
        popState(ctx);
        return ctx.reply('✅ Audiência cadastrada com sucesso!', initialMenu());

      default:
        return next();
    }
  });

  // Parte representada
  bot.action(/representa_(.+)/, async (ctx) => {
    const parte = ctx.match[1];
    const state = getCurrentState(ctx);
    const dados = state?.data?.audiencia;

    if (!dados) return ctx.reply('❌ Erro ao recuperar dados da audiência.');

    dados.representa = parte;
    pushState(ctx, 'cadastro_audiencia_data', { audiencia: dados });
    await ctx.editMessageText('📅 Informe a data da audiência (ex: 20/08/2025):');
  });
}
