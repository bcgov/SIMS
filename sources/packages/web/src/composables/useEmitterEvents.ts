import useEmitter from "@/composables/useEmitter";
import { Handler } from "mitt";

const REFRESH_APPLICATION_SIDEBAR = "REFRESH_APPLICATION_SIDEBAR";
const REFRESH_STUDENT_SEARCH_PROFILE = "REFRESH_STUDENT_SEARCH_PROFILE";
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
  refreshApplicationSidebarOn: (handler: Handler<unknown>) => void;
  /**
   * Unregisters a previously registered handler function.
   * @param handler The function to unregister.
   */
  refreshApplicationSidebarOff: (handler: Handler<unknown>) => void;

  /**
   * Emits an event to refresh the student search profile.
   */
  refreshStudentSearchProfile(): void;
  /**
   * Registers a handler to be called when the student search profile is refreshed.
   */
  refreshStudentSearchProfileOn(handler: Handler<unknown>): void;
  /**
   * Unregisters a handler from being called when the student search profile is refreshed.
   */
  refreshStudentSearchProfileOff(handler: Handler<unknown>): void;
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

  const refreshApplicationSidebarOn = (handler: Handler<unknown>) => {
    emitter.on(REFRESH_APPLICATION_SIDEBAR, handler);
  };

  const refreshApplicationSidebarOff = (handler: Handler<unknown>) => {
    emitter.off(REFRESH_APPLICATION_SIDEBAR, handler);
  };

  const refreshStudentSearchProfile = () => {
    emitter.emit(REFRESH_STUDENT_SEARCH_PROFILE);
  };

  const refreshStudentSearchProfileOn = (handler: Handler<unknown>) => {
    emitter.on(REFRESH_STUDENT_SEARCH_PROFILE, handler);
  };

  const refreshStudentSearchProfileOff = (handler: Handler<unknown>) => {
    emitter.off(REFRESH_STUDENT_SEARCH_PROFILE, handler);
  };

  return {
    refreshApplicationSidebar,
    refreshApplicationSidebarOn,
    refreshApplicationSidebarOff,
    refreshStudentSearchProfile,
    refreshStudentSearchProfileOn,
    refreshStudentSearchProfileOff,
  };
}
