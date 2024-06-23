import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ReqresService } from '../reqres/reqres.service';
import { UsersRepository } from './UsersRepository';

@Injectable()
export class UsersService {
  constructor(
    private readonly reqresService: ReqresService,
    private readonly repo: UsersRepository,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const created = this.repo.save(createUserDto);

    return created;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return this.reqresService.getUser(id);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
