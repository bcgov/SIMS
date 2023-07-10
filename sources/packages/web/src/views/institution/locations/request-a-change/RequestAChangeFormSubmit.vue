<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Request an Application Change"
        sub-title="Request a Change"
        :routeLocation="goBackRouteParams"
      />
    </template>
    <request-a-change-form
      :offeringId="activeOfferingId"
      :locationId="locationId"
      :studentName="studentName"
      :applicationNumber="applicationNumber"
    >
      <v-form ref="requestAChangeForm">
        <v-autocomplete
          hide-details="auto"
          density="compact"
          variant="outlined"
          label="Program"
          :items="programs"
          item-title="description"
          item-value="id"
          v-model="selectedProgram"
          @update:modelValue="selectedProgramChanged"
          :rules="[(v: string) => checkNullOrEmptyRule(v, 'Program')]"
        ></v-autocomplete>
        <v-autocomplete
          hide-details="auto"
          density="compact"
          variant="outlined"
          label="Offering"
          class="mt-4"
          :items="offerings"
          item-title="description"
          item-value="id"
          v-model="selectedOffering"
          :rules="[(v:string) => checkNullOrEmptyRule(v, 'Offering')]"
        ></v-autocomplete>
        <v-textarea
          label="Reason for change"
          variant="outlined"
          hide-details="auto"
          class="mt-4"
          :rules="[(v:string) => checkLengthRule(v, 500, 'Reason for change')]"
        />
        <p class="mt-1 brand-gray-text">
          This note is visible to students and StudentAid BC staff.
        </p>
      </v-form>
      <footer-buttons
        :processing="false"
        primaryLabel="Submit requested change"
        @primaryClick="submit"
        @secondaryClick="cancel"
      />
    </request-a-change-form>
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { computed, defineComponent, onMounted, ref } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";
import RequestAChangeForm from "./RequestAChangeForm.vue";
import {
  ApplicationOfferingChangeSummaryDetailAPIOutDTO,
  ApplicationOfferingChangesAPIOutDTO,
  OptionItemAPIOutDTO,
} from "@/services/http/dto";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import { VForm } from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { useRules } from "@/composables";

export default defineComponent({
  components: { RequestAChangeForm },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const { checkNullOrEmptyRule, checkLengthRule } = useRules();
    // Readonly data.
    let application: ApplicationOfferingChangeSummaryDetailAPIOutDTO;
    const studentName = ref("");
    const applicationNumber = ref("");
    const requestChangeData = ref({} as ApplicationOfferingChangesAPIOutDTO);
    const activeOfferingId = ref<number>();
    // Vue form data.
    const requestAChangeForm = ref({} as VForm);
    // Programs dropdown.
    const programs = ref([] as OptionItemAPIOutDTO[]);
    const selectedProgram = ref<number>();
    // Offerings dropdown.
    const offerings = ref([] as OptionItemAPIOutDTO[]);
    const selectedOffering = ref<number>();

    onMounted(async () => {
      application =
        await ApplicationOfferingChangeRequestService.shared.getEligibleApplication(
          props.locationId,
          props.applicationId,
        );
      studentName.value = application.fullName;
      applicationNumber.value = application.applicationNumber;
      activeOfferingId.value = application.offeringId;
      programs.value =
        await EducationProgramService.shared.getProgramsListForInstitutions();
      selectedProgram.value = application.programId;
      await selectedProgramChanged();
    });

    const selectedProgramChanged = async () => {
      if (selectedProgram.value) {
        offerings.value =
          await EducationProgramOfferingService.shared.getProgramOfferingsOptionsList(
            props.locationId,
            +selectedProgram.value,
            application.programYearId,
            application.offeringIntensity,
            true,
          );
        if (offerings.value.length) {
          return;
        }
      }
      offerings.value = [];
      selectedOffering.value = undefined;
    };

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
      requestAChangeForm.value.reset();
      router.push(goBackRouteParams.value);
    };

    const submit = async () => {
      const validationResult = await requestAChangeForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      // Do submit.
      requestAChangeForm.value.reset();
    };

    return {
      requestChangeData,
      studentName,
      applicationNumber,
      submit,
      cancel,
      goBackRouteParams,
      activeOfferingId,
      programs,
      selectedProgram,
      selectedProgramChanged,
      offerings,
      selectedOffering,
      requestAChangeForm,
      checkNullOrEmptyRule,
      checkLengthRule,
    };
  },
});
</script>
