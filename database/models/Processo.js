// database/models/Processo.js

import mongoose from 'mongoose';

const processoSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    processNumber: { type: String, required: true },
    libraryName: { type: String, required: true },
    courtSystem: { type: String },
    parteAtiva: { type: String },
    partePassiva: { type: String },
    status: { 
        type: String, 
        enum: ['Em Andamento', 'Sentenciado', 'Recurso', 'Em Conclusão'], 
        default: 'Em Andamento' 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

processoSchema.index({ userId: 1, processNumber: 1, libraryName: 1 }, { unique: true });

const Processo = mongoose.model('Processo', processoSchema);

export default Processo;