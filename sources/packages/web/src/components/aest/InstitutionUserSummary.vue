<template>
  <!-- This component is shared between ministry and student users -->
  <div class="row p-3">
    <div class="col">
      <span class="category-header-large color-blue">
        All Users({{ usersListAndCount.totalUsers }})
      </span>
    </div>
    <div class="col">
      <div class="row float-right">
        <InputText
          v-model="searchBox"
          placeholder="Search User"
          @keyup.enter="searchUserTable()"
        />
        <v-btn
          @click="searchUserTable()"
          tile
          class="ml-2 primary-btn-background"
        >
          <font-awesome-icon :icon="['fas', 'search']" />
        </v-btn>

        <v-btn
          v-if="clientType === ClientIdType.Institution"
          class="ml-2 primary-btn-background"
          @click="openNewUserModal()"
        >
          <font-awesome-icon :icon="['fas', 'external-link-square-alt']" />
          Add New User
        </v-btn>

        <!-- Add user -->
        <AddInstitutionUser
          :userType="userType"
          :showAddUser="showAddUser"
          :adminRoles="adminRoles"
          @updateShowAddInstitutionModal="updateShowAddInstitutionModal"
          @getAllInstitutionUsers="getAllInstitutionUsers"
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
      </div>
    </div>
  </div>
  <ContentGroup>
    <DataTable
      :value="usersListAndCount.users"
      :lazy="true"
      :paginator="true"
      :rows="DEFAULT_PAGE_LIMIT"
      :rowsPerPageOptions="PAGINATION_LIST"
      :totalRecords="usersListAndCount.totalUsers"
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
          <StatusBadge
            :status="
              slotProps.data.isActive
                ? GeneralStatusForBadge.Active
                : GeneralStatusForBadge.InActive
            "
          /> </template
      ></Column>
      <Column
        field=""
        header="Actions"
        v-if="clientType === ClientIdType.Institution"
        ><template #body="slotProps">
          <span v-if="slotProps.data.userName !== parsedToken?.userName">
            <v-btn @click="editInstitutionUser(slotProps.data.userName)" plain>
              <font-awesome-icon
                :icon="['fas', 'pen']"
                v-if="slotProps.data.isActive"
                right
                v-tooltip="'Edit User'"
              >
              </font-awesome-icon
              ><font-awesome-icon
                :icon="['fas', 'pen']"
                v-else
                right
                v-tooltip="'Disabled User Cannot Be Edited'"
              >
                mdi-pencil
              </font-awesome-icon>
            </v-btn>
            <InputSwitch
              v-model="slotProps.data.isActive"
              v-tooltip="
                slotProps.data.isActive ? 'Disable User' : 'Enable User'
              "
              @change="updateUserStatus(slotProps.data)"
            />
          </span>
        </template>
      </Column>
    </DataTable>
  </ContentGroup>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import AddInstitutionUser from "@/components/institutions/modals/AddInstitutionUserModal.vue";
import EditInstitutionUser from "@/components/institutions/modals/EditInstitutionUserModal.vue";
import { useToast } from "primevue/usetoast";
import { useAuth } from "@/composables";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import StatusBadge from "@/components/generic/StatusBadge.vue";
import {
  InstitutionUserViewModel,
  InstitutionUserAndCountForDataTable,
  ClientIdType,
  GeneralStatusForBadge,
  UserFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  DataTableSortOrder,
  PAGINATION_LIST,
} from "@/types";
import InputSwitch from "primevue/inputswitch";

export default {
  components: {
    AddInstitutionUser,
    EditInstitutionUser,
    ContentGroup,
    StatusBadge,
    InputSwitch,
  },
  props: {
    clientType: {
      type: String,
      required: true,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const { parsedToken } = useAuth();
    const toast = useToast();
    const showAddUser = ref(false);
    const showEditUser = ref(false);
    const usersListAndCount = ref({} as InstitutionUserAndCountForDataTable);
    const userRoleType = ref();
    const userType = ref();
    const loading = ref(false);
    const defaultSortOrder = -1;
    const searchBox = ref("");
    const currentPage = ref();
    const currentPageLimit = ref();
    const openNewUserModal = () => {
      showAddUser.value = true;
    };
    const institutionUserName = ref();
    const adminRoles = ref();
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
      switch (props.clientType) {
        case ClientIdType.Institution:
          usersListAndCount.value = await InstitutionService.shared.institutionSummary(
            page,
            pageCount,
            searchBox.value,
            sortField,
            sortOrder,
          );
          break;
        case ClientIdType.AEST:
          usersListAndCount.value = await InstitutionService.shared.institutionSummaryForAEST(
            props.institutionId,
            page,
            pageCount,
            searchBox.value,
            sortField,
            sortOrder,
          );
          break;
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
      loading.value = true;
      currentPage.value = event?.page;
      currentPageLimit.value = event?.rows;
      await getAllInstitutionUsers(
        event.page,
        event.rows,
        event.sortField,
        event.sortOrder,
      );
      loading.value = false;
    };

    // search user table
    const searchUserTable = async () => {
      await getAllInstitutionUsers(
        currentPage.value ?? DEFAULT_PAGE_NUMBER,
        currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
      );
    };

    onMounted(async () => {
      // Call Service
      await getAllInstitutionUsers();

      if (props.clientType === ClientIdType.Institution) {
        // Get User type and Role
        userRoleType.value = await InstitutionService.shared.getUserTypeAndRoles();
        userType.value = userRoleType.value?.userTypes
          ? userRoleType.value.userTypes.map((el: string) =>
              el !== "admin" ? { name: el, code: el } : null,
            )
          : [];

        adminRoles.value = await InstitutionService.shared.getGetAdminRoleOptions();
      }
    });
    return {
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
      parsedToken,
      ClientIdType,
      GeneralStatusForBadge,
      paginationAndSortEvent,
      loading,
      defaultSortOrder,
      searchUserTable,
      searchBox,
      UserFields,
      usersListAndCount,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      adminRoles,
    };
  },
};
</script>
