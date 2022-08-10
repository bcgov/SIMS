<template>
  <slot :isReadonly="isReadonly"></slot>
</template>

<script lang="ts">
import { computed, PropType } from "vue";
import { ClientIdType, Role } from "@/types";
import { AuthService } from "@/services/AuthService";

export default {
  props: {
    role: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup(props: any) {
    const isReadonly = computed(() => {
      const userToken = AuthService.shared.userToken;
      if (userToken?.resource_access && userToken?.azp) {
        if (userToken.azp === ClientIdType.AEST) {
          const userRoles = userToken.resource_access[userToken.azp].roles;
          return !userRoles?.includes(props.role);
        }
        /**
         * Non aest client will come here. for eg, common components used in non AEST client like institution/student/supporting-user
         * this permission check doesn't matter.
         */
        return false;
      }
      return true;
    });

    return {
      isReadonly,
    };
  },
};
</script>
