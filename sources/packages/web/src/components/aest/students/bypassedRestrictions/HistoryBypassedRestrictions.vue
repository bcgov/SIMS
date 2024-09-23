<template>
  <v-card>
    <v-container>
      <body-header title="History of Bypassed Restrictions" class="m-1">
        <template #actions>
          <check-permission-role :role="Role.StudentAddRestriction">
            <template #="{ notAllowed }">
              <v-btn
                @click="addBypassedRestriction"
                class="float-right"
                color="primary"
                data-cy="addRestrictionButton"
                prepend-icon="fa:fa fa-plus-circle"
                :disabled="notAllowed"
                >Bypass A Restriction</v-btn
              >
            </template>
          </check-permission-role>
        </template>
      </body-header>
      <content-group class="mt-4">
        <toggle-content
          :toggled="!bypassedRestrictions.length"
          message="No bypassed restrictions found."
        >
          <DataTable
            :value="bypassedRestrictions"
            :paginator="true"
            :rows="DEFAULT_PAGE_LIMIT"
            :rowsPerPageOptions="PAGINATION_LIST"
            :totalRecords="bypassedRestrictions.length"
          >
            <template #empty>
              <p class="text-center font-weight-bold">No records found.</p>
            </template>
            <Column
              field="restrictionType"
              header="Restriction Type"
              :sortable="true"
            ></Column>
            <Column field="restrictionCode" header="Restriction Code"></Column>
            <Column header="View Details">
              <template #body="{ data }">
                <v-btn
                  @click="$emit('viewBypassDetails', data.id)"
                  color="primary"
                  variant="text"
                  class="text-decoration-underline"
                  prepend-icon="fa:far fa-file-alt"
                >
                  View Details</v-btn
                >
              </template></Column
            ><Column header="Remove Bypass Rule?">
              <template #body="{ data }">
                <v-btn
                  @click="$emit('viewRemoveBypass', data.id)"
                  :color="getRemoveBypassColor(data)"
                  :disabled="!data.isActive"
                >
                  {{ getRemoveBypassLabel(data) }}</v-btn
                >
              </template>
            </Column>
          </DataTable>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
</template>
<script lang="ts">
import { DEFAULT_PAGE_LIMIT, PAGINATION_LIST, Role } from "@/types";
import { ref, onMounted, defineComponent } from "vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { BypassedRestrictionSummaryAPIOutDTO } from "@/services/http/dto/BypassedRestriction.dto";
import { BypassedRestrictionService } from "@/services/BypassedRestrictionService";

export default defineComponent({
  emits: ["viewBypassDetails", "viewRemoveBypass"],
  components: {
    CheckPermissionRole,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const bypassedRestrictions = ref(
      [] as BypassedRestrictionSummaryAPIOutDTO[],
    );
    onMounted(async () => {
      bypassedRestrictions.value =
        await BypassedRestrictionService.shared.getBypassedRestrictionHistory(
          props.applicationId,
        );
    });

    const getRemoveBypassLabel = (
      data: BypassedRestrictionSummaryAPIOutDTO,
    ): string => {
      return data.isActive ? "Remove Bypass" : "Bypass Removed";
    };

    const getRemoveBypassColor = (
      data: BypassedRestrictionSummaryAPIOutDTO,
    ): string => {
      return data.isActive ? "primary" : "secondary";
    };

    const addBypassedRestriction = async () => {
      // ToDo: Add bypassed restriction
    };

    return {
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      Role,
      bypassedRestrictions,
      getRemoveBypassLabel,
      getRemoveBypassColor,
      addBypassedRestriction,
    };
  },
});
</script>
