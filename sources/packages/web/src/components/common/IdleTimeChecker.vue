<template>
  <div
    class="v-main body-background"
    @mouseover="setLastActivityTime"
    @click="setLastActivityTime"
    @keyup="setLastActivityTime"
  >
    <slot></slot>
    <confirm-extend-time
      ref="extendTimeModal"
      :clientIdType="clientIdType"
      :countdown="countdown"
      @dialogClosedEvent="extendUserSessionTime"
    />
  </div>
</template>

<script lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { ClientIdType } from "@/types";
import {
  ModalDialog,
  useInstitutionAuth,
  useAuth,
  useFormatters,
} from "@/composables";
import {
  MAXIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER,
  MAXIMUM_IDLE_TIME_FOR_WARNING_STUDENT,
  MAXIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION,
  MAXIMUM_IDLE_TIME_FOR_WARNING_AEST,
  COUNT_DOWN_TIMER_FOR_LOGOUT,
  LOGGED_OUT_LOCAL_STORAGE_ITEM,
} from "@/constants/system-constants";
import ConfirmExtendTime from "@/components/common/modals/ConfirmExtendTime.vue";

export default {
  components: { ConfirmExtendTime },
  props: {
    clientIdType: {
      type: String,
      required: true,
      default: "" as ClientIdType,
    },
  },
  setup(props: any) {
    const interval = ref();
    const extendTimeModal = ref({} as ModalDialog<boolean>);
    const { isAuthenticated } = useInstitutionAuth();
    const { getDatesDiff } = useFormatters();
    const { executeLogout } = useAuth();
    const countdown = ref(COUNT_DOWN_TIMER_FOR_LOGOUT);
    const IDLE_CHECKER_TIMER_INTERVAL = 1000;
    const COUNTDOWN_INTERVAL = 1000;
    const LAST_ACTIVITY_TIME_LOCAL_STORAGE_ITEM = "lastActivityTime";
    let countdownInterval = 0;
    let idleTimeInSeconds = 0;

    onMounted(async () => {
      setLastActivityTime();
      resetIdleCheckerTimer();
      localStorage.removeItem(LOGGED_OUT_LOCAL_STORAGE_ITEM);
    });

    const logoff = async () => {
      await executeLogout(props.clientIdType);
    };

    const maximumIdleTime = computed(() => {
      switch (props.clientIdType) {
        case ClientIdType.Student:
          return MAXIMUM_IDLE_TIME_FOR_WARNING_STUDENT;
        case ClientIdType.Institution:
          return MAXIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION;
        case ClientIdType.SupportingUsers:
          return MAXIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER;
        case ClientIdType.AEST:
          return MAXIMUM_IDLE_TIME_FOR_WARNING_AEST;
        default:
          console.error("Invalid Client type");
          return 0;
      }
    });

    const resetIdleCheckerTimer = () => {
      clearInterval(interval.value);
      if (isAuthenticated.value) {
        interval.value = setInterval(checkIdle, IDLE_CHECKER_TIMER_INTERVAL);
      }
    };

    watch(
      () => extendTimeModal.value.showDialog,
      (newValue: boolean) => {
        if (newValue) {
          countdownInterval = setInterval(() => {
            if (countdown.value > 0) {
              countdown.value = maximumIdleTime.value - idleTimeInSeconds;
            }
          }, COUNTDOWN_INTERVAL);
        } else {
          clearInterval(countdownInterval);
          countdown.value = COUNT_DOWN_TIMER_FOR_LOGOUT;
        }
      },
    );

    const extendUserSessionTime = () => {
      setLastActivityTime();
      resetIdleCheckerTimer();
      extendTimeModal.value.showDialog = false;
      clearInterval(countdownInterval);
      countdown.value = COUNT_DOWN_TIMER_FOR_LOGOUT;
    };

    const confirmExtendTimeModal = async () => {
      extendTimeModal.value.showDialog = true;
      if (await extendTimeModal.value.showModal()) {
        extendUserSessionTime();
      } else {
        setLoggedOut();
      }
    };

    const checkIdle = () => {
      if (getLoggedOut()) {
        logoff();
        return;
      }
      idleTimeInSeconds = getDatesDiff(
        getLastActivityTime(),
        new Date(),
        "second",
        false,
      );

      // Exceeded user session time.
      if (idleTimeInSeconds > maximumIdleTime.value) {
        // Logoff immediately in case session is expired.
        logoff();
      } else if (
        idleTimeInSeconds >=
        maximumIdleTime.value - COUNT_DOWN_TIMER_FOR_LOGOUT
      ) {
        confirmExtendTimeModal();
      }
    };

    const setLastActivityTime = () => {
      if (isAuthenticated.value) {
        localStorage.setItem(
          LAST_ACTIVITY_TIME_LOCAL_STORAGE_ITEM,
          new Date().getTime().toString(),
        );
      }
    };

    const getLastActivityTime = () => {
      const epochLastActivityTimeStringValue = localStorage.getItem(
        LAST_ACTIVITY_TIME_LOCAL_STORAGE_ITEM,
      );
      if (epochLastActivityTimeStringValue) {
        return new Date(+epochLastActivityTimeStringValue);
      }
      return new Date();
    };

    const setLoggedOut = () => {
      localStorage.setItem(LOGGED_OUT_LOCAL_STORAGE_ITEM, "true");
    };

    const getLoggedOut = () => {
      const loggedOutStringValue = localStorage.getItem(
        LOGGED_OUT_LOCAL_STORAGE_ITEM,
      );
      if (loggedOutStringValue === "true") {
        return true;
      }
      return false;
    };

    return {
      setLastActivityTime,
      extendTimeModal,
      isAuthenticated,
      countdown,
      extendUserSessionTime,
    };
  },
};
</script>
