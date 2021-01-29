import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigController } from './config/config.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule
  ],
  controllers: [AppController, ConfigController],
  providers: [AppService],
})
export class AppModule {}
