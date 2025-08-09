import { setupAudienciaVisualizacaoHandler } from './handlers/audienciaVisualizacaoHandler.js';
// index.js
import dotenv from 'dotenv';
dotenv.config();

import { Telegraf } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import connectDB from './database/connection.js';
import { userTokens } from './utils/userTokens.js';
import { startReminderScheduler } from './utils/reminderScheduler.js';
import { setupExibirPautaHandler } from './handlers/exibirPautaHandler.js';

// 📌 Handlers existentes
import { setupStartHandler } from './handlers/startHandler.js';
import { setupLembreteActions } from './handlers/lembreteHandler.js';
import { setupAuthCodeHandler } from './handlers/authCodeHandler.js';
import { setupLawyerHandler } from './handlers/lawyerHandler.js';
import { setupLawyerCadastroHandler } from './handlers/lawyerCadastroHandler.js';
import { setupAudienciaMenuHandler } from './handlers/audienciaMenuHandler.js';
import { setupAudienciaCadastroHandler } from './handlers/audienciaCadastroHandler.js';
import { setupPericiaCadastroHandler } from './handlers/periciaCadastroHandler.js';
import { setupPautaDoDiaHandler } from './handlers/pautaDoDiaHandler.js';
import { setupTodasAudienciasHandler } from './handlers/todasAudienciasHandler.js';
import { setupEditarPericiaHandler } from './handlers/editarPericiaHandler.js';
import { setupDefaultHandler } from './handlers/defaultHandler.js';
import { setupEditarAudienciaHandler } from './handlers/editarAudienciaHandler.js';
import { setupHonorarioHandler } from './handlers/honorarioHandler.js';
import { setupGerarPdfHandler } from './handlers/gerarPdfHandler.js';
import { setupProcessoHandler } from './handlers/processoHandler.js';
import { setupLibraryHandler } from './handlers/libraryHandler.js';
import { setupVerAudienciaHandler } from './handlers/verAudienciaHandler.js';
import { setupVerPericiaHandler } from './handlers/verPericiaHandler.js';
import { setupLawyerListaHandler } from './handlers/lawyerListaHandler.js';
import { setupDefinirLembreteHandler } from './handlers/definirLembreteHandler.js';
import { setupPautaHandler } from './handlers/pautaHandler.js';
import { setupPericiaHandler } from './handlers/periciaHandler.js';
import { setupScraperHandler } from './handlers/scraperHandler.js';
import { setupAudienciaPericiaListaHandler } from './handlers/audienciaPericiaListaHandler.js';
import { setupProcessActionsHandler } from './handlers/processActionsHandler.js';

async function bootstrap() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('❌ BOT_TOKEN não definido no .env — defina BOT_TOKEN e reinicie o bot.');
    process.exit(1);
  }

  // 🔹 Conecta ao MongoDB antes de iniciar
  console.log('⏳ Conectando ao MongoDB...');
  await connectDB();
  console.log('✅ Conectado ao MongoDB!');

  const bot = new Telegraf(token);

  // Middleware de sessão persistente
  bot.use((new LocalSession({
    database: 'session_db.json', // arquivo local para persistência
    storage: LocalSession.storageFileAsync
  })).middleware());

  // Registro de handlers
  setupStartHandler(bot);
  setupAuthCodeHandler(bot);
  setupLawyerHandler(bot);
  setupLawyerCadastroHandler(bot);
  setupLawyerListaHandler(bot);
  setupAudienciaMenuHandler(bot);
  setupAudienciaVisualizacaoHandler(bot);
  setupAudienciaCadastroHandler(bot);
  setupPericiaCadastroHandler(bot);
  setupPautaDoDiaHandler(bot);
  setupTodasAudienciasHandler(bot);
  setupEditarPericiaHandler(bot);
  setupEditarAudienciaHandler(bot);
  setupHonorarioHandler(bot);
  setupGerarPdfHandler(bot);
  setupProcessoHandler(bot);
  setupLibraryHandler(bot);
  setupVerAudienciaHandler(bot);
  setupVerPericiaHandler(bot);
  setupDefinirLembreteHandler(bot);
  setupPautaHandler(bot);
  setupPericiaHandler(bot);
  setupScraperHandler(bot);
  setupAudienciaPericiaListaHandler(bot);
  setupProcessActionsHandler(bot);
  setupExibirPautaHandler(bot);

  // Lembretes
  setupLembreteActions(bot, userTokens);

  // Handler default
  setupDefaultHandler(bot);

  // Inicia agendador de lembretes internos
  startReminderScheduler(bot);

  // Inicia o bot
  await bot.launch();
  console.log('🤖 Bot rodando...');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('❌ Erro ao iniciar o bot:', err);
  process.exit(1);
});
