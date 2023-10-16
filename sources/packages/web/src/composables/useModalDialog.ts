import { Ref, ref } from "vue";

export function useModalDialog<T, TParameter = any>() {
  const showDialog = ref(false);
  const loading = ref(false);
  const showParameter = ref<TParameter>();
  let promise: (value: T) => void;

  const resolvePromise = (value: T, keepModalOpen = false) => {
    showDialog.value = keepModalOpen;
    promise(value);
  };

  const showModal = async (params?: TParameter): Promise<T> => {
    showParameter.value = params;
    showDialog.value = true;
    return new Promise((resolve) => {
      promise = resolve;
    });
  };

  return {
    showDialog,
    resolvePromise,
    showModal,
    showParameter,
    loading,
  };
}

export interface ModalDialog<T, TParameter = any> {
  showModal: (params?: TParameter) => Promise<T>;
  showDialog: Ref<boolean>;
  loading: Ref<boolean>;
}
