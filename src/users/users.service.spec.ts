import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ReqresService } from '../reqres/reqres.service';
import { UsersRepository } from './user.repository';
import { AvatarService } from './avatar.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { HttpService } from '@nestjs/axios';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserAvatar } from './entities/user-avatar.entity';
import { NotFoundException } from '@nestjs/common';

const user: User = {
  email: '',
  avatar: 'http://mock.avatar.url',
  first_name: '',
  last_name: '',
  id: '2',
};

const avatar: UserAvatar = {
  userId: '2',
  fileHash: 'dummy-hash',
};

const avatarHash = 'mock-avatar-hash';

describe('UsersService', () => {
  let service: UsersService;
  let repo: UsersRepository;
  let rabbitmqService: RabbitmqService;
  let reqresService: ReqresService;
  let avatarService: AvatarService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        ReqresService,
        UsersRepository,
        AvatarService,
        RabbitmqService,
        HttpService,
        ConfigService,
        {
          provide: getModelToken('User'),
          useValue: {},
        },
        {
          provide: getModelToken('UserAvatar'),
          useValue: {},
        },
        {
          provide: 'AXIOS_INSTANCE_TOKEN',
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<UsersRepository>(UsersRepository);
    rabbitmqService = module.get<RabbitmqService>(RabbitmqService);
    reqresService = module.get<ReqresService>(ReqresService);
    avatarService = module.get<AvatarService>(AvatarService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the created user', async () => {
    const saveSpy: jest.SpyInstance = jest
      .spyOn(repo, 'save')
      .mockResolvedValueOnce(user);
    const pushToEmailQueueSpy: jest.SpyInstance = jest
      .spyOn(rabbitmqService, 'pushToEmailQueue')
      .mockResolvedValueOnce(undefined);

    expect(await service.create(user)).toEqual(user);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(user);
    expect(pushToEmailQueueSpy).toHaveBeenCalledTimes(1);
    expect(pushToEmailQueueSpy).toHaveBeenCalledWith(JSON.stringify(user));
  });

  it('should find a user by ID', async () => {
    const getUserSpy: jest.SpyInstance = jest
      .spyOn(reqresService, 'getUser')
      .mockResolvedValueOnce({ data: user });

    expect(await service.findOne(+user.id)).toEqual({
      data: user,
    });

    expect(getUserSpy).toHaveBeenCalledTimes(1);
    expect(getUserSpy).toHaveBeenCalledWith(+user.id);
  });

  it('if the file does not exist yet, should store user avatar in file system and database', async () => {
    const existsSpy: jest.SpyInstance = jest
      .spyOn(avatarService, 'exists')
      .mockResolvedValueOnce(false);

    const getUserAvatarSpy: jest.SpyInstance = jest
      .spyOn(reqresService, 'getUser')
      .mockResolvedValueOnce({ data: user });

    const saveSpy: jest.SpyInstance = jest
      .spyOn(avatarService, 'save')
      .mockResolvedValueOnce(avatarHash);

    const saveAvatarSpy: jest.SpyInstance = jest
      .spyOn(repo, 'saveAvatar')
      .mockResolvedValueOnce(avatar);

    expect(await service.findAvatar(+user.id)).toEqual(
      Buffer.from(JSON.stringify(avatar)).toString('base64'),
    );

    expect(existsSpy).toHaveBeenCalledTimes(1);
    expect(existsSpy).toHaveBeenCalledWith(user.id);
    expect(getUserAvatarSpy).toHaveBeenCalledTimes(1);
    expect(getUserAvatarSpy).toHaveBeenCalledWith(+user.id);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(user.avatar, user.id);
    expect(saveAvatarSpy).toHaveBeenCalledTimes(1);
    expect(saveAvatarSpy).toHaveBeenCalledWith(avatarHash, user.id);
  });

  it('if the file exists already, should retrieve its data from the database and return it in base64', async () => {
    const existsSpy: jest.SpyInstance = jest
      .spyOn(avatarService, 'exists')
      .mockResolvedValueOnce(true);

    const getAvatarSpy: jest.SpyInstance = jest
      .spyOn(repo, 'getAvatar')
      .mockResolvedValueOnce(avatar);

    expect(await service.findAvatar(+user.id)).toEqual(
      Buffer.from(JSON.stringify(avatar)).toString('base64'),
    );

    expect(existsSpy).toHaveBeenCalledTimes(1);
    expect(existsSpy).toHaveBeenCalledWith(user.id);
    expect(getAvatarSpy).toHaveBeenCalledTimes(1);
    expect(getAvatarSpy).toHaveBeenCalledWith(user.id);
  });

  it('should delete the avatar file from the disk and its data from the db', async () => {
    const existsSpy: jest.SpyInstance = jest
      .spyOn(avatarService, 'exists')
      .mockResolvedValueOnce(true);

    const deleteSpy: jest.SpyInstance = jest
      .spyOn(avatarService, 'delete')
      .mockResolvedValueOnce(true);

    const deleteAvatarSpy: jest.SpyInstance = jest
      .spyOn(repo, 'deleteAvatar')
      .mockResolvedValueOnce({
        acknowledged: true,
        deletedCount: 1,
      });

    expect(await service.deleteAvatar(+user.id)).toEqual(true);

    expect(existsSpy).toHaveBeenCalledTimes(1);
    expect(existsSpy).toHaveBeenCalledWith(user.id);
    expect(deleteAvatarSpy).toHaveBeenCalledTimes(1);
    expect(deleteAvatarSpy).toHaveBeenCalledWith(user.id);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith(user.id);
  });

  it('throw NotFoundException if avatar is not currently stored', async () => {
    const existsSpy: jest.SpyInstance = jest
      .spyOn(avatarService, 'exists')
      .mockResolvedValueOnce(false);

    const deleteSpy: jest.SpyInstance = jest.spyOn(avatarService, 'delete');

    const deleteAvatarSpy: jest.SpyInstance = jest.spyOn(repo, 'deleteAvatar');

    expect(service.deleteAvatar(+user.id)).rejects.toThrow(NotFoundException);

    expect(existsSpy).toHaveBeenCalledTimes(1);
    expect(existsSpy).toHaveBeenCalledWith(user.id);
    expect(deleteAvatarSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
