<template>
  <content-group>
    <p class="category-header-large color-blue">Notes</p>
    <Timeline :value="events">
      <template #content="slotProps">
        <v-row>
          <v-col cols="2" class="primary-color marker-text">{{
            slotProps.item.status
          }}</v-col>
          <v-col>
            <div class="content-header">{{ slotProps.item.type }}</div>
            <div class="header mt-2">{{ slotProps.item.body }}</div>
            <div class="content-footer mt-2 mb-8 secondary-color-light">
              <span>{{ slotProps.item.date }}</span>
              <span class="ml-6">Ramanathan,Dheepak</span>
            </div>
          </v-col>
        </v-row>
      </template>
    </Timeline>
  </content-group>
</template>

<script lang="ts">
import { ref } from "vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
export default {
  components: { ContentGroup },
  setup() {
    const events = ref([
      {
        status: "Nov 7,2021",
        date: "10:30 PST",
        type: "General",
        body:
          "Student called regarding pending enrolement issue. Explained process and wait times involved. There was also a discrepency in the student’s institution program information will also need to get in touc… View More",
      },
      {
        status: "Nov 6,2021",
        date: "14:00 PST",
        type: "Restriction",
        body:
          "Student called regarding pending enrolement issue. Explained process and wait times involved. There was also a discrepency in the student’s institution program.",
      },
      {
        status: "Nov 5,2021",
        date: "16:15 PST",
        type: "System Action",
        body:
          "Restriction added to account due to CRA verification issue. Advised student to contact national directly to solve this issue.",
      },
      {
        status: "Nov 4,2021",
        date: "10:00 PST",
        type: "System Action",
        body:
          "Restriction added to account due to CRA verification issue. Advised student to contact national directly to solve this issue.",
      },
    ]);
    return { events };
  },
  //TODO, create and fetch an API to fetch Notes
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
