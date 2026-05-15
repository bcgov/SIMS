<template>
  <div>
    <v-app-bar color="white">
      <b-c-logo subtitle="Student &amp; Institution Accounts" />
    </v-app-bar>
    <v-main>
      <v-container class="landing-page-container-size mx-auto mt-6">
        <!-- For Students -->
        <v-card class="p-4 mb-4">
          <h1
            class="category-header-large primary-color mb-4 text-center text-sm-left"
          >
            For Students
          </h1>

          <!-- New Student Account -->
          <v-card hover>
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" sm="2" class="d-flex justify-center">
                  <v-img
                    height="100"
                    width="100"
                    alt="An illustration of a student."
                    src="@/assets/images/image_student_welcome.svg"
                  />
                </v-col>
                <v-col cols="12" sm="10" class="text-center text-sm-left">
                  <p class="category-header-medium mb-2">New Student Account</p>
                  <p class="mb-4">
                    <strong>If applying after June 19, 2026</strong>, use the
                    new Student Account and Application system to create and
                    manage your student aid applications.
                  </p>
                  <div class="d-flex justify-center justify-sm-start">
                    <v-btn color="primary" href="/student/login">
                      Access New Student Account
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-divider class="my-8" />
          <!-- Old Student Dashboard -->
          <v-card hover>
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" sm="2" class="d-flex justify-center">
                  <v-img
                    height="100"
                    width="100"
                    alt="An illustration of a student with a book."
                    src="@/assets/images/girl-on-book.svg"
                  />
                </v-col>
                <v-col cols="12" sm="10" class="text-center text-sm-left">
                  <p class="category-header-medium mb-2">
                    Old Student Dashboard Account
                  </p>
                  <p class="mb-4">
                    <strong
                      >If you applied for full-time student aid before June 19,
                      2026</strong
                    >, access your dashboard and manage your application(s).
                  </p>
                  <div class="d-flex justify-center justify-sm-start mb-4">
                    <v-chip
                      class="font-weight-regular text-no-wrap"
                      color="warning"
                      variant="tonal"
                      size="small"
                      label
                      prepend-icon="fa:fa fa-circle-exclamation"
                    >
                      Not available to submit new applications
                    </v-chip>
                  </div>
                  <div class="d-flex justify-center justify-sm-start">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      href="https://studentaidbc.ca/dashboard/login"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Access Old Dashboard Account
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card>

        <!-- For Institutions -->

        <v-card class="p-4">
          <h1
            class="category-header-large primary-color mb-4 text-center text-sm-left"
          >
            For Institutions
          </h1>

          <!-- Institution Account -->
          <v-card hover>
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" sm="2" class="d-flex justify-center">
                  <v-img
                    height="100"
                    width="100"
                    alt="An illustration of an institution building."
                    src="@/assets/images/image_institution_welcome.svg"
                  />
                </v-col>
                <v-col cols="12" sm="10" class="text-center text-sm-left">
                  <p class="category-header-medium mb-2">Institution Account</p>
                  <p class="mb-4">
                    Create and manage your institution account using your
                    Business or Basic BCeID User ID.
                  </p>
                  <div class="d-flex justify-center justify-sm-start">
                    <v-btn color="primary" href="/institution/login">
                      Access Institution Account
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card>
      </v-container>
    </v-main>
  </div>
</template>

<script setup lang="ts">
/**
 * Landing page shown to unauthenticated users at the root URL, allowing them
 * to navigate to the appropriate login for their role (student or institution).
 */
import BCLogo from "@/components/generic/BCLogo.vue";
</script>
