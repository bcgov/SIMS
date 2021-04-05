<template>
  <Message severity="info">
    Please notice that the read-only information below is retrieved from your BC
    Service Card and it is not possible to change it here. If any read-only
    information needs to be changed please visit
    <a href="http://id.gov.bc.ca" target="_blank">id.gov.bc.ca</a>.
  </Message>
  <Card class="p-m-4">
    <template #content>
      <formio
        formName="studentinformation"
        :data="init"
        @changed="changed"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { ref } from "vue";
import formio from "../../components/generic/formio.vue";
// import ApiClient from "../../services/http/ApiClient";

export default {
  components: { formio },
  setup() {
    const init = ref({
      givenNames: "Laba",
      lastName: "Ballabh",
    });
    const changed = (form: any, event: any) => {
      if (event.changed) {
        console.dir(event.changed.component);
      }
      console.dir(event.data);
    };

    const submitted = async (args: any) => {
      console.log(`Submission: \n ${JSON.stringify(args, null, 2)}`);
    };

    return { changed, submitted, init };
  },
};
</script>
