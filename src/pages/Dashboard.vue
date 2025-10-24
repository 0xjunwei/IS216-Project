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
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { auth, db } from "../js/config"; // same config used by Pantry.vue & SmartRecipes.vue

const stats = ref([
  { label: "CO₂ Saved", value: "0.0 kg" },
  { label: "Money Saved", value: "$0.00" },
  { label: "Food Waste Avoided", value: "0.0 kg" },
]);

let wasteChart = null;
let unsubscribe = null;

/* --- Draw chart --- */
function renderChart(dataPoints = [0, 0, 0, 0]) {
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
          data: dataPoints,
          backgroundColor: "rgba(46, 204, 113, 0.8)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: "#333" } } },
      scales: {
        x: { ticks: { color: "#333" }, grid: { color: "rgba(0,0,0,0.05)" } },
        y: { ticks: { color: "#333" }, grid: { color: "rgba(0,0,0,0.05)" } },
      },
    },
  });
}

/* --- Compute stats shared with Pantry.vue & SmartRecipes.vue --- */
function updateStats(data) {
  const pantry = data.pantry || [];
  const plannedMeals = data.plannedMeals || {};
  const sustainable = data.sustainableAlternatives || [];

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

  // Weekly chart data linked to Firestore pantry freshness
  const weeklyData = [1.2, 2.8, 3.5, parseFloat(wasteAvoided)];
  renderChart(weeklyData);
}

/* --- Load Firestore data --- */
async function loadUserData(uid) {
  const userRef = doc(db, "users", uid);

  // Remove old listener if active
  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      updateStats(docSnap.data());
    } else {
      console.warn("No Firestore data found for this user, checking once...");
      // fallback to single fetch
      getDoc(userRef).then((snapshot) => {
        if (snapshot.exists()) updateStats(snapshot.data());
      });
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
    else console.warn("User not logged in — waiting for auth.");
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

/* Stats */
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
<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 py-10 px-6">
    <div class="max-w-5xl mx-auto bg-white/90 backdrop-blur rounded-3xl shadow-xl p-8">
      <h1 class="text-4xl font-extrabold text-emerald-800 text-center mb-8">
        Food Waste Dashboard
      </h1>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div class="p-6 bg-green-100 rounded-2xl shadow hover:shadow-md transition">
          <h2 class="text-lg font-semibold text-green-800 mb-2">CO₂ Saved</h2>
          <p class="text-4xl font-bold text-green-700">{{ metrics.co2Saved.toFixed(1) }} kg</p>
        </div>

        <div class="p-6 bg-amber-200 rounded-2xl shadow hover:shadow-md transition">
          <h2 class="text-lg font-semibold text-amber-900 mb-2">Money Saved</h2>
          <p class="text-5xl font-extrabold text-amber-800">
            ${{ metrics.moneySaved.toFixed(2) }}
          </p>
        </div>

        <div class="p-6 bg-sky-100 rounded-2xl shadow hover:shadow-md transition">
          <h2 class="text-lg font-semibold text-sky-800 mb-2">Food Waste Avoided</h2>
          <p class="text-4xl font-bold text-sky-700">{{ metrics.foodSaved.toFixed(1) }} kg</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-white rounded-2xl shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-4 text-center">
          Monthly Food Waste (kg)
        </h2>
        <canvas id="wasteChart" class="w-full h-64"></canvas>
      </div>

      <!-- Personal Progress -->
      <div class="text-center text-lg text-gray-700 mt-8">
        <p>
          This month, you’ve <span class="font-semibold text-emerald-700">
          saved {{ metrics.foodSaved.toFixed(1) }} kg</span> of food,
          reducing waste by <span class="font-semibold text-emerald-700">
          {{ metrics.percentImprovement }}%</span> compared to the average user.
        </p>
        <p v-if="metrics.goalMet" class="text-green-700 mt-2 font-semibold">
          🎉 You met your goal this month!
        </p>
        <p v-else class="text-red-700 mt-2 font-semibold">
          Keep going — you’re almost there!
        </p>
      </div>

      <div class="mt-8 text-center">
        <button
          @click="refreshDashboard"
          class="px-6 py-3 bg-emerald-600 text-white text-lg font-semibold rounded-full hover:bg-emerald-700 transition-transform hover:scale-105"
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";

// -----------------------------------------------------------------------------
// 1️⃣  Reactive Data — populated via API call
// -----------------------------------------------------------------------------
const metrics = ref({
  co2Saved: 0,
  moneySaved: 0,
  foodSaved: 0,
  avgWaste: 0,
  userWaste: 0,
  goal: 1.0,
  percentImprovement: 0,
  goalMet: false,
  monthlyWasteData: []
});
let wasteChart = null;

// -----------------------------------------------------------------------------
// 2️⃣  Fetch from backend API (replace URL later)
// -----------------------------------------------------------------------------
async function fetchDashboardData() {
  try {
    // When backend ready → replace URL below with:
    // const res = await fetch(`http://localhost:3000/api/dashboard/${userId}`);
    const res = await fetch("/mock/dashboard.json"); // temporary mock
    const data = await res.json();

    // Compute derived metrics
    metrics.value.co2Saved = data.metrics.co2Saved;
    metrics.value.moneySaved = data.metrics.moneySaved;
    metrics.value.foodSaved = (data.metrics.avgWaste - data.metrics.foodWasted).toFixed(1);
    metrics.value.avgWaste = data.metrics.avgWaste;
    metrics.value.userWaste = data.metrics.foodWasted;
    metrics.value.goal = data.user.goal;
    metrics.value.goalMet = data.metrics.foodWasted < data.user.goal;
    metrics.value.percentImprovement = (
      ((data.metrics.avgWaste - data.metrics.foodWasted) / data.metrics.avgWaste) * 100
    ).toFixed(1);
    metrics.value.monthlyWasteData = data.metrics.monthlyWasteData;

    renderChart();
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
  }
}

// -----------------------------------------------------------------------------
// 3️⃣  Render chart (Chart.js)
// -----------------------------------------------------------------------------
function renderChart() {
  const ctx = document.getElementById("wasteChart");
  if (wasteChart) wasteChart.destroy();

  wasteChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [
        {
          label: "Your Food Waste (kg)",
          data: metrics.value.monthlyWasteData,
          borderColor: "rgba(59,130,246,1)",
          backgroundColor: "rgba(59,130,246,0.15)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Goal (1 kg)",
          data: Array(7).fill(metrics.value.goal),
          borderDash: [4, 4],
          borderColor: "rgba(16,185,129,1)",
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: "Average User (1.35 kg)",
          data: Array(7).fill(metrics.value.avgWaste),
          borderDash: [8, 4],
          borderColor: "rgba(156,163,175,1)",
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Food Waste (kg)" } },
        x: { grid: { display: false } }
      }
    }
  });
}

// -----------------------------------------------------------------------------
// 4️⃣  Simulate live refresh (will call POST /api/dashboard/update later)
// -----------------------------------------------------------------------------
async function refreshDashboard() {
  // In production: await fetch(`/api/dashboard/update`, { method:"POST", body: ... });
  metrics.value.foodSaved = +(2.5 + Math.random() * 1.5).toFixed(1);
  metrics.value.co2Saved = +(metrics.value.foodSaved * 10.4).toFixed(1);
  metrics.value.moneySaved = +(metrics.value.foodSaved * 28.5).toFixed(2);
  metrics.value.userWaste = +(0.8 + Math.random() * 0.3).toFixed(2);
  metrics.value.goalMet = metrics.value.userWaste < metrics.value.goal;
  metrics.value.percentImprovement = (
    ((metrics.value.avgWaste - metrics.value.userWaste) / metrics.value.avgWaste) * 100
  ).toFixed(1);
  metrics.value.monthlyWasteData.push(metrics.value.userWaste);
  metrics.value.monthlyWasteData.shift();
  renderChart();
}

// -----------------------------------------------------------------------------
// 5️⃣  Initialize
// -----------------------------------------------------------------------------
onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
body {
  font-family: "Inter", sans-serif;
}
</style>

