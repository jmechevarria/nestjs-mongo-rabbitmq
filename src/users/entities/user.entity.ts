import * as mongoose from 'mongoose';
export const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  avatar: { type: String, required: true, unique: true },
});

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}
