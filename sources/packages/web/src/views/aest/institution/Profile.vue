<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="Profile">
          <template #actions>
            <check-permission-role :role="Role.InstitutionEditProfile">
              <template #="{ notAllowed }">
                <v-btn
                  class="float-right"
                  @click="editProfile"
                  variant="text"
                  color="primary"
                  prepend-icon="fa:fa fa-gear"
                  :disabled="notAllowed"
                  >Edit
                </v-btn>
              </template>
            </check-permission-role>
          </template>
        </body-header>
      </template>
      <p class="category-header-medium">Institution profile</p>
      <content-group>
        <v-row>
          <v-col>
            <title-value
              property-title="Legal operating name"
              :property-value="institutionProfileDetail.legalOperatingName"
            />
            <title-value
              property-title="Institution name"
              :property-value="institutionProfileDetail.operatingName"
            />
            <title-value
              property-title="Primary phone number"
              :property-value="institutionProfileDetail.primaryPhone"
            />
            <title-value
              property-title="Primary email"
              :property-value="institutionProfileDetail.primaryEmail"
            />
            <title-value
              property-title="Website"
              :property-value="institutionProfileDetail.website"
            />
            <title-value
              property-title="Established date"
              :property-value="institutionProfileDetail.establishedDate"
            />
          </v-col>
          <v-divider :thickness="2" vertical />
          <v-col>
            <title-value
              property-title="Regulatory body"
              :property-value="
                getRegulatoryBodyToDisplay(
                  institutionProfileDetail.regulatingBody,
                )
              "
            />
            <title-value
              v-if="institutionProfileDetail.regulatingBody === 'other'"
              property-title="Other regulatory body"
              :property-value="institutionProfileDetail.otherRegulatingBody"
            />
            <title-value
              property-title="Country"
              :property-value="
                emptyStringFiller(institutionProfileDetail.countryName)
              "
            />
            <title-value
              property-title="Province"
              :property-value="
                emptyStringFiller(institutionProfileDetail.provinceName)
              "
            />
            <title-value
              property-title="Classification"
              :property-value="
                conditionalEmptyStringFiller(
                  !!institutionProfileDetail.classification,
                  getClassificationToDisplay(
                    institutionProfileDetail.classification as InstitutionClassification,
                  ),
                )
              "
            />
            <title-value
              property-title="Organization status"
              :property-value="
                conditionalEmptyStringFiller(
                  !!institutionProfileDetail.organizationStatus,
                  getOrganizationStatusToDisplay(
                    institutionProfileDetail.organizationStatus as InstitutionOrganizationStatus,
                  ),
                )
              "
            />
            <title-value
              property-title="Medical"
              :property-value="
                conditionalEmptyStringFiller(
                  !!institutionProfileDetail.medicalSchoolStatus,
                  getMedicalSchoolStatusToDisplay(
                    institutionProfileDetail.medicalSchoolStatus as InstitutionMedicalSchoolStatus,
                  ),
                )
              "
            />
          </v-col>
        </v-row>
      </content-group>
      <p class="category-header-medium mt-5">Contact information</p>
      <v-row>
        <v-col
          ><content-group
            ><span class="label-bold">Institution primary contact</span>
            <v-row class="mt-1 mb-2 ml-0 text-muted">
              {{ institutionProfileDetail.primaryContactFirstName }}
              {{ institutionProfileDetail.primaryContactLastName }}
            </v-row>
            <v-row class="mt-1 mb-2 ml-0 text-muted">
              {{ institutionProfileDetail.primaryContactEmail }}
            </v-row>
            <v-row class="mt-1 mb-2 ml-0 text-muted">
              {{ institutionProfileDetail.primaryContactPhone }}
            </v-row>
          </content-group></v-col
        >
      </v-row>
      <p class="category-header-medium mt-5">Mailing address</p>
      <content-group>
        <title-value
          property-title="Address line 1"
          :property-value="
            institutionProfileDetail.mailingAddress?.addressLine1
          "
        />
        <title-value
          property-title="Address line 2"
          :property-value="
            emptyStringFiller(
              institutionProfileDetail.mailingAddress?.addressLine2,
            )
          "
        />
        <title-value
          property-title="City"
          :property-value="institutionProfileDetail.mailingAddress?.city"
        />
        <title-value
          property-title="Postal Code"
          :property-value="institutionProfileDetail.mailingAddress?.postalCode"
        />
        <title-value
          property-title="Province"
          :property-value="
            institutionProfileDetail.mailingAddress?.provinceState
          "
        />
        <title-value
          property-title="Country"
          :property-value="institutionProfileDetail.mailingAddress?.country"
        />
      </content-group>
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionDetailAPIOutDTO } from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import {
  InstitutionClassification,
  InstitutionMedicalSchoolStatus,
  InstitutionOrganizationStatus,
  Role,
} from "@/types";
import { useFormatters, useInstitution } from "@/composables";

export default defineComponent({
  components: { CheckPermissionRole },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const institutionProfileDetail = ref({} as InstitutionDetailAPIOutDTO);
    const {
      emptyStringFiller,
      dateOnlyLongString,
      conditionalEmptyStringFiller,
    } = useFormatters();
    const {
      getRegulatoryBodyToDisplay,
      getClassificationToDisplay,
      getOrganizationStatusToDisplay,
      getMedicalSchoolStatusToDisplay,
    } = useInstitution();
    const router = useRouter();
    onMounted(async () => {
      institutionProfileDetail.value =
        await InstitutionService.shared.getDetail(props.institutionId);
      institutionProfileDetail.value.establishedDate = dateOnlyLongString(
        institutionProfileDetail.value.establishedDate,
      );
    });

    const editProfile = () => {
      router.push({
        name: AESTRoutesConst.INSTITUTION_PROFILE_EDIT,
        params: { institutionId: props.institutionId },
      });
    };
    return {
      institutionProfileDetail,
      editProfile,
      Role,
      emptyStringFiller,
      conditionalEmptyStringFiller,
      getRegulatoryBodyToDisplay,
      getClassificationToDisplay,
      getOrganizationStatusToDisplay,
      getMedicalSchoolStatusToDisplay,
      InstitutionClassification,
      InstitutionOrganizationStatus,
      InstitutionMedicalSchoolStatus,
    };
  },
});
</script>
