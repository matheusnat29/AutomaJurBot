// utils/reminderScheduler.js
// Gerencia lembretes internos do Telegram
import cron from 'node-cron';
import fs from 'fs';

const REMINDERS_FILE = './data/reminders.json';

// Carrega lembretes do arquivo
function loadReminders() {
  if (!fs.existsSync(REMINDERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

// Salva lembretes no arquivo
function saveReminders(reminders) {
  fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
}

// Adiciona um novo lembrete
export function addReminder(reminder) {
  const reminders = loadReminders();
  reminders.push(reminder);
  saveReminders(reminders);
}

// Inicializa o agendador
export function startReminderScheduler(bot) {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const reminders = loadReminders();
    const toSend = reminders.filter(r => {
      const date = new Date(r.datetime);
      return date <= now && !r.sent;
    });
    for (const reminder of toSend) {
      try {
        await bot.telegram.sendMessage(reminder.chatId, reminder.message);
        reminder.sent = true;
      } catch (e) {
        // erro ao enviar
      }
    }
    // Salva lembretes atualizados (marcando como enviados)
    saveReminders(reminders);
  });
}
