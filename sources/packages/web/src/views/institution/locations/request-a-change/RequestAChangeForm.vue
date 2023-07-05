<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Request an Application Change"
        sub-title="Request a Change"
        :routeLocation="goBackRouteParams"
      />
    </template>
    <h2 class="category-header-large primary-color">Matt Damon</h2>
    <detail-header :headerMap="headerDetailsData" />
    <hr class="horizontal-divider" />
    <h2 class="category-header-large primary-color">Application Details</h2>
    <p>Review the active program and offering details below.</p>
    <content-group-info>
      <h3 class="category-header-medium primary-color">
        Practical Nursing Program
      </h3>
      <p>
        The PNA program is available for students who have completed an HCA,
        RCA, or HSRCA program. 61 week program.
      </p>
      <v-row>
        <v-col cols="12" sm="6">
          <title-value propertyTitle="Credential" propertyValue="Diploma" />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Program delivery"
            propertyValue="Blended"
          />
        </v-col>
      </v-row>
    </content-group-info>
    <content-group-info>
      <h3 class="category-header-medium primary-color">Fall 2023 - Year 1</h3>
      <v-row>
        <v-col cols="12">
          <title-value
            propertyTitle="Location"
            propertyValue="Interurban Campus"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Study intensity"
            propertyValue="Part-time"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value propertyTitle="Study delivery" propertyValue="Online" />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Study dates"
            propertyValue="Jan 21 2021 - Dec 21 2021"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Study breaks"
            propertyValue="Feb 14 2021 - Feb 17 2021"
          />
        </v-col>
      </v-row>
      <h3 class="category-header-medium primary-color mt-6">Study costs</h3>
      <v-row>
        <v-col cols="12" sm="6">
          <title-value propertyTitle="Tuition" propertyValue="$4000.00" />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Program related costs"
            propertyValue="$3000.00"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Mandatory fees"
            propertyValue="$2000.00"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <title-value
            propertyTitle="Exceptional expenses"
            propertyValue="$1000.00"
          />
        </v-col>
      </v-row>
    </content-group-info>
    <hr class="horizontal-divider" />
    <h2 class="category-header-large primary-color">Request details</h2>
    <p>
      Select a new program and offering below. This request will be shown to the
      student to allow or decline the change. If the change is allowed, the
      request will go to StudentAid BC for a final decision.
    </p>
    <v-autocomplete
      hide-details="auto"
      density="compact"
      variant="outlined"
      label="Program"
    ></v-autocomplete>
    <v-autocomplete
      hide-details="auto"
      density="compact"
      variant="outlined"
      label="Offering"
      class="mt-4"
    ></v-autocomplete>
    <v-textarea
      label="Reason for change"
      variant="outlined"
      hide-details="auto"
      class="mt-4"
    />
    <p class="mt-1 brand-gray-text">
      This note is visible to students and StudentAid BC staff.
    </p>
    <footer-buttons
      :processing="false"
      primaryLabel="Submit requested change"
      @primaryClick="submit"
      @secondaryClick="cancel"
    />
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { computed, defineComponent, ref } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";
import DetailHeader from "@/components/generic/DetailHeader.vue";

export default defineComponent({
  components: { DetailHeader },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const headerDetailsData = ref<Record<string, string>>({
      "Application #": "loading...",
      Location: "location",
    });

    const goBackRouteParams = computed(
      () =>
        ({
          name: InstitutionRoutesConst.REQUEST_CHANGE,
          params: {
            locationId: props.locationId,
          },
        } as RouteLocationRaw),
    );

    const cancel = () => {
      router.push(goBackRouteParams.value);
    };

    const submit = () => {
      console.log("submit");
    };

    return { submit, cancel, goBackRouteParams, headerDetailsData };
  },
});
</script>
