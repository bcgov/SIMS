<template>
  <v-container>
    <v-card class="p-4">
      <formio
        formName="supportingusersparent"
        :data="initialData"
        @submitted="submitted"
      ></formio>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import { useRouter } from "vue-router";
import { useAuthBCSC, useFormatters } from "@/composables";
import { SupportingUsersRoutesConst } from "@/constants/routes/RouteConstants";
import { ref } from "vue";
export default {
  components: {
    formio,
  },
  setup() {
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const { bcscParsedToken } = useAuthBCSC();
    const initialData = ref();
    console.log(bcscParsedToken);
    initialData.value = {
      ...bcscParsedToken,
      dateOfBirth: dateOnlyLongString(bcscParsedToken.birthdate),
    };

    const submitted = (formData: any) => {
      console.log(formData);
    };

    return { initialData, submitted };
  },
};
</script>
