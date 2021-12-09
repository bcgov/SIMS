<template>
  <p class="category-header-medium color-blue">{{ title }}</p>
  <Timeline :value="notes">
    <template #content="slotProps">
      <v-row>
        <v-col cols="2" class="primary-color marker-text">{{
          dateOnlyLongString(slotProps.item.createdAt)
        }}</v-col>
        <v-col>
          <div class="content-header">{{ slotProps.item.noteType }}</div>
          <div class="header mt-2">{{ slotProps.item.description }}</div>
          <div class="content-footer mt-2 mb-8 secondary-color-light">
            <span>{{ timeOnlyString(slotProps.item.createdAt) }}</span>
            <span class="ml-6">{{
              `${slotProps.item.lastName}, ${slotProps.item.firstName}`
            }}</span>
          </div>
        </v-col>
      </v-row>
    </template>
  </Timeline>
</template>

<script lang="ts">
import { useFormatters } from "@/composables";
export default {
  props: {
    notes: {
      type: Array,
      required: true,
    },
    title: {
      type: Array,
      required: true,
    },
  },
  setup() {
    const { dateOnlyLongString, timeOnlyString } = useFormatters();
    return { dateOnlyLongString, timeOnlyString };
  },
};
</script>
<style lang="scss">
.p-timeline-event-marker {
  background-color: #2965c5 !important;
}

.content-header {
  color: #333a47;
  font-weight: 700;
  font-size: 17px;
  line-height: 22px;
  font-style: normal;
}

.content-body {
  color: #333a47;
  font-weight: 400;
  font-size: 16px;
  line-height: 22px;
  font-style: normal;
}

.content-footer {
  color: #333a47;
  font-weight: 400;
  font-size: 14px;
  line-height: 21px;
  font-style: normal;
}
div.p-timeline-event-opposite {
  max-width: 0 !important;
}

.marker-text {
  font-weight: 700;
  font-size: 17px;
  line-height: 22px;
  font-style: normal;
}

.p-timeline .p-timeline-event-connector {
  background-color: #e8e8e8;
}
</style>
