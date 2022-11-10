import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),
  ],
})
export class QueueRootModule {}
