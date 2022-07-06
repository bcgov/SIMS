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
          <ul
            class="no-bullets"
            v-for="userType in slotProps.data.userType"
            :key="userType"
          >
            <li>{{ userType }}</li>
          </ul></template
        ></Column
      >
      <Column :field="UserFields.Role" header="Role"></Column>
      <Column :field="UserFields.Location" header="Locations"
        ><template #body="slotProps">
          <ul
            class="no-bullets"
            v-for="location in slotProps.data.location"
            :key="location"
          >
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
            @click="editInstitutionUser(slotProps.data.userName)"
            variant="text"
            text="Edit"
            color="primary"
            append-icon="mdi-pencil-outline"
          >
            <span class="text-decoration-underline">Edit</span>
          </v-btn>
          <v-btn
            v-if="slotProps.data.isActive"
            @click="editInstitutionUser(slotProps.data.userName)"
            variant="text"
            text="Edit"
            color="primary"
            append-icon="mdi-account-remove-outline"
          >
            <span class="text-decoration-underline">Deactivate</span>
          </v-btn>
          <!-- <InputSwitch
              v-model="slotProps.data.isActive"
              v-tooltip="
                slotProps.data.isActive ? 'Disable User' : 'Enable User'
              "
              @change="updateUserStatus(slotProps.data)"
            /> -->
        </template>
      </Column>
    </DataTable>
  </content-group>
  <!-- Add user -->
  <add-institution-user
    ref="addInstitutionUserModal"
    :institutionId="institutionId"
  />
  <!-- edit user -->
  <EditInstitutionUser
    :userType="userType"
    :showEditUser="showEditUser"
    :institutionUserName="institutionUserName"
    :adminRoles="adminRoles"
    @updateShowEditInstitutionModal="updateShowEditInstitutionModal"
    @getAllInstitutionUsers="getAllInstitutionUsers"
  />
</template>

<script lang="ts">
import { ref, computed, watch } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import AddInstitutionUser from "@/components/institutions/modals/AddInstitutionUserModal.vue";
import EditInstitutionUser from "@/components/institutions/modals/EditInstitutionUserModal.vue";
import { useToast } from "primevue/usetoast";
import { ModalDialog } from "@/composables";
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
import { AuthService } from "@/services/AuthService";

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
    const addInstitutionUserModal = ref({} as ModalDialog<boolean>);
    const toast = useToast();
    const showAddUser = ref(false);
    const showEditUser = ref(false);
    const usersListAndCount = ref({} as InstitutionUserAndCountForDataTable);
    const userType = ref();
    const loading = ref(false);
    const searchBox = ref("");
    const currentPage = ref();
    const currentPageLimit = ref();

    const institutionUserName = ref();
    const adminRoles = ref();

    const clientType = computed(() => AuthService.shared.authClientType);
    /**
     * function to load usersListAndCount respective to the client type
     * @param page page number, if nothing passed then DEFAULT_PAGE_NUMBER
     * @param pageCount page limit, if nothing passed then DEFAULT_PAGE_LIMIT
     * @param sortField sort field, if nothing passed then UserFields.DisplayName
     * @param sortOrder sort oder, if nothing passed then DataTableSortOrder.DESC
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

    const updateShowAddInstitutionModal = () => {
      showAddUser.value = !showAddUser.value;
    };

    const updateShowEditInstitutionModal = () => {
      showEditUser.value = !showEditUser.value;
    };

    const editInstitutionUser = async (userName: string) => {
      institutionUserName.value = userName;
      showEditUser.value = true;
    };

    const updateUserStatus = async (userDetails: InstitutionUserViewModel) => {
      try {
        await InstitutionService.shared.updateUserStatus(
          userDetails.userName,
          userDetails.isActive,
        );
        await getAllInstitutionUsers();
        toast.add({
          severity: "success",
          summary: `${userDetails.displayName} is ${
            userDetails.isActive ? "Enabled" : "Disabled"
          }`,
          detail: " Successfully!",
          life: 5000,
        });
      } catch (excp) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the update process.",
          life: 5000,
        });
      }
    };

    // pagination sort event callback
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

    // search user table
    const searchUserTable = async () => {
      await getAllInstitutionUsers(
        currentPage.value ?? DEFAULT_PAGE_NUMBER,
        currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
      );
    };

    watch(props.institutionId, () => getAllInstitutionUsers(), {
      immediate: true,
    });

    const openNewUserModal = async () => {
      const modalResult = await addInstitutionUserModal.value.showModal();
      if (modalResult) {
        // Refresh the list to display the added user.
        await getAllInstitutionUsers();
      }
    };

    return {
      addInstitutionUserModal,
      openNewUserModal,
      showAddUser,
      showEditUser,
      updateShowAddInstitutionModal,
      getAllInstitutionUsers,
      editInstitutionUser,
      updateShowEditInstitutionModal,
      userType,
      institutionUserName,
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
      adminRoles,
      clientType,
    };
  },
};
</script>
