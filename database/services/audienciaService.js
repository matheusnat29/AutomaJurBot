// database/services/audienciaService.js
import Audiencia from '../models/Audiencia.js';
import Pericia from '../models/Pericia.js';

// Retorna todas as audiências
export async function getAllAudiencias(userId) {
  // Se quiser filtrar por usuário, use { userId }, senão deixe {}
  return await Audiencia.find(userId ? { userId } : {});
}

// Retorna todas as perícias
export async function getAllPericias(userId) {
  return await Pericia.find(userId ? { userId } : {});
}
