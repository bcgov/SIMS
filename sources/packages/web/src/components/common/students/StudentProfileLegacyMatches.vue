<template>
  <template v-if="legacyProfile">
    <v-row>
      <v-col
        ><title-value
          propertyTitle="Given names"
          :propertyValue="emptyStringFiller(legacyProfile.firstName)"
        />
      </v-col>
      <v-col
        ><title-value
          propertyTitle="Last name"
          :propertyValue="legacyProfile.lastName"
        />
      </v-col>
      <v-col>
        <title-value
          propertyTitle="Date of birth"
          :propertyValue="dateOnlyLongString(legacyProfile.dateOfBirth)"
      /></v-col>
    </v-row>
    <v-row>
      <v-col
        ><title-value
          propertyTitle="SIN"
          :propertyValue="sinDisplayFormat(legacyProfile.sin)"
        />
      </v-col>
    </v-row>
    <v-row v-if="legacyProfile.hasMultipleProfiles">
      <v-col
        ><banner
          :type="BannerTypes.Warning"
          summary="The student is associated with multiple legacy profiles; the most recent update is shown."
        ></banner>
      </v-col>
    </v-row>
  </template>
  <template v-else>
    <banner
      :type="BannerTypes.Info"
      summary="The student is not currently associated with any legacy record. Please check the legacy match information to see if there are any potential matches."
    >
      <template #actions>
        <check-permission-role :role="Role.StudentLinkLegacyProfile">
          <template #="{ notAllowed }">
            <v-btn
              color="primary"
              @click="loadStudentLegacyMatches()"
              :disabled="notAllowed"
            >
              Check for legacy matches
              <v-tooltip activator="parent" location="start"
                >Click to check for potential legacy matches.</v-tooltip
              >
            </v-btn>
          </template>
        </check-permission-role></template
      >
    </banner>
    <toggle-content
      v-if="showLegacyMatches"
      :toggled="!legacyStudentMatches.length && !studentLegacyMatchesLoading"
      message="No potential legacy matches found."
    >
      <v-data-table
        :headers="StudentProfileLegacyMatchHeaders"
        :items="legacyStudentMatches"
        :loading="studentLegacyMatchesLoading"
        :items-per-page="-1"
        hide-default-footer
      >
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@3"></v-skeleton-loader>
        </template>
        <template #[`item.firstName`]="{ item }">
          {{ emptyStringFiller(item.firstName) }}
        </template>
        <template #[`item.lastName`]="{ item }">
          {{ item.lastName }}
        </template>
        <template #[`item.birthDate`]="{ item }">
          {{ dateOnlyLongString(item.birthDate) }}
        </template>
        <template #[`item.sin`]="{ item }">
          {{ sinDisplayFormat(item.sin) }}
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn
            color="primary"
            @click="showLinkProfileModal(item.individualId)"
          >
            Link
            <v-tooltip activator="parent" location="start"
              >Click to link student with this legacy profile.</v-tooltip
            >
          </v-btn>
        </template>
      </v-data-table>
    </toggle-content>
    <student-profile-legacy-matches-modal ref="legacyMatchesModal" />
  </template>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from "vue";
import { StudentService } from "@/services/StudentService";
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";
import {
  LegacyStudentMatchAPIOutDTO,
  LegacyStudentMatchesAPIInDTO,
  LegacyStudentProfileAPIOutDTO,
} from "@/services/http/dto";
import { Role, BannerTypes, StudentProfileLegacyMatchHeaders } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import StudentProfileLegacyMatchesModal from "@/components/aest/students/modals/StudentProfileLegacyMatchesModal.vue";

export default defineComponent({
  emits: {
    legacyProfileLinked: null,
  },
  components: {
    CheckPermissionRole,
    StudentProfileLegacyMatchesModal,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    legacyProfile: {
      type: Object as PropType<LegacyStudentProfileAPIOutDTO>,
      required: false,
    },
  },
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const { sinDisplayFormat, emptyStringFiller, dateOnlyLongString } =
      useFormatters();
    const legacyStudentMatches = ref<LegacyStudentMatchAPIOutDTO[]>([]);
    const studentLegacyMatchesLoading = ref(false);
    const showLegacyMatches = ref(false);
    const legacyMatchesModal = ref(
      {} as ModalDialog<LegacyStudentMatchesAPIInDTO>,
    );

    const loadStudentLegacyMatches = async (): Promise<void> => {
      studentLegacyMatchesLoading.value = true;
      showLegacyMatches.value = true;
      try {
        const legacyMatches =
          await StudentService.shared.getStudentLegacyMatches(props.studentId);
        legacyStudentMatches.value = legacyMatches.matches;
      } catch {
        snackBar.error(
          "An unexpected error happened while loading the legacy matches.",
        );
      } finally {
        studentLegacyMatchesLoading.value = false;
      }
    };

    const showLinkProfileModal = async (
      individualId: number,
    ): Promise<void> => {
      await legacyMatchesModal.value.showModal(individualId, linkLegacyProfile);
    };

    const linkLegacyProfile = async (
      payload: LegacyStudentMatchesAPIInDTO,
    ): Promise<boolean> => {
      try {
        await StudentService.shared.associateLegacyStudent(
          props.studentId,
          payload,
        );
        snackBar.success("Legacy profile linked successfully.");
        emit("legacyProfileLinked");
        return true;
      } catch {
        snackBar.error(
          "An unexpected error happened while linking the legacy profile.",
        );
      }
      return false;
    };

    return {
      sinDisplayFormat,
      dateOnlyLongString,
      emptyStringFiller,
      Role,
      BannerTypes,
      legacyStudentMatches,
      loadStudentLegacyMatches,
      studentLegacyMatchesLoading,
      StudentProfileLegacyMatchHeaders,
      showLegacyMatches,
      legacyMatchesModal,
      showLinkProfileModal,
    };
  },
});
</script>
