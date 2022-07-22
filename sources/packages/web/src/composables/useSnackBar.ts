import { SnackBarType } from "@/types";
import useEmitter from "./useEmitter";

export function useSnackBar() {
  const emitter = useEmitter();

  const success = (content: string, displayTime = 5000): void => {
    const snackbarOptions = {
      show: true,
      type: SnackBarType.success,
      content: content,
      displayTime: displayTime,
    };
    emitter.emit("snackBar", snackbarOptions);
  };

  const error = (content: string, displayTime = 5000): void => {
    const snackbarOptions = {
      show: true,
      type: SnackBarType.error,
      content: content,
      displayTime: displayTime,
    };
    emitter.emit("snackBar", snackbarOptions);
  };

  const warn = (content: string, displayTime = 5000): void => {
    const snackbarOptions = {
      show: true,
      type: SnackBarType.warn,
      content: content,
      displayTime: `${displayTime}`,
    };

    emitter.emit("snackBar", snackbarOptions);
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
