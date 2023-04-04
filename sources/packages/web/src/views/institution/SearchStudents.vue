<template>
  <search-students-common :search-type="SearchTypes.Institution" />
</template>
<script lang="ts">
import { defineComponent } from "vue";
import SearchStudentsCommon from "@/components/common/SearchStudentsCommon.vue";
import { SearchTypes } from "@/constants/search-types";
export default defineComponent({
  components: {
    SearchStudentsCommon,
  },
  setup() {
    return {
      SearchTypes,
    };
  },
});
</script>
