<template>
  <div class="v-main body-background" @mouseover="setLastActivityTime" @click="setLastActivityTime" @keyup="setLastActivityTime">
    <slot></slot>
    <confirm-extend-time ref="extendTimeModal" :countdown="countdown" @dialogClosedEvent="extendUserSessionTime" />
  </div>
</template>

<script lang="ts">
import {
  onMounted,
  ref,
  computed,
  watch,
  defineComponent,
  PropType,
} from "vue";
import { ClientIdType } from "@/types";
import {
  ModalDialog,
  useInstitutionAuth,
  useAuth,
  useFormatters,
} from "@/composables";
import { COUNT_DOWN_TIMER_FOR_LOGOUT } from "@/constants/system-constants";
import ConfirmExtendTime from "@/components/common/modals/ConfirmExtendTime.vue";
import { AppConfigService } from "@/services/AppConfigService";

export default defineComponent({
  components: { ConfirmExtendTime },
  props: {
    clientIdType: {
      type: String as PropType<ClientIdType>,
      required: true,
      default: "" as ClientIdType,
    },
  },
  setup(props) {
    const interval = ref();
    const extendTimeModal = ref({} as ModalDialog<boolean>);
    const { isAuthenticated } = useInstitutionAuth();
    const { getDatesDiff } = useFormatters();
    const { executeLogout, isLoggedOut, resetLoggedOut } = useAuth();
    const countdown = ref(COUNT_DOWN_TIMER_FOR_LOGOUT);
    const IDLE_CHECKER_TIMER_INTERVAL = 1000;
    const COUNTDOWN_INTERVAL = 1000;
    const LAST_ACTIVITY_TIME_LOCAL_STORAGE_ITEM = "lastActivityTime";
    let countdownInterval = 0;
    let idleTimeInSeconds = 0;

    const maximumIdleTime = ref(0);

    onMounted(async () => {
      setLastActivityTime();
      resetIdleCheckerTimer();
      resetLoggedOut();
      const {
        maximumIdleTimeForWarningAest,
        maximumIdleTimeForWarningInstitution,
        maximumIdleTimeForWarningStudent,
        maximumIdleTimeForWarningSupportingUser,
      } = await AppConfigService.shared.config();

      switch (props.clientIdType) {
        case ClientIdType.Student:
          maximumIdleTime.value = maximumIdleTimeForWarningStudent;
          break;
        case ClientIdType.Institution:
          maximumIdleTime.value = maximumIdleTimeForWarningInstitution;
          break;
        case ClientIdType.SupportingUsers:
          maximumIdleTime.value = maximumIdleTimeForWarningSupportingUser;
          break;
        case ClientIdType.AEST:
          maximumIdleTime.value = maximumIdleTimeForWarningAest;
          break;
        default:
          console.error("Invalid Client type");
          break;
      }
    });

    const logoff = async () => {
      await executeLogout(props.clientIdType);
    };

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
        await logoff();
      }
    };

    const checkIdle = async () => {
      // Check if it was logged out from another tab/window.
      if (isLoggedOut()) {
        await logoff();
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
        await logoff();
      } else if (
        idleTimeInSeconds >=
        maximumIdleTime.value - COUNT_DOWN_TIMER_FOR_LOGOUT
      ) {
        // Open modal.
        await confirmExtendTimeModal();
      } else {
        // Close modal.
        extendTimeModal.value.showDialog = false;
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

    return {
      setLastActivityTime,
      extendTimeModal,
      isAuthenticated,
      countdown,
      extendUserSessionTime,
    };
  },
});
</script>
