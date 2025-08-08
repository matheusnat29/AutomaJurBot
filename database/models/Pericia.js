// models/Pericia.js

import mongoose from 'mongoose';

const periciaSchema = new mongoose.Schema({
  nomeParte: { type: String, required: true },
  data: { type: Date, required: true },
  horario: { type: String, required: true },
  userId: { type: String, required: true },
});

const Pericia = mongoose.model('Pericia', periciaSchema);

export default Pericia;
