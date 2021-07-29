<template
  ><div class="p-m-4">
    <h1><strong>Page Under development</strong></h1>
    <v-btn color="primary" class="float-right ml-2" @click="toggle"
      >Application Options
      <v-icon size="25"> mdi-arrow-down-bold-circle</v-icon></v-btn
    >
    <Menu class="mt-n15" ref="menu" :model="items" :popup="true" />
    <v-btn
      color="primary"
      class="p-button-raised ml-2 float-right"
      @click="
        $router.push({
          name: StudentRoutesConst.ASSESSMENT,
          params: {
            applicationId: id,
          },
        })
      "
    >
      <v-icon size="25">mdi-text-box-plus</v-icon>
      View Assessment
    </v-btn>
  </div>
</template>
<script lang="ts">
import Menu from "primevue/menu";
import { onMounted, ref } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: {
    Menu,
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
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
    return { items, toggle, menu, StudentRoutesConst };
  },
};
</script>
