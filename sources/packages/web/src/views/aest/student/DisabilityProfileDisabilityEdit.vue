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
              >Save draft</v-btn
            >
          </template>
        </body-header>
      </template>
    </body-header-container>
    <content-group>
      <student-disability-profile-disability
        v-for="(disability, index) in disabilities"
        :key="disability.id"
        :student-id="studentId"
        :disability-model="disability"
        :max-disability-priority="disabilities.length"
        :read-only="readOnly"
        @move-up="moveDisabilityUp(index)"
        @move-down="moveDisabilityDown(index)"
        @delete-disability="deleteDisability(index)"
      />
      <v-row class="mt-2" v-if="!readOnly" justify="end">
        <v-col cols="auto">
          <v-btn
            prepend-icon="fas fa-plus"
            color="primary"
            variant="outlined"
            @click="addDisability"
            >Add new disability</v-btn
          >
        </v-col>
      </v-row>
    </content-group>
    <footer-buttons
      v-if="!readOnly"
      primary-label="Complete change"
    ></footer-buttons>
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import StudentDisabilityProfileDisability from "@/components/common/students/StudentDisabilityProfileDisability.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentDisability } from "@/types";

export default defineComponent({
  components: { StudentDisabilityProfileDisability },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup() {
    let nextId = 4;
    const disabilities = ref<StudentDisability[]>([
      {
        id: 1,
        disabilityPriority: 1,
        disabilityCategory: "",
        disabilityType: "",
        diagnosis: "",
        impairments: [],
      },
      {
        id: 2,
        disabilityPriority: 2,
        disabilityCategory: "",
        disabilityType: "",
        diagnosis: "",
        impairments: [],
      },
      {
        id: 3,
        disabilityPriority: 3,
        disabilityCategory: "",
        disabilityType: "",
        diagnosis: "",
        impairments: [],
      },
    ]);

    const addDisability = () => {
      disabilities.value.push({
        id: nextId++,
        disabilityPriority: disabilities.value.length + 1,
        disabilityCategory: "",
        disabilityType: "",
        diagnosis: "",
        impairments: [],
      });
    };

    const moveDisabilityUp = (index: number) => {
      if (index === 0) return;
      const items = disabilities.value;
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
    };

    const moveDisabilityDown = (index: number) => {
      if (index === disabilities.value.length - 1) return;
      const items = disabilities.value;
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    };

    const deleteDisability = (index: number) => {
      disabilities.value.splice(index, 1);
    };

    return {
      disabilities,
      addDisability,
      moveDisabilityUp,
      moveDisabilityDown,
      deleteDisability,
      AESTRoutesConst,
    };
  },
});
</script>
