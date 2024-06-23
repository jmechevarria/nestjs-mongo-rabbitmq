import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { UserAvatar } from './entities/user-avatar.entity';

export class UsersRepository {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('UserAvatar')
    private readonly userAvatarModel: Model<UserAvatar>,
  ) {}

  async save(user: Omit<User, 'id'>) {
    const userDocument = new this.userModel({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
    });

    return await userDocument.save();
  }

  async saveAvatar(fileHash: string, userId: string) {
    const avatarDocument = new this.userAvatarModel({
      userId,
      fileHash,
    });

    return await avatarDocument.save();
  }

  async getAvatar(userId: string) {
    const avatarDocument = await this.userAvatarModel
      .findOne({
        userId,
      })
      .exec();

    return avatarDocument;
  }

  async deleteAvatar(userId: string) {
    const avatarDocument = await this.userAvatarModel
      .deleteOne({
        userId,
      })
      .exec();

    return avatarDocument;
  }
}
