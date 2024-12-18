import mongoose, { Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyhub';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const connection: Connection = mongoose.connection;

connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

connection.on('error', (err: Error) => {
  console.error('MongoDB error:', err);
});

export default mongoose;
