<template>
  <shared-login
    title="Welcome to StudentAid BC"
    subtitle="Access your student account to apply for student financial assistance."
    login-area-title="Log in or Register"
    login-area-text="Whether you are a new or returning user—log in or register using the BC Services Card account."
    login-area-button="Log in/Register"
    @login="login(IdentityProviders.BCSC)"
  >
    <template #image>
      <v-img
        max-height="250"
        class="ml-2"
        alt="Happy student waving"
        src="@/assets/images/happy-student.svg"
      />
    </template>
  </shared-login>
  <v-card elevation="2" class="mx-auto mt-6" max-width="670px" outlined>
    <v-card-text>
      <h2 class="category-header-medium primary-color mb-2">
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
              class="mt-2"
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

<script setup lang="ts">
import { useAuth } from "@/composables";
import { IdentityProviders, ClientIdType } from "@/types";
import { AuditService } from "@/services/AuditService";
import SharedLogin from "@/components/common/SharedLogin.vue";

const { executeLogin } = useAuth();
const login = async (idp: IdentityProviders) => {
  AuditService.userLoginTriggered();
  await executeLogin(ClientIdType.Student, idp);
};
</script>
