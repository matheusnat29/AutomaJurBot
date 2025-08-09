

export function setupWelcomeMessage(bot) {
  bot.on('new_chat_members', async (ctx) => {
    await ctx.reply('👋 Olá! Para começar, clique no botão "Iniciar" abaixo do nome do bot ou digite /start no chat.');
  });
  bot.on('chat_join_request', async (ctx) => {
    await ctx.reply('👋 Seja bem-vindo! Para ativar o bot, clique em "Iniciar" ou digite /start.');
  });
  // Mensagem para chats privados ao abrir o bot (primeira mensagem)
  bot.on('my_chat_member', async (ctx) => {
    if (ctx.chat && ctx.chat.type === 'private') {
      await ctx.reply('👋 Olá! Para começar, clique no botão "Iniciar" ou digite /start.');
    }
  });
}
// handlers/startHandler.js
import { Markup } from 'telegraf';
import { initialMenu } from '../menu/initialMenu.js';
import { pushState, resetState } from '../utils/stateManager.js';
import Advogado from '../database/models/Advogado.js';

export function setupStartHandler(bot) {
  // Handler para botão 'Iniciar' no menu principal
  bot.action('main_menu', async (ctx) => {
    resetState(ctx);
    pushState(ctx, 'main_menu');
    await initialMenu(ctx);
  });
  // Handler global para botão Voltar
  bot.action('back', async (ctx) => {
    resetState(ctx);
    pushState(ctx, 'main_menu');
    await initialMenu(ctx);
  });
  console.log('⚙️ startHandler carregado ✅');

  // Comando /start → Menu inicial
  bot.start(async (ctx) => {
    resetState(ctx);
    pushState(ctx, 'main_menu');
    console.log(`📲 Usuário ${ctx.from?.username || ctx.from?.id} iniciou /start → Estado: main_menu`);
    await initialMenu(ctx);
  });

  // Botão "Cadastrar Advogado"
  bot.action('register_lawyer', async (ctx) => {
    pushState(ctx, 'awaiting_oab');
    console.log(`🆕 Usuário ${ctx.from?.username || ctx.from?.id} iniciou cadastro de advogado → Estado: awaiting_oab`);

    try {
      await ctx.editMessageText('✏️ Digite o *número da OAB* do advogado:', { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('⚠️ Erro ao editar mensagem em register_lawyer:', err.message);
      await ctx.reply('✏️ Digite o *número da OAB* do advogado:', { parse_mode: 'Markdown' });
    }
  });


  // Botão "Voltar ao Menu"
  bot.action('back_to_menu', async (ctx) => {
    resetState(ctx);
    pushState(ctx, 'main_menu');
    console.log(`🔙 Usuário ${ctx.from?.username || ctx.from?.id} voltou ao menu inicial`);
    await initialMenu(ctx);
  });

  // Handler para menu de Audiências/Perícias
  bot.action('menu_audiencia_pericia', async (ctx) => {
    const { audienciaPericiaMenu } = await import('../menu/audienciaPericiaMenu.js');
    await ctx.editMessageText('📅 Menu de Audiências/Perícias:', audienciaPericiaMenu());
  });
  // Handler para menu de Biblioteca/Processos removido para não sobrescrever o handler real
}
