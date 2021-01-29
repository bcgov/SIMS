const SIN_NUMBER_LENGTH = 9;

export function isValidSinNumber(sin: string): boolean {
  if (sin) {
    sin = sin.replace(/\s/g, "");
    if (sin.length === SIN_NUMBER_LENGTH) {
      let checksum = 0;
      for (let i = 0; i < sin.length; i++) {
        const currentDigit = parseInt(sin.charAt(i));
        if ((i + 1) % 2 === 0) {
          const digitTimes2 = currentDigit * 2;
          checksum += digitTimes2 < 10 ? digitTimes2 : digitTimes2 - 9;
        } else {
          checksum += parseInt(sin.charAt(i));
        }
      }

      if (checksum % 10 == 0) {
        return true;
      }
    }
  }

  return false;
}

export function sinValidationRule(sin: string): boolean | string {
  if (isValidSinNumber(sin)) {
    return true;
  }

  return "SIN Number is in an invalid format.";
}
