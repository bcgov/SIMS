<template>
  <full-page-container layout-template="centered-card" :enable-max-width="true">
    <v-row
      ><v-col cols="15"
        ><v-card-header>
          <v-col cols="12">
            <h1 class="category-header-large primary-color">Welcome to AEST</h1>
            <p class="mb-5">
              In order to successfully login—you must be previously authorized
              by the system administrator. Please use your IDIR to authenticate.
            </p></v-col
          >
        </v-card-header>
        <content-group>
          <h3 class="category-header-medium primary-color">
            Login for ministry staff
          </h3>
          <p class="sign-in-description">
            With authorization from the system administrator, login here using
            your IDIR to access the AEST portal.
          </p>

          <p class="sign-in-description">
            <banner
              class="mt-2"
              :type="BannerTypes.Error"
              v-if="showNotAllowedUser"
              summary="The user was validated successfully but is not currently allowed to
        have access to this application. Please contact the Administrator for
        more information."
            />
            <!-- TODO: v-btn inside v-card-actions is not working properly. try in vuetify 3 stable version -->
          </p>

          <div class="pt-3 pb-2 ml-2">
            <v-row>
              <v-btn
                color="primary"
                data-cy="loginWithIDIR"
                @click="login"
                prepend-icon="fa:fa fa-user"
              >
                Login with IDIR
              </v-btn>
            </v-row>
          </div>
        </content-group></v-col
      ><v-col cols="3"
        ><v-img
          height="260"
          class="mt-8"
          alt="A person entering their login information into a digital screen.."
          src="@/assets/images/person-seeing-screen.svg" /></v-col
    ></v-row>
  </full-page-container>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { AppIDPType, ClientIdType } from "@/types";
import { BannerTypes } from "@/types/contracts/Banner";

export default {
  props: {
    showNotAllowedUser: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup() {
    const { executeLogin } = useAuth();
    const login = async () => {
      await executeLogin(ClientIdType.AEST, AppIDPType.IDIR);
    };
    return { login, BannerTypes };
  },
};
</script>
