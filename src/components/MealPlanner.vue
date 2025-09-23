<template>
  <div class="meal-planner-container">
    <div class="container-fluid">
      <div class="row">
        <!-- Weekly Calendar -->
        <div class="col-lg-8">
          <WeeklyCalendar />
        </div>

        <!-- Meal Library & Shopping List -->
        <div class="col-lg-4">
          <div class="row h-100">
            <!-- Meal Library -->
            <div class="col-12 mb-4">
              <MealLibrary />
            </div>

            <!-- Shopping List -->
            <div class="col-12">
              <ShoppingList />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useMealStore } from "@/stores/mealStore.js";
import WeeklyCalendar from "./meal-planner/WeeklyCalendar.vue";
import MealLibrary from "./meal-planner/MealLibrary.vue";
import ShoppingList from "./meal-planner/ShoppingList.vue";

// Initialize store
const mealStore = useMealStore();

// Initialize store data on mount
onMounted(() => {
  mealStore.initializeStore();
});
</script>

<style scoped>
.meal-planner-container {
  padding: 1rem;
  background: #ffffff;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
}

/* Ensure proper height for the layout */
.row.h-100 {
  height: calc(100vh - 200px) !important;
}

.col-lg-4 .row {
  height: 100%;
}

.col-12 {
  display: flex;
  flex-direction: column;
}
</style>
