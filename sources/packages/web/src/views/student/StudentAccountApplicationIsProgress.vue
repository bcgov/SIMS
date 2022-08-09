<template>
  <full-page-container>
    <v-row no-gutters>
      <v-col cols="8">
        <h1 class="category-header-large primary-color">Almost there!</h1>
        <p class="my-8"><strong>Identify verification in progress</strong></p>
        <p class="sign-in-description">
          StudentAid BC must verify your identity before you can proceed to
          apply for financial aid. If you have questions, please contact
          StudentAid BC for more information.
        </p>
        <v-btn
          width="220"
          color="primary"
          class="mt-8 text-decoration-none"
          href="https://studentaidbc.ca/"
          target="_blank"
        >
          Back to studentaidbc.ca
        </v-btn>
      </v-col>
      <v-col
        ><v-img
          height="240"
          class="ml-2"
          alt="A person on a chair with mobile"
          src="@/assets/images/person-chair-mobile.svg"
      /></v-col>
    </v-row>
  </full-page-container>
</template>
