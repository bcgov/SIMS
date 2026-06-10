import "bootstrap-icons/font/bootstrap-icons.css";
import "vuetify/styles";
import "../assets/css/reset.scss";
import "@mdi/font/css/materialdesignicons.css";
import "@fortawesome/fontawesome-free/css/all.css";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, fa } from "vuetify/iconsets/fa";
import { mdi } from "vuetify/iconsets/mdi";
import {
  VDivider,
  VBtn,
  VDataTableServer,
  VDataTable,
  VDateInput,
} from "vuetify/components";

export default createVuetify({
  components: {
    ...components,
    VDataTableServer,
    VDataTable,
    VDateInput,
  },
  aliases: {
    VDividerOpaque: VDivider,
    VDividerInsetOpaque: VDivider,
    VDividerVerticalOpaque: VDivider,
    VAppBarAccountBtn: VBtn,
  },
  directives,
  default: {},
  defaults: {
    VDividerOpaque: {
      thickness: 2,
      color: "secondary",
    },
    VDividerInsetOpaque: {
      thickness: 2,
      color: "secondary",
      style: "margin-inline: 16px;",
    },
    VDividerVerticalOpaque: {
      thickness: 2,
      color: "secondary",
      vertical: true,
    },
    VAppBarAccountBtn: {
      width: 46,
      height: 46,
      rounded: "xl",
      icon: "fa:fa fa-user",
      variant: "outlined",
      elevation: 1,
      color: "secondary",
      "aria-label": "Account",
      class: "mr-5 nav-item-label",
    },
  },
  theme: {
    defaultTheme: "light",
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
          danger: "#e4222e",
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
