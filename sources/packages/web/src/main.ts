import "./assets/css/BCSans.scss";
import "./assets/css/base.scss";
import "./assets/css/formio-shared.scss";
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
import Menu from "primevue/menu";
import Menubar from "primevue/menubar";
import InputText from "primevue/inputtext";
import InputMask from "primevue/inputmask";
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
import Chip from "primevue/chip";
import TabMenu from "primevue/tabmenu";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import { AppConfigService } from "./services/AppConfigService";
import configValidationRules from "./validators/ValidatorConfigUI";
import Timeline from "primevue/timeline";
import Tooltip from "primevue/tooltip";
import { library } from "@fortawesome/fontawesome-svg-core";
import BodyHeader from "@/components/generic/BodyHeader.vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";

import {
  faMapPin,
  faCheck,
  faCircle,
  faSearch,
  faPlus,
  faTimes,
  faExternalLinkSquareAlt,
  faPen,
  faCog,
  faTrash,
  faUser,
  faFolderOpen,
  faArrowLeft,
  faConciergeBell,
  faGraduationCap,
  faHome,
  faPenNib,
  faBell,
  faFileAlt as faFileAltSolid,
  faHandPaper as faHandPaperSolid,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFileAlt,
  faUser as farUsers,
  faCheckSquare,
  faHandPaper,
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
library.add(
  faMapPin,
  faCheck,
  faCircle,
  faSearch,
  faPlus,
  faTimes,
  faExternalLinkSquareAlt,
  faPen,
  faCog,
  faTrash,
  faUser,
  faFolderOpen,
  faArrowLeft,
  faConciergeBell,
  faGraduationCap,
  faFileAlt,
  faHome,
  faPenNib,
  farUsers,
  faCheckSquare,
  faBell,
  faFileAltSolid,
  faHandPaper,
  faHandPaperSolid,
);

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
    .component("Menu", Menu)
    .component("Menubar", Menubar)
    .component("Card", Card)
    .component("Button", Button)
    .component("DataTable", DataTable)
    .component("Column", Column)
    .component("InputText", InputText)
    .component("InputMask", InputMask)
    .component("Message", Message)
    .component("Checkbox", Checkbox)
    .component("Calendar", Calendar)
    .component("Dropdown", Dropdown)
    .component("InputNumber", InputNumber)
    .component("ProgressSpinner", ProgressSpinner)
    .component("Chip", Chip)
    .component("TabMenu", TabMenu)
    .component("TabView", TabView)
    .component("TabPanel", TabPanel)
    .component("font-awesome-icon", FontAwesomeIcon)
    .component("Timeline", Timeline)
    .component("BodyHeader", BodyHeader)
    .component("ContentGroup", ContentGroup)
    .directive("tooltip", Tooltip)
    .mount("#app");
});
