<template>
  <banner
    header="System Announcements"
    :type="BannerTypes.Warning"
    v-if="relevantAnnouncements && relevantAnnouncements.length > 0"
  >
    <template #content>
      <div v-for="(announcement, index) in relevantAnnouncements" :key="index">
        <b>{{ announcement.messageTitle }}</b> -
        <i>added {{ dateOnlyLongString(announcement.startDate) }}</i>
        <p>{{ announcement.message }}</p>
      </div>
    </template>
  </banner>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { AnnouncementService } from "@/services/AnnouncementService";
import { useFormatters } from "@/composables";

export default defineComponent({
  props: {
    dashboard: {
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
      let announcements = await AnnouncementService.shared.getAnnouncements();
      relevantAnnouncements.value = announcements.filter((announcement) => {
        return announcement.target.some(
          (tar: string) => tar.toLowerCase() === props.dashboard.toLowerCase(),
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
