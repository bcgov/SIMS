import { ref } from "vue";

export function useModal<T>() {
  const showDialog = ref(false);
  let promise: (value: T) => void;

  const resolvePromise = (value: T) => {
    promise(value);
  };

  const showModal = async (): Promise<T> => {
    showDialog.value = true;
    return new Promise(resolve => {
      promise = resolve;
    });
  };

  return {
    showDialog,
    resolvePromise,
    showModal,
  };
}

export interface ModalDialog<T> {
  showModal: () => Promise<T>;
}
