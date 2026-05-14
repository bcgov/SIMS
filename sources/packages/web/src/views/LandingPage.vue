<template>
  <v-app-bar color="white">
    <b-c-logo subtitle="Student &amp; Institution Accounts" />
  </v-app-bar>
  <v-main>
    <v-container class="container-max-width mx-auto mt-10">
      <!-- For Students -->
      <v-card elevation="2" class="mb-6">
        <v-card-text>
          <h1
            class="category-header-large primary-color mb-6 text-center text-md-left"
          >
            For Students
          </h1>

          <!-- New Student Account row -->
          <v-row align="center" class="mb-4">
            <v-col cols="12" md="2" class="d-flex justify-center">
              <v-img
                height="100"
                width="100"
                alt="An illustration of a student."
                src="@/assets/images/image_student_welcome.svg"
              />
            </v-col>
            <v-col cols="12" md="7" class="text-center text-md-left">
              <p class="category-header-medium mb-2">New Student Account</p>
              <p class="mb-4">
                <strong>If applying after June 19, 2026</strong>, use the new
                Student Account and Application system to create and manage your
                student aid applications.
              </p>
              <div class="d-flex justify-center justify-md-start">
                <v-btn color="primary" href="/student/login">
                  Access New Student Account
                </v-btn>
              </div>
            </v-col>
            <v-col cols="12" md="3" />
          </v-row>

          <v-divider class="mb-4" />

          <!-- Old Student Dashboard row -->
          <v-row align="start">
            <v-col cols="12" md="2" class="d-flex justify-center">
              <v-img
                height="100"
                width="100"
                alt="An illustration of a student with a book."
                src="@/assets/images/girl-on-book.svg"
              />
            </v-col>
            <v-col cols="12" md="6" class="text-center text-md-left">
              <p class="category-header-medium mb-2">
                Old Student Dashboard Account
              </p>
              <p class="mb-4">
                <strong
                  >If you applied for full-time student aid before June 19,
                  2026</strong
                >, access your dashboard and manage your application(s).
              </p>
              <div class="d-flex justify-center justify-md-start">
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
            <v-col
              cols="12"
              md="4"
              class="d-flex align-center justify-center justify-md-start"
            >
              <v-chip
                class="font-weight-regular text-no-wrap"
                color="warning"
                variant="outlined"
                size="small"
                prepend-icon="fa:fa fa-circle-exclamation"
              >
                Not available to submit new applications
              </v-chip>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- For Institutions -->
      <v-card elevation="2">
        <v-card-text>
          <h1
            class="category-header-large primary-color mb-6 text-center text-md-left"
          >
            For Institutions
          </h1>

          <v-row align="center">
            <v-col cols="12" md="2" class="d-flex justify-center">
              <v-img
                height="100"
                width="100"
                alt="An illustration of an institution building."
                src="@/assets/images/image_institution_welcome.svg"
              />
            </v-col>
            <v-col cols="12" md="7" class="text-center text-md-left">
              <p class="category-header-medium mb-2">Institution Account</p>
              <p class="mb-4">
                Create and manage your institution account using your Business
                or Basic BCeID User ID.
              </p>
              <div class="d-flex justify-center justify-md-start">
                <v-btn color="primary" href="/institution/login">
                  Access Institution Account
                </v-btn>
              </div>
            </v-col>
            <v-col cols="12" md="3" />
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import BCLogo from "@/components/generic/BCLogo.vue";
// Landing page shown to unauthenticated users at the root URL, allowing them
// to navigate to the appropriate login for their role (student or institution).
</script>
