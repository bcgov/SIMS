import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [ TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) ?? 5432,
    database: process.env.POSTGRES_DB ?? 'aest',
    username: process.env.POSTGRES_USER ?? 'admin',
    password: process.env.POSTGRES_PASSWORD,
  })]
})
export class DatabaseModule {}
