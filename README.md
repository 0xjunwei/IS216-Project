

A modern, responsive meal planning application built with Vue.js 3, focusing on sustainability and healthy eating habits.

## ✨ Features

- **📅 Weekly Meal Planning**: Drag-and-drop interface for easy meal scheduling
- **🛒 Smart Shopping Lists**: Automatically generated from planned meals
- **🌿 Sustainability Focus**: Sustainable alternatives and eco-friendly meal suggestions
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **💾 Data Persistence**: Your meal plans are automatically saved locally
- **🔍 Meal Library**: Searchable collection of healthy recipes
- **🎯 Category Filtering**: Filter meals by type, dietary preferences, and more

## 🚀 Tech Stack

- **Frontend**: Vue.js 3 with Composition API
- **State Management**: Pinia
- **Styling**: Bootstrap 5 + Custom CSS
- **Build Tool**: Vite
- **Icons**: Font Awesome

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Google OAuth client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── meal-planner/          # Meal planning components
│   │   ├── WeeklyCalendar.vue
│   │   ├── MealCard.vue
│   │   ├── MealLibrary.vue
│   │   └── ShoppingList.vue
│   ├── App.vue               # Main application component
│   ├── Navigation.vue        # Navigation component
│   └── ErrorBoundary.vue     # Error handling component
├── composables/              # Reusable composition functions
│   ├── useValidation.js
│   ├── useDateHandling.js
│   └── useDragAndDrop.js
├── services/                 # Business logic services
│   ├── storage.js           # Local storage management
│   └── errorHandler.js      # Error handling service
├── stores/                   # Pinia state management
│   └── mealStore.js         # Main application store
└── main.js                  # Application entry point
```

## 🧪 Development

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Lint**: `npm run lint`
- **Format**: `npm run format`


---


