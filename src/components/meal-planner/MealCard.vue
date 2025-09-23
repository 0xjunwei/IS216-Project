<template>
  <div
    class="meal-card"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="meal-content">
      <div class="meal-name">{{ meal.name }}</div>
      <div v-if="meal.sustainable" class="sustainable-indicator">
        <i class="fas fa-leaf"></i>
      </div>
    </div>
    <button @click="handleRemove" class="btn-remove" title="Remove meal">
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<script setup>
import { useDragAndDrop } from "@/composables/useDragAndDrop.js";

// Props
const props = defineProps({
  meal: {
    type: Object,
    required: true,
  },
  mealType: {
    type: String,
    required: true,
  },
  mealIndex: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dayIndex: {
    type: Number,
    required: true,
  },
});

// Emits
const emit = defineEmits(["drag-meal", "remove-meal"]);

// Drag and drop
const { handleDragStart: dragStart, handleDragEnd: dragEnd } = useDragAndDrop();

// Methods
const handleDragStart = (event) => {
  const data = {
    type: "move",
    date: props.date.toISOString().split("T")[0],
    dayIndex: props.dayIndex,
    mealType: props.mealType,
    mealIndex: props.mealIndex,
    meal: props.meal,
  };

  dragStart(event, data);
  emit(
    "drag-meal",
    event,
    props.date,
    props.dayIndex,
    props.mealType,
    props.mealIndex,
  );
};

const handleDragEnd = (event) => {
  dragEnd(event);
};

const handleRemove = () => {
  emit("remove-meal", props.date, props.mealType, props.mealIndex);
};
</script>

<style scoped>
.meal-card {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  min-height: 50px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  cursor: move;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.meal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.meal-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.meal-name {
  font-weight: 500;
  line-height: 1.2;
}

.sustainable-indicator {
  color: #fff;
  font-size: 0.8rem;
  opacity: 0.9;
}

.btn-remove {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.meal-card:hover .btn-remove {
  opacity: 1;
}

.btn-remove:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* Drag states */
.meal-card[draggable="true"]:active {
  opacity: 0.5;
  transform: rotate(5deg);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .meal-card {
    min-height: 44px; /* iOS touch target minimum */
    padding: 0.6rem;
    font-size: 0.85rem;
    touch-action: manipulation;
  }
  
  .btn-remove {
    width: 24px;
    height: 24px;
    font-size: 0.8rem;
    opacity: 0.7; /* More visible on mobile */
  }
  
  .meal-card:hover .btn-remove {
    opacity: 1;
  }
  
  /* Better touch feedback */
  .meal-card:active {
    transform: scale(0.98);
  }
}

@media (max-width: 576px) {
  .meal-card {
    min-height: 40px;
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .btn-remove {
    width: 22px;
    height: 22px;
    font-size: 0.7rem;
  }
}
</style>
