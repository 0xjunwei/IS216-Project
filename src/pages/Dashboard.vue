<template>
  <div class="dashboard-container min-vh-100">
    <div class="container py-5">
      <h2 class="dashboard-title text-center mb-2">Food Waste Dashboard</h2>
      <p class="dashboard-subtitle text-center mb-5">
        Track your CO₂ savings, money saved, and food waste reduction.
      </p>

      <!-- Stats Section -->
      <div class="stats-grid row g-4 mb-5">
        <div v-for="stat in stats" :key="stat.label" class="col-12 col-md-4">
          <div class="stat-card text-center">
            <h3 class="stat-label">{{ stat.label }}</h3>
            <p class="stat-value">{{ stat.value }}</p>
          </div>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="chart-card text-center">
        <h4 class="chart-title">Monthly Food Waste (kg)</h4>
        <canvas id="wasteChart" class="chart-canvas"></canvas>
        <p class="chart-text mt-3">
          This month, you've saved <strong>{{ stats[2]?.value || "0.0 kg" }}</strong> of food,
          reducing waste compared to the average user.
        </p>
        <button class="refresh-btn mt-3" @click="refreshData">
          <i class="fas fa-sync-alt"></i> Refresh Data
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Chart from "chart.js/auto";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../js/config"; // use Jun Wei's Firebase config

const stats = ref([
  { label: "CO₂ Saved", value: "0.0 kg" },
  { label: "Money Saved", value: "$0.00" },
  { label: "Food Waste Avoided", value: "0.0 kg" },
]);

let wasteChart = null;
let unsubscribe = null;

/* --- Draw dynamic chart --- */
function renderChart(weeklyData) {
  const ctx = document.getElementById("wasteChart");
  if (!ctx) return;
  if (wasteChart) wasteChart.destroy();

  wasteChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          label: "Food Waste Avoided (kg)",
          data: weeklyData,
          backgroundColor: "rgba(46, 204, 113, 0.8)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      animation: { duration: 1000, easing: "easeOutQuart" },
      plugins: { legend: { labels: { color: "#333" } } },
      scales: {
        x: { ticks: { color: "#333" }, grid: { color: "rgba(0,0,0,0.05)" } },
        y: { ticks: { color: "#333" }, grid: { color: "rgba(0,0,0,0.05)" } },
      },
    },
  });
}

/* --- Update stats and graph --- */
function updateStats(data) {
  const pantry = data.pantry || [];
  const plannedMeals = data.plannedMeals || {};
  const sustainable = data.sustainableAlternatives || [];
  const weeklyWaste = data.weeklyWaste || [0, 0, 0, 0];

  const mealCount = Object.values(plannedMeals).flat().length;
  const sustainableCount = sustainable.length;

  const expiringSoon = pantry.filter((p) => {
    const diff = (new Date(p.expiry) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;
  const expired = pantry.filter((p) => new Date(p.expiry) < new Date()).length;

  const co2Saved = (sustainableCount * 1.5).toFixed(2);
  const moneySaved = (mealCount * 3.5).toFixed(2);
  const wasteAvoided = ((expiringSoon + expired) * 0.25).toFixed(2);

  stats.value = [
    { label: "CO₂ Saved", value: `${co2Saved} kg` },
    { label: "Money Saved", value: `$${moneySaved}` },
    { label: "Food Waste Avoided", value: `${wasteAvoided} kg` },
  ];

  // use Firestore weeklyWaste or auto-generated fallback
  const weeklyData =
    weeklyWaste.length === 4
      ? weeklyWaste
      : [expiringSoon * 0.1, expired * 0.2, sustainableCount * 0.3, parseFloat(wasteAvoided)];

  renderChart(weeklyData);
}

/* --- Sync live with Firestore --- */
function loadUserData(uid) {
  const userRef = doc(db, "users", uid);
  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      updateStats(snapshot.data());
    } else {
      console.warn("No data found for this user in Firestore.");
    }
  });
}

/* --- Manual refresh --- */
function refreshData() {
  const user = auth.currentUser;
  if (user) loadUserData(user.uid);
}

/* --- Lifecycle --- */
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) loadUserData(user.uid);
    else console.warn("Waiting for user login...");
  });
});

onUnmounted(() => {
  if (wasteChart) wasteChart.destroy();
  if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.dashboard-container {
  background: linear-gradient(to bottom right, #f3fff5, #e6fff0);
  font-family: "Inter", "Segoe UI", sans-serif;
  color: #2c3e50;
}

/* Title & Subtitle */
.dashboard-title {
  font-weight: 700;
  color: #1a7940;
  font-size: 2rem;
}

.dashboard-subtitle {
  font-size: 1rem;
  color: #5f6d63;
}

/* Stats Section */
.stats-grid {
  text-align: center;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 2rem 1rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-weight: 600;
  font-size: 1.25rem;
  color: #1a7940;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #27ae60;
  margin-top: 0.3rem;
  transition: all 0.3s ease;
}

/* Chart */
.chart-card {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.chart-title {
  font-weight: 600;
  color: #1a7940;
  margin-bottom: 1rem;
}

.chart-canvas {
  max-height: 300px;
  margin: 0 auto;
}

.chart-text {
  font-size: 0.95rem;
  color: #2f3e46;
}

.refresh-btn {
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.refresh-btn:hover {
  background: #1e8449;
}
</style>
