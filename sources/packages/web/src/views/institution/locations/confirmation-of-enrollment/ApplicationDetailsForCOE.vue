<template>
  <v-container>
    <h5 class="text-muted">
      <a @click="goBack()">
        <v-icon left> mdi-arrow-left </v-icon> Back to Programs</a
      >
    </h5>
    <p class="font-weight-bold h2 color-blue">
      View Financial Aid Application
    </p>
    <v-btn color="primary" class="float-right ml-2" @click="toggle"
      >Application Options
      <v-icon size="25"> mdi-arrow-down-bold-circle</v-icon></v-btn
    >
    <Menu
      class="mt-n15 coe-menu-option"
      ref="menu"
      :model="items"
      :popup="true"
    />
    <div>
      <formio formName="confirmsstudentenrolment" :data="initialData"></formio>
    </div>
  </v-container>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import formio from "@/components/generic/formio.vue";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import Menu from "primevue/menu";

/**
 * added MenuType interface for prime vue component menu,
 *  remove it when vuetify componnt is used
 */
export interface MenuType {
  label?: string;
  icon?: string;
  separator?: boolean;
  command?: any;
}
export default {
  components: { formio, Menu },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const initialData = ref({});
    const menu = ref();
    const items = ref([] as MenuType[]);

    const goBack = () => {
      router.push({
        name: InstitutionRoutesConst.COE_SUMMARY,
      });
    };

    const loadMenu = () => {
      items.value = [
        {
          label: "Edit",
          icon: "pi pi-fw pi-pencil",
        },
        { separator: true },
        {
          label: "View",
          icon: "pi pi-fw pi-folder-open",
        },
        { separator: true },
        {
          label: "Cancel",
          icon: "pi pi-fw pi-trash text-danger",
        },
      ];
    };
    onMounted(async () => {
      loadMenu();
      initialData.value = await ConfirmationOfEnrollmentService.shared.getApplicationForCOE(
        props.applicationId,
        props.locationId,
      );
    });
    const toggle = (event: any) => {
      menu?.value?.toggle(event);
    };
    return { goBack, initialData, toggle, menu, items };
  },
};
</script>
