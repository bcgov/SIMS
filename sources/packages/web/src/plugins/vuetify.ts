import "@mdi/font/css/materialdesignicons.css";
import "vuetify/lib/styles/main.sass";
import { createVuetify } from "vuetify";
import * as components from "vuetify/lib/components";
import * as directives from "vuetify/lib/directives";
import { mdi } from "vuetify/iconsets/mdi";
import { aliases, fa } from "vuetify/iconsets/fa";

export default createVuetify({
  components,
  directives,
  default: {},
  icons: {
    defaultSet: "fa",
    aliases,
    sets: {
      fa,
      mdi,
    },
  },
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#2965c5",
        },
      },
    },
  },
});
