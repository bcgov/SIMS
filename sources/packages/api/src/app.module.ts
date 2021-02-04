import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { ConfigController } from "./config/config.controller";
import { AuthService, StudentService, UserService } from "./services";
import { UserController, StudentController } from "./route-controllers";

@Module({
  imports: [DatabaseModule],
  controllers: [
    AppController,
    ConfigController,
    UserController,
    StudentController,
  ],
  providers: [AppService, AuthService, UserService, StudentService],
})
export class AppModule {}
