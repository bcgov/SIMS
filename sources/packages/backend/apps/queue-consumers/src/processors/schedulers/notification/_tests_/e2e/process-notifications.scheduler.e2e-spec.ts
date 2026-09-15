import { INestApplication } from "@nestjs/common";
import { addDays, QueueNames } from "@sims/utilities";
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
import {
  GCNotifyResult,
  GCNotifyService,
  NotifyService,
} from "@sims/services/notifications";
import { IsNull, MoreThanOrEqual, Or } from "typeorm";
import { ProcessNotificationScheduler } from "../../../../";
import { ProcessNotificationsQueueInDTO } from "../../models/notification.dto";
import { CustomNamedError } from "@sims/utilities";
import { NOTIFY_LIMIT_EXCEEDED_ERROR } from "@sims/services/constants";

describe(describeProcessorRootTest(QueueNames.ProcessNotifications), () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let processor: ProcessNotificationScheduler;
  let gcNotifyService: GCNotifyService;
  let notifyService: NotifyService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // Processor under test.
    processor = app.get(ProcessNotificationScheduler);
    gcNotifyService = app.get(GCNotifyService);
    notifyService = app.get(NotifyService);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Mock both possible notification API calls (legacy GC Notify and the new BC
    // Notify service) to avoid any real external HTTP call, regardless of the
    // feature toggle configuration.
    jest
      .spyOn(gcNotifyService, "sendEmailNotification")
      .mockResolvedValue({} as GCNotifyResult);
    jest.spyOn(notifyService, "sendEmailNotification").mockResolvedValue();
    // Push every existing sent/unsent notification outside of any rate limit
    // window and out of the unsent pool so previously executed tests do not
    // affect the rate limit calculation and the notifications polling.
    const outOfWindowDateSent = addDays(-1);
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
        externalRateLimitSeconds: 60,
      });

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        `Total notifications processed ${externalRateLimit}.`,
        `Total notifications successfully processed ${externalRateLimit}.`,
      ]);
    },
  );

  it("Should stop processing further notifications when the external notification API returns a 429 (too many requests) rate limit exceeded error.", async () => {
    // Arrange
    // Create 3 unsent notifications.
    const totalNotifications = 3;
    const pollingRecordsLimit = 10;
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
    const sendEmailNotificationMock = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValue(rateLimitExceededError);
    (gcNotifyService.sendEmailNotification as jest.Mock).mockImplementation(
      sendEmailNotificationMock,
    );
    (notifyService.sendEmailNotification as jest.Mock).mockImplementation(
      sendEmailNotificationMock,
    );

    // Queued job with a rate limit high enough to not interfere with this scenario.
    const mockedJob = mockBullJob<ProcessNotificationsQueueInDTO>({
      pollingRecordsLimit,
      externalRateLimit: 10,
      externalRateLimitSeconds: 60,
    });

    // Act
    await processor.processQueue(mockedJob.job);

    // Assert
    // The notification already sent before the rate limit error is still
    // accounted for as processed and successfully processed. No warning is
    // expected since the remaining notifications are simply left pending to
    // be retried in the next polling cycle, not a processing failure.
    expect(
      mockedJob.containLogMessages([
        `Not all pending notifications were successfully processed.`,
        "Total notifications processed 2.",
        "Total notifications successfully processed 1.",
      ]),
    ).toBe(true);
    // The process must stop as soon as the rate limit error is detected, i.e.
    // the third notification must never be attempted.
    expect(sendEmailNotificationMock).toHaveBeenCalledTimes(2);
    // Only the first notification should have been sent, the remaining two,
    // including the one that was never attempted, must still be unsent.
    const unsentNotificationsCount = await db.notification.count({
      where: { dateSent: IsNull() },
    });
    expect(unsentNotificationsCount).toBe(2);
  });

  afterAll(async () => {
    await app?.close();
  });
});
