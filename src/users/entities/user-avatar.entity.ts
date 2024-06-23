import * as mongoose from 'mongoose';
export const UserAvatarSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  fileHash: { type: String, required: true, unique: true },
});

export interface UserAvatar {
  userId: string;
  fileHash: string;
}
