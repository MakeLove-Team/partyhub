import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Nazwa użytkownika jest wymagana'],
    unique: true,
    minlength: [3, 'Nazwa użytkownika musi mieć minimum 3 znaki']
  },
  email: {
    type: String,
    required: [true, 'Email jest wymagany'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Nieprawidłowy format emaila']
  },
  password: {
    type: String,
    required: [true, 'Hasło jest wymagane'],
    minlength: [6, 'Hasło musi mieć minimum 6 znaków']
  }
}, {
  timestamps: true
});

// Haszowanie hasła przed zapisem
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Metoda do porównywania hasła
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

export const User = mongoose.model<IUser>('User', userSchema);
