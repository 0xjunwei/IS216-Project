<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-10 px-4">
    <div class="max-w-5xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
      <h1 class="text-4xl font-extrabold text-center text-emerald-800 mb-10 tracking-tight">
        Food Waste Dashboard
      </h1>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div class="p-6 bg-emerald-100 rounded-2xl shadow hover:shadow-md transition">
          <h2 class="text-lg font-semibold text-emerald-800 mb-2">CO₂ Saved</h2>
          <p class="text-4xl font-bold text-emerald-700">{{ co2Saved.toFixed(2) }} kg</p>
        </div>

        <div class="p-6 bg-sky-100 rounded-2xl shadow hover:shadow-md transition">
          <h2 class="text-lg font-semibold text-sky-800 mb-2">Food Saved</h2>
          <p class="text-4xl font-bold text-sky-700">{{ foodSaved.toFixed(1) }} kg</p>
        </div>

        <div class="p-6 bg-amber-100 rounded-2xl shadow hover:shadow-md transition">
          <h2 class="text-lg font-semibold text-amber-800 mb-2">Money Saved</h2>
          <p class="text-4xl font-bold text-amber-700">${{ moneySaved.toFixed(2) }}</p>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="bg-white rounded-2xl shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">Monthly CO₂ Savings</h2>
        <canvas id="co2Chart" class="w-full h-64"></canvas>
      </div>

      <!-- Refresh Button -->
      <div class="mt-8 text-center">
        <button
          @click="fetchCO2Data"
          class="px-6 py-3 bg-emerald-600 text-white text-lg font-semibold rounded-full hover:bg-emerald-700 transition-transform hover:scale-105"
        >
          🔄 Refresh Dashboard
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";

const co2Saved = ref(0);
const foodSaved = ref(3.5);
const moneySaved = ref(12.8);
const chart = ref(null);
const monthlyData = ref([0.8, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0]);

// ⚠️ Replace this with your actual Climatiq API key
const apiKey ="MKTD3ZWH7H455B40QK0SCW24FG";
const apiUrl = "https://api.climatiq.io/estimate";

async function fetchCO2Data() {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emission_factor: {
          activity_id: "food-waste-disposal_food_waste-landfill",
          data_version: "^1",
        },
        parameters: { mass: foodSaved.value, mass_unit: "kg" },
      }),
    });

    const data = await response.json();
    if (data.co2e) {
      co2Saved.value = data.co2e;
      updateChart();
    } else {
      console.warn("Invalid response:", data);
    }
  } catch (error) {
    console.error("Error fetching CO₂ data:", error);
  }
}

function updateChart() {
  const ctx = document.getElementById("co2Chart");
  if (chart.value) chart.value.destroy();

  chart.value = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [
        {
          label: "CO₂ Saved (kg)",
          data: monthlyData.value,
          fill: true,
          tension: 0.3,
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          borderColor: "rgba(5, 150, 105, 1)",
          pointBackgroundColor: "rgba(5, 150, 105, 1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "kg CO₂ Saved" } },
        x: { grid: { display: false } },
      },
    },
  });
}

onMounted(() => {
  updateChart();
  fetchCO2Data();
});
</script>

<style scoped>
body {
  font-family: 'Inter', sans-serif;
}
</style>
