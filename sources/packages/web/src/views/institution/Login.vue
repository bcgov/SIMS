<template>
  <v-card elevation="2" class="mx-auto mt-15" max-width="660px" outlined>
    <v-card-text>
      <v-row no-gutters>
        <v-col cols="9">
          <h1 class="category-header-large primary-color">
            Welcome to StudentAid BC
          </h1>
          <p class="mb-8">
            Login or sign up here to manage your institution account.
          </p>
          <content-group>
            <v-row>
              <v-col>
                <p class="category-header-medium primary-color">
                  Login with BCeID
                </p>
                <p class="sign-in-description">
                  For returning users—login using your BCeID.
                </p>
                <v-btn
                  class="primary-btn-background"
                  @click="login"
                  prepend-icon="fa:fa fa-user"
                >
                  Login with BCeID
                </v-btn>
              </v-col>
              <v-col
                ><p class="category-header-medium primary-color">
                  Sign up with BCeID
                </p>
                <p class="sign-in-description">
                  For new users—sign up using your BCeID.
                </p>
                <v-btn
                  class="primary-btn-background"
                  @click="login"
                  variant="outlined"
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
            class="mt-4 ml-4"
            alt="Person standing with laptop"
            src="@/assets/images/person-standing-with-laptop.svg"
        /></v-col>
        <v-col cols="12">
          <Message severity="error" v-if="showBasicBCeIDMessage">
            No such Business account has been found with BCeID. Please login
            with your Business BCeId
          </Message>
          <Message severity="error" v-if="showDisabledUserMessage">
            Disabled User - you don't have access to the system. Please contact
            Administrator for more informations.
          </Message>
          <Message severity="error" v-if="showUnknownUserMessage">
            The user was validated successfully but is not currently allowed to
            have access to this application. Please contact the Administrator
            for more information
          </Message>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { AppIDPType, ClientIdType } from "@/types";

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
  setup() {
    const { executeLogin } = useAuth();
    const login = async () => {
      await executeLogin(ClientIdType.Institution, AppIDPType.BCeID);
    };
    return { login };
  },
};
</script>
<style scoped>
.sign-in-description {
  max-width: 180px;
}
</style>
