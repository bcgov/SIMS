<template>
  <chip-status status="success" :label="clientTypeLabel" />
</template>

<script lang="ts">
import { RestrictedParty } from "@/types";
import { computed, defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    clientType: {
      type: String as PropType<
        RestrictedParty.Student | RestrictedParty.Institution
      >,
      required: true,
    },
  },
  setup(props) {
    const clientTypeLabel = computed(() =>
      props.clientType === RestrictedParty.Student ? "Student" : "Institution",
    );
    return { clientTypeLabel };
  },
});
</script>
