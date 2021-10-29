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
      :startTimer="startTimer"
      :clientIdType="clientType"
    />
  </div>
</template>

<script lang="ts">
import { useRoute } from "vue-router";
import { onMounted, ref, onUnmounted, computed } from "vue";
import { ClientIdType, AppRoutes } from "@/types";
import { useAuth, ModalDialog, useClientLoader } from "@/composables";
import {
  MINIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER,
  MINIMUM_IDLE_TIME_FOR_WARNING_STUDENT,
  MINIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION,
  MINIMUM_IDLE_TIME_FOR_WARNING_AEST,
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
    const { executeRenewTokenIfExpired } = useAuth();
    const route = useRoute();
    const lastActivityLogin = ref(new Date());
    const interval = ref();
    const extendTimeModal = ref({} as ModalDialog<boolean>);
    const startTimer = ref(false);
    const { getClientType } = useClientLoader();

    const clientType = computed(() => {
      return getClientType(props.clientIdType);
    });

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
          return 0.02;
      }
    });

    const startIdleCheckerTimer = () => {
      if (!route.path.includes(AppRoutes.Login)) {
        /* eslint-disable */
        interval.value = setInterval(checkIdle, 30000);
        /*eslint-enable */
      }
    };

    const confirmExtendTimeModal = async () => {
      if (await extendTimeModal.value.showModal()) {
        lastActivityLogin.value = new Date();
        startTimer.value = false;
        clearInterval(interval.value);
        startIdleCheckerTimer();
        executeRenewTokenIfExpired();
      }
    };

    const checkIdle = () => {
      const idleTimeInMintutes =
        (new Date().getTime() - lastActivityLogin.value.getTime()) / 60000;
      if (idleTimeInMintutes >= minimumIdleTime.value) {
        confirmExtendTimeModal();
        startTimer.value = true;
      }
    };

    onMounted(async () => {
      startIdleCheckerTimer();
    });

    onUnmounted(() => {
      clearInterval(interval.value);
    });

    const setLastActivityTime = () => {
      if (!route.path.includes(AppRoutes.Login)) {
        lastActivityLogin.value = new Date();
      }
    };
    return {
      setLastActivityTime,
      extendTimeModal,
      startTimer,
      clientType,
    };
  },
};
</script>
