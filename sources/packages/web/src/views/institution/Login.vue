<template>
  <v-card max-width="730" elevation="2" class="mx-auto mt-15">
    <v-card-text>
      <v-row>
        <v-col md="9">
          <h1 class="category-header-large primary-color">
            Welcome to StudentAid BC
          </h1>
          <p class="mb-5">
            Manage your institution account using your Business or Basic BCeID
            User ID. Learn how to setup and access your account
            <a
              class="formio-href"
              rel="noopener"
              target="_blank"
              href="https://www.bceid.ca/"
              >here</a
            >.
          </p>
          <content-group>
            <h2 class="category-header-medium primary-color">
              Login or register
            </h2>
            <p>No account? Please register through the BCeID website below.</p>
            <v-btn
              data-cy="login"
              color="primary"
              @click="login"
              prepend-icon="fa:fa fa-user"
            >
              Login / Register with BCeID
            </v-btn>
          </content-group>
        </v-col>
        <v-col
          ><v-img
            height="260"
            class="ml-2"
            alt="A man holding a laptop. An illustration from Storyset."
            src="@/assets/images/person-standing-with-laptop.svg"
        /></v-col>
      </v-row>
      <v-row>
        <v-col>
          <banner
            v-if="errorMessage"
            class="mt-2"
            :type="BannerTypes.Error"
            :summary="errorMessage"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { IdentityProviders, ClientIdType } from "@/types";
import { computed, defineComponent } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { USER_LOGIN_TRIGGERED } from "@/constants";

export default defineComponent({
  props: {
    showDisabledUserMessage: {
      type: Boolean,
      required: false,
      default: false,
    },
    showUnknownUserMessage: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    sessionStorage.setItem(USER_LOGIN_TRIGGERED, "true");
    const { executeLogin } = useAuth();
    const login = async () => {
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
    return { login, errorMessage, BannerTypes };
  },
});
</script>
