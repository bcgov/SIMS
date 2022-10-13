<template>
  <v-card elevation="2" class="mx-auto mt-15" max-width="730px">
    <v-card-text>
      <v-row
        ><v-col cols="15"
          ><v-card-header>
            <v-col cols="12">
              <h1 class="category-header-large primary-color">
                Welcome to StudentAid BC
              </h1>
              <p class="mb-5">
                Login or sign up to submit supporting information for student
                applications.
              </p></v-col
            >
          </v-card-header>
          <content-group>
            <h3 class="category-header-medium primary-color">
              Login or sign up
            </h3>
            <p class="sign-in-description">
              Whether you are a new or returning user—login or sign up here
              using your BC Services Card.
            </p>
            <div class="pt-3 pb-2 ml-2">
              <v-row>
                <v-btn
                  color="primary"
                  @click="login"
                  prepend-icon="fa:fa fa-user"
                >
                  Login / Sign up with BCSC
                </v-btn>
              </v-row>
            </div>
          </content-group></v-col
        ><v-col cols="3"
          ><v-img
            height="260"
            class="mt-8"
            alt="An illustration of a woman working at a desk with her laptop. Illustration by Storyset."
            src="@/assets/images/happy-parent.svg" /></v-col></v-row></v-card-text
  ></v-card>
</template>

<script lang="ts">
import { useAuth } from "@/composables";
import { AppIDPType, ClientIdType } from "@/types";

export default {
  setup() {
    const { executeLogin } = useAuth();
    const login = async () => {
      await executeLogin(ClientIdType.SupportingUsers, AppIDPType.BCSC);
    };
    return { login };
  },
};
</script>
