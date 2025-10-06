import { createRouter, createWebHistory } from "vue-router";
import Login from "../pages/Login.vue";
import SmartRecipes from "../pages/SmartRecipes.vue";
import Pantry from "../pages/Pantry.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/recipe", component: SmartRecipes },
  { path: "/pantry",component: Pantry},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
