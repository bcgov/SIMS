import { INestApplication } from "@nestjs/common";
import { QueueNames, CustomNamedError } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import {
  createE2EDataSources,
  createFakeNotification,
  E2EDataSources,
} from "@sims/test-utils";
import { NotifyService } from "@sims/services/notifications";
import { IsNull, MoreThanOrEqual, Or } from "typeorm";
import { ProcessNotificationScheduler } from "../../../../";
import { ProcessNotificationsQueueInDTO } from "../../models/notification.dto";
import { NOTIFY_LIMIT_EXCEEDED_ERROR } from "@sims/services/constants";
import { ConfigServiceMockHelper } from "@sims/test-utils/mocks/config-service-mock";
import dayjs from "dayjs";

const EXTERNAL_RATE_LIMIT_SECONDS = 60;

describe(describeProcessorRootTest(QueueNames.ProcessNotifications), () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let processor: ProcessNotificationScheduler;
  let notifyService: NotifyService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // Processor under test.
    processor = app.get(ProcessNotificationScheduler);
    notifyService = app.get(NotifyService);
    const configServiceMockHelper = new ConfigServiceMockHelper(app);
    // Allow mocking only BC Notify to perform tests.
    configServiceMockHelper.useBCNotify();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Push every existing sent/unsent notification outside of any rate limit
    // window and out of the unsent pool so previously executed tests do not
    // affect the rate limit calculation and the notifications polling.
    const outOfWindowDateSent = dayjs()
      .subtract(EXTERNAL_RATE_LIMIT_SECONDS + 1, "second")
      .toDate();
    await db.notification.update(
      { dateSent: Or(MoreThanOrEqual(outOfWindowDateSent), IsNull()) },
      { dateSent: outOfWindowDateSent },
    );
  });

  it(
    "Should process only the amount of notifications allowed by the external rate limit " +
      "and leave the remaining notifications unsent when there are more pending notifications than the rate limit allows.",
    async () => {
      // Arrange
      // Create 5 unsent notifications.
      const notifications = Array.from({ length: 5 }, () =>
        createFakeNotification(),
      );
      await db.notification.save(notifications);
      // Queued job with an external rate limit lower than the total pending notifications.
      const externalRateLimit = 2;
      const mockedJob = mockBullJob<ProcessNotificationsQueueInDTO>({
        pollingRecordsLimit: 10,
        externalRateLimit,
        externalRateLimitSeconds: EXTERNAL_RATE_LIMIT_SECONDS,
      });
      jest.spyOn(notifyService, "sendEmailNotification").mockResolvedValue();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        `Total notifications processed ${externalRateLimit}.`,
        `Total notifications successfully processed ${externalRateLimit}.`,
      ]);
      const unsentNotificationsCount = await db.notification.count({
        where: { dateSent: IsNull() },
      });
      expect(unsentNotificationsCount).toBe(
        notifications.length - externalRateLimit,
      );
    },
  );

  it("Should stop processing further notifications when the external notification API returns a 429 (too many requests) rate limit exceeded error.", async () => {
    // Arrange
    const totalNotifications = 3;
    const pollingRecordsLimit = 10;
    // Create unsent notifications.
    const notifications = Array.from({ length: totalNotifications }, () =>
      createFakeNotification(),
    );
    await db.notification.save(notifications);
    // Simulate the external API succeeding for the first call and then
    // returning a 429 (too many requests) rate limit exceeded error, regardless
    // of which notification API implementation (GC Notify or BC Notify) is used.
    const rateLimitExceededError = new CustomNamedError(
      "Too many requests.",
      NOTIFY_LIMIT_EXCEEDED_ERROR,
    );
    // Allow 2 notifications to be successfully sent before hitting the rate limit error.
    const sendEmailNotificationMock = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValue(rateLimitExceededError);
    (notifyService.sendEmailNotification as jest.Mock).mockImplementation(
      sendEmailNotificationMock,
    );

    // Queued job with a rate limit high enough to not interfere with this scenario.
    const mockedJob = mockBullJob<ProcessNotificationsQueueInDTO>({
      pollingRecordsLimit,
      externalRateLimit: 10,
      externalRateLimitSeconds: EXTERNAL_RATE_LIMIT_SECONDS,
    });

    // Act
    await processor.processQueue(mockedJob.job);

    // Assert
    // The notification already sent before the rate limit error is still
    // accounted for as processed and successfully processed.
    expect(
      mockedJob.containLogMessages([
        `Not all pending notifications were successfully processed.`,
        "Total notifications processed 3.",
        "Total notifications successfully processed 2.",
      ]),
    ).toBe(true);
    // The process must stop as soon as the rate limit error is detected, i.e.
    // the third notification must never be attempted.
    expect(sendEmailNotificationMock).toHaveBeenCalledTimes(3);
    // Only the first notification should have been sent, the remaining two,
    // including the one that was never attempted, must still be unsent.
    const unsentNotificationsCount = await db.notification.count({
      where: { dateSent: IsNull() },
    });
    expect(unsentNotificationsCount).toBe(1);
  });

  afterAll(async () => {
    await app?.close();
  });
});
