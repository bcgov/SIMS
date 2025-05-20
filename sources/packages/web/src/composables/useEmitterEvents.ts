import useEmitter from "@/composables/useEmitter";
import { Handler } from "mitt";

const REFRESH_APPLICATION_SIDEBAR = "REFRESH_APPLICATION_SIDEBAR";
/**
 * Interface defining the the object returned by the useEmitterEvents composable.
 */
interface EmitterEvents {
  /**
   * Emits an event to refresh the application sidebar.
   */
  refreshApplicationSidebar: () => void;
  /**
   * Registers a handler function to be called when the application sidebar needs refreshing.
   * @param handler The function to call when the event is emitted.
   */
  refreshApplicationSidebarOn: <T>(handler: Handler<T>) => void;
  /**
   * Unregisters a previously registered handler function.
   * @param handler The function to unregister.
   */
  refreshApplicationSidebarOff: <T>(handler: Handler<T>) => void;
}

/**
 * This composable provides methods to emit and listen for events related
 * to the application sidebar.
 * @returns {Object} An object containing methods to emit and listen for events.
 **/
export default function useEmitterEvents(): EmitterEvents {
  const emitter = useEmitter();

  const refreshApplicationSidebar = () => {
    emitter.emit(REFRESH_APPLICATION_SIDEBAR);
  };

  const refreshApplicationSidebarOn = <T>(handler: Handler<T>) => {
    emitter.on(REFRESH_APPLICATION_SIDEBAR, handler);
  };

  const refreshApplicationSidebarOff = <T>(handler: Handler<T>) => {
    emitter.off(REFRESH_APPLICATION_SIDEBAR, handler);
  };

  return {
    refreshApplicationSidebar,
    refreshApplicationSidebarOn,
    refreshApplicationSidebarOff,
  };
}
