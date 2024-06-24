import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ReqresService } from '../reqres/reqres.service';
import { UsersRepository } from './user.repository';
import { AvatarService } from './avatar.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly reqresService: ReqresService,
    private readonly repo: UsersRepository,
    private readonly avatarService: AvatarService,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const created = await this.repo.save(createUserDto);

    await this.rabbitmqService.pushToEmailQueue(JSON.stringify(created));
    return created;
  }

  findOne(id: number): Promise<{ data: User }> {
    return this.reqresService.getUser(id);
  }

  async findAvatar(id: number): Promise<string> {
    if (await this.avatarService.exists(String(id))) {
      const avatarDocument = await this.repo.getAvatar(String(id));

      return Buffer.from(JSON.stringify(avatarDocument)).toString('base64');
    }

    const avatarUrl = (await this.reqresService.getUser(id)).data.avatar;

    const hash = await this.avatarService.save(avatarUrl, String(id));

    const avatarDocument = await this.repo.saveAvatar(hash, String(id));

    return Buffer.from(JSON.stringify(avatarDocument)).toString('base64');
  }

  async deleteAvatar(id: number): Promise<boolean> {
    if (await this.avatarService.exists(String(id))) {
      await this.repo.deleteAvatar(String(id));

      return await this.avatarService.delete(String(id));
    }

    throw new NotFoundException();
  }
}
