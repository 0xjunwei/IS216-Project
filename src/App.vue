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
