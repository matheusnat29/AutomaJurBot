import mongoose from 'mongoose';

const LawyerSchema = new mongoose.Schema({
    oabNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: { type: String },
    lastUpdate: { type: Date }
});

const UserSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    lawyers: [LawyerSchema]
});

const User = mongoose.model('User', UserSchema);

export default User;