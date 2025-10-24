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
        <h4 class="chart-title">Weekly Food Waste (kg)</h4>
        <canvas id="wasteChart" class="chart-canvas"></canvas>
        <p class="chart-text mt-3">
          Each bar shows how much food was wasted (expired) during that week.
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
import { auth, db } from "../js/config";

const stats = ref([
  { label: "CO₂ Saved", value: "0.00 kg" },
  { label: "Money Saved", value: "$0.00" },
  { label: "Food Waste Avoided", value: "0.00 kg" },
]);

let wasteChart = null;
let unsubscribe = null;

/* -------------------------------------------------------------
   Parse expiry safely (string or Firestore timestamp)
------------------------------------------------------------- */
function parseExpiryDate(raw) {
  if (!raw) return null;
  if (raw.toDate) return raw.toDate(); // Firestore Timestamp
  if (typeof raw === "string") {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(raw);
}

/* -------------------------------------------------------------
   Render the bar chart
------------------------------------------------------------- */
function renderChart(weeklyWaste, weeklyItems, weekLabels) {
  const ctx = document.getElementById("wasteChart");
  if (!ctx) return;
  if (wasteChart) wasteChart.destroy();

  wasteChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: weekLabels,
      datasets: [
        {
          label: "Food Wasted (kg)",
          data: weeklyWaste,
          backgroundColor: "rgba(231, 76, 60, 0.8)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      animation: { duration: 1000, easing: "easeOutQuart" },
      plugins: {
        legend: { labels: { color: "#333" } },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const weekIndex = ctx.dataIndex;
              const items = weeklyItems[weekIndex] || [];
              if (!items.length) return "No expired items";
              return [
                `${ctx.parsed.y.toFixed(2)} kg wasted`,
                ...items.map((i) => `• ${i.name} (${i.qty} ${i.unit})`),
              ];
            },
          },
        },
      },
      scales: {
        x: { ticks: { color: "#333" }, grid: { color: "rgba(0,0,0,0.05)" } },
        y: {
          beginAtZero: true,
          ticks: { color: "#333" },
          grid: { color: "rgba(0,0,0,0.05)" },
        },
      },
    },
  });
}

/* -------------------------------------------------------------
   Calculate totals and weekly distribution (Monday–Sunday)
------------------------------------------------------------- */
function updateStats(data) {
  const pantry = data.pantry || [];
  const now = new Date();

  // Create 4 weekly windows (each Monday–Sunday)
  const weekStarts = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // shift to Monday
    weekStarts.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  const weeklyWaste = [0, 0, 0, 0];
  const weeklyItems = [[], [], [], []];

  let expiredQty = 0;
  let expiringSoonQty = 0;
  let savedQty = 0;

  pantry.forEach((item) => {
    const expiry = parseExpiryDate(item.expiry);
    if (!expiry || isNaN(expiry)) return;
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    const qty = parseFloat(item.qty || 1);

    if (diffDays < 0) {
      expiredQty += qty;

      // Find the right week bucket by expiry date
      for (let i = 0; i < 4; i++) {
        const start = weekStarts[i];
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        if (expiry >= start && expiry < end) {
          weeklyWaste[i] += qty * 0.25; // Convert to kg approximation
          weeklyItems[i].push(item);
          break;
        }
      }
    } else if (diffDays <= 7) {
      expiringSoonQty += qty;
    } else {
      savedQty += qty;
    }
  });

  const wastedKg = (expiredQty * 0.25).toFixed(2);
  const savedKg = (expiringSoonQty * 0.25 + savedQty * 0.15).toFixed(2);
  const co2Saved = (savedKg * 1.5).toFixed(2);
  const moneySaved = (savedKg * 3.5).toFixed(2);

  stats.value = [
    { label: "CO₂ Saved", value: `${co2Saved} kg` },
    { label: "Money Saved", value: `$${moneySaved}` },
    { label: "Food Waste Avoided", value: `${savedKg} kg` },
  ];

  const weekLabels = weekStarts.map(
    (d) => `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  );

  renderChart(weeklyWaste, weeklyItems, weekLabels);
}

/* -------------------------------------------------------------
   Firestore live sync
------------------------------------------------------------- */
function loadUserData(uid) {
  const userRef = doc(db, "users", uid);
  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(userRef, (snap) => {
    if (snap.exists()) updateStats(snap.data());
  });
}

function refreshData() {
  const user = auth.currentUser;
  if (user) loadUserData(user.uid);
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) loadUserData(user.uid);
    else console.warn("User not logged in.");
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  if (wasteChart) wasteChart.destroy();
});
</script>

<style scoped>
.dashboard-container {
  background: linear-gradient(to bottom right, #f3fff5, #e6fff0);
  font-family: "Inter", "Segoe UI", sans-serif;
  color: #2c3e50;
}
.dashboard-title {
  font-weight: 700;
  color: #1a7940;
  font-size: 2rem;
}
.dashboard-subtitle {
  font-size: 1rem;
  color: #5f6d63;
}
.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 2rem 1rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
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
}
.chart-card {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}
.chart-title {
  font-weight: 600;
  color: #b03a2e;
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
}
.refresh-btn:hover {
  background: #1e8449;
}
</style>
