import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  AESTGroups,
  getAESTToken,
  getStudentToken,
  FakeStudentUsersTypes,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeMSFAANumber,
  E2EDataSources,
  MSFAAStates,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { ApplicationStatus, OfferingIntensity } from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import { MSFAANumberAPIOutDTO } from "../../models/msfaa-number.dto";

describe("MSFAANumberAESTController(e2e)-getStudentMSFAAActivity", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return all MSFAA activity records ordered by date created newest to oldest when given a student id.", async () => {
    // Arrange.
    const student = await saveFakeStudent(db.dataSource);
    // Pending full-time MSFAA (earliest - two days ago).
    const pendingFullTimeMSFAA = createFakeMSFAANumber({ student });
    pendingFullTimeMSFAA.createdAt = addDays(-2);
    // Signed full-time MSFAA (middle - yesterday).
    const signedFullTimeMSFAA = createFakeMSFAANumber(
      { student },
      { msfaaState: MSFAAStates.Signed },
    );
    signedFullTimeMSFAA.createdAt = addDays(-1);
    // Part-time MSFAA cancelled due to another province (most recent - today).
    const cancelledPartTimeMSFAA = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledOtherProvince,
        msfaaInitialValues: { offeringIntensity: OfferingIntensity.partTime },
      },
    );
    // Save records with non-default ordering to confirm the sort is applied.
    await db.msfaaNumber.save([
      signedFullTimeMSFAA,
      pendingFullTimeMSFAA,
      cancelledPartTimeMSFAA,
    ]);
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/msfaa-number/student/${student.id}`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          id: cancelledPartTimeMSFAA.id,
          createdAt: cancelledPartTimeMSFAA.createdAt.toISOString(),
          offeringIntensity: OfferingIntensity.partTime,
          msfaaNumber: cancelledPartTimeMSFAA.msfaaNumber,
          dateSent: cancelledPartTimeMSFAA.dateRequested.toISOString(),
          dateSigned: cancelledPartTimeMSFAA.dateSigned,
          cancelledDate: cancelledPartTimeMSFAA.cancelledDate,
          newIssuingProvince: cancelledPartTimeMSFAA.newIssuingProvince,
          canBeReissued: false,
        },
        {
          id: signedFullTimeMSFAA.id,
          createdAt: signedFullTimeMSFAA.createdAt.toISOString(),
          offeringIntensity: OfferingIntensity.fullTime,
          msfaaNumber: signedFullTimeMSFAA.msfaaNumber,
          dateSent: signedFullTimeMSFAA.dateRequested.toISOString(),
          dateSigned: signedFullTimeMSFAA.dateSigned,
          cancelledDate: null,
          newIssuingProvince: null,
          canBeReissued: false,
        },
        {
          id: pendingFullTimeMSFAA.id,
          createdAt: pendingFullTimeMSFAA.createdAt.toISOString(),
          offeringIntensity: OfferingIntensity.fullTime,
          msfaaNumber: pendingFullTimeMSFAA.msfaaNumber,
          dateSent: null,
          dateSigned: null,
          cancelledDate: null,
          newIssuingProvince: null,
          canBeReissued: false,
        },
      ]);
  });

  it("Should indicate that only the most recent cancelled MSFAA with disbursements of each offering intensity can be reissued.", async () => {
    // Arrange.
    const student = await saveFakeStudent(db.dataSource);
    // Older cancelled full-time MSFAA with disbursement, replaced by a newer one.
    const olderFullTimeMSFAA = createFakeMSFAANumber(
      { student },
      { msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledSystem },
    );
    olderFullTimeMSFAA.createdAt = addDays(-3);
    // Most recent cancelled full-time MSFAA with disbursement.
    const latestFullTimeMSFAA = createFakeMSFAANumber(
      { student },
      { msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledSystem },
    );
    latestFullTimeMSFAA.createdAt = addDays(-2);
    // Most recent cancelled part-time MSFAA without disbursement.
    const partTimeMSFAAWithoutDisbursement = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledSystem,
        msfaaInitialValues: { offeringIntensity: OfferingIntensity.partTime },
      },
    );
    partTimeMSFAAWithoutDisbursement.createdAt = addDays(-1);
    await db.msfaaNumber.save([
      olderFullTimeMSFAA,
      latestFullTimeMSFAA,
      partTimeMSFAAWithoutDisbursement,
    ]);
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: olderFullTimeMSFAA },
      { applicationStatus: ApplicationStatus.Completed },
    );
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: latestFullTimeMSFAA },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/msfaa-number/student/${student.id}`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const canBeReissuedById = new Map<number, boolean>(
          response.body.map((msfaa: MSFAANumberAPIOutDTO) => [
            msfaa.id,
            msfaa.canBeReissued,
          ]),
        );
        expect(canBeReissuedById.get(olderFullTimeMSFAA.id)).toBe(false);
        expect(canBeReissuedById.get(latestFullTimeMSFAA.id)).toBe(true);
        expect(canBeReissuedById.get(partTimeMSFAAWithoutDisbursement.id)).toBe(
          false,
        );
      });
  });

  it("Should indicate that a cancelled MSFAA with disbursements can be reissued when a newer MSFAA was already issued for the same offering intensity.", async () => {
    // Arrange.
    const student = await saveFakeStudent(db.dataSource);
    const cancelledMSFAA = createFakeMSFAANumber(
      { student },
      { msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledSystem },
    );
    cancelledMSFAA.createdAt = addDays(-2);
    const newerPendingMSFAA = createFakeMSFAANumber({ student });
    await db.msfaaNumber.save([cancelledMSFAA, newerPendingMSFAA]);
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: cancelledMSFAA },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/msfaa-number/student/${student.id}`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const canBeReissuedById = new Map<number, boolean>(
          response.body.map((msfaa: MSFAANumberAPIOutDTO) => [
            msfaa.id,
            msfaa.canBeReissued,
          ]),
        );
        expect(canBeReissuedById.get(cancelledMSFAA.id)).toBe(true);
        expect(canBeReissuedById.get(newerPendingMSFAA.id)).toBe(false);
      });
  });

  it("Should return an empty array when the student has no MSFAA records.", async () => {
    // Arrange.
    const student = await saveFakeStudent(db.dataSource);
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/msfaa-number/student/${student.id}`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([]);
  });

  it("Should throw a NotFoundException when the student does not exist.", async () => {
    // Arrange.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Use student id 0 which can never exist.
    const endpoint = `/aest/msfaa-number/student/0`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);
  });

  it("Should throw a ForbiddenException when the request is not made by an AEST user.", async () => {
    // Arrange.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/aest/msfaa-number/student/0`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN);
  });

  afterAll(async () => {
    await app?.close();
  });
});
