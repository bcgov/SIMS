<template>
  <div>
    <NavBar title="INSTITUTION APPLICATION" :clientType="ClientIdType.INSTITUTION">
      <template #end>
        <Button
          v-if="isAuthenticated"
          label="Home"
          icon="pi pi-fw pi-home"
          class="p-button-text"
          style="color: white"
          @click="
            $router.push({
              name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
            })
          "
        />
        <Button
          v-if="isAuthenticated && isAdmin"
          label="Manage Institution"
          icon="pi pi-fw pi-map-marker"
          class="p-button-text"
          style="color: white"
          @click="
            $router.push({
              name: InstitutionRoutesConst.MANAGE_LOCATIONS,
            })
          "
        />
      </template>
    </NavBar>
  </div>
</template>

<script lang="ts">
import { useStore } from "vuex";
import { InstitutionRoutesConst } from "../../../../constants/routes/RouteConstants";
import { ClientIdType } from "../../../../types/contracts/ConfigContract";
import NavBar from "../../../../components/partial-view/student/NavBar.vue";
import { computed } from "vue";

export default {
  components: {
    NavBar,
  },
  props: {
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const store = useStore();
    const isAdmin = computed(() => store.state.institution.userState?.isAdmin);
    return {
      InstitutionRoutesConst,
      ClientIdType,
      isAdmin,
    };
  },
};
</script>
