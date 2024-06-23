import { Module } from '@nestjs/common';
import { ReqresService } from './reqres.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [ReqresService],
  imports: [HttpModule],
  exports: [ReqresService],
})
export class ReqresModule {}
