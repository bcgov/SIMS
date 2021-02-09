import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { ConfigController } from "./route-controllers/config/config.controller";
import { AuthService, StudentService, UserService } from "./services";
import { UserController, StudentController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { ConfigService } from "./services/config/config.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    AppController,
    ConfigController,
    UserController,
    StudentController,
  ],
  providers: [
    AppService,
    AuthService,
    ConfigService,
    UserService,
    StudentService,
  ],
})
export class AppModule {}
