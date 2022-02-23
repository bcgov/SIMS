import { useToast } from "primevue/usetoast";

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

  const warn = (summary: string, detail: string, displayTime = 5000): void => {
    toast.add({
      severity: "warn",
      summary,
      detail,
      life: displayTime,
    });
  };

  /**
   * toast display time
   */
  const EXTENDED_MESSAGE_DISPLAY_TIME = 15000;

  return { success, error, warn, EXTENDED_MESSAGE_DISPLAY_TIME };
}
