<!-- This component is shared between ministry and student users -->
<template>
  <body-header-container>
    <template #header>
      <body-header title="All users" :recordsCount="usersListAndCount.count">
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
        breakpoint="1250px"
        data-cy="usersList"
      >
        <template #empty>
          <p class="text-center font-weight-bold">No records found.</p>
        </template>
        <Column
          :field="UserFields.DisplayName"
          header="Name"
          :sortable="true"
        ></Column>
        <Column
          :field="UserFields.Email"
          header="Email"
          :sortable="true"
          data-cy="userEmail"
        ></Column>
        <Column :field="UserFields.UserType" header="User Type">
          <template #body="slotProps">
            <span data-cy="userType" class="text-capitalize">{{
              slotProps.data.userType
            }}</span>
          </template></Column
        >
        <Column :field="UserFields.Roles" header="Role">
          <template #body="slotProps">
            <span class="text-capitalize"
              >{{ institutionUserRoleToDisplay(slotProps.data.roles[0]) }}
            </span>
          </template>
        </Column>
        <Column :field="UserFields.Locations" header="Locations"
          ><template #body="slotProps">
            <ul v-for="location in slotProps.data.locations" :key="location">
              <li>{{ location }}</li>
            </ul></template
          ></Column
        >
        <Column :field="UserFields.IsActive" header="Status"
          ><template #body="slotProps">
            <status-chip-active-user
              :is-active="slotProps.data.isActive"
              data-cy="userStatus"
            /> </template
        ></Column>
        <Column header="Action"
          ><template #body="slotProps">
            <check-permission-role :role="Role.InstitutionEditUser">
              <template #="{ notAllowed }">
                <v-btn
                  :disabled="!slotProps.data.isActive || notAllowed"
                  @click="openEditUserModal(slotProps.data)"
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
                  :disabled="slotProps.data.disableRemove || notAllowed"
                  @click="updateUserStatus(slotProps.data)"
                  variant="text"
                  color="primary"
                  append-icon="fa:far fa-user"
                  data-cy="disableUser"
                >
                  <span class="text-decoration-underline"
                    ><strong>{{
                      slotProps.data.isActive ? "Disable" : "Enable"
                    }}</strong></span
                  >
                </v-btn>
              </template>
            </check-permission-role>
          </template>
        </Column>
      </DataTable>
    </content-group>
    <!-- Add user. -->
    <add-institution-user
      ref="addInstitutionUserModal"
      :institutionId="institutionId"
      :hasBusinessGuid="hasBusinessGuid"
      :canSearchBCeIDUsers="canSearchBCeIDUsers"
    />
    <!-- Edit user. -->
    <edit-institution-user
      ref="editInstitutionUserModal"
      :institutionId="institutionId"
      :hasBusinessGuid="hasBusinessGuid"
    />
  </body-header-container>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import AddInstitutionUser from "@/components/institutions/modals/AddInstitutionUserModal.vue";
import EditInstitutionUser from "@/components/institutions/modals/EditInstitutionUserModal.vue";
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";
import StatusChipActiveUser from "@/components/generic/StatusChipActiveUser.vue";
import {
  InstitutionUserViewModel,
  InstitutionUserSummary,
  UserFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  DataTableSortOrder,
  PAGINATION_LIST,
  ApiProcessError,
  Role,
} from "@/types";
import { INSTITUTION_MUST_HAVE_AN_ADMIN } from "@/constants";
import { InstitutionUserService } from "@/services/InstitutionUserService";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

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
    const usersListAndCount = ref({} as InstitutionUserSummary);
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
          await InstitutionUserService.shared.institutionUserSummary(
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
      institutionUserRoleToDisplay,
      updateUserStatus,
      paginationAndSortEvent,
      loading,
      searchUserTable,
      searchBox,
      UserFields,
      usersListAndCount,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      Role,
    };
  },
});
</script>
