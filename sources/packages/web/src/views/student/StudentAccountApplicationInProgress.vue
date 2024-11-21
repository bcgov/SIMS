<template>
  <student-page-container>
    <v-row no-gutters>
      <v-col cols="8">
        <h1 class="category-header-large primary-color">Almost there!</h1>
        <p class="my-6"><strong>Identify verification in progress</strong></p>
        <p class="sign-in-description">
          StudentAid BC must verify your identity before you can proceed to
          apply for financial aid. If you have questions, please contact
          StudentAid BC for more information.
        </p>
        <v-btn
          color="primary"
          class="mt-2 text-decoration-none float-left"
          href="https://studentaidbc.ca/"
          rel="noopener"
        >
          Back to studentaidbc.ca
        </v-btn>
      </v-col>
      <v-col
        ><v-img
          height="240"
          class="ml-2"
          alt="An illustration of a women checking her phone. Illustration by Storyset."
          src="@/assets/images/person-chair-mobile.svg"
      /></v-col>
    </v-row>
  </student-page-container>
</template>
