<template>
  <div class="p-grid p-m-2">
    <div>
      <Dropdown
        class="p-col-12"
        v-model="selectedItem"
        :options="programs"
        optionLabel="name"
        placeholder="Search for education program"
        @change="onChange"
        :disabled="!enable"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { SetupContext, ref, onUpdated } from "vue";
import { InstituteService } from "../../services/InstituteService";
import { EducationProgram } from "../../contracts/EducationContract";
import { Institute } from "../../contracts/InstituteContract";
export default {
  emits: ["update:modelValue", "change"],
  props: {
    modelValue: Object,
    institute: Object,
    enable: Boolean,
  },
  setup(props: any, context: SetupContext) {
    const programs = ref([] as EducationProgram[]);
    const onChange = (event: any) => {
      context.emit("update:modelValue", event.value);
      context.emit("change", event);
    };
    onUpdated(async () => {
      if (props.institute && props.enable && programs.value.length === 0) {
        programs.value = await InstituteService.shared.getProgramsFor(
          props.institute as Institute,
        );
      }
    });
    return {
      programs,
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
