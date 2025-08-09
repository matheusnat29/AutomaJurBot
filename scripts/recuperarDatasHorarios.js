// scripts/recuperarDatasHorarios.js
// Corrige audiências com data ou horário zerados
import mongoose from 'mongoose';
import Audiencia from '../database/models/Audiencia.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/automa_jur_bot');
  const audiencias = await Audiencia.find({ $or: [ { data: { $in: [null, '', '00/00/0000'] } }, { horario: { $in: [null, '', '00:00'] } } ] });
  if (audiencias.length === 0) {
    console.log('Nenhuma audiência com data ou horário zerado encontrada.');
    process.exit(0);
  }
  for (const aud of audiencias) {
    // Exemplo: definir data e horário padrão, ou logar para ajuste manual
    if (!aud.data || aud.data === '' || aud.data === '00/00/0000') {
      aud.data = '01/01/2025'; // Defina aqui a data padrão ou recupere de backup
    }
    if (!aud.horario || aud.horario === '' || aud.horario === '00:00') {
      aud.horario = '09:00'; // Defina aqui o horário padrão ou recupere de backup
    }
    await aud.save();
    console.log(`Corrigido: ${aud.autor} x ${aud.reu} - ${aud.data} ${aud.horario}`);
  }
  console.log('Correção concluída.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
