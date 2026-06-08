<template>
  <shared-login
    title="Welcome to StudentAid BC"
    subtitle="Manage your institution account using your Business or Basic BCeID User ID. Learn how to setup and access your account"
    login-area-title="Log in or Register"
    login-area-text="No account? Please register through the BCeID website below."
    login-area-button="Login / Register with BCeID"
    @login="login"
  >
    <template #subtitle>
      <span>
        Manage your institution account using your Business or Basic BCeID User
        ID. Learn how to setup and access your account
        <a
          class="formio-href"
          rel="noopener"
          target="_blank"
          href="https://www.bceid.ca/"
          >here</a
        >.
      </span>
    </template>
    <template #image>
      <v-img
        height="230"
        class="ml-2"
        alt="A man holding a laptop. An illustration from Storyset."
        src="@/assets/images/person-standing-with-laptop.svg"
      />
    </template>
    <template #banner-message>
      <banner
        v-if="errorMessage"
        class="mt-2"
        :type="BannerTypes.Error"
        :summary="errorMessage"
      />
    </template>
  </shared-login>
</template>

<script setup lang="ts">
import { useAuth } from "@/composables";
import { IdentityProviders, ClientIdType } from "@/types";
import { computed } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { AuditService } from "@/services/AuditService";
import SharedLogin from "@/components/common/SharedLogin.vue";

const props = withDefaults(
  defineProps<{
    showDisabledUserMessage?: boolean;
    showUnknownUserMessage?: boolean;
  }>(),
  {
    showDisabledUserMessage: false,
    showUnknownUserMessage: false,
  },
);

const { executeLogin } = useAuth();

const login = async () => {
  AuditService.userLoginTriggered();
  await executeLogin(ClientIdType.Institution, IdentityProviders.BCeIDBoth);
};

const errorMessage = computed(() => {
  switch (true) {
    case props.showDisabledUserMessage:
      return "Your access was disabled. Please contact your institution's admin to enable your access.";
    case props.showUnknownUserMessage:
      return "Your BCeID User ID is not authorized to access our system yet. If you are using a Basic BCeID User ID, please contact Designat@gov.bc.ca for authorization. If you are using a Business BCeID User ID, please contact your institution's admin to add you as a new user. For newly approved Business BCeID accounts, please fully complete the steps to activate your Business BCeID first.";
    default:
      return false;
  }
});
</script>
