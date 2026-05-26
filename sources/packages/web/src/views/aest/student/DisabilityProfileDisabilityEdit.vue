<template>
  <full-page-container :full-width="false">
    <template #header>
      <header-navigator
        title="Student Disability Profile"
        sub-title="Student Disabilities"
        :route-location="{
          name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE,
          params: {
            studentId: studentId,
          },
        }"
      />
    </template>
    <body-header-container :enable-card-view="false">
      <template #header>
        <body-header
          title="Disability Profile"
          sub-title="Created by Some User on May 1, 2024, edited by Another User on June 1, 2024"
        >
          <template #actions v-if="!readOnly">
            <v-btn
              prepend-icon="fas fa-save"
              class="float-right mr-2"
              color="primary"
              variant="outlined"
              @click="saveDraft"
              >Save draft</v-btn
            >
          </template>
        </body-header>
      </template>
    </body-header-container>
    <v-form ref="disabilitiesForm">
      <content-group>
        <student-disability-disabilities
          :student-id="studentId"
          :disability-profile-id="disabilityProfileId"
          :read-only="readOnly"
          v-model="disabilities"
        />
      </content-group>
    </v-form>
    <footer-buttons
      v-if="!readOnly"
      primary-label="Complete change"
    ></footer-buttons>
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentDisability, VForm } from "@/types";

import ApiClient from "@/services/http/ApiClient";
import { SaveStudentDisabilityProfileAPIInDTO } from "@/services/http/dto";
import StudentDisabilityDisabilities from "@/components/common/students/StudentDisabilityDisabilities.vue";

export default defineComponent({
  components: { StudentDisabilityDisabilities },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    disabilityProfileId: {
      type: Number,
      required: false,
      default: undefined,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const disabilitiesForm = ref({} as VForm);
    const disabilities = ref<StudentDisability[]>([]);

    const saveDraft = async (): Promise<void> => {
      const validationResult = await disabilitiesForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      const payload: SaveStudentDisabilityProfileAPIInDTO = {
        id: props.disabilityProfileId,
        disabilities: disabilities.value.map((disability) => ({
          id: disability.id,
          disabilityPriority: disability.disabilityPriority,
          disabilityCategory: disability.disabilityCategory,
          disabilityType: disability.disabilityType,
          disabilityNotes: disability.disabilityNotes,
          diagnosis: disability.diagnosis,
          diagnosisNotes: disability.diagnosisNotes,
          impairments: disability.impairments,
          additionalNotes: disability.additionalNotes,
        })),
      };
      ApiClient.DisabilityProfileApi.saveDraftProfile(props.studentId, payload);
    };

    return {
      disabilitiesForm,
      disabilities,
      saveDraft,
      AESTRoutesConst,
    };
  },
});
</script>
