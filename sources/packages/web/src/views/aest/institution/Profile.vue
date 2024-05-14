<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="Profile" title-header-level="2">
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
              propertyTitle="Primary phone number"
              :propertyValue="institutionProfileDetail.primaryPhone"
            />
            <title-value
              propertyTitle="Primary email"
              :propertyValue="institutionProfileDetail.primaryEmail"
            />
            <title-value
              propertyTitle="Website"
              :propertyValue="institutionProfileDetail.website"
            />
            <title-value
              propertyTitle="Established date"
              :propertyValue="institutionProfileDetail.establishedDate"
            />
          </v-col>
          <v-divider :thickness="2" vertical />
          <v-col>
            <title-value
              propertyTitle="Legal operating name"
              :propertyValue="institutionProfileDetail.legalOperatingName"
            />
            <title-value
              propertyTitle="Institution name"
              :propertyValue="institutionProfileDetail.operatingName"
            />
            <title-value
              propertyTitle="Type"
              :propertyValue="institutionProfileDetail.institutionTypeName"
            />
            <title-value
              propertyTitle="Regulatory body"
              :propertyValue="institutionProfileDetail.regulatingBody"
            />
            <title-value
              v-if="institutionProfileDetail.regulatingBody === 'other'"
              propertyTitle="Other regulatory body"
              :propertyValue="institutionProfileDetail.otherRegulatingBody"
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
          propertyTitle="Address line 1"
          :propertyValue="institutionProfileDetail.mailingAddress?.addressLine1"
        />
        <title-value
          propertyTitle="Address line 2"
          :propertyValue="
            emptyStringFiller(
              institutionProfileDetail.mailingAddress?.addressLine2,
            )
          "
        />
        <title-value
          propertyTitle="City"
          :propertyValue="institutionProfileDetail.mailingAddress?.city"
        />
        <title-value
          propertyTitle="Postal Code"
          :propertyValue="institutionProfileDetail.mailingAddress?.postalCode"
        />
        <title-value
          propertyTitle="Province"
          :propertyValue="
            institutionProfileDetail.mailingAddress?.provinceState
          "
        />
        <title-value
          propertyTitle="Country"
          :propertyValue="institutionProfileDetail.mailingAddress?.country"
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
import { Role } from "@/types";
import { useFormatters } from "@/composables";

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
    const { emptyStringFiller, dateOnlyLongString } = useFormatters();
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
    };
  },
});
</script>
