import { INestApplication } from "@nestjs/common";
import { MSFAAIntegrationService } from "@sims/integrations/esdc-integration";
import {
  DATE_FORMAT,
  TIME_FORMAT,
} from "@sims/integrations/esdc-integration/msfaa-integration/models/msfaa-integration.model";
import { OfferingIntensity } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as dayjs from "dayjs";

export function getMSFAASequenceGroupName(
  offeringIntensity: OfferingIntensity,
) {
  return `MSFAA_${offeringIntensity}_SENT_FILE_${getISODateOnlyString(
    new Date(),
  )}`;
}

export function createMSFAARequestContentSpyOnMock(
  app: INestApplication,
): jest.SpyInstance {
  const msfaaIntegrationService = app.get(MSFAAIntegrationService);
  return jest.spyOn(msfaaIntegrationService, "createMSFAARequestContent");
}

export function getProcessDateFromMSFAARequestContent(
  mockedMethod: jest.SpyInstance,
): { processDate: string; processTime: string } {
  const [[, , , processDateParameter]] = mockedMethod.mock.calls;
  const dayjsDate = dayjs(processDateParameter);
  const processDate = dayjsDate.format(DATE_FORMAT);
  const processTime = dayjsDate.format(TIME_FORMAT);
  return {
    processDate,
    processTime,
  };
}
