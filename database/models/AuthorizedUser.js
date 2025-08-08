import mongoose from 'mongoose';

const AuthorizedUserSchema = new mongoose.Schema({
    telegramId: {
        type: Number,
        required: true,
        unique: true
    },
    authorizedAt: {
        type: Date,
        default: Date.now
    }
});

const AuthorizedUser = mongoose.model('AuthorizedUser', AuthorizedUserSchema);

export default AuthorizedUser;