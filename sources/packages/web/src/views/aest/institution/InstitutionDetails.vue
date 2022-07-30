<template>
  <full-page-container layout-template="centered-tab" :fullWidth="true"
    ><template #header>
      <header-navigator
        title="Institution Details"
        :subTitle="institutionBasicDetail.operatingName"
      >
        <template #sub-title-details>
          <status-chip-designation-agreement
            class="ml-4 mt-1"
            :status="institutionBasicDetail.designationStatus"
          />
        </template>
      </header-navigator>
    </template>
    <template #tab-header>
      <v-tabs :model="tab" stacked color="primary"
        ><v-tab
          v-for="item in items"
          :key="item"
          :value="item.value"
          :to="item.command()"
          :ripple="false"
          ><div>
            <v-icon start :icon="item.icon" class="px-1"></v-icon>
            <span class="mx-2 label-bold"> {{ item.label }} </span>
          </div>
        </v-tab>
      </v-tabs>
    </template>
    <router-view />
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionBasicAPIOutDTO } from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import StatusChipDesignationAgreement from "@/components/generic/StatusChipDesignationAgreement.vue";

export default {
  components: { StatusChipDesignationAgreement },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const tab = ref("institution-tab");
    const institutionBasicDetail = ref({} as InstitutionBasicAPIOutDTO);
    // TODO: replace all fa isons with fas as per figma with replace with vuetify3
    const items = ref([
      {
        label: "Profile",
        value: "profile-tab",
        icon: "fa:far fa-address-book",
        command: () => ({
          name: AESTRoutesConst.INSTITUTION_PROFILE,
          params: { institutionId: props.institutionId },
        }),
      },
      {
        label: "Programs",
        value: "programs",
        icon: "fa:far fa-folder-open",
        command: () => ({
          name: AESTRoutesConst.INSTITUTION_PROGRAMS,
          params: { institutionId: props.institutionId },
        }),
      },
      {
        label: "Locations",
        value: "locations-tab",
        icon: "mdi-map-marker-outline",
        command: () => ({
          name: AESTRoutesConst.INSTITUTION_LOCATIONS,
          params: { institutionId: props.institutionId },
        }),
      },
      {
        label: "Users",
        value: "users-tab",
        icon: "fa:far fa-user",
        command: () => ({
          name: AESTRoutesConst.INSTITUTION_USERS,
          params: { institutionId: props.institutionId },
        }),
      },
      {
        label: "Designation",
        value: "designation-tab",
        icon: "fa:far fa-bookmark",
        command: () => ({
          name: AESTRoutesConst.INSTITUTION_DESIGNATION,
          params: { institutionId: props.institutionId },
        }),
      },
      {
        label: "Restrictions",
        value: "restrictions-tab",
        icon: "fa:far fa-times-circle",
        command: () => ({
          name: AESTRoutesConst.INSTITUTION_RESTRICTIONS,
          params: { institutionId: props.institutionId },
        }),
      },
      {
        label: "Notes",
        value: "notes-tab",
        icon: "fa:fa fa-sticky-note",
        command: () => ({
          name: AESTRoutesConst.INSTITUTION_NOTES,
          params: { institutionId: props.institutionId },
        }),
      },
    ]);

    onMounted(async () => {
      institutionBasicDetail.value =
        await InstitutionService.shared.getBasicInstitutionInfoById(
          props.institutionId,
        );
    });
    return {
      institutionBasicDetail,
      AESTRoutesConst,
      items,
      tab,
    };
  },
};
</script>
