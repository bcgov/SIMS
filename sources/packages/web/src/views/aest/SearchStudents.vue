<template>
  <v-container>
    <ModalDialogBase
      title="Search Students"
      dialogType="warning"
      :showDialog="showDialog"
      @dialogClosed="dialogClosed"
    >
      <template v-slot:content>
        <v-container>
          <form>
            <p>No Students found for the given search criteria.</p>
          </form>
        </v-container>
      </template>
      <template v-slot:footer>
        <v-btn color="primary" outlined @click="dialogClosed"> Close </v-btn>
      </template>
    </ModalDialogBase>

    <h2 class="color-blue">Search Students</h2>
    <v-row class="mt-5"
      ><v-col><label for="appNumber">Application Number</label></v-col
      ><v-col><label for="firstName">Given Name</label></v-col
      ><v-col><label for="lastName">Last Name</label></v-col></v-row
    >
    <v-row
      ><v-col><InputText type="text" v-model="appNumber" /> </v-col
      ><v-col><InputText type="text" v-model="firstName" /> </v-col
      ><v-col><InputText type="text" v-model="lastName" /> </v-col
    ></v-row>

    <v-btn
      :disabled="!appNumber && !firstName && !lastName"
      color="primary"
      class="p-button-raised mt-2"
      @click="goToSearchStudents(appNumber, firstName, lastName)"
    >
      <v-icon size="25" class="mr-2">mdi-account-outline</v-icon>
      Search
    </v-btn>
    <DataTable
      v-if="studentsfound"
      :autoLayout="true"
      :value="students"
      class="p-m-4"
    >
      <Column field="firstName" header="First Name" :sortable="true">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.firstName }}
          </div>
        </template>
      </Column>
      <Column field="lastName" header="Last Name" :sortable="true">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.lastName }}
          </div>
        </template>
      </Column>
      <Column field="birthDate" header="Date of Birth" :sortable="true">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.birthDate }}
          </div>
        </template>
      </Column>
      <Column>
        <template #body="slotProps">
          <v-btn outlined @click="goToViewStudent(slotProps.data.id)"
            >View</v-btn
          >
        </template>
      </Column>
    </DataTable>
  </v-container>
</template>
<script lang="ts">
import { ref } from "vue";
import { StudentService } from "../../services/StudentService";
import { SearchStudentResp } from "@/types";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
export default {
  components: {
    ModalDialogBase,
  },
  setup() {
    const students = ref([{}] as SearchStudentResp[]);
    const studentsfound = ref(false);
    const { showDialog, showModal } = useModalDialog<boolean>();
    const goToSearchStudents = async (
      appNumber: string,
      firstName: string,
      lastName: string,
    ) => {
      students.value = await StudentService.shared.searchStudents(
        appNumber,
        firstName,
        lastName,
      );
      if (students.value.length == 0) {
        studentsfound.value = false;
        showDialog.value = true;
      } else {
        studentsfound.value = true;
      }
    };
    const dialogClosed = () => {
      showDialog.value = false;
    };

    return {
      showDialog,
      studentsfound,
      showModal,
      dialogClosed,
      goToSearchStudents,
      students,
    };
  },
};
</script>
