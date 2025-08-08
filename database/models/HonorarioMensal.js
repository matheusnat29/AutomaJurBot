import mongoose from 'mongoose';

const honorarioMensalSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    clientName: { type: String, required: true },
    processNumber: { type: String },
    totalValue: { type: Number, required: true },
    firstPaymentMonth: { type: String, required: true },
    lastPaymentMonth: { type: String, required: true },
    paidMonths: { type: [String], default: [] },
    paidValue: { type: Number, default: 0 },
    owedValue: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const HonorarioMensal = mongoose.model('HonorarioMensal', honorarioMensalSchema);

export default HonorarioMensal; // Linha de exportação correta