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
            propertyTitle="Given names"
            :propertyValue="studentDetail.firstName"
          />
        </v-col>
        <v-col
          ><title-value
            propertyTitle="Last name"
            :propertyValue="studentDetail.lastName"
          />
        </v-col>
        <v-col>
          <title-value
            propertyTitle="Date of birth"
            :propertyValue="studentDetail.birthDateFormatted"
        /></v-col>
      </v-row>
      <v-row>
        <v-col
          ><title-value
            propertyTitle="Gender"
            :propertyValue="genderDisplayFormat(studentDetail.gender)"
          />
        </v-col>
        <v-col
          ><title-value
            propertyTitle="Email"
            :propertyValue="studentDetail.email"
          />
        </v-col>
        <v-col>
          <disability-status-update-tile-value
            :studentId="studentId"
            :allowDisabilityStatusUpdate="allowDisabilityStatusUpdate"
            :disabilityStatus="studentDetail.disabilityStatus"
            @disabilityStatusUpdated="loadStudentProfile"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col
          ><title-value
            propertyTitle="SIN"
            :propertyValue="sinDisplayFormat(studentDetail.sin)"
          />
        </v-col>
      </v-row>
    </content-group>
    <h3 class="category-header-medium mt-4">Contact information</h3>
    <content-group
      ><v-row>
        <v-col
          ><title-value
            propertyTitle="Address line 1"
            :propertyValue="address.addressLine1"
          />
        </v-col>
        <v-col
          ><title-value
            propertyTitle="Address line 2"
            :propertyValue="emptyStringFiller(address.addressLine2)"
          />
        </v-col>
        <v-col>
          <title-value propertyTitle="City" :propertyValue="address.city"
        /></v-col>
      </v-row>
      <v-row>
        <v-col
          ><title-value
            propertyTitle="Province"
            :propertyValue="address.provinceState"
          />
        </v-col>
        <v-col
          ><title-value
            propertyTitle="Postal/Zip Code"
            :propertyValue="address.postalCode"
          />
        </v-col>
        <v-col>
          <title-value
            propertyTitle="Phone number"
            :propertyValue="studentDetail.contact?.phone"
        /></v-col>
      </v-row>
    </content-group>
    <edit-student-profile-modal
      ref="studentEditProfile"
      :updatedStudentDetails="updatedStudentDetails"
    ></edit-student-profile-modal>
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent, computed, watchEffect } from "vue";
import { StudentService } from "@/services/StudentService";
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";
import {
  AddressAPIOutDTO,
  UpdateStudentDetails,
  UpdateStudentDetailsAPIInDTO,
} from "@/services/http/dto";
import { IdentityProviders, Role, StudentProfile } from "@/types";
import DisabilityStatusUpdateTileValue from "@/components/aest/students/DisabilityStatusUpdateTileValue.vue";
import EditStudentProfileModal from "@/components/aest/students/modals/EditStudentProfileModal.vue";

/**
 *  Used to combine institution and ministry DTOs and make SIN explicitly mandatory.
 */
interface SharedStudentProfile extends Omit<StudentProfile, "sin"> {
  sin: string;
  identityProviderType?: IdentityProviders;
}

export default defineComponent({
  components: {
    DisabilityStatusUpdateTileValue,
    EditStudentProfileModal,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    allowDisabilityStatusUpdate: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const updatedStudentDetails = ref({} as UpdateStudentDetails);
    const studentEditProfile = ref(
      {} as ModalDialog<UpdateStudentDetailsAPIInDTO | boolean>,
    );
    const studentDetail = ref({} as SharedStudentProfile);
    const address = ref({} as AddressAPIOutDTO);
    const { genderDisplayFormat, sinDisplayFormat, emptyStringFiller } =
      useFormatters();

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
      } catch (error) {
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

    watchEffect(() => {
      updatedStudentDetails.value = {
        givenNames: studentDetail.value.firstName,
        lastName: studentDetail.value.lastName,
        birthdate: studentDetail.value.dateOfBirth,
        email: studentDetail.value.email,
      };
    });

    onMounted(loadStudentProfile);
    return {
      studentDetail,
      address,
      sinDisplayFormat,
      genderDisplayFormat,
      emptyStringFiller,
      loadStudentProfile,
      Role,
      editStudentProfile,
      canEditProfile,
      studentEditProfile,
      updatedStudentDetails,
    };
  },
});
</script>
