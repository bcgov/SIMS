<template>
  <v-container>
    <h5 class="color-grey">Manage Desgination</h5>
    <h2>Desgination In Progress</h2>
  </v-container>
</template>

<script lang="ts">
import { useStore, mapActions } from "vuex";

export default {
  props: {
    showManageInstitutionSideBar: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    ...mapActions(["setShowHome", "setShowManageLocation"]),
  },
  setup(props: any) {
    const store = useStore();
    // to manage sidebar
    store.dispatch("institution/setShowManageInstitution", props.showManageInstitutionSideBar);
    store.dispatch("institution/setShowHome", !props.showManageInstitutionSideBar);
    return {
      store,
    };
  },
};
</script>
