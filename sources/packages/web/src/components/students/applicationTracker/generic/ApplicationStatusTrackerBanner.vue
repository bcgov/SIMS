<template>
  <v-alert
    variant="tonal"
    class="application-tracker-alert mt-3"
    :class="backgroundColor"
    :color="backgroundColor"
  >
    <template #prepend>
      <v-icon class="mt-1" :icon="icon" :size="20" :color="iconColor" />
    </template>
    <template #title>
      <div class="category-header-medium mb-3 label">
        {{ label }}
      </div>
    </template>
    <span class="label-value-normal">
      <slot name="content">
        <v-row>
          <v-col :md="hasImage ? 10 : 12">
            {{ content }}
          </v-col>
          <v-col md="2" class="col-img" v-if="hasImage">
            <slot name="image"></slot>
          </v-col>
        </v-row>
      </slot>
    </span>
    <div class="my-3">
      <slot name="actions"></slot>
    </div>
  </v-alert>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  props: {
    label: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: false,
    },
    icon: {
      type: String,
      required: true,
    },
    backgroundColor: {
      type: String,
      required: false,
      default: "white",
    },
    iconColor: {
      type: String,
      required: false,
      default: "default",
    },
  },
  setup(_props, { slots }) {
    const hasImage = ref(false);
    // Check if the slot exists by name and has content.
    // It returns an empty array if it's empty.
    if (slots.image && slots.image().length) {
      hasImage.value = true;
    }

    return {
      hasImage,
    };
  },
});
</script>
