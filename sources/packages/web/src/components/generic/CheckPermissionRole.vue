<template>
  <slot :notAllowed="notAllowed" :isAllowed="isAllowed"></slot>
</template>

<script lang="ts">
import { computed, PropType } from "vue";
import { ClientIdType, Role } from "@/types";
import { AuthService } from "@/services/AuthService";
import { useAuth } from "@/composables";

export default {
  props: {
    role: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup(props: any) {
    const { hasRole } = useAuth();

    const notAllowed = computed(() => {
      const userToken = AuthService.shared.userToken;
      if (userToken?.azp === ClientIdType.AEST) {
        return !hasRole(props.role);
      }
      // Non-AEST client will come here, for instance,
      // for common components used in a non-AEST client,
      // like institution/student/supporting-user,
      // this permission check doesn't matter.
      return false;
    });

    const isAllowed = !notAllowed.value;

    return {
      notAllowed,
      isAllowed,
    };
  },
};
</script>
