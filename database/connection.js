import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
  } catch (err) {
    console.error('❌ Erro de conexão com o MongoDB:', err.message);
    process.exit(1);
  }
};

export default connectDB;