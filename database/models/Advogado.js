// database/models/Advogado.js
import mongoose from 'mongoose';

const advogadoSchema = new mongoose.Schema({
  nome:    { type: String, required: true },
  oab:     { type: String, required: true },
  uf:      { type: String },
  email:   { type: String },
  telegramId: { type: Number, required: true }
}, { timestamps: true });

// nome do model: 'Advogado' -> coleção 'advogados' (mongoose)
const Advogado = mongoose.model('Advogado', advogadoSchema);

export default Advogado;
