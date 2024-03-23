import { Ref, ref } from "vue";

export function useModalDialog<T, TParameter = any>() {
  const showDialog = ref(false);
  const loading = ref(false);
  const showParameter = ref<TParameter>();
  let promise: (value: T) => void;
  let beforeResolvePromise: ((value: T) => Promise<boolean>) | undefined;

  const resolvePromise = async (
    value: T,
    options?: { keepModalOpen?: boolean },
  ) => {
    if (beforeResolvePromise) {
      loading.value = true;
      const success = await beforeResolvePromise(value);
      loading.value = false;
      if (!success) {
        // Abort the promise resolution if the beforeResolvePromise
        // is present and did not return true.
        return;
      }
    }
    showDialog.value = options?.keepModalOpen ?? false;
    promise(value);
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
