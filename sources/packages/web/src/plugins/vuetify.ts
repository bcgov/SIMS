import "@mdi/font/css/materialdesignicons.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "vuetify/lib/styles/main.sass";
import { createVuetify } from "vuetify";
import * as components from "vuetify/lib/components";
// Todo: remove import from vuetify/labs/ and its corresponding logics when the components are available in vetify/lib/components.
import { VDataTableServer, VDataTable } from "vuetify/labs/VDataTable";
import * as directives from "vuetify/lib/directives";
import { aliases, fa } from "vuetify/iconsets/fa";
import { mdi } from "vuetify/iconsets/mdi";
import { VDivider } from "vuetify/lib/components";

export default createVuetify({
  components: {
    ...components,
    VDataTableServer,
    VDataTable,
  },
  aliases: {
    VDividerOpaque: VDivider,
    VDividerInsetOpaque: VDivider,
    VDividerVerticalOpaque: VDivider,
  },
  directives,
  default: {},
  defaults: {
    VDividerOpaque: {
      class: "border-opacity-100",
      thickness: 2,
      color: "secondary",
    },
    VDividerInsetOpaque: {
      class: "border-opacity-100",
      thickness: 2,
      color: "secondary",
      inset: true,
    },
    VDividerVerticalOpaque: {
      class: "border-opacity-100",
      thickness: 2,
      color: "secondary",
      vertical: true,
    },
  },
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#2965c5",
          secondary: "#69768c",
          info: "#6554c0",
          warning: "#ff7a00",
          success: "#16c92e",
          error: "#e4222e",
          "info-bg": "#F0EEF9",
          "warning-bg": "#FFF9ED",
          "success-bg": "#EEFFEF",
          "error-bg": "#FDF4F4",
          "info-chip-outline": "#a99fda",
          "warning-chip-outline": "#FFC38C",
          "success-chip-outline": "#A5E8AE",
          "error-chip-outline": "#FFB1B5",
          "warning-shade": "#b35600",
          "success-shade": "#0f851f",
          white: "#ffffff",
          readonly: "#e9ecef",
          border: "#e8e8e8",
          default: "#f5f6f7",
          black: "#333a47",
        },
      },
    },
  },
  icons: {
    defaultSet: "mdi",
    aliases: {
      ...aliases,
      expanderExpandIcon: "fa:fa fa-chevron-circle-down",
      expanderCollapseIcon: "fa:fa fa-chevron-circle-up",
    },
    sets: {
      fa,
      mdi,
    },
  },
});
