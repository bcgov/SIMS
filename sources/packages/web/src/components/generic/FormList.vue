<template>
  <router-view v-if="loadChildren" />
  <div v-if="!loadChildren">
    <ProgressSpinner v-if="loading" />
    <OrderList v-else v-model="list" listStyle="height:auto" dataKey="_id">
      <template #header> List of Forms </template>
      <template #item="slotProps">
        <div class="p-d-flex p-jc-between">
          <div>
            <h5 class="p-mb-2">{{ slotProps.item.title }}</h5>
            <i class="pi pi-file-o"></i>
            <span>{{ `${slotProps.item.tags}` }}</span>
          </div>
          <div>
            <Button
              @click="
                () => {
                  handleOpen(slotProps.item);
                }
              "
              >Open</Button
            >
          </div>
        </div>
      </template>
    </OrderList>
  </div>
</template>

<script lang="ts">
import { onMounted, reactive, ref, onBeforeUpdate } from "vue";
import OrderList from "primevue/orderlist";
import ApiClient from "../../services/http/ApiClient";
import { useRouter, useRoute } from "vue-router";

interface FormDef {
  title: string;
  tags: string[];
  path: string;
}
export default {
  components: {
    OrderList,
  },
  setup() {
    const list = reactive([] as FormDef[]);
    const loadChildren = ref(false);
    const loading = ref(true);
    const router = useRouter();
    const route = useRoute();
    if (route.path.includes("load")) {
      loadChildren.value = true;
    } else {
      loadChildren.value = false;
    }

    const handleOpen = (data: FormDef) => {
      loadChildren.value = true;
      /*router.push({
        name: "formContainer",
        params: {
          formName: data.path,
        },
      });*/
      router.push(`/student/forms/load/${data.path}`);
    };

    onBeforeUpdate(() => {
      if (route.path.includes("load")) {
        loadChildren.value = true;
      } else {
        loadChildren.value = false;
      }
    });
    onMounted(async () => {
      const resp = await ApiClient.DynamicForms.getFormlist();
      const data: any[] = resp.data;
      loading.value = false;
      data.forEach((item: FormDef) => list.push(item));
    });

    return {
      list,
      handleOpen,
      loadChildren,
      loading,
    };
  },
};
</script>

<style></style>
