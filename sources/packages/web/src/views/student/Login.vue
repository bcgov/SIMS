<template>
  <v-card elevation="2" class="mx-auto mt-12" max-width="670px" outlined>
    <v-card-text>
      <v-row no-gutters>
        <v-col cols="9">
          <h1 class="category-header-large primary-color">
            Welcome to StudentAid BC
          </h1>
          <p class="mb-5">
            Access your student account to apply for financial aid.
          </p>
          <content-group>
            <v-row>
              <v-col>
                <h2 class="category-header-medium primary-color">
                  Login or sign up
                </h2>
                <p class="sign-in-description">
                  Whether you are a new or returning user—login or sign up using
                  your BC Services Card.
                </p>
                <v-btn
                  color="primary"
                  @click="login(IdentityProviders.BCSC)"
                  prepend-icon="fa:fa fa-user"
                >
                  Login / Sign up with BCSC
                </v-btn>
              </v-col>
            </v-row>
          </content-group>
        </v-col>
        <v-col
          ><v-img
            height="260"
            class="ml-2"
            alt="Happy student waving"
            src="@/assets/images/happy-student.svg"
        /></v-col>
      </v-row>
    </v-card-text>
  </v-card>
  <v-card elevation="2" class="mx-auto mt-6" max-width="670px" outlined>
    <v-card-text>
      <h2 class="category-header-medium primary-color">
        Frequently asked questions
      </h2>
      <v-expansion-panels>
        <v-expansion-panel
          collapse-icon="$expanderCollapseIcon"
          expand-icon="$expanderExpandIcon"
          title="I have a BC Services Card. How can I use it to login?"
        >
          <v-expansion-panel-text
            >Using your BC Services Card to login to StudentAid BC is quick and
            easy. Click on the login button above and follow the steps. For more
            information, please visit
            <a
              rel="noopener"
              target="_blank"
              href="https://id.gov.bc.ca/account/"
              >BC Services Card website</a
            >.</v-expansion-panel-text
          >
        </v-expansion-panel>
        <v-expansion-panel
          collapse-icon="$expanderCollapseIcon"
          expand-icon="$expanderExpandIcon"
          title="I don't have a BC Services Card. How can I get one?"
        >
          <v-expansion-panel-text
            >There are a few ways you can get a BC Services Card. Learn how to
            get a BC Services Card on the
            <a
              rel="noopener"
              target="_blank"
              href="https://www2.gov.bc.ca/gov/content/governments/government-id/bc-services-card/your-card/get-a-card"
              >BC Government website</a
            >.</v-expansion-panel-text
          >
        </v-expansion-panel>
        <v-expansion-panel
          collapse-icon="$expanderCollapseIcon"
          expand-icon="$expanderExpandIcon"
          title="I can't get a BC Services Card. What can I do?"
        >
          <v-expansion-panel-text
            ><p>
              Using the BC Services Card is the quickest and easiest way to
              apply for financial aid. However, we understand not everyone is
              able to get a BC Services Card. Please follow the steps below to
              request an alternate way to login.
            </p>
            <p>
              <strong>What you need to do</strong>
            </p>
            <p>
              Step 1: Please email a request to StudentAidBC@gov.bc.ca. You will
              receive further instructions to confirm your identity and how to
              apply for financial aid.
            </p>
            <p>
              Step 2: After your identity is verified, you will be instructed to
              create a Basic BCeID account. Click on the button below to access
              the BCeID registration page.
            </p>
            <p>
              Step 3: Login using your Basic BCeID to complete your StudentAid
              BC account registration. Click on the button below to login.
            </p>
            <v-btn
              color="primary"
              @click="login(IdentityProviders.BCeIDBoth)"
              prepend-icon="fa:fa fa-user"
            >
              Login / Sign up with Basic BCeID
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel
          collapse-icon="$expanderCollapseIcon"
          expand-icon="$expanderExpandIcon"
          title="I have a Basic BCeID account. How can I upgrade my account to use a
            BC Services Card instead?"
        >
          <v-expansion-panel-text
            >When you login using your BC Services Card, your Basic BCeID
            account will be disabled and you can begin using your BC Services
            Card.</v-expansion-panel-text
          >
        </v-expansion-panel>
      </v-expansion-panels>
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
    const login = async (idp: IdentityProviders) => {
      await executeLogin(ClientIdType.Student, idp);
    };
    return { IdentityProviders, login };
  },
});
</script>
