<template>
  <content-group>
    <div class="mt-1 mb-4">
      <h2 class="color-blue font-weight-bold">Profile</h2>
    </div>
    <content-group>
      <v-row>
        <v-col>
          <title-value
            propertyTitle="Legal operating name"
            :propertyValue="initialValue.legalOperatingName"
          />
          <title-value
            propertyTitle="Institution name"
            :propertyValue="initialValue.operatingName"
          />
          <title-value
            propertyTitle="Type"
            :propertyValue="initialValue.institutionTypeName"
          />
          <title-value
            propertyTitle="Regulating body"
            :propertyValue="initialValue.regulatingBody"
          />
        </v-col>
        <v-divider class="mx-4" vertical></v-divider>
        <v-col>
          <title-value
            propertyTitle="Primary phone number"
            :propertyValue="initialValue.primaryPhone"
          />
          <title-value
            propertyTitle="Primary email"
            :propertyValue="initialValue.primaryEmail"
          />
          <title-value
            propertyTitle="Website"
            :propertyValue="initialValue.website"
          />
          <title-value
            propertyTitle="Established date"
            :propertyValue="initialValue.formattedEstablishedDate"
          />
        </v-col>
      </v-row>
    </content-group>
    <h2 class="color-blue font-weight-bold pt-4 pb-4">Contact info</h2>
    <content-group>
      <v-row>
        <v-col
          ><content-group
            ><h6 class="color-blue font-weight-bold">
              INSTITUTION PRIMARY CONTACT
            </h6>
            <v-row class="mt-1 mb-2 ml-0">
              {{ initialValue.primaryContactFirstName }}
              {{ initialValue.primaryContactLastName }}
            </v-row>
            <v-row class="mt-1 mb-2 ml-0">
              {{ initialValue.primaryContactEmail }}
            </v-row>
            <v-row class="mt-1 mb-2 ml-0">
              {{ initialValue.primaryContactPhone }}
            </v-row>
          </content-group></v-col
        >
        <v-col
          ><content-group
            ><h6 class="color-blue font-weight-bold">
              LEGAL AUTHORIZED AUTHORITY CONTACT
            </h6>
            <v-row class="mt-1 mb-2 ml-0">
              {{ initialValue.legalAuthorityFirstName }}
              {{ initialValue.legalAuthorityLastName }}
            </v-row>
            <v-row class="mt-1 mb-2 ml-0">
              {{ initialValue.legalAuthorityEmail }}
            </v-row>
            <v-row class="mt-1 mb-2 ml-0">
              {{ initialValue.legalAuthorityPhone }}
            </v-row></content-group
          ></v-col
        ></v-row
      >
    </content-group>
    <h2 class="color-blue font-weight-bold pt-4 pb-4">Mailing address</h2>
    <content-group>
      <title-value
        propertyTitle="Address 1"
        :propertyValue="initialValue.address?.addressLine1"
      />
      <title-value
        propertyTitle="Address 2"
        :propertyValue="initialValue.address?.addressLine2"
      />
      <title-value
        propertyTitle="City"
        :propertyValue="initialValue.address?.city"
      />
      <title-value
        propertyTitle="Postal Code"
        :propertyValue="initialValue.address?.postalCode"
      />
      <title-value
        propertyTitle="Province"
        :propertyValue="initialValue.address?.provinceState"
      />
      <title-value
        propertyTitle="Country"
        :propertyValue="initialValue.address?.country"
      />
    </content-group>
  </content-group>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import TitleValue from "@/components/generic/TitleValue.vue";
import { AESTInstitutionDetailDto } from "@/types";
export default {
  components: { ContentGroup, TitleValue },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const initialValue = ref({} as AESTInstitutionDetailDto);
    onMounted(async () => {
      initialValue.value = await InstitutionService.shared.getAESTInstitutionDetailById(
        props.institutionId,
      );
    });
    return {
      initialValue,
    };
  },
};
</script>
