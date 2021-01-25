import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigController } from './config/config.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController, ConfigController],
  providers: [AppService],
})
export class AppModule {}
