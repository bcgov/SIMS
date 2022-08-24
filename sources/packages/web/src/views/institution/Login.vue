<template>
  <full-page-container layout-template="centered-card" :enable-max-width="true">
    <v-row no-gutters>
      <v-col cols="9">
        <h1 class="category-header-large primary-color">
          Welcome to StudentAid BC
        </h1>
        <p class="mb-5">
          Login or sign up here to manage your institution account.
        </p>
        <content-group>
          <v-row>
            <v-col>
              <h3 class="category-header-medium primary-color">Login</h3>
              <p class="sign-in-description">
                For returning users—login using your BCeID.
              </p>
              <v-btn
                color="primary"
                @click="login"
                prepend-icon="fa:fa fa-user"
              >
                Login with BCeID
              </v-btn>
            </v-col>
            <v-col
              ><h3 class="category-header-medium primary-color">Sign up</h3>
              <p class="sign-in-description">
                For new users—sign up using your BCeID.
              </p>
              <v-btn
                color="primary"
                @click="login"
                prepend-icon="fa:fa fa-user-plus"
              >
                Sign Up with BCeID
              </v-btn></v-col
            >
          </v-row>
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
  </full-page-container>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { AppIDPType, ClientIdType } from "@/types";
import { computed } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";

export default {
  props: {
    showBasicBCeIDMessage: {
      type: Boolean,
      required: false,
      default: false,
    },
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
  setup(props: any) {
    const { executeLogin } = useAuth();
    const login = async () => {
      await executeLogin(ClientIdType.Institution, AppIDPType.BCeID);
    };
    const errorMessage = computed(() => {
      switch (true) {
        case props.showBasicBCeIDMessage:
          return "No such Business account has been found with BCeID. Please login with your Business BCeId.";
        case props.showDisabledUserMessage:
          return "Disabled user - you don't have access to the system. Please contact Administrator for more information.";
        case props.showUnknownUserMessage:
          return "The user was validated successfully but is not currently allowed to have access to this application. Please contact the Administrator for more information.";
        default:
          return false;
      }
    });
    return { login, errorMessage, BannerTypes };
  },
};
</script>
<style scoped>
.sign-in-description {
  max-width: 180px;
}
</style>
