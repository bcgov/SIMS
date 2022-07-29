import "@mdi/font/css/materialdesignicons.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "vuetify/lib/styles/main.sass";
import { createVuetify } from "vuetify";
import * as components from "vuetify/lib/components";
import * as directives from "vuetify/lib/directives";
import { aliases, fa } from "vuetify/iconsets/fa";
import { mdi } from "vuetify/iconsets/mdi";

export default createVuetify({
  components,
  directives,
  default: {},
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#2965c5",
          secondary: "#69768C",
          info: "#6554C0",
          warning: "#FF7A00",
          success: "#16C92E",
          error: "#E4222E",
          info_bg: "#F0EEF9",
          warning_bg: "#FFF9ED",
          success_bg: "#EEFFEF",
          error_bg: "#FDF4F4",
          warning_shade: "#B35600",
          success_shade: "#0F851F",
          white: "#FFFFFF",
          readonly: "#CFD4DB",
          background: "#F5F6F7",
          border: "#E8E8E8",
          default: "#333A47",
        },
      },
    },
  },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      fa,
      mdi,
    },
  },
});
