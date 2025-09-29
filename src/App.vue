<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-transparent fixed-top">
  <div class="container-fluid">
    <router-link to="/" class="navbar-brand fw-bold text-light">MealPrep</router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link to="/login" class="nav-link" active-class="active">
              Login
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/tracker" class="nav-link" active-class="active">
              Pantry Tracker Page
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/recipe" class="nav-link" active-class="active">
              Recipe Suggestion
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/planner" class="nav-link" active-class="active">
              Meal Planner
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/dashboard" class="nav-link" active-class="active">
              Dashboard
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>


    <router-view />

</template>


<script setup>
</script>

<style>
/* Keep navbar readable on top of gradients */
.navbar.fixed-top {
  background: rgba(18, 18, 18, 0.7) !important;
  backdrop-filter: saturate(140%) blur(10px);
  -webkit-backdrop-filter: saturate(140%) blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
  z-index: 3000;
}

/* Ensure toggler remains above the dropdown panel */
.navbar .navbar-toggler { position: relative; z-index: 3050; }

/* Mobile collapse: appear as a dropdown panel under the navbar,
   opaque so content doesn't show through, without using offcanvas */
.navbar .container-fluid { position: relative; }
@media (max-width: 991.98px) {
  .navbar.fixed-top .navbar-collapse {
    width: 100%;
  }
  .navbar.fixed-top .navbar-collapse.show {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #121212; /* fully opaque to avoid content bleeding through */
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 12px 30px rgba(0,0,0,0.35);
    max-height: calc(100vh - 72px);
    overflow-y: auto;
    z-index: 2990;
  }
}

@media (min-width: 992px) {
  .navbar.fixed-top .navbar-collapse { position: static; background: transparent; box-shadow: none; }
}
</style>
