import { INestApplication } from "@nestjs/common";
import { MSFAAIntegrationService } from "@sims/integrations/esdc-integration";
import {
  DATE_FORMAT,
  TIME_FORMAT,
} from "@sims/integrations/esdc-integration/msfaa-integration/models/msfaa-integration.model";
import { OfferingIntensity } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as dayjs from "dayjs";

/**
 * Created the sequence group name by the offering intensity.
 * @param offeringIntensity offering intensity.
 * @returns the sequence group name by the offering intensity.
 */
export function getMSFAASequenceGroupName(
  offeringIntensity: OfferingIntensity,
) {
  return `MSFAA_${offeringIntensity}_SENT_FILE_${getISODateOnlyString(
    new Date(),
  )}`;
}

/**
 * Create a jest spyOn to intercept the call for the method invoked to create
 * the file content. This method receives parameters, like the processDate that
 * need to be used for many MSFAA file content validations.
 * This does not replace the actual method implementation that will still be called.
 * @param app Nestjs to retrieve the service that will have the method mocked.
 * @returns jest spyOn mock.
 */
export function createMSFAARequestContentSpyOnMock(
  app: INestApplication,
): jest.SpyInstance {
  const msfaaIntegrationService = app.get(MSFAAIntegrationService);
  return jest.spyOn(msfaaIntegrationService, "createMSFAARequestContent");
}

/**
 * Gets the processDate parameter from the method createMSFAARequestContent
 * from the service {@link MSFAAIntegrationService}.
 * @param mockedMethod createMSFAARequestContent method previously mocked
 * using {@link createMSFAARequestContentSpyOnMock}.
 * @returns processDate and the perspectives formatted date and time.
 */
export function getProcessDateFromMSFAARequestContent(
  mockedMethod: jest.SpyInstance,
): {
  processDate: Date;
  processDateFormatted: string;
  processTimeFormatted: string;
} {
  // Method expected to be called once and received the processDate
  // parameter at index 3.
  const [[, , , processDateParameter]] = mockedMethod.mock.calls;
  const dayjsDate = dayjs(processDateParameter);
  const processDateFormatted = dayjsDate.format(DATE_FORMAT);
  const processTimeFormatted = dayjsDate.format(TIME_FORMAT);
  return {
    processDate: processDateParameter,
    processDateFormatted,
    processTimeFormatted,
  };
}
