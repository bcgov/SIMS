<template>
  <div class="mb-2">
    <div class="muted-heading-text">Institution Details</div>
    <span class="heading-x-large mb-2">
      {{ institutionBasicDetail.operatingName }}
      <status-chip-designation-agreement
        :status="institutionBasicDetail.designationStatus"
      />
    </span>
  </div>
  <!-- TODO:replace prime tabMenu with vuetify3-->
  <TabMenu :model="items" />
  <router-view />
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
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
    const router = useRouter();

    const institutionBasicDetail = ref({} as InstitutionBasicAPIOutDTO);
    // TODO: replace all fa isons with fas as per figma with replace with vuetify3
    const items = ref([
      {
        label: "Profile",
        icon: "fa fa-university",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_PROFILE,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Programs",
        icon: "fa fa-book",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_PROGRAMS,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Locations",
        icon: "fa fa-map-marker",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_LOCATIONS,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Users",
        icon: "fa fa-users",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_USERS,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Designation",
        icon: "fa fa-pencil",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_DESIGNATION,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Restrictions",
        icon: "fa fa-times-circle-o",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_RESTRICTIONS,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Notes",
        icon: "fa fa-sticky-note-o",

        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_NOTES,
            params: { institutionId: props.institutionId },
          });
        },
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
    };
  },
};
</script>
