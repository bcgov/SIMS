<template>
  <body-header-container>
    <template #header>
      <body-header title="Profile">
        <template #actions v-if="canEditProfile">
          <check-permission-role :role="Role.StudentEditProfile">
            <template #="{ notAllowed }">
              <v-btn
                @click="editStudentProfile"
                class="float-right"
                color="primary"
                prepend-icon="fa:fa fa-edit"
                :disabled="notAllowed"
                >Edit Profile</v-btn
              >
            </template>
          </check-permission-role>
        </template>
      </body-header>
    </template>
    <h3 class="category-header-medium">Student profile</h3>
    <content-group>
      <v-row>
        <v-col
          ><title-value
            property-title="Given names"
            :property-value="emptyStringFiller(studentDetail.firstName)"
          />
        </v-col>
        <v-col
          ><title-value
            property-title="Last name"
            :property-value="studentDetail.lastName"
          />
        </v-col>
        <v-col>
          <title-value
            property-title="Date of birth"
            :property-value="studentDetail.birthDateFormatted"
        /></v-col>
      </v-row>
      <v-row>
        <v-col
          ><title-value
            property-title="Gender"
            :property-value="genderDisplayFormat(studentDetail.gender)"
          />
        </v-col>
        <v-col
          ><title-value
            property-title="Email"
            :property-value="studentDetail.email"
          />
        </v-col>
        <v-col>
          <disability-status-update-tile-value
            :student-id="studentId"
            :allow-disability-status-update="allowUpdateActions"
            :disability-status="studentDetail.disabilityStatus"
            @disability-status-updated="loadStudentProfile"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <modified-independent-status-title-value
            :student-id="studentId"
            :modified-independent-status="
              studentDetail.modifiedIndependentStatus
            "
            :allow-update-actions="allowUpdateActions"
          />
        </v-col>
        <v-col cols="8"
          ><title-value
            property-title="SIN"
            :property-value="sinDisplayFormat(studentDetail.sin)"
        /></v-col>
      </v-row>
    </content-group>
    <h3 class="category-header-medium mt-4">Contact information</h3>
    <content-group
      ><v-row>
        <v-col
          ><title-value
            property-title="Address line 1"
            :property-value="address.addressLine1"
          />
        </v-col>
        <v-col
          ><title-value
            property-title="Address line 2"
            :property-value="emptyStringFiller(address.addressLine2)"
          />
        </v-col>
        <v-col>
          <title-value property-title="City" :property-value="address.city"
        /></v-col>
      </v-row>
      <v-row>
        <v-col
          ><title-value
            property-title="Province"
            :property-value="address.provinceState"
          />
        </v-col>
        <v-col
          ><title-value
            property-title="Postal/Zip Code"
            :property-value="address.postalCode"
          />
        </v-col>
        <v-col>
          <title-value
            property-title="Phone number"
            :property-value="studentDetail.contact?.phone"
        /></v-col>
      </v-row>
    </content-group>
    <template v-if="showLegacyMatch">
      <h3 class="category-header-medium mt-4">Legacy match</h3>
      <content-group>
        <student-profile-legacy-matches
          :student-id="studentId"
          :legacy-profile="studentDetail.legacyProfile"
          @legacy-profile-linked="loadStudentProfile"
        />
      </content-group>
    </template>
    <edit-student-profile-modal
      ref="studentEditProfile"
    ></edit-student-profile-modal>
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent, computed } from "vue";
import { StudentService } from "@/services/StudentService";
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";
import {
  AddressAPIOutDTO,
  UpdateStudentDetailsAPIInDTO,
} from "@/services/http/dto";
import { IdentityProviders, Role, StudentProfile, BannerTypes } from "@/types";
import DisabilityStatusUpdateTileValue from "@/components/aest/students/DisabilityStatusUpdateTileValue.vue";
import ModifiedIndependentStatusTitleValue from "@/components/aest/students/ModifiedIndependentStatusTitleValue.vue";
import EditStudentProfileModal from "@/components/aest/students/modals/EditStudentProfileModal.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import StudentProfileLegacyMatches from "@/components/common/students/StudentProfileLegacyMatches.vue";

/**
 *  Used to combine institution and ministry DTOs and make SIN explicitly mandatory.
 */
interface SharedStudentProfile extends Omit<StudentProfile, "sin"> {
  sin: string;
  identityProviderType?: IdentityProviders;
}

export default defineComponent({
  components: {
    StudentProfileLegacyMatches,
    DisabilityStatusUpdateTileValue,
    ModifiedIndependentStatusTitleValue,
    EditStudentProfileModal,
    CheckPermissionRole,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    allowUpdateActions: {
      type: Boolean,
      required: false,
      default: false,
    },
    showLegacyMatch: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const studentEditProfile = ref(
      {} as ModalDialog<UpdateStudentDetailsAPIInDTO | boolean>,
    );
    const studentDetail = ref({} as SharedStudentProfile);
    const address = ref({} as AddressAPIOutDTO);
    const {
      genderDisplayFormat,
      sinDisplayFormat,
      emptyStringFiller,
      dateOnlyLongString,
    } = useFormatters();

    const loadStudentProfile = async () => {
      studentDetail.value = (await StudentService.shared.getStudentProfile(
        props.studentId,
      )) as SharedStudentProfile;
      address.value = studentDetail.value.contact.address;
    };

    const editStudentProfile = async () => {
      await studentEditProfile.value.showModal(
        {
          givenNames: studentDetail.value.firstName,
          lastName: studentDetail.value.lastName,
          birthdate: studentDetail.value.dateOfBirth,
          email: studentDetail.value.email,
          noteDescription: "",
        },
        saveUpdatedProfileInfo,
      );
    };

    const saveUpdatedProfileInfo = async (
      modalData: UpdateStudentDetailsAPIInDTO | boolean,
    ) => {
      try {
        await StudentService.shared.updateStudentProfileInfo(
          props.studentId,
          modalData as UpdateStudentDetailsAPIInDTO,
        );
        await loadStudentProfile();
        snackBar.success("Profile Information updated successfully.");
        return true;
      } catch {
        snackBar.error(
          "An error happened while updating the profile information. Your profile information could not be updated.",
        );
        return false;
      }
    };

    const canEditProfile = computed(() => {
      return (
        studentDetail.value.identityProviderType ===
        IdentityProviders.BCeIDBasic
      );
    });

    onMounted(loadStudentProfile);

    return {
      studentDetail,
      address,
      sinDisplayFormat,
      genderDisplayFormat,
      dateOnlyLongString,
      emptyStringFiller,
      loadStudentProfile,
      Role,
      editStudentProfile,
      canEditProfile,
      studentEditProfile,
      BannerTypes,
    };
  },
});
</script>
