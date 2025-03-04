<template>
  <body-header-container :enableCardView="true">
    <template #header>
      <body-header title="Your account" />
    </template>
    <template v-if="restrictions.length > 0">
      <p>
        <span class="font-bold">Please resolve the items below soon</span>
        to minimize the disruption and impact.
      </p>
      <content-group
        ><ul v-for="(restriction, index) in restrictions" :key="index">
          <li>{{ restriction.code }}</li>
        </ul>
      </content-group>
    </template>
    <template v-else><p>There are no items to resolve.</p></template>
  </body-header-container>
</template>
<script lang="ts">
import { computed, onMounted, defineComponent } from "vue";
import { StudentRestriction } from "@/store/modules/student/student";
import { useStudentStore } from "@/composables";

export default defineComponent({
  setup() {
    const { activeRestrictions, updateRestrictions } = useStudentStore();
    const restrictions = computed<StudentRestriction[]>(
      () => activeRestrictions.value,
    );
    onMounted(async () => {
      await updateRestrictions();
    });
    return { restrictions };
  },
});
</script>
