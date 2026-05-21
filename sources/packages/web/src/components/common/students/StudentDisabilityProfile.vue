<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header
        title="Disability Profile"
        sub-title="Current version created by Some User on May 1, 2024"
      >
        <template #actions>
          <v-btn class="float-right" color="primary" @click="editProfile"
            >Edit current version</v-btn
          >
        </template>
      </body-header>
      <banner
        class="mb-2"
        type="warning"
        header="Draft in progress"
        summary="A draft version exists for this disability profile. The draft can be converted to the current version or deleted, if no longer needed."
      >
        <template #actions>
          <v-btn color="danger" class="mr-2">Delete draft</v-btn>
          <v-btn color="primary">View draft</v-btn>
        </template>
      </banner>
    </template>
    <content-group>
      <v-row dense>
        <v-col cols="12">
          <h4 class="category-header-medium brand-gray-text mb-0">
            Disability details
          </h4>
          <v-divider></v-divider>
        </v-col>
        <v-col cols="6">
          <v-select
            v-model="selectedDisabilityCategory"
            :items="disabilityCategoryOptions"
            label="Disability category"
            item-title="text"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6">
          <v-select
            v-model="selectedDisabilityType"
            :items="disabilityTypeOptions"
            label="Disability type"
            item-title="text"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12"
          ><v-textarea
            label="Disability details notes"
            variant="outlined"
            rows="3"
            hide-details
        /></v-col>
      </v-row>
      <v-row dense>
        <v-col cols="12"
          ><h4 class="category-header-medium brand-gray-text mb-0 mt-4">
            Diagnosis
          </h4>
          <v-divider></v-divider
        ></v-col>
        <v-col cols="12"
          ><v-text-field
            v-model="diagnosisText"
            label="Diagnosis information"
            placeholder="Enter diagnosis details..."
            density="compact"
            variant="outlined"
            hide-details
        /></v-col>
        <v-col cols="12"
          ><v-textarea
            label="Diagnosis notes"
            variant="outlined"
            rows="3"
            hide-details
        /></v-col>
      </v-row>
      <v-row dense>
        <v-col cols="12">
          <h4 class="category-header-medium brand-gray-text mb-0 mt-4">
            Impairments
          </h4>
          <v-divider />
        </v-col>
        <v-col>
          <ul>
            <li>Difficulty with vision</li>
            <li>Difficulty with hearing</li>
            <li>Difficulty with manual dexterity</li>
            <li>Difficulty with speaking</li>
            <li>Difficulty with ascending/descending stairs</li>
            <li>Difficulty walking short distances</li>
            <li>Difficulty walking long distances</li>
            <li>Difficulty using public transportation</li>
          </ul>
        </v-col>
        <v-col cols="12"
          >Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type and
          scrambled it to make a type specimen book. It has survived not only
          five centuries, but also the leap into electronic typesetting,
          remaining essentially unchanged. It was popularised in the 1960s with
          the release of Letraset sheets containing Lorem Ipsum passages, and
          more recently with desktop publishing software like Aldus PageMaker
          including versions of Lorem Ipsum.</v-col
        >
      </v-row>
      <v-row dense>
        <v-col cols="12">
          <h4 class="category-header-medium brand-gray-text mb-0 mt-4">
            Additional notes
          </h4>
          <v-divider />
        </v-col>
        <v-col cols="12"
          ><v-textarea label="Notes" variant="outlined" rows="3" hide-details
        /></v-col>
      </v-row>
    </content-group>
  </body-header-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import StudentDisabilityProfileDisability from "@/components/common/students/StudentDisabilityProfileDisability.vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  components: { StudentDisabilityProfileDisability },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const hasSecondaryDisability = ref(false);
    const router = useRouter();

    const onSecondaryDisabilityChanged = (value: boolean) => {
      hasSecondaryDisability.value = value;
    };

    const editProfile = () => {
      router.push({
        name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE_DISABILITY_EDIT,
        params: {
          studentId: props.studentId,
        },
      });
    };

    return {
      hasSecondaryDisability,
      onSecondaryDisabilityChanged,
      editProfile,
    };
  },
});
</script>
