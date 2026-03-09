<template>
  <content-group>
    <v-row class="m-0 p-0 mb-2" align="center">
      <v-col md="auto" class="flex-grow-1 pa-0 pr-2 mb-1">
        <!--
          Custom search input slot. When provided, it replaces the default
          text field, allowing full control over the search input.
        -->
        <slot v-if="slots['prepend-search']" name="prepend-search"></slot>
        <v-text-field
          v-else
          density="compact"
          :label="searchLabel ?? 'Search'"
          variant="outlined"
          v-model="searchText"
          @keyup.enter="$emit('search')"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        />
      </v-col>
      <v-col cols="auto" class="pa-0 pr-2 mb-1">
        <v-btn color="primary" :loading="loading" @click="$emit('search')"
          >Search</v-btn
        >
      </v-col>
      <v-col cols="auto" class="pa-0 mb-1">
        <!--
          On medium and larger screens the append-search slot content is shown
          inline. On smaller screens it collapses into a dropdown menu to avoid
          horizontal overflow.
        -->
        <template v-if="slots['append-search']">
          <!-- Inline filters for md+ screens. -->
          <div class="d-none d-md-flex">
            <slot name="append-search"></slot>
          </div>
          <!-- Dropdown filter menu for small screens. -->
          <v-menu v-model="filterMenuOpen" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <!-- Filter button for small screens. -->
              <v-btn
                v-bind="menuProps"
                class="d-flex d-md-none"
                density="comfortable"
                color="primary"
                icon="mdi-filter-variant"
                aria-label="Filter search options"
                title="Filter search options"
              />
            </template>
            <v-card class="pa-3">
              <slot name="append-search"></slot>
            </v-card>
          </v-menu>
        </template>
      </v-col>
    </v-row>
    <!-- Default slot for the data table or any other content below the search row. -->
    <slot></slot>
  </content-group>
</template>

<script setup lang="ts">
import { ref, useSlots } from "vue";

const slots = useSlots();
const filterMenuOpen = ref(false);
defineProps<{
  /** Label displayed inside the default search text field. */
  searchLabel?: string;
  /** When true, the Search button displays a loading indicator. */
  loading?: boolean;
}>();
/** Emitted when the user clicks the Search button or presses Enter in the text field. */
defineEmits(["search"]);

/** Bound to the default search text field value. Not required when the `prepend-search` slot is used. */
const searchText = defineModel<string>();
</script>
