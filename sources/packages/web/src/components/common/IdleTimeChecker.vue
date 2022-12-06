<template>
  <div
    class="v-main body-background"
    @mouseover="setLastActivityTime"
    @click="setLastActivityTime"
    @keyup="setLastActivityTime"
  >
    <slot></slot>
    <ConfirmExtendTime ref="extendTimeModal" :clientIdType="clientIdType" />
  </div>
</template>

<script lang="ts">
import { onMounted, ref, computed } from "vue";
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
    const lastActivityLogin = ref(new Date());
    const interval = ref();
    const extendTimeModal = ref({} as ModalDialog<boolean>);
    const { isAuthenticated } = useInstitutionAuth();
    const { getDatesDiff } = useFormatters();
    const { executeLogout } = useAuth();

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
        /* eslint-disable */
        interval.value = setInterval(checkIdle, 1000);
        /* eslint-enable */
      }
    };

    const confirmExtendTimeModal = async () => {
      if (await extendTimeModal.value.showModal()) {
        lastActivityLogin.value = new Date();
        resetIdleCheckerTimer();
      }
    };
    let n = 0;
    const checkIdle = () => {
      console.log("Seconds: ", ++n);
      const idleTimeInMinutes = getDatesDiff(
        lastActivityLogin.value,
        new Date(),
        "second",
        true,
      );
      if (idleTimeInMinutes > minimumIdleTime.value) {
        logoff();
      } else if (
        idleTimeInMinutes >=
        minimumIdleTime.value - COUNT_DOWN_TIMER_FOR_LOGOUT
      ) {
        confirmExtendTimeModal();
      }
    };

    onMounted(async () => {
      resetIdleCheckerTimer();
    });

    const setLastActivityTime = () => {
      if (isAuthenticated.value) {
        lastActivityLogin.value = new Date();
      }
    };
    return {
      setLastActivityTime,
      extendTimeModal,
      isAuthenticated,
    };
  },
};
</script>
