<template>
  <v-card elevation="2" class="mx-auto mt-12" max-width="670px" outlined>
    <v-card-text>
      <v-row no-gutters>
        <v-col cols="9">
          <h1 class="category-header-large primary-color">
            Welcome to StudentAid BC
          </h1>
          <p class="mb-5">
            Access your student account to apply for student financial
            assistance.
          </p>
          <content-group>
            <v-row>
              <v-col>
                <h2 class="category-header-medium primary-color">
                  Log in or Register
                </h2>
                <p class="sign-in-description">
                  Whether you are a new or returning user—log in or register
                  using the BC Services Card account.
                </p>
                <banner
                  v-if="errorMessage"
                  class="mb-2 mt-n3"
                  :type="BannerTypes.Error"
                  :summary="errorMessage"
                />
                <v-btn
                  color="primary"
                  @click="login(IdentityProviders.BCSC)"
                  prepend-icon="fa:fa fa-user"
                >
                  Log in/Register
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
          title="I have a BC Services Card account. How can I use it to log in?"
        >
          <v-expansion-panel-text
            >Using your BC Services Card account to log in to StudentAid BC is
            quick and easy. Click on the login button above and follow the
            steps. For more information, please visit
            <a
              rel="noopener"
              target="_blank"
              href="https://id.gov.bc.ca/account/"
              >BC Services Card account website</a
            >.</v-expansion-panel-text
          >
        </v-expansion-panel>
        <v-expansion-panel
          collapse-icon="$expanderCollapseIcon"
          expand-icon="$expanderExpandIcon"
          title="I don't have a BC Services Card account. How can I get one?"
        >
          <v-expansion-panel-text
            >Learn how to get a BC Services Card account on the
            <a
              rel="noopener"
              target="_blank"
              href="https://id.gov.bc.ca/account/"
              >BC Services Card account website</a
            >.</v-expansion-panel-text
          >
        </v-expansion-panel>
        <v-expansion-panel
          collapse-icon="$expanderCollapseIcon"
          expand-icon="$expanderExpandIcon"
          title="I am not eligible for a BC Services Card account. What can I do?"
        >
          <v-expansion-panel-text
            ><p>
              Using the BC Services Card account is the easiest, most secure way
              to apply for student financial aid. However, we understand not
              everyone is eligible for the BC Services Card account. Please
              follow the steps below to inquire about alternate login options.
            </p>
            <p>
              <strong>What you need to do:</strong>
            </p>
            <p>
              Please email a request to
              <a
                href="mailto:StudentAidBC@gov.bc.ca"
                rel="noopener"
                target="_blank"
                >StudentAidBC@gov.bc.ca</a
              >
              and provide a detailed explanation why you are not eligible for a
              BC Services Card account. StudentAid BC will review your request
              and provide further instructions via email.
            </p>
            <v-btn
              color="primary"
              @click="login(IdentityProviders.BCeIDBoth)"
              prepend-icon="fa:fa fa-user"
            >
              Log in/Register with Basic BCeID
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel
          collapse-icon="$expanderCollapseIcon"
          expand-icon="$expanderExpandIcon"
          title="I have a Basic BCeID account. How can I upgrade to use the BC Services Card account?"
        >
          <v-expansion-panel-text
            >Simply log in using your BC Services Card account. Once you
            successfully log in with your BC Services Card account, your Basic
            BCeID account will be disabled.</v-expansion-panel-text
          >
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useAuth } from "@/composables";
import { IdentityProviders, ClientIdType } from "@/types";
import { BannerTypes } from "@/types/contracts/Banner";
import { USER_LOGIN_TRIGGERED } from "@/constants";

export default defineComponent({
  props: {
    showInvalidBetaUserMessage: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    sessionStorage.setItem(USER_LOGIN_TRIGGERED, "true");
    const { executeLogin } = useAuth();
    const login = async (idp: IdentityProviders) => {
      await executeLogin(ClientIdType.Student, idp);
    };
    const errorMessage = computed(() => {
      if (props.showInvalidBetaUserMessage) {
        return "Unable to login as the system is not yet available.";
      }
      return false;
    });
    return { IdentityProviders, login, errorMessage, BannerTypes };
  },
});
</script>
