<!-- This component is shared between ministry and student users -->
<template>
  <body-header
    title="All users"
    class="m-1"
    :recordsCount="usersListAndCount.count"
  >
    <template #actions>
      <v-btn
        class="ml-2 primary-btn-background float-right"
        @click="openNewUserModal"
        prepend-icon="fa:fa fa-plus-circle"
      >
        Add new user
      </v-btn>
      <v-btn
        class="ml-2 primary-btn-background float-right"
        @click="searchUserTable"
        prepend-icon="fa:fas fa-magnifying-glass"
      />
      <v-text-field
        class="v-text-field-search-width float-right"
        density="compact"
        label="Search user"
        variant="outlined"
        v-model="searchBox"
        @keyup.enter="searchUserTable"
        prepend-inner-icon="fa:fas fa-magnifying-glass"
      >
      </v-text-field>
    </template>
  </body-header>
  <content-group>
    <DataTable
      :value="usersListAndCount.results"
      :lazy="true"
      :paginator="true"
      :rows="DEFAULT_PAGE_LIMIT"
      :rowsPerPageOptions="PAGINATION_LIST"
      :totalRecords="usersListAndCount.count"
      @page="paginationAndSortEvent($event)"
      @sort="paginationAndSortEvent($event)"
      :loading="loading"
    >
      <template #empty>
        <p class="text-center font-weight-bold">No records found.</p>
      </template>
      <Column
        :field="UserFields.DisplayName"
        header="Name"
        sortable="true"
      ></Column>
      <Column :field="UserFields.Email" header="Email" sortable="true"></Column>
      <Column :field="UserFields.UserType" header="User Type">
        <template #body="slotProps">
          <!-- Get the first index of the array since the user will have admin or user type only. -->
          {{ slotProps.data.userType[0] }}
        </template></Column
      >
      <Column :field="UserFields.Role" header="Role"></Column>
      <Column :field="UserFields.Location" header="Locations"
        ><template #body="slotProps">
          <ul v-for="location in slotProps.data.location" :key="location">
            <li>{{ location }}</li>
          </ul></template
        ></Column
      >
      <Column :field="UserFields.IsActive" header="Status"
        ><template #body="slotProps">
          <status-chip-active-user
            :is-active="slotProps.data.isActive"
          /> </template
      ></Column>
      <Column header="Actions"
        ><template #body="slotProps">
          <v-btn
            v-if="slotProps.data.isActive"
            @click="openEditUserModal(slotProps.data)"
            variant="text"
            text="Edit"
            color="primary"
            append-icon="mdi-pencil-outline"
          >
            <span class="text-decoration-underline">Edit</span>
          </v-btn>
          <v-btn
            @click="updateUserStatus(slotProps.data)"
            variant="text"
            text="Edit"
            color="primary"
            append-icon="mdi-account-remove-outline"
          >
            <span class="text-decoration-underline">{{
              slotProps.data.isActive ? "Disable User" : "Enable User"
            }}</span>
          </v-btn>
        </template>
      </Column>
    </DataTable>
  </content-group>
  <!-- Add user. -->
  <add-institution-user
    ref="addInstitutionUserModal"
    :institutionId="institutionId"
  />
  <!-- Edit user. -->
  <edit-institution-user
    ref="editInstitutionUserModal"
    :institutionId="institutionId"
  />
</template>

<script lang="ts">
import { ref, watch } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import AddInstitutionUser from "@/components/institutions/modals/AddInstitutionUserModal.vue";
import EditInstitutionUser from "@/components/institutions/modals/EditInstitutionUserModal.vue";
import { ModalDialog, useToastMessage } from "@/composables";
import StatusChipActiveUser from "@/components/generic/StatusChipActiveUser.vue";
import {
  InstitutionUserViewModel,
  InstitutionUserAndCountForDataTable,
  GeneralStatusForBadge,
  UserFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  DataTableSortOrder,
  PAGINATION_LIST,
} from "@/types";

export default {
  components: {
    AddInstitutionUser,
    EditInstitutionUser,
    StatusChipActiveUser,
  },
  props: {
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const toast = useToastMessage();
    const usersListAndCount = ref({} as InstitutionUserAndCountForDataTable);
    const loading = ref(false);
    const searchBox = ref("");
    const currentPage = ref();
    const currentPageLimit = ref();
    const addInstitutionUserModal = ref({} as ModalDialog<boolean>);
    const editInstitutionUserModal = ref(
      {} as ModalDialog<boolean, InstitutionUserViewModel>,
    );

    /**
     * Function to load usersListAndCount respective to the client type.
     * @param page page number, if nothing passed then DEFAULT_PAGE_NUMBER.
     * @param pageCount page limit, if nothing passed then DEFAULT_PAGE_LIMIT.
     * @param sortField sort field, if nothing passed then UserFields.DisplayName.
     * @param sortOrder sort oder, if nothing passed then DataTableSortOrder.DESC.
     */
    const getAllInstitutionUsers = async (
      page = DEFAULT_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField = UserFields.DisplayName,
      sortOrder = DataTableSortOrder.ASC,
    ) => {
      loading.value = true;
      try {
        usersListAndCount.value =
          await InstitutionService.shared.institutionUserSummary(
            {
              page: page,
              pageLimit: pageCount,
              searchCriteria: searchBox.value,
              sortField: sortField,
              sortOrder: sortOrder,
            },
            props.institutionId,
          );
      } finally {
        loading.value = false;
      }
    };

    const updateUserStatus = async (userDetails: InstitutionUserViewModel) => {
      try {
        const enabled = !userDetails.isActive;
        await InstitutionService.shared.updateUserStatus(
          userDetails.userName,
          enabled,
        );
        await getAllInstitutionUsers();
        toast.success(
          "User status updated",
          `${userDetails.displayName} is ${enabled ? "enabled" : "disabled"}`,
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened during the update process.",
        );
      }
    };

    // Pagination sort event callback.
    const paginationAndSortEvent = async (event: any) => {
      currentPage.value = event?.page;
      currentPageLimit.value = event?.rows;
      await getAllInstitutionUsers(
        event.page,
        event.rows,
        event.sortField,
        event.sortOrder,
      );
    };

    // Search user table.
    const searchUserTable = async () => {
      await getAllInstitutionUsers(
        currentPage.value ?? DEFAULT_PAGE_NUMBER,
        currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
      );
    };

    watch(
      () => props.institutionId,
      () => getAllInstitutionUsers(),
      {
        immediate: true,
      },
    );

    const openNewUserModal = async () => {
      const modalResult = await addInstitutionUserModal.value.showModal();
      if (modalResult) {
        // Refresh the list to display the added user.
        await getAllInstitutionUsers();
      }
    };

    const openEditUserModal = async (userDetails: InstitutionUserViewModel) => {
      const modalResult = await editInstitutionUserModal.value.showModal(
        userDetails,
      );
      if (modalResult) {
        // Refresh the list to display the updated user.
        await getAllInstitutionUsers();
      }
    };

    return {
      addInstitutionUserModal,
      editInstitutionUserModal,
      openNewUserModal,
      openEditUserModal,
      getAllInstitutionUsers,
      updateUserStatus,
      GeneralStatusForBadge,
      paginationAndSortEvent,
      loading,
      searchUserTable,
      searchBox,
      UserFields,
      usersListAndCount,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
    };
  },
};
</script>
