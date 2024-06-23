import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ReqresModule } from '../reqres/reqres.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './entities/user.entity';
import { UsersRepository } from './UsersRepository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, AvatarService],
  imports: [
    ReqresModule,
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
  providers: [UsersService],
    ]),
  ],
})
export class UsersModule {}
