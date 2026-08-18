<template>
  <user-note-confirm-modal
    title="View restriction"
    ref="viewRestrictionModal"
    :allowed-role="allowedRole"
    :ok-label="allowUserToEdit ? 'Resolve restriction' : 'Close'"
    :show-secondary-button="allowUserToEdit"
    notes-label="Resolution reason"
    :show-notes="allowUserToEdit"
  >
    <template #content>
      <h3 class="category-header-medium">Restriction information</h3>
      <content-group>
        <title-value
          property-title="Category"
          :property-value="restrictionData?.restrictionCategory"
        />
        <title-value
          property-title="Reason"
          :property-value="restrictionData?.description"
        />
        <title-value
          v-if="restrictionData?.restrictionNote"
          property-title="Notes"
          :property-value="restrictionData?.restrictionNote"
        />
        <v-row
          ><v-col
            ><title-value
              property-title="Date created"
              :property-value="
                dateOnlyLongString(restrictionData?.createdAt)
              " /></v-col
          ><v-col
            ><title-value
              property-title="Created by"
              :property-value="restrictionData?.createdBy" /></v-col
          ><v-col
            ><title-value property-title="Status" /><status-chip-restriction
              :is-active="!!restrictionData?.isActive"
              :deleted-at="restrictionData?.deletedAt" /></v-col
        ></v-row>
      </content-group>
      <template v-if="showResolution">
        <h3 class="category-header-medium mt-2">Resolution</h3>
        <content-group
          v-if="
            !restrictionData?.isActive &&
            restrictionData?.restrictionType !== RestrictionType.Federal
          "
        >
          <title-value
            property-title="Resolution reason"
            :property-value="restrictionData?.resolutionNote"
          />
          <v-row
            ><v-col
              ><title-value
                property-title="Date resolved"
                :property-value="
                  dateOnlyLongString(restrictionData?.resolvedAt)
                " /></v-col
            ><v-col
              ><title-value
                property-title="Resolved by"
                :property-value="restrictionData?.resolvedBy" /></v-col
          ></v-row>
        </content-group>
      </template>
      <template v-if="showDeletion">
        <h3 class="category-header-medium mt-2">Deletion</h3>
        <content-group>
          <title-value
            property-title="Deletion reason"
            :property-value="restrictionData?.deletionNote"
          />
          <v-row
            ><v-col
              ><title-value
                property-title="Date deleted"
                :property-value="
                  dateOnlyLongString(restrictionData?.deletedAt)
                " /></v-col
            ><v-col
              ><title-value
                property-title="Deleted by"
                :property-value="restrictionData?.deletedBy" /></v-col
          ></v-row>
        </content-group>
      </template>
    </template>
  </user-note-confirm-modal>
</template>

<script lang="ts">
import { PropType, ref, reactive, computed, defineComponent } from "vue";
import UserNoteConfirmModal, {
  UserNoteModal,
} from "@/components/common/modals/UserNoteConfirmModal.vue";
import { ModalDialog, useFormatters } from "@/composables";
import { Role, RestrictionType, RestrictionStatus } from "@/types";
import { RestrictionDetailAPIOutDTO } from "@/services/http/dto";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import TitleValue from "@/components/generic/TitleValue.vue";

export default defineComponent({
  components: {
    StatusChipRestriction,
    TitleValue,
    UserNoteConfirmModal,
  },
  props: {
    restrictionData: {
      type: Object as PropType<RestrictionDetailAPIOutDTO>,
      required: true,
    },
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
    canResolveRestriction: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const { dateOnlyLongString } = useFormatters();
    const viewRestrictionModal = ref(
      {} as ModalDialog<UserNoteModal<unknown> | false>,
    );
    const formModel = reactive({} as RestrictionDetailAPIOutDTO);

    const showModal = async (): Promise<RestrictionDetailAPIOutDTO | false> => {
      if (!props.restrictionData) {
        return false;
      }
      const modalResult = await viewRestrictionModal.value.showModal();
      if (!modalResult) {
        return false;
      }
      formModel.restrictionId = props.restrictionData.restrictionId;
      formModel.resolutionNote = modalResult.note;
      return formModel;
    };

    const allowUserToEdit = computed(
      () =>
        !!props.restrictionData &&
        !props.restrictionData.deletedAt &&
        props.restrictionData.isActive &&
        props.restrictionData.restrictionType !== RestrictionType.Federal &&
        props.canResolveRestriction,
    );

    const showResolution = computed(() => {
      if (!props.restrictionData) {
        return false;
      }
      if (props.restrictionData.deletedAt) {
        // Show resolution section if the restriction was deleted, but has some note.
        return !!props.restrictionData.resolutionNote;
      }
      return (
        props.canResolveRestriction &&
        props.restrictionData.restrictionType !== RestrictionType.Federal &&
        // If no resolution note is present, consider no resolution was provided.
        // For instance, resolved provincial restrictions imported from legacy
        // will not have a resolution associated with it.
        (props.restrictionData.isActive || props.restrictionData.resolutionNote)
      );
    });

    const showDeletion = computed(() => {
      return !!props.restrictionData?.deletedAt;
    });

    return {
      viewRestrictionModal,
      showModal,
      RestrictionType,
      Role,
      formModel,
      RestrictionStatus,
      allowUserToEdit,
      showResolution,
      showDeletion,
      dateOnlyLongString,
    };
  },
});
</script>
