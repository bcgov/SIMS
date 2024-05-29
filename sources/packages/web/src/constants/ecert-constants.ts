import { ECertFailedValidation } from "@/types";

export interface EcertFailedValidationDetail {
  failedType: ECertFailedValidation;
  failedMessage: string;
}

export const ECERT_FAILED_MESSAGES: EcertFailedValidationDetail[] = [
  {
    failedType: ECertFailedValidation.InvalidSIN,
    failedMessage:
      "Your SIN is invalid and your funding cannot be issued. Contact StudentAid BC for assistance.",
  },
  {
    failedType: ECertFailedValidation.MSFAANotValid,
    failedMessage:
      "You have not yet signed your MSFAA number with the National Student Loans Service Center. Your MSFAA number was issued on your Notice of Assessment - you must use that number to sign your Master Student Financial Assistance Agreement with NSLSC before you are eligible to receive your funding. Alternatively, this could be due to your MSFAA being cancelled.",
  },
  {
    failedType: ECertFailedValidation.DisabilityStatusNotConfirmed,
    failedMessage:
      "You have applied for disability funding on your application, but your disability status on your student profile has not yet been verified. Only once your status is verified will you be able to receive funding.",
  },
  {
    failedType: ECertFailedValidation.HasStopDisbursementRestriction,
    failedMessage:
      "You have a restriction on your account making you ineligible to receive funding. Please contact StudentAid BC if you still require assistance in identifying the cause of this issue and help resolving the issue.",
  },
  {
    failedType: ECertFailedValidation.LifetimeMaximumCSLP,
    failedMessage:
      "Your current funding assessment would exceed your allowable lifetime limit for Part-Time Canada Student Loan. Your assessment must be adjusted to stay within your lifetime limit. Contact StudentAid BC for assistance.",
  },
];
