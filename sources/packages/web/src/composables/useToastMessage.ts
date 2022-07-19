import { SnackBarOptions, SnackBarType } from "@/types";
import { useToast } from "primevue/usetoast";
// todo: ann clean up
export function useToastMessage() {
  const toast = useToast();

  const success = (
    summary: string,
    detail: string,
    displayTime = 5000,
  ): void => {
    toast.add({
      severity: "success",
      summary,
      detail,
      life: displayTime,
    });
  };
  const success1 = (content: string, displayTime = 5000): SnackBarOptions => {
    return {
      show: true,
      type: SnackBarType.success,
      content: content,
      displayTime: displayTime,
    };
  };

  const error = (
    summary: string,
    detail: string | undefined,
    displayTime = 5000,
  ): void => {
    toast.add({
      severity: "error",
      summary,
      detail,
      life: displayTime,
    });
  };

  const error1 = (content: string, displayTime = 5000): SnackBarOptions => {
    return {
      show: true,
      type: SnackBarType.error,
      content: content,
      displayTime: displayTime,
    };
  };

  const warn = (summary: string, detail: string, displayTime = 5000): void => {
    toast.add({
      severity: "warn",
      summary,
      detail,
      life: displayTime,
    });
  };
  const warn1 = (content: string, displayTime = 5000): SnackBarOptions => {
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
    success1,
    error1,
    warn1,
  };
}
