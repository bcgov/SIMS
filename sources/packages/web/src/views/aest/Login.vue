<template>
  <shared-login
    :title="`Welcome to ${MINISTRY_SHORTNAME}`"
    subtitle="In order to successfully login—you must be previously authorized by the system administrator. Please use your IDIR to authenticate."
    login-area-title="Login for ministry staff"
    :login-area-text="`With authorization from the system administrator, login here using your IDIR to access the ${MINISTRY_SHORTNAME} portal.`"
    login-area-button="Login with IDIR"
    @login="login"
  >
    <template #image>
      <v-img
        height="250"
        class="ml-2"
        alt="A person entering their login information into a digital screen."
        src="@/assets/images/person-seeing-screen.svg"
      />
    </template>
    <template #banner-message v-if="showNotAllowedUser">
      <banner
        class="mt-2"
        :type="BannerTypes.Error"
        summary="The user was validated successfully but is not currently allowed to
        have access to this application. Please contact the Administrator for
        more information."
      />
    </template>
  </shared-login>
</template>

<script setup lang="ts">
import { useAuth } from "@/composables";
import { IdentityProviders, ClientIdType } from "@/types";
import { BannerTypes } from "@/types/contracts/Banner";
import { MINISTRY_SHORTNAME } from "@/constants/message-constants";
import { AuditService } from "@/services/AuditService";
import SharedLogin from "@/components/common/SharedLogin.vue";

withDefaults(
  defineProps<{
    showNotAllowedUser?: boolean;
  }>(),
  {
    showNotAllowedUser: false,
  },
);

const { executeLogin } = useAuth();
const login = async () => {
  AuditService.userLoginTriggered();
  await executeLogin(ClientIdType.AEST, IdentityProviders.IDIR);
};
</script>
