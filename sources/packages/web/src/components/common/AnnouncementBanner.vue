<template>
  <v-alert
    v-if="relevantAnnouncements && relevantAnnouncements.length > 0"
    :type="BannerTypes.Warning"
    variant="outlined"
    icon="fa:fa fa-triangle-exclamation"
    class="sims-banner"
  >
    <template #title>
      <div class="mb-5">System Announcements</div>
    </template>
    <v-row>
      <v-col>
        <div
          v-for="(announcement, index) in relevantAnnouncements"
          :key="index"
        >
          <div class="label-value-normal">
            <b>{{ announcement.messageTitle }}</b> -
            <i>added {{ dateOnlyLongString(announcement.startDate) }}</i>
            <p>{{ announcement.message }}</p>
          </div>
        </div>
      </v-col>
      <v-col cols="auto"> <slot name="actions"></slot></v-col>
    </v-row>
  </v-alert>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { AnnouncementsService } from "@/services/AnnouncementsService";
import { useFormatters } from "@/composables";

export default defineComponent({
  props: {
    location: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { dateOnlyLongString } = useFormatters();
    // Data-bind
    const relevantAnnouncements = ref();
    // Hooks
    onMounted(async () => {
      let announcements = await AnnouncementsService.shared.getAnnouncements();
      relevantAnnouncements.value = announcements.filter((announcement) => {
        return announcement.target.some(
          (tar: string) => tar.toLowerCase() === props.location.toLowerCase(),
        );
      });
    });
    return {
      BannerTypes,
      relevantAnnouncements,
      dateOnlyLongString,
    };
  },
});
</script>
