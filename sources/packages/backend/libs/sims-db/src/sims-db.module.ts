import { Module } from '@nestjs/common';
import { SimsDbService } from './sims-db.service';

@Module({
  providers: [SimsDbService],
  exports: [SimsDbService],
})
export class SimsDbModule {}
