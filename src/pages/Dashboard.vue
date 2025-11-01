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
        <div class="chart-container">
          <canvas id="wasteChart" class="chart-canvas"></canvas>
        </div>
        <p class="chart-text mt-3">
          Each bar shows how much food was wasted (expired) during that week.
        </p>

        <!-- Summary -->
        <div class="summary-text mt-3">
          <p class="summary-item wasted">
            <strong>Food Wasted:</strong> {{ totalWasted }} kg
          </p>
          <p class="summary-item saved">
            <strong>Food Saved:</strong> {{ totalSaved }} kg
          </p>
          <p class="summary-item average" v-if="globalAverageWaste > 0">
            <strong>Global Average Food Waste:</strong> {{ globalAverageWaste }} kg
          </p>
        </div>

        <button class="refresh-btn mt-4" @click="refreshData">
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
import { collection, doc, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "../js/config";

/* -------------------------------------------------------------
   Reactive variables
------------------------------------------------------------- */
const stats = ref([
  { label: "CO₂ Saved", value: "0.00 kg" },
  { label: "Money Saved", value: "$0.00" },
  { label: "Food Waste Avoided", value: "0.00 kg" },
]);
const totalWasted = ref("0.00");
const totalSaved = ref("0.00");
const globalAverageWaste = ref(0);

let wasteChart = null;
let unsubscribe = null;

/* -------------------------------------------------------------
   Parse expiry safely
------------------------------------------------------------- */
function parseExpiryDate(raw) {
  if (!raw) return null;
  if (raw.toDate) return raw.toDate();
  if (typeof raw === "string") {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(raw);
}

/* -------------------------------------------------------------
   Unit-to-kg conversion
------------------------------------------------------------- */
function convertToKg(qty, unit, name = "") {
  const u = unit?.toLowerCase() || "";
  const n = name?.toLowerCase() || "";

  if (u.includes("kg")) return qty;
  if (u.includes("g")) return qty / 1000;
  if (u.includes("l")) return qty * 1.0;
  if (u.includes("ml")) return qty / 1000;
  if (n.includes("chicken")) return qty * 0.18;
  if (n.includes("broccoli")) return qty * 0.3;
  if (n.includes("egg")) return qty * 0.06;
  return qty * 0.25;
}

/* -------------------------------------------------------------
   Fetch Global Average (All Users)
------------------------------------------------------------- */
async function fetchGlobalAverage() {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    let totalWasteAll = 0;
    let userCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.pantry || !Array.isArray(data.pantry)) return;

      let expiredQty = 0;
      data.pantry.forEach((item) => {
        const expiry = parseExpiryDate(item.expiry);
        if (!expiry || isNaN(expiry)) return;
        const diffDays = (expiry - new Date()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) {
          const kg = convertToKg(parseFloat(item.qty || 1), item.unit, item.name);
          expiredQty += kg;
        }
      });

      if (expiredQty > 0) {
        totalWasteAll += expiredQty;
        userCount++;
      }
    });

    globalAverageWaste.value =
      userCount > 0 ? (totalWasteAll / userCount).toFixed(2) : 0;
  } catch (err) {
    console.error("Error fetching global average:", err);
  }
}

/* -------------------------------------------------------------
   Render Chart
------------------------------------------------------------- */
function renderChart(weeklyWaste, weeklyItems, weekLabels) {
  const ctx = document.getElementById("wasteChart");
  if (!ctx) return;
  if (wasteChart) wasteChart.destroy();

  const avg = parseFloat(globalAverageWaste.value) || 0;
  const avgLine = Array(weeklyWaste.length).fill(avg);

  // Deep red gradient
  const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 350);
  gradient.addColorStop(0, "#c0392b");
  gradient.addColorStop(1, "#922b21");

  wasteChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: weekLabels,
      datasets: [
        {
          label: "Your Food Waste (kg)",
          data: weeklyWaste,
          backgroundColor: gradient,
          borderRadius: 10,
          barThickness: 45,
          borderColor: "#6e1d12",
          borderWidth: 1.5,
          order: 1,
        },
        {
          label: "Global Average (kg)",
          data: avgLine,
          type: "line",
          borderColor: "#1b2631",
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          tension: 0.3,
          order: 0,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: "easeOutQuart" },
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#333", usePointStyle: true, padding: 15 },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          titleColor: "#fff",
          bodyColor: "#fff",
          callbacks: {
            label: function (ctx) {
              if (ctx.dataset.label === "Global Average (kg)") {
                return `Global Average: ${ctx.parsed.y.toFixed(2)} kg`;
              }
              const weekIndex = ctx.dataIndex;
              const items = weeklyItems[weekIndex] || [];
              if (!items.length) return "No expired items";
              return [
                `${ctx.parsed.y.toFixed(2)} kg wasted`,
                ...items.map(
                  (i) => `• ${i.name} (${i.qty} ${i.unit || "pcs"})`
                ),
              ];
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#333", font: { size: 13 } },
          grid: { color: "rgba(0,0,0,0.05)" },
        },
        y: {
          beginAtZero: true,
          min: 0,
          suggestedMax: Math.max(...weeklyWaste, avg, 0.5) + 0.5,
          ticks: { color: "#333" },
          grid: { color: "rgba(0,0,0,0.08)" },
        },
      },
    },
  });
}

/* -------------------------------------------------------------
   Update Stats
------------------------------------------------------------- */
async function updateStats(data) {
  const pantry = data.pantry || [];
  const now = new Date();

  const weekStarts = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
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
    const kg = convertToKg(parseFloat(item.qty || 1), item.unit, item.name);

    if (diffDays < 0) {
      expiredQty += kg;
      for (let i = 0; i < 4; i++) {
        const start = weekStarts[i];
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        if (expiry >= start && expiry < end) {
          weeklyWaste[i] += kg;
          weeklyItems[i].push(item);
          break;
        }
      }
    } else if (diffDays <= 7) {
      expiringSoonQty += kg;
    } else {
      savedQty += kg;
    }
  });

  const wastedKg = expiredQty.toFixed(2);
  const savedKg = (expiringSoonQty * 0.5 + savedQty * 0.25).toFixed(2);
  const co2Saved = (savedKg * 1.5).toFixed(2);
  const moneySaved = (savedKg * 3.5).toFixed(2);

  stats.value = [
    { label: "CO₂ Saved", value: `${co2Saved} kg` },
    { label: "Money Saved", value: `$${moneySaved}` },
    { label: "Food Waste Avoided", value: `${savedKg} kg` },
  ];

  totalWasted.value = wastedKg;
  totalSaved.value = savedKg;

  await fetchGlobalAverage();

  const weekLabels = weekStarts.map((d) =>
    `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
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
  padding: 2.5rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}
.chart-title {
  font-weight: 600;
  color: #b03a2e;
  margin-bottom: 1rem;
}
.chart-container {
  height: 340px;
  position: relative;
}
.chart-canvas {
  width: 100%;
  height: 100%;
}
.chart-text {
  font-size: 0.95rem;
  color: #2f3e46;
}
.summary-text {
  margin-top: 1rem;
  font-size: 1rem;
}
.summary-item {
  margin: 0.3rem 0;
}
.summary-item.wasted {
  color: #c0392b;
}
.summary-item.saved {
  color: #27ae60;
}
.summary-item.average {
  color: #34495e;
}
.refresh-btn {
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s ease;
}
.refresh-btn:hover {
  background: #1e8449;
  transform: scale(1.03);
}
</style>
