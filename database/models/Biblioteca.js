// database/models/Biblioteca.js
import mongoose from 'mongoose';

const BibliotecaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  userId: { type: Number, required: true },
  processos: [{
    parteAutora: { type: String, required: true },
    parteAdversa: { type: String, required: true },
    numero: { type: String, required: true },
    faseProcessual: { type: String }, // sentenciado, gabinete, recurso, cumprimento
    resultadoProcesso: { type: String }, // ganhou, perdeu
    valorCondenacao: { type: Number },
    honorarioContratualPercentual: { type: Number },
    honorarioContratual: { type: Number },
    honorarioSucumbencialPercentual: { type: Number },
    honorarioSucumbencial: { type: Number }
  }], // lista de processos detalhados
  criadaEm: { type: Date, default: Date.now }
});

export default mongoose.model('Biblioteca', BibliotecaSchema);
