<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand" href="#" @click="goHome">
        <i class="fas fa-leaf me-2"></i>EcoEats
      </a>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: currentPage === 'meal-planner' }"
              href="#"
              @click="navigateTo('meal-planner')"
            >
              <i class="fas fa-calendar-alt me-1"></i>Meal Planner
            </a>
          </li>
        </ul>

        <ul class="navbar-nav">
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="navbarDropdown"
              role="button"
              data-bs-toggle="dropdown"
            >
              <i class="fas fa-user me-1"></i>{{ userEmail }}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <a
                  class="dropdown-item"
                  href="#"
                  @click="navigateTo('profile')"
                >
                  <i class="fas fa-user-cog me-2"></i>Profile
                </a>
              </li>
              <li>
                <a
                  class="dropdown-item"
                  href="#"
                  @click="navigateTo('settings')"
                >
                  <i class="fas fa-cog me-2"></i>Settings
                </a>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a class="dropdown-item" href="#" @click="logout">
                  <i class="fas fa-sign-out-alt me-2"></i>Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
// defineProps and defineEmits are compiler macros, no need to import

defineProps({
  currentPage: String,
  userEmail: String,
});

const emit = defineEmits(["navigate", "logout"]);

const navigateTo = (page) => {
  emit("navigate", page);
};

const goHome = () => {
  navigateTo("meal-planner");
};

const logout = () => {
  emit("logout");
};
</script>

<style scoped>
.navbar {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.navbar-brand {
  font-weight: bold;
  font-size: 1.3rem;
  color: #2c3e50 !important;
}

.navbar-brand:hover {
  color: #27ae60 !important;
}

.nav-link {
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 0 0.25rem;
  padding: 0.5rem 0.75rem !important;
  color: #2c3e50 !important;
  font-weight: 500;
}

.nav-link:hover {
  background-color: rgba(39, 174, 96, 0.1);
  color: #27ae60 !important;
  transform: translateY(-1px);
}

.nav-link.active {
  background-color: rgba(39, 174, 96, 0.15);
  color: #27ae60 !important;
  font-weight: 600;
}

.dropdown-menu {
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  margin-top: 0.5rem;
}

.dropdown-item {
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 0.25rem;
  color: #2c3e50;
}

.dropdown-item:hover {
  background-color: rgba(39, 174, 96, 0.1);
  color: #27ae60;
  transform: translateX(4px);
}

.navbar-toggler {
  border-color: rgba(44, 62, 80, 0.1);
}

.navbar-toggler:focus {
  box-shadow: 0 0 0 0.2rem rgba(39, 174, 96, 0.25);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .navbar-brand {
    font-size: 1.1rem;
  }
  
  .nav-link {
    padding: 0.75rem 1rem !important;
    margin: 0.1rem 0;
    min-height: 44px; /* iOS touch target minimum */
    touch-action: manipulation;
  }
  
  .dropdown-item {
    padding: 0.75rem 1rem;
    min-height: 44px;
    touch-action: manipulation;
  }
  
  .navbar-toggler {
    min-height: 44px;
    min-width: 44px;
    touch-action: manipulation;
  }
  
  /* Better mobile dropdown */
  .dropdown-menu {
    margin-top: 0.25rem;
    border-radius: 8px;
  }
}

@media (max-width: 576px) {
  .navbar-brand {
    font-size: 1rem;
  }
  
  .nav-link {
    font-size: 0.9rem;
  }
  
  .dropdown-item {
    font-size: 0.9rem;
  }
}
</style>
