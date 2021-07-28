<template>
  <v-btn color="primary" class="float-right" @click="toggle"
    >Application Options &#9660;</v-btn
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
    onMounted(() => {
      items.value = [
        { label: "Edit application", icon: "pi pi-fw pi-pencil" },
        {
          label: "Cancel application",
          icon: "pi pi-fw pi-trash",
        },
      ];
    });
    return { items };
  },
  methods: {
    toggle(event: any) {
      this.$refs.menu.toggle(event);
    },
  },
};
</script>
