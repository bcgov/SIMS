<template>
  <div class="p-grid p-m-2">
    <div>
      <Dropdown
        class="p-col-12"
        v-model="selectedItem"
        :options="institutes"
        optionLabel="name"
        placeholder="Search for your school"
        @change="onChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { SetupContext, onMounted, ref } from "vue";
import { InstituteService, Institute } from "../../services/InstituteService";
// import Dropdown from "primevue/dropdown";

export default {
  emits: ["update:modelValue", "change"],
  /*components: {
    Dropdown,
  },*/
  props: {
    modelValue: Object,
  },
  setup(props: any, context: SetupContext) {
    const institutes = ref([] as Institute[]);
    const onChange = (event: any) => {
      context.emit("update:modelValue", event.value);
      context.emit("change", event);
    };
    onMounted(async () => {
      institutes.value = await InstituteService.shared.getInstitutes();
    });
    return {
      institutes,
      onChange,
    };
  },
  data(props: any) {
    return {
      selectedItem: props.modelValue ?? null,
    };
  },
};
</script>

<style lang="scss"></style>
