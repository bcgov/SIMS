<template>
  <v-card elevation="2" class="mx-auto mt-15" max-width="730px">
    <v-card-text>
      <v-row class="pt-2 pb-4 px-2">
        <v-col cols="9">
          <v-card-text class="pa-0">
            <h1 class="category-header-large primary-color">
              Welcome to StudentAid BC
            </h1>
            <p class="mb-5">
              We help with the cost of post-secondary education through student
              loans, grants, and other financial assistance programs.
            </p>
          </v-card-text>
          <content-group>
            <h2 class="category-header-medium primary-color">
              Log in or Register
            </h2>
            <p class="sign-in-description">
              Whether you are a new or returning user—log in or register using
              the BC Services Card account.
            </p>
            <div class="pb-2">
              <v-btn
                color="primary"
                @click="login"
                prepend-icon="fa:fa fa-user"
              >
                Log in/Register
              </v-btn>
            </div>
          </content-group>
        </v-col>
        <v-col cols="3" align-self="end">
          <v-img
            height="260"
            class="mt-8 mb-n6"
            alt="An illustration of a woman working at a desk with her laptop. Illustration by Storyset."
            src="@/assets/images/happy-parent.svg"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useAuth } from "@/composables";
import { IdentityProviders, ClientIdType } from "@/types";

export default defineComponent({
  setup() {
    const { executeLogin } = useAuth();
    const login = async () => {
      await executeLogin(ClientIdType.SupportingUsers, IdentityProviders.BCSC);
    };
    return { login };
  },
});
</script>
