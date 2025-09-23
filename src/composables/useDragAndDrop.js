/**
 * Drag and Drop composable
 * Provides reusable drag and drop functionality for meal planning
 */

export const useDragAndDrop = () => {
  /**
   * Handles drag start event for meals
   * @param {Event} event - Drag start event
   * @param {Object} data - Data to transfer
   */
  const handleDragStart = (event, data) => {
    try {
      event.dataTransfer.setData("text/plain", JSON.stringify(data));
      event.dataTransfer.effectAllowed = "move";

      // Add visual feedback
      if (event.target) {
        event.target.style.opacity = "0.5";
      }
    } catch (error) {
      console.error("Error in handleDragStart:", error);
    }
  };

  /**
   * Handles drag end event
   * @param {Event} event - Drag end event
   */
  const handleDragEnd = (event) => {
    try {
      // Remove visual feedback
      if (event.target) {
        event.target.style.opacity = "1";
      }
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
    }
  };

  /**
   * Handles drag over event
   * @param {Event} event - Drag over event
   */
  const handleDragOver = (event) => {
    try {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      // Add visual feedback for drop zones
      if (event.currentTarget) {
        event.currentTarget.classList.add("drag-over");
      }
    } catch (error) {
      console.error("Error in handleDragOver:", error);
    }
  };

  /**
   * Handles drag enter event
   * @param {Event} event - Drag enter event
   */
  const handleDragEnter = (event) => {
    try {
      event.preventDefault();

      // Add visual feedback
      if (event.currentTarget) {
        event.currentTarget.classList.add("drag-enter");
      }
    } catch (error) {
      console.error("Error in handleDragEnter:", error);
    }
  };

  /**
   * Handles drag leave event
   * @param {Event} event - Drag leave event
   */
  const handleDragLeave = (event) => {
    try {
      // Remove visual feedback
      if (event.currentTarget) {
        event.currentTarget.classList.remove("drag-enter", "drag-over");
      }
    } catch (error) {
      console.error("Error in handleDragLeave:", error);
    }
  };

  /**
   * Handles drop event
   * @param {Event} event - Drop event
   * @param {Function} onDrop - Callback function to handle drop
   */
  const handleDrop = (event, onDrop) => {
    try {
      event.preventDefault();

      // Remove visual feedback
      if (event.currentTarget) {
        event.currentTarget.classList.remove("drag-enter", "drag-over");
      }

      // Get transferred data
      const dataString = event.dataTransfer.getData("text/plain");
      if (!dataString) {
        console.warn("No data found in drop event");
        return;
      }

      const data = JSON.parse(dataString);

      // Call the provided callback
      if (typeof onDrop === "function") {
        onDrop(data, event);
      }
    } catch (error) {
      console.error("Error in handleDrop:", error);
    }
  };

  /**
   * Creates drag and drop event handlers for a meal card
   * @param {Object} mealData - Meal data to transfer
   * @param {Function} onDrop - Callback for drop events
   * @returns {Object} - Event handlers object
   */
  const createMealCardHandlers = (mealData, onDrop) => {
    return {
      draggable: true,
      onDragstart: (event) => handleDragStart(event, mealData),
      onDragend: handleDragEnd,
      onDragover: handleDragOver,
      onDragenter: handleDragEnter,
      onDragleave: handleDragLeave,
      onDrop: (event) => handleDrop(event, onDrop),
    };
  };

  /**
   * Creates drag and drop event handlers for a drop zone
   * @param {Function} onDrop - Callback for drop events
   * @returns {Object} - Event handlers object
   */
  const createDropZoneHandlers = (onDrop) => {
    return {
      onDragover: handleDragOver,
      onDragenter: handleDragEnter,
      onDragleave: handleDragLeave,
      onDrop: (event) => handleDrop(event, onDrop),
    };
  };

  /**
   * Checks if drag and drop is supported
   * @returns {boolean} - True if drag and drop is supported
   */
  const isDragAndDropSupported = () => {
    return "draggable" in document.createElement("div");
  };

  /**
   * Sets up drag and drop for a meal from library
   * @param {Event} event - Drag start event
   * @param {Object} meal - Meal object
   */
  const dragMealFromLibrary = (event, meal) => {
    const data = {
      type: "fromLibrary",
      meal: meal,
    };
    handleDragStart(event, data);
  };

  /**
   * Sets up drag and drop for moving an existing meal
   * @param {Event} event - Drag start event
   * @param {Object} params - Parameters object
   * @param {Date} params.date - Date of the meal
   * @param {number} params.dayIndex - Day index
   * @param {string} params.mealType - Type of meal (breakfast, lunch, dinner)
   * @param {number} params.mealIndex - Index of the meal in the array
   * @param {Object} params.meal - Meal object
   */
  const dragMeal = (event, { date, dayIndex, mealType, mealIndex, meal }) => {
    const data = {
      type: "move",
      date: date.toISOString().split("T")[0],
      dayIndex: dayIndex,
      mealType: mealType,
      mealIndex: mealIndex,
      meal: meal,
    };
    handleDragStart(event, data);
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    createMealCardHandlers,
    createDropZoneHandlers,
    isDragAndDropSupported,
    dragMealFromLibrary,
    dragMeal,
  };
};
