import useEmitter from "@/composables/useEmitter";
import { Handler } from "mitt";

const REFRESH_STUDENT_SEARCH_PROFILE = "REFRESH_STUDENT_SEARCH_PROFILE";

/**
 * Interface defining the the object returned by the useEmitterEvents composable.
 */
interface StudentSearchProfileEmitterEvents {
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
 * to the Ministry student search profile.
 * @returns {Object} An object containing methods to emit and listen for events.
 **/
export default function useStudentDetailsEmitter(): StudentSearchProfileEmitterEvents {
  const emitter = useEmitter();

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
    refreshStudentSearchProfile,
    refreshStudentSearchProfileOn,
    refreshStudentSearchProfileOff,
  };
}
