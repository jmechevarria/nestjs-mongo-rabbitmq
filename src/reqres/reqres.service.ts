import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReqresService {
  private baseUrl = 'https://reqres.in/api';
  constructor(private readonly httpService: HttpService) {}

  async getUser(id: number): Promise<{ data: User }> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/users/${id}`),
    );

    return response.data;
  }

}
