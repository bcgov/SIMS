<template>
  <content-group>
    <h3 class="category-header-medium primary-color my-3">
      What does this page mean?
    </h3>
    <v-row>
      <v-col cols="3" md="2"
        ><chip-tag color="error" label="Restriction"
      /></v-col>
      <v-col
        >Restrictions on your account have resulted in funding that is lower
        than the initial estimated award. For further clarification, please
        contact StudentAid BC.</v-col
      >
    </v-row>
    <v-row>
      <v-col cols="3" md="2"><chip-tag color="error" label="Funded" /></v-col>
      <v-col
        >Your actual funding amounts received are different than the amounts
        estimated during the initial assessment. This was caused by payments
        previously received for this application. For further clarification,
        please contact StudentAid BC.</v-col
      >
    </v-row>
    <v-row>
      <v-col cols="3" md="2"
        ><chip-tag color="error" label="Overawards"
      /></v-col>
      <v-col
        >Overawards on your account have resulted in funding that is lower than
        the initial estimated award. For further clarification, please contact
        StudentAid BC.</v-col
      >
    </v-row>
    <v-row>
      <v-col cols="3" md="2"
        ><chip-tag color="success" label="Overawards"
      /></v-col>
      <v-col
        >Previously deducted overawards were applied to this payment. For
        further clarification, please contact StudentAid BC.</v-col
      >
    </v-row>
  </content-group>
</template>
<script lang="ts">
import ChipTag from "@/components/generic/ChipTag.vue";
import { defineComponent } from "vue";

export default defineComponent({
  components: { ChipTag },
});
</script>
