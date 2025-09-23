<template>
  <div class="weekly-calendar">
    <!-- Week Navigation Header -->
    <div class="calendar-header">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">
          <i class="fas fa-calendar-alt me-2 text-success"></i>
          {{ currentWeekRange }}
        </h4>
        <div class="d-flex align-items-center gap-3">
          <input
            type="date"
            v-model="selectedDate"
            @change="handleDateChange"
            class="form-control form-control-sm"
            style="width: auto"
          />
          <div class="d-flex align-items-center gap-2">
            <button
              @click="previousWeek"
              class="btn btn-outline-success"
              title="Previous Week"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              @click="nextWeek"
              class="btn btn-outline-success"
              title="Next Week"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Headers -->
    <div class="day-headers">
      <div class="day-header" v-for="day in weekDays" :key="day.name">
        <div class="day-name">{{ day.name }}</div>
        <div class="day-date">{{ day.dateNumber }}</div>
        <div class="day-month">
          {{ day.fullDate.toLocaleDateString("en-US", { month: "short" }) }}
        </div>
      </div>
    </div>

    <!-- Meal Planning Grid -->
    <div class="meal-planning-grid">
      <div
        class="day-column"
        v-for="(day, dayIndex) in weekDays"
        :key="dayIndex"
        v-bind="createDropZoneHandlers(handleDrop)"
      >
        <div class="meal-slots">
          <div
            class="meal-slot breakfast"
            v-bind="
              createDropZoneHandlers((data) =>
                handleMealDrop(data, day.date, dayIndex, 'breakfast'),
              )
            "
          >
            <div class="meal-label">
              <i class="fas fa-sun me-1"></i>Breakfast
            </div>
            <div class="meals-container">
              <MealCard
                v-for="(meal, mealIndex) in getMealsForDate(day.date).breakfast"
                :key="`breakfast-${mealIndex}`"
                :meal="meal"
                :meal-type="'breakfast'"
                :meal-index="mealIndex"
                :date="day.date"
                :day-index="dayIndex"
                @drag-meal="handleDragMeal"
                @remove-meal="handleRemoveMeal"
              />
            </div>
          </div>

          <div
            class="meal-slot lunch"
            v-bind="
              createDropZoneHandlers((data) =>
                handleMealDrop(data, day.date, dayIndex, 'lunch'),
              )
            "
          >
            <div class="meal-label"><i class="fas fa-sun me-1"></i>Lunch</div>
            <div class="meals-container">
              <MealCard
                v-for="(meal, mealIndex) in getMealsForDate(day.date).lunch"
                :key="`lunch-${mealIndex}`"
                :meal="meal"
                :meal-type="'lunch'"
                :meal-index="mealIndex"
                :date="day.date"
                :day-index="dayIndex"
                @drag-meal="handleDragMeal"
                @remove-meal="handleRemoveMeal"
              />
            </div>
          </div>

          <div
            class="meal-slot dinner"
            v-bind="
              createDropZoneHandlers((data) =>
                handleMealDrop(data, day.date, dayIndex, 'dinner'),
              )
            "
          >
            <div class="meal-label"><i class="fas fa-moon me-1"></i>Dinner</div>
            <div class="meals-container">
              <MealCard
                v-for="(meal, mealIndex) in getMealsForDate(day.date).dinner"
                :key="`dinner-${mealIndex}`"
                :meal="meal"
                :meal-type="'dinner'"
                :meal-index="mealIndex"
                :date="day.date"
                :day-index="dayIndex"
                @drag-meal="handleDragMeal"
                @remove-meal="handleRemoveMeal"
              />
            </div>
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
import MealCard from "./MealCard.vue";

// Store
const mealStore = useMealStore();
const {
  selectedDate,
  weekDays,
  currentWeekRange,
  getMealsForDate,
} = storeToRefs(mealStore);
const {
  previousWeek,
  nextWeek,
  goToDate,
  addMeal,
  moveMeal,
} = mealStore;

// Drag and drop
const { createDropZoneHandlers } = useDragAndDrop();

// Methods
const handleDateChange = () => {
  goToDate(selectedDate);
};

const handleMealDrop = (data, date, dayIndex, mealType) => {
  if (data.type === "fromLibrary") {
    addMeal(data.meal, date, mealType);
  } else if (data.type === "move") {
    const fromDate = new Date(data.date);
    moveMeal(fromDate, data.mealType, data.mealIndex, date, mealType);
  }
};

const handleDragMeal = (event, date, dayIndex, mealType, mealIndex) => {
  const meal = getMealsForDate(date)[mealType][mealIndex];
  const data = {
    type: "move",
    date: date.toISOString().split("T")[0],
    dayIndex: dayIndex,
    mealType: mealType,
    mealIndex: mealIndex,
    meal: meal,
  };
  event.dataTransfer.setData("text/plain", JSON.stringify(data));
};

const handleRemoveMeal = (date, mealType, mealIndex) => {
  mealStore.removeMeal(date, mealType, mealIndex);
};
</script>

<style scoped>
.weekly-calendar {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.calendar-header {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 1rem;
  flex-shrink: 0;
}

.day-headers {
  background: #f8f9fa;
  display: flex;
  border-bottom: 2px solid #e9ecef;
  flex-shrink: 0;
}

.day-header {
  text-align: center;
  flex: 1;
  padding: 0.75rem 0.5rem;
  border-right: 1px solid #e9ecef;
  background: #f8f9fa;
}

.day-header:last-child {
  border-right: none;
}

.day-name {
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: #495057;
}

.day-date {
  font-size: 1.4rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.day-month {
  font-size: 0.8rem;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 500;
}

.meal-planning-grid {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.day-column {
  flex: 1;
  border-right: 1px solid #e9ecef;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
}

.day-column:last-child {
  border-right: none;
}

.meal-slots {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  height: 100%;
}

.meal-slot {
  padding: 0.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 2px dashed #e9ecef;
  transition: all 0.3s ease;
  min-height: 120px;
}

.meal-slot:hover {
  border-color: #27ae60;
  background-color: rgba(39, 174, 96, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.15);
}

.meal-slot.drag-over {
  border-color: #27ae60;
  background-color: rgba(39, 174, 96, 0.1);
}

.meal-label {
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #495057;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: rgba(39, 174, 96, 0.1);
  border-radius: 4px;
}

.meals-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
  max-height: 100%;
}

/* Custom scrollbar */
.meals-container::-webkit-scrollbar {
  width: 6px;
}

.meals-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.meals-container::-webkit-scrollbar-thumb {
  background: #27ae60;
  border-radius: 3px;
}

.meals-container::-webkit-scrollbar-thumb:hover {
  background: #229954;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .weekly-calendar {
    padding: 0.5rem;
  }
  
  .calendar-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .calendar-header .d-flex {
    flex-direction: column;
    align-items: stretch !important;
    gap: 0.5rem;
  }
  
  .day-headers {
    font-size: 0.8rem;
  }
  
  .day-header {
    padding: 0.25rem;
  }
  
  .meal-slot {
    min-height: 80px;
    padding: 0.5rem;
  }
  
  .meal-label {
    font-size: 0.7rem;
    padding: 0.2rem;
  }
  
  /* Improve touch targets */
  .btn {
    min-height: 44px;
    min-width: 44px;
    touch-action: manipulation;
  }
  
  .meal-slot {
    touch-action: manipulation;
  }
  
  /* Better mobile navigation */
  .d-flex.gap-2 {
    gap: 0.5rem !important;
  }
  
  .form-control-sm {
    font-size: 0.9rem;
  }
}

@media (max-width: 576px) {
  .day-headers {
    font-size: 0.7rem;
  }
  
  .day-header {
    padding: 0.2rem;
  }
  
  .meal-slot {
    min-height: 60px;
    padding: 0.4rem;
  }
  
  .meal-label {
    font-size: 0.6rem;
  }
}
</style>
