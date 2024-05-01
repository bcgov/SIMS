import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { NotificationMessageType, Student } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";

describe("ConfirmationOfStudentAccounts(e2e)-confirmAccount", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedStudent: Student;
  let partialMatchStudent: Student;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);

    // Create student if it doesn't exist.
    sharedStudent = await db.student.findOne({
      where: {
        birthDate: getISODateOnlyString(new Date("1998-03-24")),
        user: { lastName: "FOUR" },
        sinValidation: { sin: "900041310" },
      },
    });
    if (!sharedStudent) {
      sharedStudent = await saveFakeStudent(db.dataSource);
      // Update the student to ensure that the student imported from SFAS is the same student as the one created above.
      sharedStudent.birthDate = getISODateOnlyString(new Date("1998-03-24"));
      sharedStudent.user.lastName = "FOUR";
      sharedStudent.sinValidation.sin = "900041310";
      await db.student.save(sharedStudent);
    }
    // Create a second student for a partial match.
    partialMatchStudent = await db.student.findOne({
      where: {
        birthDate: getISODateOnlyString(new Date("1998-03-24")),
        user: { lastName: "FOURTH" },
        sinValidation: { sin: "900041310" },
      },
    });
    if (!partialMatchStudent) {
      partialMatchStudent = await saveFakeStudent(db.dataSource);
      // Update the student to ensure that the student imported from SFAS is the same student as the one created above.
      partialMatchStudent.birthDate = getISODateOnlyString(
        new Date("1998-03-24"),
      );
      partialMatchStudent.user.lastName = "FOURTH";
      partialMatchStudent.sinValidation.sin = "900041310";
      await db.student.save(partialMatchStudent);
    }
  });

  it("Should send a notification message when at least a partial match is found for importing a student record from SFAS.", async () => {
    // Run the check for partial student matches. TODO somehow
    // possibly with an endpoint call?
    /*
    const endpoint = `/aest/student-account-applications`; // fix actual endpoint

    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK);
      */

    // Check that the notification is in the database.
    const notificationMessageType =
      NotificationMessageType.PartialStudentMatchNotification;
    const notification = await db.notification.findOne({
      select: {
        id: true,
        dateSent: true,
        messagePayload: true,
        notificationMessage: { templateId: true },
      },
      relations: { notificationMessage: true, user: true },
      where: {
        notificationMessage: {
          id: notificationMessageType,
        },
      },
    });
    expect(notification.dateSent).toBe(null);
    // expect(notification.messagePayload).toStrictEqual({
    //   email_address: notification.user.email,
    //   template_id: notification.notificationMessage.templateId,
    //   personalisation: {
    //     lastName: notification.user.lastName,
    //     givenNames: notification.user.firstName,
    //   },
    // });
  });

  afterAll(async () => {
    await app?.close();
  });
});
