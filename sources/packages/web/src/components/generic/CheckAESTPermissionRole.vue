<template>
  <slot :isReadonly="isReadonly"></slot>
</template>

<script lang="ts">
import { computed, PropType } from "vue";
import { Role } from "@/types";
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
        const userRoles = userToken.resource_access[userToken.azp].roles;
        console.log(userRoles, props.role);
        return !userRoles?.includes(props.role);
      }
      return true;
    });

    return {
      isReadonly,
    };
  },
};
</script>
