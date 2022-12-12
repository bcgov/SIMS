<template>
  <div
    class="v-main body-background"
    @mouseover="setLastActivityTime"
    @click="setLastActivityTime"
    @keyup="setLastActivityTime"
  >
    <slot></slot>
    <ConfirmExtendTime
      ref="extendTimeModal"
      :clientIdType="clientIdType"
      :countdown="countdown"
      :showDialog="modalOpen"
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
  MINIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER,
  MINIMUM_IDLE_TIME_FOR_WARNING_STUDENT,
  MINIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION,
  MINIMUM_IDLE_TIME_FOR_WARNING_AEST,
  COUNT_DOWN_TIMER_FOR_LOGOUT,
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
    const countdownInterval = ref(0);
    const modalOpen = ref(false);
    const idleTimeInSeconds = ref(0);

    onMounted(async () => {
      setLastActivityTime();
      resetIdleCheckerTimer();
      localStorage.removeItem("loggedOut");
    });

    const logoff = async () => {
      await executeLogout(props.clientIdType);
    };
    const minimumIdleTime = computed(() => {
      switch (props.clientIdType) {
        case ClientIdType.Student:
          return MINIMUM_IDLE_TIME_FOR_WARNING_STUDENT;
        case ClientIdType.Institution:
          return MINIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION;
        case ClientIdType.SupportingUsers:
          return MINIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER;
        case ClientIdType.AEST:
          return MINIMUM_IDLE_TIME_FOR_WARNING_AEST;
        default:
          console.error("Invalid Client type");
          return 0;
      }
    });

    const resetIdleCheckerTimer = () => {
      clearInterval(interval.value);
      if (isAuthenticated.value) {
        interval.value = setInterval(checkIdle, 1000);
      }
    };

    watch(
      () => modalOpen.value,
      (newValue: boolean) => {
        if (newValue) {
          countdownInterval.value = setInterval(() => {
            if (countdown.value > 0) {
              countdown.value = minimumIdleTime.value - idleTimeInSeconds.value;
            }
          }, 1000);
        } else {
          clearInterval(countdownInterval.value);
          countdown.value = COUNT_DOWN_TIMER_FOR_LOGOUT;
        }
      },
    );

    const extendUserSessionTime = () => {
      setLastActivityTime();
      resetIdleCheckerTimer();
      modalOpen.value = false;
      clearInterval(countdownInterval.value);
      countdown.value = COUNT_DOWN_TIMER_FOR_LOGOUT;
    };

    const confirmExtendTimeModal = async () => {
      console.log("confirmExtendTimeModal");
      modalOpen.value = true;
      if (await extendTimeModal.value.showModal()) {
        extendUserSessionTime();
      } else {
        setLoggedOut();
      }
    };

    const checkIdle = () => {
      if (getLoggedOut()) {
        logoff();
      }
      idleTimeInSeconds.value = getDatesDiff(
        getLastActivityTime(),
        new Date(),
        "second",
        false,
      );
      console.log("idleTimeInSeconds", idleTimeInSeconds.value);

      // Exceeded user session time.
      if (idleTimeInSeconds.value > minimumIdleTime.value) {
        if (modalOpen.value === true) {
          modalOpen.value = false;
          clearInterval(countdownInterval.value);
        }
        // Logoff immediately in case session is expired.
        logoff();
      } else if (
        idleTimeInSeconds.value >=
        minimumIdleTime.value - COUNT_DOWN_TIMER_FOR_LOGOUT
      ) {
        confirmExtendTimeModal();
      } else {
        // Close the modal in case idleTimeInSeconds has changed
        // because lastAcitivityTime changed from activity in other tab/window.
        modalOpen.value = false;
      }
    };

    const setLastActivityTime = () => {
      if (isAuthenticated.value) {
        localStorage.setItem(
          "lastActivityTime",
          new Date().getTime().toString(),
        );
      }
    };

    const getLastActivityTime = () => {
      const localStorageValue = localStorage.getItem("lastActivityTime");
      if (localStorageValue) {
        return new Date(+localStorageValue);
      }
      return new Date();
    };

    const setLoggedOut = () => {
      localStorage.setItem("loggedOut", "true");
    };

    const getLoggedOut = () => {
      const localStorageValue = localStorage.getItem("loggedOut");
      if (localStorageValue === "true") {
        return true;
      }
      return false;
    };

    return {
      setLastActivityTime,
      extendTimeModal,
      isAuthenticated,
      countdown,
      modalOpen,
      extendUserSessionTime,
    };
  },
};
</script>
