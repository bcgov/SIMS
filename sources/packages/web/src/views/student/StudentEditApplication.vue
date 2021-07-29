<template>
  <v-btn color="primary" class="float-right" @click="toggle"
    >Application Options
    <v-icon size="25"> mdi-arrow-down-bold-circle</v-icon></v-btn
  >
  <Menu class="mt-n15" ref="menu" :model="items" :popup="true" />
</template>
<script lang="ts">
import Menu from "primevue/menu";
import { onMounted, ref } from "vue";

export default {
  components: {
    Menu,
  },
  setup() {
    const items = ref();
    const menu = ref();

    onMounted(() => {
      items.value = [
        { label: "Edit application", icon: "pi pi-fw pi-pencil" },
        { separator: true },
        {
          label: "Cancel application",
          icon: "pi pi-fw pi-trash",
        },
      ];
    });
    const toggle = (event: any) => {
      menu?.value?.toggle(event);
    };
    return { items, toggle, menu };
  },
};
</script>
