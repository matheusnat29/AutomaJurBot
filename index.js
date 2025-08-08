// index.js

import dotenv from 'dotenv';
dotenv.config();

import { Telegraf } from 'telegraf';
import connectDB from './database/connection.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

// Handlers principais
import { setupStartHandler } from './handlers/startHandler.js';
import { setupLembreteActions } from './handlers/lembreteHandler.js';
import { setupAuthCodeHandler } from './handlers/authCodeHandler.js';
import { setupProcessHandlers } from './handlers/processoHandler.js';
import { setupHonorarioHandlers } from './handlers/honorarioHandler.js';
import { setupLawyerHandlers } from './handlers/lawyerHandler.js';
import { setupAudienciaMenu } from './handlers/audienciaMenuHandler.js';

// Handlers de Audiências e Perícias
import { setupAudienciaCadastroHandler } from './handlers/audienciaCadastroHandler.js';
import { setupPericiaCadastroHandler } from './handlers/periciaCadastroHandler.js';
import { setupEditarPericiaHandler } from './handlers/editarPericiaHandler.js';
import { setupAudienciaVisualizacaoHandler } from './handlers/audienciaVisualizacaoHandler.js';
import { setupGerarPdfHandler } from './handlers/gerarPdfHandler.js';

// Variáveis obrigatórias
const {
  BOT_TOKEN,
  MONGODB_URI,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  ACCESS_CODE,
  USER_LIMIT,
  ADMIN_ID,
  AUTH_ENABLED
} = process.env;

if (
  !BOT_TOKEN ||
  !MONGODB_URI ||
  !GOOGLE_CLIENT_ID ||
  !GOOGLE_CLIENT_SECRET ||
  !GOOGLE_REDIRECT_URI ||
  !ACCESS_CODE ||
  isNaN(parseInt(USER_LIMIT)) ||
  isNaN(parseInt(ADMIN_ID))
) {
  console.error('❌ Variáveis de ambiente ausentes ou inválidas. Verifique seu arquivo .env.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const userTokens = new Map();

console.log('✅ Iniciando LegalPulseBot...');

const main = async () => {
  try {
    // Conexão com banco de dados
    await connectDB();

    // Middleware condicional
    if (AUTH_ENABLED === 'true') {
      console.log('🔐 Middleware de autenticação ATIVADO');
      bot.use(authMiddleware(ACCESS_CODE));
    } else {
      console.log('⚠️ Middleware de autenticação DESATIVADO');
    }

    // Registro de todos os handlers
    setupStartHandler(bot);
    setupLembreteActions(bot);
    setupAuthCodeHandler(bot, userTokens);
    setupProcessHandlers(bot);
    setupHonorarioHandlers(bot);
    setupLawyerHandlers(bot);
    setupAudienciaMenu(bot); // ✅ Correto e incluído

    setupAudienciaCadastroHandler(bot);
    setupPericiaCadastroHandler(bot);
    setupEditarPericiaHandler(bot);
    setupAudienciaVisualizacaoHandler(bot);
    setupGerarPdfHandler(bot);

    // Inicialização do bot
    bot.botInfo = await bot.telegram.getMe();
    console.log(`✅ Bot iniciado como: @${bot.botInfo.username}`);
    await bot.launch();
  } catch (err) {
    console.error('❌ Falha ao iniciar o bot:', err);
  }
};

// Start
main();

// Encerramento seguro
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
