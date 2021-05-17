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
import Menubar from "primevue/menubar";
import InputText from "primevue/inputtext";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Card from "primevue/card";
import Button from "primevue/button";
import Message from "primevue/message";
import Toast from "primevue/toast";
import Checkbox from "primevue/checkbox";
import ToastService from "primevue/toastservice";
import Calendar from "primevue/calendar";
import Dropdown from "primevue/dropdown";
import InputNumber from "primevue/inputnumber";
import ProgressSpinner from "primevue/progressspinner";
import { AppConfigService } from "./services/AppConfigService";
import configValidationRules from "./validators/ValidatorConfigUI";

// Configure the UI validations rules globally available.
configValidationRules();

AppConfigService.shared.init().then(() => {
  createApp(App)
    .use(vuetify)
    .use(store)
    .use(router)
    .use(PrimeVue)
    .use(ToastService)
    .component("Toast", Toast)
    .component("Menubar", Menubar)
    .component("Card", Card)
    .component("Button", Button)
    .component("DataTable", DataTable)
    .component("Column", Column)
    .component("InputText", InputText)
    .component("Message", Message)
    .component("Checkbox", Checkbox)
    .component("Calendar", Calendar)
    .component("Dropdown", Dropdown)
    .component("InputNumber", InputNumber)
    .component("ProgressSpinner", ProgressSpinner)
    .mount("#app");
});
