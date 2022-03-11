<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <div class="mb-2">
        <p class="category-header-large color-blue">Profile</p>
      </div>
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
          :propertyValue="institutionProfileDetail.address?.addressLine1"
        />
        <title-value
          propertyTitle="Address 2"
          :propertyValue="institutionProfileDetail.address?.addressLine2"
        />
        <title-value
          propertyTitle="City"
          :propertyValue="institutionProfileDetail.address?.city"
        />
        <title-value
          propertyTitle="Postal Code"
          :propertyValue="institutionProfileDetail.address?.postalCode"
        />
        <title-value
          propertyTitle="Province"
          :propertyValue="institutionProfileDetail.address?.provinceState"
        />
        <title-value
          propertyTitle="Country"
          :propertyValue="institutionProfileDetail.address?.country"
        />
      </content-group>
    </div>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import TitleValue from "@/components/generic/TitleValue.vue";
import { InstitutionReadOnlyDto } from "@/types";

export default {
  components: { ContentGroup, TitleValue },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const institutionProfileDetail = ref({} as InstitutionReadOnlyDto);
    onMounted(async () => {
      institutionProfileDetail.value = await InstitutionService.shared.getInstitutionDetail(
        props.institutionId,
      );
    });
    return {
      institutionProfileDetail,
    };
  },
};
</script>
