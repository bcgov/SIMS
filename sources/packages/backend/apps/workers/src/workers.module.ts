import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';

@Module({
  imports: [],
  controllers: [WorkersController],
  providers: [WorkersService],
})
export class WorkersModule {}
