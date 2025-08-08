import mongoose from 'mongoose';

const RecebivelSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    processNumber: { type: String, required: true },
    libraryName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    dadosCalculo: {
        danoMoral: { type: Number, default: 0 },
        danoMaterial: { type: Number, default: 0 },
        danoMaterialEmDobro: { type: Boolean, default: false },
        honorariosSucumbenciais: {
            tipo: { type: String, enum: ['equidade', 'convencional', null], default: null },
            valor: { type: Number, default: 0 },
            porcentagem: { type: Number, default: 0 }
        },
        multa523: { type: Boolean, default: false },
        honorarios523: {
            tipo: { type: String, enum: ['valor_causa', 'valor_condenacao', null], default: null },
            valor: { type: Number, default: 0 }
        },
        condenacaoBase: { type: String, enum: ['valor_causa', 'vantagem_economica'], default: 'valor_causa' },
        valorCausa: { type: Number, default: 0 }
    },
    valoresFinais: {
        totalBruto: { type: Number, default: 0 },
        honorariosAdv: { type: Number, default: 0 },
        parteCliente: { type: Number, default: 0 }
    },
    valorTotal: { type: Number, required: true }
});

const Recebivel = mongoose.model('Recebivel', RecebivelSchema);

export default Recebivel;