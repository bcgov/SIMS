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

  return { success, error, warn };
}
