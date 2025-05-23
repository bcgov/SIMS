<template>
  <v-navigation-drawer app color="default" permanent>
    <v-list
      active-class="active-list-item"
      density="compact"
      bg-color="default"
      color="primary"
      class="no-wrap"
      :items="menuItems"
    />
    <template #append>
      <v-list
        density="compact"
        active-class="active-list-item"
        bg-color="default"
        class="no-wrap"
        color="primary"
        nav
      >
        <check-permission-role :role="Role.AESTCASInvoicing">
          <template #="{ notAllowed }">
            <v-list-item
              :to="{ name: AESTRoutesConst.CAS_INVOICES }"
              prepend-icon="mdi-invoice-outline"
              title="Invoices"
              :disabled="notAllowed"
            />
          </template>
        </check-permission-role>
        <check-permission-role :role="Role.AESTReports">
          <template #="{ notAllowed }">
            <v-list-item
              :to="{ name: AESTRoutesConst.REPORTS }"
              prepend-icon="mdi-content-copy"
              title="Reports"
              :disabled="notAllowed"
            />
          </template>
        </check-permission-role>
        <check-permission-role :role="Role.AESTQueueDashboardAdmin">
          <template #="{ isAllowed }">
            <v-list-item
              v-if="isAllowed"
              @click="redirectToQueuesDashboard"
              prepend-icon="mdi-monitor-dashboard"
              title="Queues Dashboard"
            />
          </template>
        </check-permission-role>
        <check-permission-role :role="Role.AESTFormEditor">
          <template #="{ isAllowed }">
            <v-list-item
              v-if="isAllowed"
              :to="{ name: AESTRoutesConst.DYNAMIC_FORM_EDITOR }"
              prepend-icon="mdi-format-float-left"
              title="Dynamic Forms Editor"
            />
          </template>
        </check-permission-role>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel, Role } from "@/types";
import { ref, defineComponent } from "vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { UserService } from "@/services/UserService";
import { AppConfigService } from "@/services/AppConfigService";

export default defineComponent({
  components: { CheckPermissionRole },
  setup() {
    const menuItems = ref<MenuItemModel[]>([
      {
        title: "Home",
        props: {
          prependIcon: "mdi-home-outline",
          to: {
            name: AESTRoutesConst.AEST_DASHBOARD,
          },
        },
      },
      {
        title: "Search Students",
        props: {
          prependIcon: "mdi-magnify",
          to: {
            name: AESTRoutesConst.SEARCH_STUDENTS,
          },
        },
      },
      {
        title: "Search Institutions",
        props: {
          prependIcon: "mdi-magnify",
          to: {
            name: AESTRoutesConst.SEARCH_INSTITUTIONS,
          },
        },
      },
      {
        type: "subheader",
        title: "Student requests",
      },
      {
        title: "Accounts",
        props: {
          prependIcon: "mdi-account-outline",
          to: {
            name: AESTRoutesConst.STUDENT_ACCOUNT_APPLICATIONS,
          },
        },
      },
      {
        title: "Exceptions",
        props: {
          prependIcon: "mdi-check-circle-outline",
          to: {
            name: AESTRoutesConst.APPLICATION_EXCEPTIONS_PENDING,
          },
        },
      },
      {
        title: "Change requests",
        props: {
          subtitle: "Pre 2025-2026",
          prependIcon: "mdi-folder-open-outline",
          to: {
            name: AESTRoutesConst.APPLICATION_APPEALS_PENDING,
          },
        },
      },
      {
        title: "Change requests",
        props: {
          subtitle: "2025-2026 and later",
          prependIcon: "mdi-folder-open-outline",
          to: {
            name: AESTRoutesConst.APPLICATION_CHANGE_REQUESTS_PENDING,
          },
        },
      },
      {
        type: "subheader",
        title: "Institution requests",
      },
      {
        title: "Designation requests",
        props: {
          prependIcon: "mdi-bookmark-outline",
          to: {
            name: AESTRoutesConst.PENDING_DESIGNATIONS,
          },
        },
      },
      {
        title: "Offering change requests",
        props: {
          prependIcon: "mdi-view-list-outline",
          to: {
            name: AESTRoutesConst.OFFERING_CHANGE_REQUESTS,
          },
        },
      },
      {
        title: "Change requests",
        props: {
          prependIcon: "mdi-folder-outline",
          to: {
            name: AESTRoutesConst.REQUEST_CHANGE_OFFERINGS,
          },
        },
      },
    ]);

    /**
     * Acquire a new token to allow the user to have access to the queues admin.
     */
    const redirectToQueuesDashboard = async () => {
      await UserService.shared.queueAdminTokenExchange();
      const { queueDashboardURL } = await AppConfigService.shared.config();
      window.open(queueDashboardURL, "_blank", "noopener,noreferrer");
    };

    return {
      menuItems,
      AESTRoutesConst,
      Role,
      redirectToQueuesDashboard,
    };
  },
});
</script>
