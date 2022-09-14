import "./assets/css/BCSans.scss";
import "./assets/css/base.scss";
import "./assets/css/formio-shared.scss";
import "./assets/css/vuetify.scss";
import "primevue/resources/themes/md-light-indigo/theme.css";
import "primevue/resources/primevue.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

import { createApp } from "vue";
import vuetify from "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import PrimeVue from "primevue/config";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { AppConfigService } from "./services/AppConfigService";
import BodyHeader from "@/components/generic/BodyHeader.vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import StudentPageContainer from "@/components/layouts/student/StudentPageContainer.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import Banner from "@/components/generic/Banner.vue";
import formio from "@/components/generic/formio.vue";
import ToggleContent from "@/components/generic/ToggleContent.vue";
import FormioContainer from "@/components/generic/FormioContainer.vue";
import FooterButtons from "@/components/generic/FooterButtons.vue";
import TitleValue from "@/components/generic/TitleValue.vue";

AppConfigService.shared.init().then(() => {
  createApp(App)
    .use(vuetify)
    .use(store)
    .use(router)
    .use(PrimeVue)
    .component("DataTable", DataTable)
    .component("Column", Column)
    .component("BodyHeader", BodyHeader)
    .component("ContentGroup", ContentGroup)
    .component("FullPageContainer", FullPageContainer)
    .component("StudentPageContainer", StudentPageContainer)
    .component("HeaderNavigator", HeaderNavigator)
    .component("Banner", Banner)
    .component("formio", formio)
    .component("ToggleContent", ToggleContent)
    .component("FormioContainer", FormioContainer)
    .component("FooterButtons", FooterButtons)
    .component("TitleValue", TitleValue)
    .mount("#app");
});
