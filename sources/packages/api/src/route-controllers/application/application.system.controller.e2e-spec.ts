require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { KeycloakConfig } from "../../auth/keycloakConfig";
import { ApplicationSystemController } from "..";
import { DatabaseModule } from "../../database/database.module";
import { AuthModule } from "../../auth/auth.module";
import {
  ApplicationService,
  ConfigService,
  DisbursementScheduleService,
  EducationProgramOfferingService,
  KeycloakService,
  MSFAANumberService,
  SequenceControlService,
  StudentFileService,
  StudentRestrictionService,
  SupportingUserService,
  TokensService,
  WorkflowActionsService,
  WorkflowService,
} from "../../services";
import { createFakeApplication } from "../../testHelpers/fake-entities/application-fake";
import { setGlobalPipes } from "../../utilities/auth-utils";
import { Connection, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  EducationProgram,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
} from "../../database/entities";
import {
  createFakeLocation,
  createFakeInstitution,
  createFakeEducationProgram,
  createFakeEducationProgramOffering,
} from "../../testHelpers/fake-entities";
import { createMockedJwtService } from "../../testHelpers/mocked-providers/jwt-service-mock";
import { CraIntegrationModule } from "../../cra-integration/cra-integration.module";

describe("Test system-access/application Controller", () => {
  let accesstoken: string;
  let app: INestApplication;
  let applicationRepository: Repository<Application>;
  let institutionRepository: Repository<Institution>;
  let locationRepository: Repository<InstitutionLocation>;
  let programRepository: Repository<EducationProgram>;
  let offeringRepository: Repository<EducationProgramOffering>;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const token = await KeycloakService.shared.getTokenFromClientSecret(
      "forms-flow-bpm",
      process.env.FORMS_FLOW_BPM_CLIENT_SECRET,
    );
    accesstoken = token.access_token;
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthModule, CraIntegrationModule],
      controllers: [ApplicationSystemController],
      providers: [
        ApplicationService,
        StudentFileService,
        EducationProgramOfferingService,
        SequenceControlService,
        WorkflowActionsService,
        WorkflowService,
        KeycloakService,
        ConfigService,
        TokensService,
        MSFAANumberService,
        SupportingUserService,
        createMockedJwtService(),
        DisbursementScheduleService,
        StudentRestrictionService,
      ],
    }).compile();

    const connection = module.get(Connection);
    applicationRepository = connection.getRepository(Application);
    locationRepository = connection.getRepository(InstitutionLocation);
    institutionRepository = connection.getRepository(Institution);
    programRepository = connection.getRepository(EducationProgram);
    offeringRepository = connection.getRepository(EducationProgramOffering);

    app = module.createNestApplication();
    setGlobalPipes(app);
    await app.init();
  });

  describe("Test route PATCH :id/program-info", () => {
    it("should return bad request for an invalid Program Request Info (PIR) status", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          programId: 1, // Valid
          offeringId: 1, // Valid
          locationId: 1, // Valid
          status: "some invalid status", // Invalid
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return bad request for an invalid locationId", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          programId: 1, // Valid
          offeringId: 1, // Valid
          locationId: -1, // Invalid
          status: "Required", // Valid
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return bad request for an invalid programId", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          programId: -1, // Invalid
          offeringId: 1, // Valid
          locationId: 1, // Valid
          status: "Required", // Valid
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return bad request for an invalid offeringId", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          offeringId: -1, // Invalid
          locationId: 1, // Valid
          status: "Required", // Valid
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return bad request when locationId is not present", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          offeringId: 1, // Valid
          // locationId not present
          status: "Required", // Valid
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return bad request when status is not present", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          offeringId: 1, // Valid
          locationId: 1, // Valid
          // status not present.
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return unprocessable entity error when invalid ids are provided", async () => {
      await request(app.getHttpServer())
        .patch(`/system-access/application/1/program-info`)
        .auth(accesstoken, { type: "bearer" })
        .send({
          programId: 9999,
          offeringId: 9999,
          locationId: 9999,
          status: "Completed",
        })
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it("should be able to change the Program Info Status (location, program, offering, status) when payload is valid", async () => {
      // Create fake application.
      const testApplication = await applicationRepository.save(
        createFakeApplication(),
      );
      // Create fake institution.
      const testInstitution = await institutionRepository.save(
        createFakeInstitution(),
      );
      // Create fake location.
      const testLocation = await locationRepository.save(
        createFakeLocation(testInstitution),
      );
      // Create fake program.
      const testProgram = await programRepository.save(
        createFakeEducationProgram(testInstitution),
      );
      // Create fake offering.
      const testOffering = await offeringRepository.save(
        createFakeEducationProgramOffering(testProgram, testLocation),
      );

      const routeUrl = `/system-access/application/${testApplication.id}/program-info`;
      try {
        await request(app.getHttpServer())
          .patch(routeUrl)
          .auth(accesstoken, { type: "bearer" })
          .send({
            programId: testProgram.id,
            offeringId: testOffering.id,
            locationId: testLocation.id,
            status: "Completed", // Valid
          })
          .expect(HttpStatus.OK);
        // Check if the database was updated as expected.
        const updatedApplication = await applicationRepository.findOne(
          testApplication.id,
          { relations: ["pirProgram", "offering", "location"] },
        );
        expect(updatedApplication.pirProgram.id).toBe(testProgram.id);
        expect(updatedApplication.offering.id).toBe(testOffering.id);
        expect(updatedApplication.location.id).toBe(testLocation.id);
        expect(updatedApplication.pirStatus).toBe("Completed");
      } finally {
        await offeringRepository.remove(testOffering);
        await programRepository.remove(testProgram);
        await locationRepository.remove(testLocation);
        await institutionRepository.remove(testInstitution);
        await applicationRepository.remove(testApplication);
      }
    });
  });

  describe("Test route PATCH :id/program-info/status", () => {
    it("should return bad request for an invalid Program Request Info (PIR) status", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info/status")
        .auth(accesstoken, { type: "bearer" })
        .send({ status: "some invalid status" })
        .expect(HttpStatus.BAD_REQUEST);
    });

    ["Required", "Not Required", "Completed", "Declined"].forEach((status) => {
      it(`should be able to change the status from Submitted to '${status}'`, async () => {
        const applicationToCreate = createFakeApplication();
        applicationToCreate.applicationStatus = ApplicationStatus.submitted;
        const testApplication = await applicationRepository.save(
          applicationToCreate,
        );
        const routeUrl = `/system-access/application/${testApplication.id}/program-info/status`;
        try {
          await request(app.getHttpServer())
            .patch(routeUrl)
            .auth(accesstoken, { type: "bearer" })
            .send({ status })
            .expect(HttpStatus.OK);
          // Check if the database was updated as expected.
          const updatedApplication = await applicationRepository.findOne(
            testApplication.id,
          );
          expect(updatedApplication.pirStatus).toBe(status);
        } finally {
          await applicationRepository.remove(testApplication);
        }
      });
    });
  });
});
