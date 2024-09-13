<template>
  <banner
    header="System Announcements"
    :type="BannerTypes.Warning"
    v-if="relevantAnnouncements.length"
  >
    <template #content>
      <div v-for="(announcement, index) in relevantAnnouncements" :key="index">
        <span class="font-bold">{{ announcement.messageTitle }}</span> -
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
import { AnnouncementAPIOutDTO } from "@/services/http/dto/Announcement.dto";

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
    const relevantAnnouncements = ref([] as AnnouncementAPIOutDTO[]);
    // Hooks
    onMounted(async () => {
      const announcementList =
        await AnnouncementService.shared.getAnnouncements(props.dashboard);
      relevantAnnouncements.value = announcementList.announcements;
    });
    return {
      BannerTypes,
      relevantAnnouncements,
      dateOnlyLongString,
    };
  },
});
</script>
