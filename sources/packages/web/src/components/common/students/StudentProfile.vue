<template>
  <body-header-container>
    <template #header>
      <body-header title="Profile" title-header-level="2" />
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
            :propertyValue="studentDetail.gender"
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
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { StudentService } from "@/services/StudentService";
import { useFormatters } from "@/composables";
import { AddressAPIOutDTO } from "@/services/http/dto";
import { StudentProfile } from "@/types";
import DisabilityStatusUpdateTileValue from "@/components/aest/students/DisabilityStatusUpdateTileValue.vue";

/**
 *  Used to combine institution and ministry DTOs and make SIN explicitly mandatory.
 */
interface SharedStudentProfile extends Omit<StudentProfile, "sin"> {
  sin: string;
}

export default defineComponent({
  components: { DisabilityStatusUpdateTileValue },
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
    const studentDetail = ref({} as SharedStudentProfile);
    const address = ref({} as AddressAPIOutDTO);
    const { sinDisplayFormat, emptyStringFiller } = useFormatters();

    const loadStudentProfile = async () => {
      studentDetail.value = (await StudentService.shared.getStudentProfile(
        props.studentId,
      )) as SharedStudentProfile;
      address.value = studentDetail.value.contact.address;
    };

    onMounted(loadStudentProfile);
    return {
      studentDetail,
      address,
      sinDisplayFormat,
      emptyStringFiller,
      loadStudentProfile,
    };
  },
});
</script>
