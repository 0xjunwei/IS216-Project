<template>
  <div class="min-vh-100 bg-light d-flex flex-column">
    <!-- Desktop Navigation -->
    <nav class="d-none d-md-flex bg-white border-bottom px-4 py-3 fixed-top shadow-sm">
      <div class="container-fluid d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <h2 class="text-success mb-0 me-4 fw-bold">FoodSaver</h2>
          <div class="d-flex gap-2">
            <router-link
              v-for="item in navItems"
              :key="item.id"
              :to="item.path"
              v-slot="{ isActive }"
              custom
            >
              <button
                @click="$router.push(item.path)"
                :class="isActive ? 'btn btn-success btn-sm' : 'btn btn-outline-secondary btn-sm'"
              >
                <i :class="item.icon" class="me-2"></i>
                {{ item.label }}
              </button>
            </router-link>
          </div>
        </div>
        <button v-if="user" class="btn btn-outline-secondary btn-sm" @click="logout">
          <i class="bi bi-box-arrow-right me-2"></i>
          Logout
        </button>
        <router-link v-else to="/login" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-box-arrow-in-right me-2"></i>
          Login
        </router-link>
      </div>
    </nav>

    <!-- Mobile Navigation -->
    <nav class="d-md-none bg-white border-bottom fixed-top shadow-sm">
      <div class="d-flex justify-content-between align-items-center px-3 py-3">
        <h2 class="text-success mb-0 fw-bold">FoodSaver</h2>
        <button
          class="btn btn-link text-muted p-0"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <i v-if="mobileMenuOpen" class="bi bi-x" style="font-size: 1.5rem;"></i>
          <i v-else class="bi bi-list" style="font-size: 1.5rem;"></i>
        </button>
      </div>

      <div v-if="mobileMenuOpen" class="border-top bg-light">
        <div class="px-3 py-3">
          <div class="d-grid gap-2">
            <router-link
              v-for="item in navItems"
              :key="item.id"
              :to="item.path"
              v-slot="{ isActive }"
              custom
            >
              <button
                @click="handleMobileNavigate(item.path)"
                :class="isActive ? 'btn btn-success' : 'btn btn-outline-secondary'"
              >
                <i :class="item.icon" class="me-2"></i>
                {{ item.label }}
              </button>
            </router-link>
            <hr class="my-2">
            <button
              v-if="user"
              class="btn btn-outline-secondary"
              @click="logout"
            >
              <i class="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
            <router-link v-else to="/login" class="btn btn-outline-secondary">
              <i class="bi bi-box-arrow-in-right me-2"></i>
              Login
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mobile Bottom Navigation -->
    <div v-if="!mobileMenuOpen" class="d-md-none fixed-bottom bg-white border-top shadow-sm" style="z-index: 1050;">
      <div class="d-flex justify-content-around align-items-center py-2">
        <router-link
          v-for="item in navItems"
          :key="item.id"
          :to="item.path"
          v-slot="{ isActive }"
          custom
        >
          <button
            @click="$router.push(item.path)"
            class="btn btn-link text-decoration-none d-flex flex-column align-items-center py-2 px-3 position-relative"
            :class="isActive ? 'text-success' : 'text-muted'"
          >
            <i :class="item.icon" class="mb-1" style="font-size: 1.2rem;"></i>
            <small class="fw-medium">{{ item.label }}</small>
            <div 
              v-if="isActive" 
              class="position-absolute bottom-0 start-50 translate-middle-x bg-success rounded-pill"
              style="width: 4px; height: 4px;"
            ></div>
          </button>
        </router-link>
      </div>
    </div>

    <!-- Main Content Area with top padding for fixed navbar -->
    <main class="flex-grow-1 pb-5 pb-md-0" style="padding-top: 72px;">
      <router-view />
    </main>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { auth } from "./js/config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";

const router = useRouter();
const user = ref(null);
const mobileMenuOpen = ref(false);

const navItems = [
  { id: "pantry", label: "Pantry", icon: "bi bi-cart", path: "/pantry" },
  { id: "recipes", label: "Recipes", icon: "bi bi-egg-fried", path: "/recipe" },
  { id: "planner", label: "Planner", icon: "bi bi-calendar", path: "/planner" },
  { id: "dashboard", label: "Dashboard", icon: "bi bi-graph-up", path: "/dashboard" },
];

let unsubscribe;
onMounted(() => {
  unsubscribe = onAuthStateChanged(auth, (uid) => {
    user.value = uid;
  });
});
onUnmounted(() => { if (unsubscribe) unsubscribe()});

async function logout() {
  await signOut(auth);
  router.push("/login");
}

function handleMobileNavigate(path) {
  mobileMenuOpen.value = false;
  router.push(path);
}
</script>

<style>
/* Light theme styling */
.bg-light {
  background-color: #f8f9fa !important;
}

.fixed-top {
  z-index: 1030;
}

.fixed-bottom {
  z-index: 1050;
}

/* Smooth transitions */
.btn {
  transition: all 0.2s ease-in-out;
}

/* Active nav link styling */
.btn-success {
  background-color: #198754;
  border-color: #198754;
}

.btn-success:hover {
  background-color: #157347;
  border-color: #146c43;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
}

/* Remove default router-link styles */
a.btn {
  text-decoration: none;
}

/* Mobile menu animation */
.border-top {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
