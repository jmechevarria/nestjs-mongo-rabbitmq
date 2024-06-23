import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ReqresModule } from '../reqres/reqres.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './entities/user.entity';
import { UsersRepository } from './UsersRepository';
import { UserAvatarSchema } from './entities/user-avatar.entity';
import { AvatarService } from './avatar.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, AvatarService],
  imports: [
    ReqresModule,
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'UserAvatar', schema: UserAvatarSchema },
    ]),
    RabbitMQModule,
  ],
})
export class UsersModule {}
