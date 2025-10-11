<template>
  <div class="min-vh-100" style="background: linear-gradient(to bottom, #f0fdf4, #ffffff);">
    <!-- Hero Section -->
    <div class="container py-5 py-md-4">
      <div class="text-center mx-auto" style="max-width: 800px;">
        <div class="d-flex justify-content-center mb-4">
          <div class="bg-success p-4 rounded-circle">
            <i class="bi bi-leaf-fill text-white" style="font-size: 3rem;"></i>
          </div>
        </div>
        <h1 class="display-4 display-md-3 mb-4 text-success">
          Reduce Food Waste, Save Money, Help the Planet
        </h1>
        <p class="lead text-muted mb-5">
          Track your pantry, discover recipes with what you have, and reduce your environmental impact one meal at a time.
        </p>
        <button 
          @click="goToLogin"
          class="btn btn-success btn-lg px-2 py-3"
        >
          Get Started for Free
        </button>
      </div>

      <!-- Stats Section, Numbers are random numbers-->
      <div class="row g-4 mt-5">
        <div class="col-md-4">
          <div class="card h-100 text-center p-4">
            <div class="display-4 text-success mb-2">40%</div>
            <p class="text-muted">Food wasted globally</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100 text-center p-4">
            <div class="display-4 text-success mb-2">$2000</div>
            <p class="text-muted">Average yearly waste per family</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100 text-center p-4">
            <div class="display-4 text-success mb-2">8%</div>
            <p class="text-muted">Global greenhouse emissions</p>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="mt-5">
        <h2 class="text-center display-5 mb-5 text-success">
          Everything You Need to Reduce Waste
        </h2>
        <div class="row g-4">
          <div class="col-md-6">
            <div class="card h-100 p-4">
              <div class="bg-success-subtle d-inline-flex align-items-center justify-content-center rounded mb-3" style="width: 48px; height: 48px;">
                <i class="bi bi-cart text-success" style="font-size: 1.5rem;"></i>
              </div>
              <h3 class="h5 mb-3">Smart Pantry Tracker</h3>
              <p class="text-muted">
                Keep track of all your ingredients with expiry date alerts. Color-coded system helps you use items before they go bad.
              </p>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card h-100 p-4">
              <div class="bg-primary-subtle d-inline-flex align-items-center justify-content-center rounded mb-3" style="width: 48px; height: 48px;">
                <i class="bi bi-egg-fried text-primary" style="font-size: 1.5rem;"></i>
              </div>
              <h3 class="h5 mb-3">Recipe Suggestions</h3>
              <p class="text-muted">
                Get personalized recipe ideas based on what's in your pantry. Zero-waste recipes prioritize items expiring soon.
              </p>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card h-100 p-4">
              <div class="bg-purple-subtle d-inline-flex align-items-center justify-content-center rounded mb-3" style="width: 48px; height: 48px;">
                <i class="bi bi-check-circle text-purple" style="font-size: 1.5rem;"></i>
              </div>
              <h3 class="h5 mb-3">Meal Planner</h3>
              <p class="text-muted">
                Plan your weekly meals with drag-and-drop simplicity. Auto-generate shopping lists with only what you need.
              </p>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card h-100 p-4">
              <div class="bg-warning-subtle d-inline-flex align-items-center justify-content-center rounded mb-3" style="width: 48px; height: 48px;">
                <i class="bi bi-graph-up text-warning" style="font-size: 1.5rem;"></i>
              </div>
              <h3 class="h5 mb-3">Impact Dashboard</h3>
              <p class="text-muted">
                Visualize your positive impact. Track CO₂ saved, money retained, and food waste avoided over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="mt-5 text-center bg-success rounded-3 py-5 p-4 mx-auto" style="max-width: 800px;">
        <h2 class="display-5 mb-3 text-white">
          Ready to Make a Difference?
        </h2>
        <p class="text-success-subtle mb-4 lead">
          Join thousands of users already reducing their food waste and environmental impact.
        </p>
        <button 
          @click="goToLogin"
          class="btn btn-light btn-lg px-2 py-3"
        >
          Start Your Journey Today
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
.bg-purple-subtle {
  background-color: #e0cffc;
}

.text-purple {
  color: #6f42c1;
}

.text-success-subtle {
  color: rgba(255, 255, 255, 0.9);
}
</style>

