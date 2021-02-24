import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import {
  StudentService,
  UserService,
  ConfigService,
  ArchiveDbService
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
    UserService,
    StudentService,
    ConfigService,
    ArchiveDbService,
  ],
})
export class AppModule { }
