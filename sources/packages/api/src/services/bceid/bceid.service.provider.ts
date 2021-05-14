import { BCeIDService } from "..";
import { BCeIDServiceMock } from "../bceid/bceid.service.mock";

/**
 * Used to allow developers to consume a mocked version of
 * BCeID WebService that makes it possible to run the
 * solution locally without a VPN.
 */
export const BCeIDServiceProvider = {
  provide: BCeIDService,
  useClass:
    process.env.DUMMY_BCeID_ACCOUNT_RESPONSE === "yes"
      ? BCeIDServiceMock
      : BCeIDService,
};
