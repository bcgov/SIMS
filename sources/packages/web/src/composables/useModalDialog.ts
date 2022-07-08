import { ref } from "vue";

export function useModalDialog<T, TParameter = any>() {
  const showDialog = ref(false);
  const showParameter = ref<TParameter>();
  let promise: (value: T) => void;

  const resolvePromise = (value: T) => {
    showDialog.value = false;
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
  };
}

export interface ModalDialog<T, TParameter = any> {
  showModal: (params?: TParameter) => Promise<T>;
}
