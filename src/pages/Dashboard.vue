<template>
  <div class="dashboard p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center">Food Waste Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
      <div class="bg-green-100 p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold">CO₂ Saved</h2>
        <p class="text-3xl font-bold text-green-700">{{ co2Saved.toFixed(2) }} kg</p>
      </div>
      <div class="bg-blue-100 p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold">Food Saved</h2>
        <p class="text-3xl font-bold text-blue-700">{{ foodSaved.toFixed(1) }} kg</p>
      </div>
      <div class="bg-yellow-100 p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold">Money Saved</h2>
        <p class="text-3xl font-bold text-yellow-700">${{ moneySaved.toFixed(2) }}</p>
      </div>
    </div>

    <div class="bg-white p-4 rounded-lg shadow">
      <canvas id="co2Chart"></canvas>
    </div>

    <div class="mt-6 text-center">
      <button
        @click="fetchCO2Data"
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Refresh Dashboard
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";

// Example data
const co2Saved = ref(0);
const foodSaved = ref(3.5); // kg
const moneySaved = ref(12.8); // $
const chart = ref(null);
const monthlyData = ref([0.8, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0]);

// API key and URL directly in file (not using .env)
const apiKey = "YOUR_REAL_CLIMATIQ_API_KEY";
const apiUrl = "https://api.climatiq.io/estimate";

// Fetch CO₂ data from Climatiq
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
        parameters: {
          mass: foodSaved.value,
          mass_unit: "kg",
        },
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

// Update Chart.js visualization
function updateChart() {
  const ctx = document.getElementById("co2Chart");
  if (chart.value) chart.value.destroy();

  chart.value = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [
        {
          label: "CO₂ Saved (kg)",
          data: monthlyData.value,
          backgroundColor: "rgba(34, 197, 94, 0.5)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "kg CO₂ Saved" },
        },
      },
    },
  });
}

// Initialize on mount
onMounted(() => {
  updateChart();
  fetchCO2Data();
});
</script>

<style scoped>
.dashboard {
  background-color: #f9fafb;
  font-family: system-ui, sans-serif;
}
</style>
