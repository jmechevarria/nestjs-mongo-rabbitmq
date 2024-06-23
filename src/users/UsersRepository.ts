import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';

export class UsersRepository {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
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

}
