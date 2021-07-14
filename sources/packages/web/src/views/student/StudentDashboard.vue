<template>
  <div class="p-m-4">
    <h1>Student Dashboard</h1>
  </div>
  <Card class="p-m-4">
    <template #title>
      Welcome {{ user.givenNames }}, let's get started
    </template>
    <template #content>
      Please start your Financial Aid application
      <br />
      <br />
      <Dropdown
        class="p-col-12"
        v-model="selectedForm"
        :options="programYearList"
        optionLabel="name"
        optionValue="code"
        placeholder="Select a Program Year"
        :style="{ width: '30vw' }"
        @change="onYearChange"
      />
    </template>
    <template #footer>
      <v-btn
        color="primary"
        class="p-button-raised"
        :disabled="!selectedForm"
        @click="
          $router.push({
            name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
            params: {
              selectedForm: selectedForm,
            },
          })
        "
      >
        <v-icon size="25" class="mr-2">mdi-text-box-plus</v-icon>
        Start New Application
      </v-btn>
    </template>
  </Card>
</template>
<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
import { StudentService } from "@/services/StudentService";
import { SetupContext, onMounted, ref } from "vue";
export default {
  emits: ["update:formName", "change"],
  props: {
    formName: {
      type: String,
    },
  },
  setup(props: any, context: SetupContext) {
    const programYearList = ref();
    const onYearChange = (event: any) => {
      context.emit("update:formName", event.value);
      context.emit("change", event);
    };
    onMounted(async () => {
      const programYears = await StudentService.shared.getProgramYears();
      programYearList.value = programYears
        ? programYears?.map((el: any) => ({
            name: "(" + el.programYear + ") - " + el.programYearDesc,
            code: el.formName,
          }))
        : [];
    });
    const store = useStore();
    const user = computed(() => store.state.student.profile);

    return {
      StudentRoutesConst,
      programYearList,
      user,
      onYearChange,
    };
  },
  data(props: any) {
    return {
      selectedForm: props.formName ?? null,
    };
  },
};
</script>
