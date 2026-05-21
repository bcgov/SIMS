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
  </body-header-container>
  <student-disability-profile-disability
    :student-id="studentId"
    :disability-priority="1"
    :max-disability-priority="2"
  />
  <student-disability-profile-disability
    :student-id="studentId"
    :disability-priority="2"
    :max-disability-priority="2"
  />
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
