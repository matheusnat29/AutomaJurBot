// menu/audienciaPericiaMenu.js
import { Markup } from 'telegraf';

export const audienciaPericiaMenu = () => Markup.inlineKeyboard([
  [
    Markup.button.callback('Pautas do Dia', 'pautas_do_dia'),
    Markup.button.callback('NOVA', 'nova_pericia')
  ],
  [
    Markup.button.callback('Perícias Cadastradas', 'pericias_cadastradas'),
    Markup.button.callback('Agendar Lembrete', 'agendar_lembrete')
  ],
  [Markup.button.callback('⬅️ Voltar', 'back')]
]);
