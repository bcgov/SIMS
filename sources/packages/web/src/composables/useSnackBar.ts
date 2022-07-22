import { SnackBarOptions, SnackBarType } from "@/types";
import useEmitter from "./useEmitter";

export function useSnackBar() {
  /**
   * Toast display time.
   */
  const EXTENDED_MESSAGE_DISPLAY_TIME = 15000;
  const DEFAULT_MESSAGE_DISPLAY_TIME = 5000;
  const emitter = useEmitter();

  const emitSnackBar = (snackbarOptions: SnackBarOptions) => {
    emitter.emit("snackBar", snackbarOptions);
  };

  const success = (
    content: string,
    displayTime = DEFAULT_MESSAGE_DISPLAY_TIME,
  ): void => {
    const snackbarOptions: SnackBarOptions = {
      show: true,
      type: SnackBarType.success,
      content: content,
      displayTime: displayTime,
    };
    emitSnackBar(snackbarOptions);
  };

  const error = (
    content: string,
    displayTime = DEFAULT_MESSAGE_DISPLAY_TIME,
  ): void => {
    const snackbarOptions: SnackBarOptions = {
      show: true,
      type: SnackBarType.error,
      content: content,
      displayTime: displayTime,
    };
    emitSnackBar(snackbarOptions);
  };

  const warn = (
    content: string,
    displayTime = DEFAULT_MESSAGE_DISPLAY_TIME,
  ): void => {
    const snackbarOptions: SnackBarOptions = {
      show: true,
      type: SnackBarType.warn,
      content: content,
      displayTime: `${displayTime}`,
    };
    emitSnackBar(snackbarOptions);
  };

  return {
    success,
    error,
    warn,
    EXTENDED_MESSAGE_DISPLAY_TIME,
    DEFAULT_MESSAGE_DISPLAY_TIME,
  };
}
