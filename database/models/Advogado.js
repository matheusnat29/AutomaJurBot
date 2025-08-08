import mongoose from 'mongoose';

const advogadoSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    inscription: { type: String, required: true }
});

const Advogado = mongoose.model('Advogado', advogadoSchema);

export default Advogado;