<template>
  <div class="meal-library">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5><i class="fas fa-utensils me-2"></i>Meal Library</h5>
      <div>
        <select
          v-model="selectedCategory"
          class="form-select form-select-sm me-2"
          style="width: auto"
          @change="handleCategoryChange"
        >
          <option value="">All Categories</option>
          <option
            v-for="category in mealCategories"
            :key="category"
            :value="category"
          >
            {{ category }}
          </option>
        </select>
      </div>
    </div>

    <div class="search-box mb-3">
      <input
        v-model="searchQuery"
        type="text"
        class="form-control"
        placeholder="Search meals..."
        @input="handleSearchChange"
      />
    </div>

    <div class="meal-grid">
      <div
        v-for="meal in filteredMeals"
        :key="meal.id"
        class="meal-item"
        draggable="true"
        @dragstart="handleDragStart($event, meal)"
        @dragend="handleDragEnd"
      >
        <div class="meal-image">
          <i :class="meal.icon"></i>
        </div>
        <div class="meal-info">
          <h6 class="meal-name">{{ meal.name }}</h6>
          <div class="meal-tags">
            <span v-for="tag in meal.tags" :key="tag" class="meal-tag">
              {{ tag }}
            </span>
          </div>
          <div v-if="meal.sustainable" class="sustainable-indicator">
            <i class="fas fa-leaf"></i> Sustainable
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useMealStore } from "@/stores/mealStore.js";
import { useDragAndDrop } from "@/composables/useDragAndDrop.js";

// Store
const mealStore = useMealStore();
const {
  searchQuery,
  selectedCategory,
  mealCategories,
  filteredMeals,
} = storeToRefs(mealStore);
const {
  setSearchQuery,
  setSelectedCategory,
} = mealStore;

// Drag and drop
const { dragMealFromLibrary, handleDragEnd: dragEnd } = useDragAndDrop();

// Methods
const handleSearchChange = () => {
  setSearchQuery(searchQuery);
};

const handleCategoryChange = () => {
  setSelectedCategory(selectedCategory);
};

const handleDragStart = (event, meal) => {
  dragMealFromLibrary(event, meal);
};

const handleDragEnd = (event) => {
  dragEnd(event);
};
</script>

<style scoped>
.meal-library {
  background: #ffffff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: calc(50vh - 100px);
  display: flex;
  flex-direction: column;
}

.meal-grid {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.meal-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: move;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.meal-item:hover {
  border-color: #27ae60;
  background-color: rgba(39, 174, 96, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.15);
}

.meal-image {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.meal-info {
  flex: 1;
}

.meal-name {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.meal-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.meal-tag {
  background: #e9ecef;
  color: #6c757d;
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.sustainable-indicator {
  color: #27ae60;
  font-size: 0.75rem;
  font-weight: 500;
}

.search-box input {
  border-radius: 20px;
  border: 1px solid #e9ecef;
  padding: 0.5rem 1rem;
}

.search-box input:focus {
  border-color: #27ae60;
  box-shadow: 0 0 0 0.2rem rgba(39, 174, 96, 0.25);
}

.form-select:focus {
  border-color: #27ae60;
  box-shadow: 0 0 0 0.2rem rgba(39, 174, 96, 0.25);
}

/* Custom scrollbar */
.meal-grid::-webkit-scrollbar {
  width: 6px;
}

.meal-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.meal-grid::-webkit-scrollbar-thumb {
  background: #27ae60;
  border-radius: 3px;
}

.meal-grid::-webkit-scrollbar-thumb:hover {
  background: #229954;
}

/* Drag states */
.meal-item[draggable="true"]:active {
  opacity: 0.5;
  transform: rotate(5deg);
}
</style>
