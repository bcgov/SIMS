<template>
  <full-page-container>
    <v-btn
      @click="goToRequestDesignation()"
      tile
      class="ml-2 primary-btn-background"
    >
      <font-awesome-icon :icon="['fas', 'external-link-square-alt']" />
      Request designation
    </v-btn>
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
      });
    };

    return { goToRequestDesignation };
  },
};
</script>
