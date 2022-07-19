<template>
  <Message severity="info">
    Please notice that the read-only information below is retrieved from your
    BCeID account and it is not possible to change it here. If any read-only
    information needs to be changed please visit
    <a rel="noopener" href="https://www.bceid.ca/" target="_blank">bceid.ca</a>.
  </Message>
  <v-card class="p-m-4">
    <template #content>
      <formio
        formName="institutionUserProfile"
        :data="initialData"
        @submitted="submitted"
      ></formio>
    </template>
  </v-card>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { UserService } from "../../services/UserService";
import { useToastMessage } from "@/composables";
import {
  InstitutionUserDetailsDto,
  InstitutionUserPersistDto,
} from "../../types";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import useEmitter from "@/composables/useEmitter";

export default {
  setup() {
    const emitter = useEmitter();
    // Hooks
    const toast = useToastMessage();
    const router = useRouter();
    // Data-bind
    const initialData = ref({});

    const submitted = async (data: InstitutionUserDetailsDto) => {
      const institutionUserPersistDto: InstitutionUserPersistDto = {
        userEmail: data.userEmail,
      };
      try {
        await UserService.shared.updateInstitutionUser(
          institutionUserPersistDto,
        );
        emitter.emit(
          "snackBar",
          toast.success1("Institution User successfully updated!"),
        );
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      } catch (excp) {
        emitter.emit(
          "snackBar",
          toast.error1("An error happened during the update process."),
        );
      }
    };

    // Hooks
    onMounted(async () => {
      const institutionUser = await UserService.shared.getInstitutionUser();
      if (institutionUser) {
        initialData.value = {
          userFirstName: institutionUser.userFirstName,
          userLastName: institutionUser.userLastName,
          userEmail: institutionUser.userEmail,
        };
      } else {
        emitter.emit(
          "snackBar",
          toast.error1("Unable to fetch Institution user account details."),
        );
      }
    });

    return {
      initialData,
      submitted,
    };
  },
};
</script>
