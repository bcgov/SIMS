<template>
  <shared-login
    title="Welcome to StudentAid BC"
    subtitle="We help with the cost of post-secondary education through student loans, grants, and other financial assistance programs."
    login-area-title="Log in or Register"
    login-area-text="Whether you are a new or returning user-log in or register using the BC Services Card account."
    login-area-button="Log in/Register"
    @login="login"
  >
    <template #image>
      <v-img
        max-height="250"
        min-width="100"
        class="ml-2"
        alt="An illustration of a woman working at a desk with her laptop. Illustration by Storyset."
        src="@/assets/images/happy-parent.svg"
      />
    </template>
  </shared-login>
</template>

<script setup lang="ts">
import { useAuth } from "@/composables";
import { IdentityProviders, ClientIdType } from "@/types";
import { AuditService } from "@/services/AuditService";
import SharedLogin from "@/components/common/SharedLogin.vue";

const { executeLogin } = useAuth();
const login = async () => {
  AuditService.userLoginTriggered();
  await executeLogin(ClientIdType.SupportingUsers, IdentityProviders.BCSC);
};
</script>
