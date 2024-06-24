import { Test, TestingModule } from '@nestjs/testing';
import { ReqresService } from '../reqres/reqres.service';
import { HttpService } from '@nestjs/axios';
import { User } from '../users/entities/user.entity';
import { AxiosResponse } from 'axios';
import * as rxjs from 'rxjs';

const user: User = {
  email: '',
  avatar: '',
  first_name: '',
  last_name: '',
  id: '2',
};

describe('ReqresService', () => {
  let service: ReqresService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReqresService,
        HttpService,
        {
          provide: 'AXIOS_INSTANCE_TOKEN',
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ReqresService>(ReqresService);
    httpService = module.get<HttpService>(HttpService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get the user data from the reqres API', async () => {
    const getResponse = rxjs.of<AxiosResponse>({
      data: { data: user },
    } as AxiosResponse);

    const getSpy: jest.SpyInstance = jest
      .spyOn(httpService, 'get')
      .mockReturnValueOnce(getResponse);

    const firstValueFromSpy: jest.SpyInstance = jest
      .spyOn(rxjs, 'firstValueFrom')
      .mockResolvedValueOnce({ data: { data: user } });

    expect(await service.getUser(+user.id)).toEqual({ data: user });

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledWith(
      `https://reqres.in/api/users/${user.id}`,
    );
    expect(firstValueFromSpy).toHaveBeenCalledTimes(1);
    expect(firstValueFromSpy).toHaveBeenCalledWith(getResponse);
  });
});
