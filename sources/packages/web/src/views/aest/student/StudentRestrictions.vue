<template>
  <full-page-container>
    <content-group>
      <v-row class="m-2">
        <v-col class="category-header-medium color-blue"
          >All Restrictions</v-col
        >
        <v-col
          ><v-btn class="float-right primary-btn-background"
            ><font-awesome-icon icon="plus" class="mr-2" />Add
            restriction</v-btn
          ></v-col
        >
      </v-row>
      <DataTable
        :value="studentRestrictions"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
      >
        <template #empty>
          <p class="text-center font-weight-bold">No records found.</p>
        </template>
        <Column field="restrictionType" header="Type" sortable="true"></Column>
        <Column field="description" header="Reason"></Column>
        <Column field="createdAt" header="Added"
          ><template #body="slotProps">{{
            dateOnlyLongString(slotProps.data.createdAt)
          }}</template></Column
        >
        <Column field="updatedAt" header="Resolved">
          <template #body="slotProps">{{
            dateOnlyLongString(slotProps.data.createdAt)
          }}</template></Column
        >
        <Column field="isActive" header="Status">
          <template #body="slotProps">
            <StatusBadge
              :status="
                slotProps.data.isActive
                  ? GeneralStatusForBadge.ActiveRestriction
                  : GeneralStatusForBadge.ResolvedRestriction
              "
            />
          </template>
        </Column>
      </DataTable>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import { RestrictionService } from "@/services/RestrictionService";
import { useFormatters } from "@/composables";
import { GeneralStatusForBadge } from "@/types";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import StatusBadge from "@/components/generic/StatusBadge.vue";

export default {
  components: { ContentGroup, FullPageContainer, StatusBadge },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const studentRestrictions = ref();
    const { dateOnlyLongString } = useFormatters();

    onMounted(async () => {
      studentRestrictions.value = await RestrictionService.shared.getStudentRestrictions(
        props.studentId,
      );
    });
    return {
      dateOnlyLongString,
      studentRestrictions,
      GeneralStatusForBadge,
    };
  },
};
</script>
