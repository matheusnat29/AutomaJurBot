// models/Audiencia.js

import mongoose from 'mongoose';

const audienciaSchema = new mongoose.Schema({
  autor: { type: String, required: true },
  reu: { type: String, required: true },
  parteRepresentada: { type: String, required: true },
  data: { type: String, required: true },
  horario: { type: String, required: true },
  comarca: { type: String, required: true },
  processo: { type: String, required: false },
  concluida: { type: Boolean, default: false },
  acordo: { type: Boolean, default: null },
  valorAcordo: { type: String, default: null },
  userId: { type: Number, required: true },
});

const Audiencia = mongoose.model('Audiencia', audienciaSchema);

export default Audiencia;
