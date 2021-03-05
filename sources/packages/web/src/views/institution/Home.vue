<template>
  <div class="p-m-4">
    <h1>Home - Institution Dashboard</h1>
  </div>
  <Card class="p-m-4">
    <template #title>
      Welcome Institution - {{ user.givenNames }}, let's get started
    </template>
    <template #content>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </template>
    <template #footer>
      <Button
        label="Start Application"
        class="p-button-raised"
        @click="$router.push('/application')"
      />
    </template>
  </Card>
</template>
<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
export default {
  setup() {
    const store = useStore();
    const user = computed(() => store.state.student.profile);
    return {
      user,
    };
  },
};
</script>
