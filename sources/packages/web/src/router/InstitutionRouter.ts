import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../views/student/Home.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/institution",
    name: "Home",
    component: Home,
  },
];

const InstitutionRouter = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default InstitutionRouter;
