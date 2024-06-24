import { Test, TestingModule } from '@nestjs/testing';
import { AvatarService } from './avatar.service';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';

const avatarFileName = 'avatar.jpg';
const avatarUrl = 'http://mock.avatar.url';

describe('AvatarService', () => {
  let service: AvatarService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvatarService],
    }).compile();

    service = module.get<AvatarService>(AvatarService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check file/folder existence', async () => {
    const accessSpy: jest.SpyInstance = jest
      .spyOn(fsPromises, 'access')
      .mockResolvedValueOnce(undefined);

    expect(await service.exists(avatarFileName)).toEqual(true);

    expect(accessSpy).toHaveBeenCalledTimes(1);
    expect(accessSpy).toHaveBeenCalledWith(
      path.join('avatars', avatarFileName),
      fsPromises.constants.R_OK,
    );

    accessSpy.mockClear();
    accessSpy.mockRejectedValueOnce(new Error());

    expect(await service.exists(avatarFileName)).toEqual(false);

    expect(accessSpy).toHaveBeenCalledTimes(1);
    expect(accessSpy).toHaveBeenCalledWith(
      path.join('avatars', avatarFileName),
      fsPromises.constants.R_OK,
    );
  });

  it('should save avatar file to disk and return its hash', async () => {
    const existsSpy: jest.SpyInstance = jest
      .spyOn(service, 'exists')
      .mockResolvedValueOnce(false);

    const mkdirSpy: jest.SpyInstance = jest
      .spyOn(fsPromises, 'mkdir')
      .mockResolvedValueOnce(undefined);
    const arrayBufferResult = new ArrayBuffer(2);
    const fetchSpy: jest.SpyInstance = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        arrayBuffer: () => Promise.resolve(arrayBufferResult),
      } as Response);

    const writeFileSpy: jest.SpyInstance = jest.spyOn(fsPromises, 'writeFile');

    expect(await service.save(avatarUrl, avatarFileName)).toEqual(
      expect.any(String),
    );

    expect(existsSpy).toHaveBeenCalledTimes(1);
    expect(existsSpy).toHaveBeenCalledWith('.');

    expect(mkdirSpy).toHaveBeenCalledTimes(1);
    expect(mkdirSpy).toHaveBeenCalledWith('avatars');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(avatarUrl);

    expect(writeFileSpy).toHaveBeenCalledTimes(1);
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join('avatars', avatarFileName),
      Buffer.from(arrayBufferResult),
    );
  });

  it('should delete avatar file from disk', async () => {
    const existsSpy: jest.SpyInstance = jest
      .spyOn(service, 'exists')
      .mockResolvedValueOnce(true);

    const rmSpy: jest.SpyInstance = jest
      .spyOn(fsPromises, 'rm')
      .mockResolvedValueOnce(undefined);

    expect(await service.delete(avatarFileName)).toEqual(true);

    expect(existsSpy).toHaveBeenCalledTimes(1);
    expect(existsSpy).toHaveBeenCalledWith(avatarFileName);

    expect(rmSpy).toHaveBeenCalledTimes(1);
    expect(rmSpy).toHaveBeenCalledWith(path.join('avatars', avatarFileName));

    existsSpy.mockClear();
    existsSpy.mockResolvedValueOnce(false);
    rmSpy.mockClear();

    expect(await service.delete(avatarFileName)).toEqual(false);

    expect(existsSpy).toHaveBeenCalledTimes(1);
    expect(existsSpy).toHaveBeenCalledWith(avatarFileName);

    expect(rmSpy).not.toHaveBeenCalled();
  });
});
