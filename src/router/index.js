import { createRouter, createWebHistory } from "vue-router";
import Login from "../pages/Login.vue";
import SmartRecipes from "../pages/SmartRecipes.vue";
import Pantry from "../pages/Pantry.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/pantry", name: "Pantry", component: Pantry },
  { path: "/login", name: "Login", component: Login },
  { path: "/recipe", name: "SmartRecipes", component: SmartRecipes },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
