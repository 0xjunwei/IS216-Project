import { createRouter, createWebHistory } from "vue-router";
import LandingPage from "../pages/LandingPage.vue";
import Login from "../pages/Login.vue";
import SmartRecipes from "../pages/SmartRecipes.vue";
import Pantry from "../pages/Pantry.vue";
import MealPlanner from "../pages/MealPlanner.vue";

const routes = [
  { path: "/", name: "Landing", component: LandingPage },
  { path: "/login", name: "Login", component: Login },
  { path: "/pantry", name: "Pantry", component: Pantry },
  { path: "/recipe", name: "SmartRecipes", component: SmartRecipes },
  { path: "/planner", name: "MealPlanner", component: MealPlanner },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
