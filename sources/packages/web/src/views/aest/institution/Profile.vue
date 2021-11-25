<template>
  <content-group>
    <h2 class="color-blue font-weight-bold">Profile</h2>
    <content-group>
      <v-row>
        <v-col>
          <v-row class="mt-1 mb-2">
            <span class="font-weight-bold">Legal operating name</span>
          </v-row>
          <v-row class="mt-1 mb-2">
            {{ initialValue.legalOperatingName }}
          </v-row>
          <v-row class="mt-1 mb-2">
            <span class="font-weight-bold">Institution name</span>
          </v-row>
          <v-row class="mt-1 mb-2">
            {{ initialValue.operatingName }}
          </v-row>
          <v-row class="mt-1 mb-2">
            <span class="font-weight-bold">Type</span>
          </v-row>
          <v-row class="mt-1 mb-2">
            {{ initialValue.institutionTypeName }}
          </v-row>
          <v-row class="mt-1 mb-2">
            <span class="font-weight-bold">Regulating body</span>
          </v-row>
          <v-row class="mt-1 mb-2">
            {{ initialValue.regulatingBody }}
          </v-row>
        </v-col>
        <v-divider class="mx-4" vertical></v-divider>
        <v-col>
          <v-row class="mt-1 mb-2">
            <span class="font-weight-bold">Primary phone number</span>
          </v-row>
          <v-row class="mt-1 mb-2">
            {{ initialValue.primaryPhone }}
          </v-row>
          <v-row class="mt-1 mb-2">
            <span class="font-weight-bold">Primary email</span>
          </v-row>
          <v-row class="mt-1 mb-2">
            {{ initialValue.primaryEmail }}
          </v-row>
          <v-row class="mt-1 mb-2">
            <span class="font-weight-bold">Website</span>
          </v-row>
          <v-row class="mt-1 mb-2">
            <v-btn plain color="primary" target="{{ initialValue.website }}">{{
              initialValue.website
            }}</v-btn>
          </v-row>
          <v-row class="mt-1 mb-2">
            <span class="font-weight-bold">Established date</span>
          </v-row>
          <v-row class="mt-1 mb-2">
            {{ initialValue.formattedEstablishedDate }}
          </v-row>
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
      <v-row class="mt-1 mb-2">
        <span class="font-weight-bold">Address 1</span>
      </v-row>
      <v-row class="mt-1 mb-2">
        {{ initialValue.address?.addressLine1 }}
      </v-row>
      <v-row class="mt-1 mb-2">
        <span class="font-weight-bold">Address 2</span>
      </v-row>
      <v-row class="mt-1 mb-2">
        {{ initialValue.address?.addressLine2 }}
      </v-row>
      <v-row class="mt-1 mb-2">
        <span class="font-weight-bold">City</span>
      </v-row>
      <v-row class="mt-1 mb-2">
        {{ initialValue.address?.city }}
      </v-row>
      <v-row class="mt-1 mb-2">
        <span class="font-weight-bold">Postal code</span>
      </v-row>
      <v-row class="mt-1 mb-2">
        {{ initialValue.address?.postalCode }}
      </v-row>
      <v-row class="mt-1 mb-2">
        <span class="font-weight-bold">Province</span>
      </v-row>
      <v-row class="mt-1 mb-2">
        {{ initialValue.address?.provinceState }}
      </v-row>
      <v-row class="mt-1 mb-2">
        <span class="font-weight-bold">Country</span>
      </v-row>
      <v-row class="mt-1 mb-2">
        {{ initialValue.address?.country }}
      </v-row>
    </content-group>
  </content-group>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import { AESTInstitutionDetailDto } from "@/types";
export default {
  components: { ContentGroup },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
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
