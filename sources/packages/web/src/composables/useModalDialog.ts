import { Ref, ref } from "vue";

export function useModalDialog<T, TParameter = unknown>() {
  const showDialog = ref(false);
  const loading = ref(false);
  const showParameter = ref<TParameter>();
  let promise: (value: T) => void;
  let beforeResolvePromise: ((value: T) => Promise<boolean>) | undefined;

  /**
   * Resolves the promise returned by showModal.
   * If {@see beforeResolvePromise} is provided, it will be called before resolving the promise,
   * and if it returns false, the promise will not be resolved and the modal will remain open.
   * @param value value to used to resolve the promise (also provided as a parameter to {@see beforeResolvePromise}).
   * @param options options to control the modal behavior.
   * @returns true if the promise was resolved, false otherwise.
   */
  const resolvePromise = async (
    value: T,
    options?: { keepModalOpen?: boolean },
  ): Promise<boolean> => {
    // Check if a truthy value was returned.
    // value as false would indicate the modal was canceled.
    if (value && beforeResolvePromise) {
      loading.value = true;
      const success = await beforeResolvePromise(value);
      loading.value = false;
      if (!success) {
        // Abort the promise resolution if the beforeResolvePromise
        // is present and did not return true.
        return false;
      }
    }
    showDialog.value = options?.keepModalOpen ?? false;
    promise(value);
    // Indicate the promise was resolved.
    return true;
  };

  const showModal = async (
    params?: TParameter,
    canResolvePromise?: (value: T) => Promise<boolean>,
  ): Promise<T> => {
    beforeResolvePromise = canResolvePromise;
    showParameter.value = params;
    showDialog.value = true;
    loading.value = false;
    return new Promise((resolve) => {
      promise = resolve;
    });
  };

  const hideModal = () => {
    showDialog.value = false;
    loading.value = false;
  };

  return {
    showDialog,
    hideModal,
    resolvePromise,
    showModal,
    showParameter,
    loading,
  };
}

export interface ModalDialog<T, TParameter = any> {
  showModal: (
    params?: TParameter,
    canResolvePromise?: (value: T) => Promise<boolean>,
  ) => Promise<T>;
  hideModal: () => void;
  showDialog: Ref<boolean>;
  loading: Ref<boolean>;
  beforeResolvePromise: () => Promise<boolean>;
}
