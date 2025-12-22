<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header title="Overaward adjustments">
        <template #actions v-if="allowManualOveraward">
          <check-permission-role :role="Role.StudentAddOverawardManual">
            <template #="{ notAllowed }">
              <div class="d-flex justify-end">
                <v-btn
                  class="ml-2"
                  color="primary"
                  :disabled="notAllowed"
                  prepend-icon="fa:fa fa-plus-circle"
                  @click="addOverawards"
                >
                  Add Overawards
                </v-btn>
                <v-btn
                  class="ml-2"
                  color="primary"
                  :disabled="notAllowed"
                  prepend-icon="fa:fa fa-minus-circle"
                  @click="subtractOverawards"
                >
                  Subtract Overawards
                </v-btn>
              </div>
            </template>
          </check-permission-role>
        </template>
      </body-header>
    </template>
    <content-group>
      <toggle-content
        :toggled="!overawardDetails.length"
        message="No overaward adjustments found."
      >
        <v-data-table
          :headers="overawardAdjustmentsHeaders"
          :items="overawardDetails"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #[`item.dateAdded`]="{ item }">
            {{ formatDateAdded(item) }}
          </template>
          <template #[`item.applicationNumber`]="{ item }">
            {{ emptyStringFiller(item.applicationNumber) }}
          </template>
          <template #[`item.overawardOrigin`]="{ item }">
            {{ origin(item) }}
          </template>
          <template #[`item.addedByUser`]="{ item }">
            {{ emptyStringFiller(item.addedByUser) }}
          </template>
          <template #[`item.awardValueCode`]="{ item }">
            {{ item.awardValueCode }}
          </template>
          <template #[`item.overawardValue`]="{ item }">
            {{ formatCurrency(item.overawardValue) }}
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>

    <add-manual-overaward
      ref="addManualOveraward"
      :is-addition="isAddition"
      :allowed-role="Role.StudentAddOverawardManual"
    />
  </body-header-container>
</template>
<script lang="ts">
import { ref, onMounted, defineComponent, computed } from "vue";
import { useDisplay } from "vuetify";

import { OverawardService } from "@/services/OverawardService";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  Role,
  OverawardAdjustmentsHeaders,
  DisbursementOverawardOriginType,
} from "@/types";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import {
  OverawardAPIOutDTO,
  OverawardManualRecordAPIInDTO,
} from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import AddManualOveraward from "@/components/aest/students/modals/AddManualOveraward.vue";

export default defineComponent({
  components: { CheckPermissionRole, AddManualOveraward },
  emits: {
    manualOverawardAdded: null,
  },
  props: {
    studentId: {
      type: Number,
      required: false,
      default: undefined,
    },
    showAddedBy: {
      type: Boolean,
      required: false,
      default: false,
    },
    allowManualOveraward: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const { dateOnlyLongString, formatCurrency, emptyStringFiller } =
      useFormatters();
    const snackBar = useSnackBar();
    const { mobile: isMobile } = useDisplay();
    const isAddition = ref(true);

    const overawardDetails = ref([] as OverawardAPIOutDTO[]);
    const addManualOveraward = ref(
      {} as ModalDialog<OverawardManualRecordAPIInDTO | boolean>,
    );
    const addOverawards = async () => {
      isAddition.value = true;
      const manualOveraward = await addManualOveraward.value.showModal();
      if (!manualOveraward || typeof manualOveraward === "boolean") {
        return;
      }
      try {
        await OverawardService.shared.addManualOveraward(
          props.studentId as number,
          manualOveraward,
        );
        snackBar.success("Overaward added successfully.");
        context.emit("manualOverawardAdded");
        await loadOverawardDetails();
      } catch {
        snackBar.error("An error happened while adding overaward.");
      }
    };

    const subtractOverawards = async () => {
      isAddition.value = false;
      const manualOveraward = await addManualOveraward.value.showModal();
      if (!manualOveraward || typeof manualOveraward === "boolean") {
        return;
      }
      try {
        const subtractOveraward = {
          ...manualOveraward,
          overawardValue: -manualOveraward.overawardValue,
        };
        await OverawardService.shared.addManualOveraward(
          props.studentId as number,
          subtractOveraward,
        );
        snackBar.success("Overaward subtracted successfully.");
        context.emit("manualOverawardAdded");
        await loadOverawardDetails();
      } catch {
        snackBar.error("An error happened while subtracting overaward.");
      }
    };

    const loadOverawardDetails = async () => {
      overawardDetails.value =
        await OverawardService.shared.getStudentOverawards(props.studentId);
    };

    const formatDateAdded = (overaward: OverawardAPIOutDTO): string => {
      return overaward.dateAdded
        ? dateOnlyLongString(overaward.dateAdded)
        : dateOnlyLongString(overaward.createdAt);
    };

    const overawardAdjustmentsHeaders = computed(() => {
      return props.showAddedBy
        ? OverawardAdjustmentsHeaders
        : OverawardAdjustmentsHeaders.filter(
            (header) => header.key !== "addedByUser",
          );
    });

    const origin = (overaward: OverawardAPIOutDTO): string => {
      return overaward.overawardOrigin ===
        DisbursementOverawardOriginType.ReassessmentOveraward
        ? (overaward.assessmentTriggerType ?? "")
        : overaward.overawardOrigin;
    };

    onMounted(loadOverawardDetails);

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      dateOnlyLongString,
      overawardDetails,
      formatCurrency,
      Role,
      addManualOveraward,
      addOverawards,
      subtractOverawards,
      emptyStringFiller,
      formatDateAdded,
      overawardAdjustmentsHeaders,
      isMobile,
      isAddition,
      origin,
    };
  },
});
</script>
