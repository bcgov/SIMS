<template>
  <div>
    <h2>Manage Institution Locations</h2>
    <div class="p-d-flex p-jc-end">
      <Button
        label="Add New Location"
        icon="pi pi-map-marker"
        iconPos="right"
        @click="goToAddNewLocation()"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";

export default {

  setup(props: any) {
    const router = useRouter();

    const goToAddNewLocation = () => {
      router.push({ name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION });
    };

    return { goToAddNewLocation };
  }
}
</script>

<style></style>
