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
        :key="disability.uniqueKey"
        :student-id="studentId"
        v-model="disabilities[index]"
        :max-disability-priority="disabilities.length"
        :read-only="readOnly"
        @move-up="moveDisability(index, 'up')"
        @move-down="moveDisability(index, 'down')"
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
    /**
     * Used as a stable Vue component key, independent of the server-assigned id.
     * Allow swapping and deleting disabilities without losing component state or causing rendering issues,
     * even for disabilities that haven't been saved to the server yet (and thus don't have an id).
     */
    let nextUniqueKey = 1;
    const disabilities = ref<StudentDisability[]>([
      {
        uniqueKey: nextUniqueKey++,
        id: 1,
        disabilityPriority: 1,
        disabilityCategory: "",
        disabilityType: "",
        diagnosis: "",
        impairments: [],
      },
      {
        uniqueKey: nextUniqueKey++,
        id: 2,
        disabilityPriority: 2,
        disabilityCategory: "",
        disabilityType: "",
        diagnosis: "",
        impairments: [],
      },
    ]);

    /**
     * Create a new disability with default values and add it to the list.
     */
    const addDisability = (): void => {
      const newDisability: StudentDisability = {
        uniqueKey: nextUniqueKey++,
        id: undefined,
        disabilityPriority: disabilities.value.length + 1,
        disabilityCategory: "",
        disabilityType: "",
        diagnosis: "",
        impairments: [],
      };
      disabilities.value.push(newDisability);
    };

    /**
     * After moving a disability up or down, we need to normalize the priorities so that
     * they are in sequential order starting from 1. This ensures that the disability priorities
     * remain consistent and accurate after any reordering operations, allowing the components
     * to adjust their available actions (e.g., "move up", "move down") based on the updated priorities.
     */
    const normalizePriorities = () => {
      disabilities.value.forEach((disability, index) => {
        disability.disabilityPriority = index + 1;
      });
    };

    /**
     * Swaps the disability at the given index with the one above it, then normalizes priorities.
     * @param index the index of the disability to move.
     * @param direction The direction to move the disability ("up" or "down").
     */
    const moveDisability = (index: number, direction: "up" | "down"): void => {
      const items = disabilities.value;
      const targetIndex = index + (direction === "up" ? -1 : 1);
      [items[targetIndex], items[index]] = [items[index], items[targetIndex]];
      normalizePriorities();
    };

    /**
     * Removes a disability from the list based on its index, then normalizes priorities.
     * @param index the index of the disability to remove.
     */
    const deleteDisability = (index: number): void => {
      disabilities.value.splice(index, 1);
      normalizePriorities();
    };

    return {
      disabilities,
      addDisability,
      moveDisability,
      deleteDisability,
      AESTRoutesConst,
    };
  },
});
</script>
