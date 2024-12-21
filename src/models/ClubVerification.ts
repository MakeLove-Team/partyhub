import mongoose from 'mongoose';

export interface IClubVerification extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  clubId?: string;
  clubName: string;
  address: string;
  nip: string;
  regon: string;
  description: string;
  openingHours: string;
  phoneNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewNotes?: string;
}

const generateClubId = () => {
  // Generate a unique club ID in format: CLUB-XXXXX where X is alphanumeric
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'CLUB-';
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const clubVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clubId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values (for pending/rejected verifications)
  },
  clubName: {
    type: String,
    required: [true, 'Nazwa klubu jest wymagana'],
    minlength: [3, 'Nazwa klubu musi mieć minimum 3 znaki']
  },
  address: {
    type: String,
    required: [true, 'Adres jest wymagany']
  },
  nip: {
    type: String,
    required: [true, 'NIP jest wymagany'],
    match: [/^\d{10}$/, 'Nieprawidłowy format NIP']
  },
  regon: {
    type: String,
    required: [true, 'REGON jest wymagany'],
    match: [/^\d{9}$/, 'Nieprawidłowy format REGON']
  },
  description: {
    type: String,
    required: [true, 'Opis klubu jest wymagany'],
    minlength: [10, 'Opis musi mieć minimum 10 znaków']
  },
  openingHours: {
    type: String,
    required: [true, 'Godziny otwarcia są wymagane']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Numer telefonu jest wymagany'],
    match: [/^\d{9}$/, 'Nieprawidłowy format numeru telefonu']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  }
});

export const ClubVerification = mongoose.model<IClubVerification>('ClubVerification', clubVerificationSchema);
