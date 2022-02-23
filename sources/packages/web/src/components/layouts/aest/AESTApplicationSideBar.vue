<template>
  <v-navigation-drawer app class="body-background">
    <v-list dense nav>
      <v-list-item @click="studentMenu.command">
        <v-list-item-icon>
          <font-awesome-icon :icon="studentMenu.icon" class="mr-2" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title
            >{{ studentMenu.label }}--{{ studentId }}+++{{ applicationId }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item
        v-for="ppAppliation in relatedPPApplications"
        :key="ppAppliation.label"
        @click="ppAppliation.command"
      >
        <v-list-item-icon>
          <font-awesome-icon :icon="ppAppliation.icon" class="mr-2" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ ppAppliation.label }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuModel } from "@/types";

export default {
  props: {
    studentId: {
      type: Number,
      required: false,
    },
    applicationId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const relatedPPApplications = ref([] as MenuModel[]);

    const studentMenu = ref<MenuModel>({
      label: "Student",
      // TODO: in figma this icon is taken from PRO
      icon: "graduation-cap",
      command: () => {
        router.push({
          name: AESTRoutesConst.APPLICATION_DETAILS,
          params: {
            applicationId: props.applicationId,
            studentId: props.studentId,
          },
        });
      },
    });
    onMounted(() => {
      relatedPPApplications.value = [
        {
          label: "parent",
          // TODO: in figma this icon is taken from PRO
          icon: "user",
        },
      ];
    });

    return {
      studentMenu,
      relatedPPApplications,
    };
  },
};
</script>
