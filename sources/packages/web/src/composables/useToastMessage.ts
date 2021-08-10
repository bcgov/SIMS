import { useToast } from "primevue/usetoast";

export function useToastMessage() {
  const toast = useToast();

  const success = (summary: string, detail: string): void => {
    toast.add({
      severity: "success",
      summary,
      detail,
      life: 5000,
    });
  };

  const error = (summary: string, detail: string): void => {
    toast.add({
      severity: "error",
      summary,
      detail,
      life: 5000,
    });
  };

  return { success, error };
}
