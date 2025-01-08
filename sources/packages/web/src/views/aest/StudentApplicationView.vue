<template>
  <full-page-container v-if="applicationDetail.data" class="my-2">
    <template #header>
      <header-navigator
        title="Back to student applications"
        :routeLocation="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Financial Aid Application"
      >
      </header-navigator>
    </template>
    <h2 class="color-blue pb-4">
      Student Application Details
      {{ emptyStringFiller(applicationDetail.applicationNumber) }}
    </h2>
    <StudentApplication
      @formLoadedCallback="loadForm"
      @render="formRender"
      :selectedForm="selectedForm"
      :initialData="initialData"
      :programYearId="applicationDetail.applicationProgramYearID"
      :isReadOnly="true"
    />
  </full-page-container>
  <router-view />
</template>
<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  ApplicationDataChangeAPIOutDTO,
  ApplicationSupplementalDataAPIOutDTO,
} from "@/services/http/dto";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters } from "@/composables/useFormatters";
import StudentApplication from "@/components/common/StudentApplication.vue";
import { useFormioUtils } from "@/composables";
import { FormIOComponent } from "@/types";

export default defineComponent({
  components: {
    StudentApplication,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { emptyStringFiller } = useFormatters();
    const { searchByKey } = useFormioUtils();

    const applicationDetail = ref({} as ApplicationSupplementalDataAPIOutDTO);
    const initialData = ref({});
    const selectedForm = ref();
    let applicationWizard: any;

    const loadForm = async (form: any) => {
      applicationWizard = form;
    };

    const formRender = async () => {
      highlightChanges();
    };

    onMounted(async () => {
      const application = await ApplicationService.shared.getApplicationDetail(
        props.applicationId,
      );
      applicationDetail.value =
        application as ApplicationSupplementalDataAPIOutDTO;
      selectedForm.value = applicationDetail.value.applicationFormName;
      initialData.value = {
        ...applicationDetail.value.data,
        isReadOnly: true,
      };
      highlightChanges();
    });

    function highlightChanges() {
      if (!applicationWizard || !applicationDetail.value.changes.length) {
        return;
      }
      highlightChangesRecursive(
        applicationDetail.value.changes,
        applicationWizard,
      );
    }

    function highlightChangesRecursive(
      changes: ApplicationDataChangeAPIOutDTO[],
      parentComponent: FormIOComponent,
    ) {
      for (const change of changes) {
        let searchComponent: FormIOComponent | undefined;
        if (change.key) {
          searchComponent = parentComponent;
        } else if (change.index != undefined) {
          searchComponent = parentComponent.components[change.index];
          highlightChangesRecursive(change.changes, searchComponent);
        } else {
          throw new Error("Invalid change object.");
        }
        if (!change.key) {
          continue;
        }
        const [component] = searchByKey(searchComponent.components, change.key);
        if (component) {
          applyChangedValueStyleClass(component);
          highlightChangesRecursive(change.changes, component);
        }
      }
    }

    function applyChangedValueStyleClass(component: FormIOComponent) {
      const htmlElement = document.getElementById(component.id);
      if (!htmlElement || htmlElement.classList.contains("changed-value")) {
        return;
      }
      document.getElementById(component.id)?.classList.add("changed-value");
    }

    return {
      loadForm,
      formRender,
      applicationDetail,
      initialData,
      selectedForm,
      AESTRoutesConst,
      emptyStringFiller,
    };
  },
});
</script>
