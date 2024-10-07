const SIN_MAX_LENGTH = 9;

/**
 * Helpers to validate input from the UI.
 */
export function useValidators() {
  /**
   * Checks if a SIN is valid.
   * @param sin value to be entered.
   * @returns true or false.
   */
  const isSINValid = (sin: string): boolean => {
    let valid = false;
    if (sin) {
      sin = sin.replace(/\s/g, "");
      if (sin.length === SIN_MAX_LENGTH) {
        let checksum = 0;
        for (let i = 0; i < sin.length; i++) {
          const currentDigit = +sin.charAt(i);
          if ((i + 1) % 2 === 0) {
            const digitTimes2 = currentDigit * 2;
            checksum += digitTimes2 < 10 ? digitTimes2 : digitTimes2 - 9;
          } else {
            checksum += +sin.charAt(i);
          }
        }
        if (checksum % 10 === 0) {
          valid = true;
        }
      }
    }
    return valid;
  };

  const isEmailValid = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
  };

  const checkMaxCharacters = (
    value: string,
    maxCharacters: number,
  ): boolean => {
    return value.length <= maxCharacters;
  };

  return {
    isSINValid,
    isEmailValid,
    checkMaxCharacters,
  };
}
