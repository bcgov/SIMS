import {
  Application,
  MSFAANumber,
  OfferingIntensity,
  Student,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Represents the different MSFAA scenarios.
 * More than one state can be combined, for instance,
 * to create a signed MSFAA that was also cancelled.
 */
export enum MSFAAStates {
  Pending = 0,
  Signed = 1,
  CancelledSystem = 2,
  CancelledOtherProvince = 4,
}

/**
 * Creates a new MSFAA number record.
 * @param relations dependencies.
 * - `student` related student.
 * - `referenceApplication` reference application. Application that triggered the
 * MSFAA creation and the one that will provide additional student information
 * for the MSFAA request file.
 * @param options additional options.
 * - `msfaaState` allow the record to be created in one of the possible 'states' that
 * an MSFAA can have for the different scenarios along its lifetime. More than one
 * state can be combined, for instance, to create a signed MSFAA that was also
 * cancelled.
 * - `msfaaInitialValues` initial msfaa record.
 * @returns MSFAA number record ready to be saved.
 */
export function createFakeMSFAANumber(
  relations: {
    student: Student;
    referenceApplication?: Application;
  },
  options?: {
    msfaaState?: MSFAAStates;
    msfaaInitialValues?: Partial<MSFAANumber>;
  },
): MSFAANumber {
  const now = new Date();
  const dateOnly = getISODateOnlyString(now);
  const msfaaNumber = new MSFAANumber();
  msfaaNumber.offeringIntensity =
    options?.msfaaInitialValues?.offeringIntensity ??
    OfferingIntensity.fullTime;
  msfaaNumber.student = relations.student;
  msfaaNumber.referenceApplication = relations?.referenceApplication;
  msfaaNumber.msfaaNumber =
    options?.msfaaInitialValues?.msfaaNumber ??
    faker.datatype
      .number({
        min: 1000000000,
        max: 9999999999,
      })
      .toString();

  if (!options?.msfaaState || options.msfaaState & MSFAAStates.Pending) {
    msfaaNumber.dateRequested = null;
    msfaaNumber.dateSigned = null;
    msfaaNumber.serviceProviderReceivedDate = null;
    msfaaNumber.cancelledDate = null;
    msfaaNumber.newIssuingProvince = null;
  }

  if (options?.msfaaState & MSFAAStates.Signed) {
    msfaaNumber.dateRequested = now;
    msfaaNumber.dateSigned = dateOnly;
    msfaaNumber.serviceProviderReceivedDate = dateOnly;
  }

  if (options?.msfaaState & MSFAAStates.CancelledSystem) {
    msfaaNumber.cancelledDate = dateOnly;
  }

  if (options?.msfaaState & MSFAAStates.CancelledOtherProvince) {
    msfaaNumber.newIssuingProvince = "ON";
    msfaaNumber.cancelledDate = dateOnly;
  }

  return msfaaNumber;
}
