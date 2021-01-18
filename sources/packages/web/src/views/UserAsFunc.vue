<template>
  <Card class="p-m-4">
    <template #title>
      Parsed Token
    </template>
    <template #content>
      <div v-if="user" class="p-fluid p-formgrid p-grid">
        <div
          v-for="(value, name) in user"
          :key="name"
          class="p-field p-sm-6 p-col-12"
        >
          <label>{{ name }}</label>
          <InputText :value="value" readonly />
        </div>
      </div>
    </template>
  </Card>
</template>

<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";

export default {
  setup() {
    const store = useStore();
    const user = computed(() => store.state.auth);
    return { user };
  }
};
</script>
