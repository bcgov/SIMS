import { SnackBarOptions, SnackBarType } from "@/types";

export function useSnackBar() {
  const success = (content: string, displayTime = 5000): SnackBarOptions => {
    return {
      show: true,
      type: SnackBarType.success,
      content: content,
      displayTime: displayTime,
    };
  };

  const error = (content: string, displayTime = 5000): SnackBarOptions => {
    return {
      show: true,
      type: SnackBarType.error,
      content: content,
      displayTime: displayTime,
    };
  };

  const warn = (content: string, displayTime = 5000): SnackBarOptions => {
    return {
      show: true,
      type: SnackBarType.warn,
      content: content,
      displayTime: `${displayTime}`,
    };
  };

  /**
   * toast display time
   */
  const EXTENDED_MESSAGE_DISPLAY_TIME = 15000;

  return {
    success,
    error,
    warn,
    EXTENDED_MESSAGE_DISPLAY_TIME,
  };
}
