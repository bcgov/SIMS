<template>
  <div v-if="showInfo">
    <div class="bg-white mt-10 mb-4" :class="containerClass">
      <p>
        <v-icon :color="iconColor">mdi-information </v-icon
        ><span class="pl-2 font-weight-bold" :class="infoHeaderClass">
          {{ infoHeader }}
        </span>
      </p>
      <span class="mt-4">
        {{ content }}
      </span>
    </div>
  </div>
</template>
<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { COEStatus } from "@/types";
import { ApplicationDetailsForCOEAPIOutDTO } from "@/services/http/dto";

export default {
  props: {
    data: {
      type: Object,
      default: {} as ApplicationDetailsForCOEAPIOutDTO,
    },
  },
  setup(props: any) {
    const content = ref("");
    const containerClass = ref("");
    const infoHeader = ref("");
    const infoHeaderClass = ref("");
    const iconColor = ref("");
    const showInfo = ref(false);
    const prepareContent = () => {
      showInfo.value = false;
      if (COEStatus.completed === props.data.applicationCOEStatus) {
        showInfo.value = true;
        content.value = `This applicant has been confirmed as enrolled at your institution.
            Funding will be disbursed on the study start date shown below. If the
            applicant will be receiving after the study start date listed below
            funds will be disbursed 48 hours after enrolment as been confirmed.`;
        containerClass.value = "coe-info-border";
        infoHeader.value = `This application has been confirmed`;
        infoHeaderClass.value = "";
        iconColor.value = "green darken-2";
      }
      if (
        COEStatus.required === props.data.applicationCOEStatus &&
        !props.data.applicationWithinCOEWindow
      ) {
        showInfo.value = true;
        content.value = `You will be able to confirm application when you are within 21
            days of the study start date. You can edit application if needed
            from the Application Actions”`;
        containerClass.value = "coe-ocw-info-border";
        infoHeader.value = `This application is currently outside the 21 day confirmation
            window`;
        infoHeaderClass.value = "color-blue";
        iconColor.value = "primary darken-2";
      }
      if (
        COEStatus.required === props.data.applicationCOEStatus &&
        props.data.applicationWithinCOEWindow
      ) {
        showInfo.value = true;
        content.value = `Confirm the program and intake information below by confirming,
            declining or editing application from the Application Actions`;
        containerClass.value = "coe-icw-info-border";
        infoHeader.value = `This application requires confirmation of enrolment so funding can
          be dispersed`;
        infoHeaderClass.value = "";
        iconColor.value = "grey darken-2";
      }
      if (COEStatus.declined === props.data.applicationCOEStatus) {
        showInfo.value = true;
        content.value = `Reason: ${props.data.applicationDeniedReason}`;
        containerClass.value = "coe-denied-info-border";
        infoHeader.value = `This confirmation of enrolment has been declined`;
        infoHeaderClass.value = "";
        iconColor.value = "red darken-2";
      }
    };
    watch(
      () => props.data,
      () => {
        prepareContent();
      },
    );
    onMounted(() => {
      prepareContent();
    });
    return {
      content,
      containerClass,
      infoHeader,
      infoHeaderClass,
      showInfo,
      iconColor,
    };
  },
};
</script>
