<!-- This component is shared between ministry and student users -->
<template>
  <body-header-container>
    <template #header>
      <body-header title="All users" :records-count="usersListAndCount.count">
        <template #subtitle>
          <ul>
            <li>
              Admin roles can access <strong>all features</strong
              ><tooltip-icon
                >Admin's can setup and manage your users, institution profile,
                locations, designation, and offering uploads including
                performing user role duties.</tooltip-icon
              >
            </li>
            <li>
              User roles can access <strong>some features</strong
              ><tooltip-icon
                >Users can only manage programs and offerings within their
                locations, program information requests, confirming enrolment,
                and reporting on scholastic standings.</tooltip-icon
              >
            </li>
            <li>
              Legal Signing Authority role is an admin with
              <strong>an additional feature</strong
              ><tooltip-icon
                >This role is only to request a designation for your
                institution. The user must be an admin first to get assigned
                this role.</tooltip-icon
              >
            </li>
            <li>
              Read-only role is any user type who is restricted to read-only
              capabilities.
            </li>
          </ul>
        </template>

        <template #actions>
          <v-row class="m-0 p-0">
            <v-text-field
              density="compact"
              label="Search name"
              variant="outlined"
              v-model="searchBox"
              data-cy="searchBox"
              @keyup.enter="searchUserTable"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
            >
            </v-text-field>
            <check-permission-role :role="Role.InstitutionAddNewUser">
              <template #="{ notAllowed }">
                <v-btn
                  v-if="hasBusinessGuid || allowBasicBCeIDCreation"
                  class="ml-2"
                  color="primary"
                  :disabled="notAllowed"
                  data-cy="addNewUser"
                  @click="openNewUserModal"
                  prepend-icon="fa:fa fa-plus-circle"
                >
                  Add new user
                </v-btn>
              </template>
            </check-permission-role>
          </v-row>
        </template>
      </body-header>
    </template>
    <content-group>
      <toggle-content
        :toggled="!usersListAndCount.count && !loading"
        message="No users found."
      >
        <v-data-table-server
          v-if="usersListAndCount?.count"
          :headers="InstitutionUsersHeaders"
          :items="usersListAndCount?.results"
          :items-length="usersListAndCount?.count"
          :loading="loading"
          item-value="id"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
          @update:options="pageSortEvent"
        >
          <template #[`item.displayName`]="{ item }">
            {{ item.displayName }}
          </template>
          <template #[`item.email`]="{ item }">
            {{ item.email }}
          </template>
          <template #[`item.userType`]="{ item }">
            <span class="text-capitalize">{{ item.userType }}</span>
          </template>
          <template #[`item.roles`]="{ item }">
            <span class="text-capitalize">
              {{ institutionUserRoleToDisplay(item.roles[0]) }}
            </span>
          </template>
          <template #[`item.locations`]="{ item }">
            <ul v-for="location in item.locations" :key="location">
              <li>{{ location }}</li>
            </ul>
          </template>
          <template #[`item.isActive`]="{ item }">
            <status-chip-active-user :is-active="item.isActive" />
          </template>
          <template #[`item.action`]="{ item }">
            <check-permission-role :role="Role.InstitutionEditUser">
              <template #="{ notAllowed }">
                <v-btn
                  :disabled="!item.isActive || notAllowed"
                  @click="openEditUserModal(item)"
                  variant="text"
                  color="primary"
                  append-icon="mdi-pencil-outline"
                  data-cy="editUser"
                >
                  <span class="text-decoration-underline"
                    ><strong>Edit</strong></span
                  >
                </v-btn>
              </template>
            </check-permission-role>
            <check-permission-role :role="Role.InstitutionEnableDisableUser">
              <template #="{ notAllowed }">
                <v-btn
                  :disabled="item.disableRemove || notAllowed"
                  @click="updateUserStatus(item)"
                  variant="text"
                  color="primary"
                  append-icon="fa:far fa-user"
                  data-cy="disableUser"
                >
                  <span class="text-decoration-underline"
                    ><strong>{{
                      item.isActive ? "Disable" : "Enable"
                    }}</strong></span
                  >
                </v-btn>
              </template>
            </check-permission-role>
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
    <!-- Add user. -->
    <add-institution-user
      ref="addInstitutionUserModal"
      :institution-id="institutionId"
      :has-business-guid="hasBusinessGuid"
      :can-search-b-ce-i-d-users="canSearchBCeIDUsers"
    />
    <!-- Edit user. -->
    <edit-institution-user
      ref="editInstitutionUserModal"
      :institution-id="institutionId"
      :has-business-guid="hasBusinessGuid"
    />
  </body-header-container>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import { useDisplay } from "vuetify";

import AddInstitutionUser from "@/components/institutions/modals/AddInstitutionUserModal.vue";
import EditInstitutionUser from "@/components/institutions/modals/EditInstitutionUserModal.vue";
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";
import StatusChipActiveUser from "@/components/generic/StatusChipActiveUser.vue";
import {
  InstitutionUserViewModel,
  InstitutionUserSummary,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  ITEMS_PER_PAGE,
  DataTableSortByOrder,
  ApiProcessError,
  Role,
  InstitutionUsersHeaders,
  DataTableOptions,
  PaginationOptions,
} from "@/types";
import { INSTITUTION_MUST_HAVE_AN_ADMIN } from "@/constants";
import { InstitutionUserService } from "@/services/InstitutionUserService";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

const DEFAULT_SORT_FIELD = "displayName";

export default defineComponent({
  components: {
    AddInstitutionUser,
    EditInstitutionUser,
    StatusChipActiveUser,
    CheckPermissionRole,
  },
  props: {
    institutionId: {
      type: Number,
      required: false,
      default: undefined,
    },
    hasBusinessGuid: {
      type: Boolean,
      required: true,
    },
    canSearchBCeIDUsers: {
      type: Boolean,
      required: true,
      default: false,
    },
    allowBasicBCeIDCreation: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const { institutionUserRoleToDisplay } = useFormatters();
    const { mobile: isMobile } = useDisplay();

    const usersListAndCount = ref({} as InstitutionUserSummary);
    const loading = ref(false);
    const searchBox = ref("");

    const addInstitutionUserModal = ref({} as ModalDialog<boolean>);
    const editInstitutionUserModal = ref(
      {} as ModalDialog<boolean, InstitutionUserViewModel>,
    );

    /**
     * Current state of the pagination.
     */
    const currentPagination: PaginationOptions = {
      page: DEFAULT_DATATABLE_PAGE_NUMBER,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortByOrder.ASC,
    };

    /**
     * Loads Users for the Institution.
     */
    const getAllInstitutionUsers = async () => {
      try {
        loading.value = true;
        usersListAndCount.value =
          await InstitutionUserService.shared.institutionUserSummary(
            {
              searchCriteria: searchBox.value,
              ...currentPagination,
            },
            props.institutionId,
          );
      } catch {
        snackBar.error("Unexpected error while loading Institution Users.");
      } finally {
        loading.value = false;
      }
    };

    const updateUserStatus = async (userDetails: InstitutionUserViewModel) => {
      try {
        const enabled = !userDetails.isActive;
        await InstitutionUserService.shared.updateUserStatus(
          userDetails.institutionUserId,
          enabled,
        );
        await getAllInstitutionUsers();
        snackBar.success(
          `${userDetails.displayName} is ${enabled ? "enabled" : "disabled"}`,
        );
      } catch (error: unknown) {
        if (
          error instanceof ApiProcessError &&
          error.errorType === INSTITUTION_MUST_HAVE_AN_ADMIN
        ) {
          snackBar.warn(
            `Cannot disable the institution admin. ${error.message}`,
          );
          return;
        }
        snackBar.error("An error happened during the update process.");
      }
    };

    /**
     * Page/Sort event handler.
     * @param event The data table page/sort event.
     */
    const pageSortEvent = async (event: DataTableOptions) => {
      currentPagination.page = event.page;
      currentPagination.pageLimit = event.itemsPerPage;
      if (event.sortBy.length) {
        const [sortBy] = event.sortBy;
        currentPagination.sortField = sortBy.key;
        currentPagination.sortOrder = sortBy.order;
      } else {
        // Sorting was removed, reset to default.
        currentPagination.sortField = DEFAULT_SORT_FIELD;
        currentPagination.sortOrder = DataTableSortByOrder.ASC;
      }
      await getAllInstitutionUsers();
    };

    // Search user table.
    const searchUserTable = async () => {
      await getAllInstitutionUsers();
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
      const modalResult =
        await editInstitutionUserModal.value.showModal(userDetails);
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
      institutionUserRoleToDisplay,
      updateUserStatus,
      pageSortEvent,
      loading,
      searchUserTable,
      searchBox,
      usersListAndCount,
      DEFAULT_PAGE_LIMIT,
      DEFAULT_DATATABLE_PAGE_NUMBER,
      ITEMS_PER_PAGE,
      Role,
      InstitutionUsersHeaders,
      isMobile,
    };
  },
});
</script>
