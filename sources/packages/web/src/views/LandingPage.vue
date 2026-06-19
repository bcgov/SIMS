<template>
  <div>
    <v-app-bar color="white">
      <b-c-logo subtitle="Student &amp; Institution Accounts" />
    </v-app-bar>
    <v-main>
      <v-container class="landing-page-container-size mx-auto mt-6">
        <!-- For Students -->
        <body-header-container title="For Students" :enable-card-view="true"
          ><v-card flat border="1" href="/student/login">
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="3" class="d-flex justify-center">
                  <v-img
                    min-height="150"
                    width="150"
                    height="150"
                    alt="An illustration of a student."
                    src="@/assets/images/image_student_welcome.svg"
                  />
                </v-col>
                <v-col cols="12" sm="9" class="text-center text-sm-start">
                  <p class="category-header-medium mb-2">New Student Account</p>
                  <p class="mb-4">
                    <strong>If applying after June 19, 2026</strong>, use the
                    new Student Account and Application system to create and
                    manage your student aid applications.
                  </p>
                  <div>
                    <v-btn color="primary"> Access New Student Account </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <v-divider class="my-8" />
          <!-- Old Student Dashboard -->
          <v-card
            flat
            border="1"
            href="https://studentaidbc.ca/dashboard/login"
            target="_blank"
            rel="noopener noreferrer"
          >
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" sm="3" class="d-flex justify-center">
                  <v-img
                    min-height="150"
                    min-width="150"
                    height="150"
                    width="150"
                    alt="An illustration of a student with a book."
                    src="@/assets/images/girl-on-book.svg"
                  />
                </v-col>
                <v-col cols="12" sm="9" class="text-center text-sm-start">
                  <p class="category-header-medium mb-2">
                    Old Student Dashboard Account
                  </p>
                  <p class="mb-4">
                    <strong
                      >If you applied for full-time student aid before June 19,
                      2026</strong
                    >, access your dashboard and manage your application(s).
                  </p>
                  <div class="mb-4">
                    <v-chip
                      border="1"
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
                  <div>
                    <v-btn color="primary" variant="outlined">
                      Access Old Dashboard Account
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </body-header-container>
        <!-- For Institutions -->
        <body-header-container
          title="For Institutions"
          :enable-card-view="true"
        >
          <v-card border="1" flat href="/institution/login">
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" sm="3" class="d-flex justify-center">
                  <v-img
                    min-height="150"
                    min-width="150"
                    height="150"
                    width="150"
                    alt="An illustration of an institution building."
                    src="@/assets/images/image_institution_welcome.svg"
                  />
                </v-col>
                <v-col cols="12" sm="9" class="text-center text-sm-start">
                  <p class="category-header-medium mb-2">Institution Account</p>
                  <p class="mb-4">
                    Create and manage your institution account using your
                    Business or Basic BCeID User ID.
                  </p>
                  <div>
                    <v-btn color="primary"> Access Institution Account </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </body-header-container>
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
