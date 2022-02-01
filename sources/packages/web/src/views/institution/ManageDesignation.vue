<template>
  <h5 class="text-muted">Manage designation</h5>
  <h2>View designations</h2>
  <full-page-container>
    <p>Designation agreements</p>
    <v-btn
      @click="goToRequestDesignation()"
      tile
      class="ml-2 primary-btn-background"
    >
      <font-awesome-icon :icon="['fas', 'external-link-square-alt']" />
      Request designation
    </v-btn>
    <p>
      Ensure you have an active designation to administer student financial
      assistance.
    </p>
  </full-page-container>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: { FullPageContainer },
  setup() {
    const router = useRouter();

    const goToRequestDesignation = () => {
      return router.push({
        name: InstitutionRoutesConst.DESIGNATION_REQUEST,
        params: {
          id: 123,
        },
      });
    };

    return { goToRequestDesignation };
  },
};
</script>
