<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <body-header title="Profile" class="m-1">
        <template #actions-align-end>
          <v-btn text @click="editProfile" variant="title" :color="COLOR_BLUE"
            ><v-icon icon="fa:fa fa-cog" class="mr-1" /> Edit
          </v-btn>
        </template>
      </body-header>
      <content-group>
        <v-row>
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
              propertyTitle="Regulating body"
              :propertyValue="institutionProfileDetail.regulatingBody"
            />
          </v-col>
          <v-divider class="mx-4" vertical></v-divider>
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
              :propertyValue="institutionProfileDetail.formattedEstablishedDate"
            />
          </v-col>
        </v-row>
      </content-group>
      <p class="category-header-large color-blue mt-2 mb-2">Contact info</p>
      <v-row>
        <v-col
          ><content-group
            ><h6 class="color-blue font-weight-bold">
              INSTITUTION PRIMARY CONTACT
            </h6>
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
      <p class="category-header-large color-blue mt-2 mb-2">Mailing address</p>
      <content-group>
        <title-value
          propertyTitle="Address 1"
          :propertyValue="institutionProfileDetail.mailingAddress?.addressLine1"
        />
        <title-value
          propertyTitle="Address 2"
          :propertyValue="institutionProfileDetail.mailingAddress?.addressLine2"
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
    </div>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionService } from "@/services/InstitutionService";
import TitleValue from "@/components/generic/TitleValue.vue";
import { InstitutionDetailAPIOutDTO } from "@/services/http/dto";
import { COLOR_BLUE } from "@/constants";
export default {
  components: { TitleValue },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const institutionProfileDetail = ref({} as InstitutionDetailAPIOutDTO);
    const router = useRouter();
    onMounted(async () => {
      institutionProfileDetail.value =
        await InstitutionService.shared.getDetail(props.institutionId);
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
      COLOR_BLUE,
    };
  },
};
</script>
