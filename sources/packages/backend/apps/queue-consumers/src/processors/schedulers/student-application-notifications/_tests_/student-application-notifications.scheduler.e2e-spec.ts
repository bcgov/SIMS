import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Application,
  StudentAssessment,
  DisabilityStatus,
} from "@sims/sims-db";
import { StudentApplicationNotificationsScheduler } from "../student-application-notifications.scheduler";
import { ApplicationService } from "../../../../services/application/application.service";
import { NotificationService } from "@sims/services/notifications";

describe("StudentApplicationNotificationsScheduler (e2e)", () => {
  let app: INestApplication;
  let applicationRepository: Repository<Application>;
  let _studentAssessmentRepository: Repository<StudentAssessment>;
  let scheduler: StudentApplicationNotificationsScheduler;
  

  afterEach(async () => {
    await app.close();
  });
});
