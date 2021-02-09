import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import {
  AuthService,
  StudentService,
  UserService,
  ConfigService,
} from "./services";
import {
  UserController,
  StudentController,
  ConfigController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    AppController,
    UserController,
    StudentController,
    ConfigController,
  ],
  providers: [
    AppService,
    AuthService,
    UserService,
    StudentService,
    ConfigService,
  ],
})
export class AppModule {}
