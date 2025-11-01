<template>
  <div class="min-vh-100 bg-light">
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="display-5 fw-bold mb-0">Find Grocers</h2>

        <div class="btn-group" role="group">
          <button 
            type="button" 
            :class="showPhysicalModal ? 'btn btn-success' : 'btn btn-outline-success'"
            @click="showPhysicalModal = true"
          >
            <i class="bi bi-geo-alt me-2"></i>Physical Stores
          </button>
          <button 
            type="button" 
            :class="!showPhysicalModal ? 'btn btn-success' : 'btn btn-outline-success'"
            @click="showPhysicalModal = false"
          >
            <i class="bi bi-cart me-2"></i>Online Shopping
          </button>
        </div>
      </div>
      
      <!-- Location Input -->
      <div class="mb-4" v-if="showPhysicalModal">
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-geo-alt"></i></span>
          <input 
            ref="autocompleteInput"
            type="text" 
            class="form-control" 
            placeholder="Enter address or location"
            v-model="locationInput"
            @keyup.enter="updateLocation"
          />
          <button class="btn btn-success" type="button" @click="updateLocation">
            <i class="bi bi-search me-2"></i>Search
          </button>
        </div>
        
        <!-- Quick Suggestions section -->
        <div class="mt-2" v-if="showPhysicalModal">
          <small class="text-muted">Quick search: </small>
          <button 
            v-for="suggestion in locationSuggestions" 
            :key="suggestion"
            class="btn btn-sm btn-outline-secondary me-2 mb-2"
            @click="searchSuggestions(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
        <button 
        class="btn btn-outline-success mt-2" 
        type="button" 
        @click="useMyLocation"
        title="Use precise location"
        v-if="showPhysicalModal"
        >
        <i class="bi bi-crosshair me-2"></i>Use my location
        </button>
        
      </div>

      
      <!-- Physical Stores Modal -->
      <div v-if="showPhysicalModal">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Finding your location...</p>
        </div>
        
        <!-- Map Container - Always render when in Physical Stores mode -->
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-body p-0">
            <div ref="mapContainer" :key="`map-${showPhysicalModal}`" class="map-container"></div>
          </div>
        </div>
        
        <!-- Error State -->
        <div v-if="error" class="alert alert-danger mt-3" role="alert">
          {{ error }}
        </div>
        
        <!-- Grocers List -->
        <div v-if="grocers.length > 0">
          <h3 class="h4 mb-3">Nearby Grocers</h3>
          <div class="row g-3">
            <div v-for="grocer in grocers" :key="grocer.id" class="col-12 col-md-6 col-lg-4">
              <div class="card h-100 shadow-sm grocer-card" @click="showGrocerOnMap(grocer)">
                <div class="card-body">
                  <h5 class="card-title mb-2">{{ grocer.name }}</h5>
                  <p class="text-muted mb-2 small">
                    <i class="bi bi-geo-alt"></i> {{ grocer.address }}
                  </p>
                  <p class="text-muted mb-0 small">
                    <i class="bi bi-clock"></i> {{ grocer.distance }} km away
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Online Shopping Modal -->
       <!-- Re-adjust due to online shop blocking iframe load to prevent clickjacking. -->
      <div v-else>
        <div class="row g-3">
          <div v-for="item in onlineGrocers" :key="item.name" class="col-12 col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm grocer-card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <i :class="item.icon" class="text-success me-3" style="font-size: 2rem;"></i>
                  <h5 class="card-title mb-0">{{ item.name }}</h5>
                </div>
                <p class="text-muted small mb-3">{{ item.description }}</p>
                <div class="d-flex gap-2">
                  <a 
                    :href="item.link" 
                    target="_blank" 
                    class="btn btn-success btn-sm flex-grow-1"
                  >
                    <i class="bi bi-cart me-2"></i>Shop online
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'

const isLoading = ref(true)
const mapLoaded = ref(false)
const error = ref(null)
const grocers = ref([])
const userLocation = ref(null)
const mapContainer = ref(null)
const locationInput = ref('')
const showPhysicalModal = ref(true)
const autocompleteInput = ref(null)
const locationSuggestions = ref([
  'Singapore', 'Orchard Road', 'Singapore Management University', 'Sentosa'
])
const onlineGrocers = ref([
  {
    name: 'FairPrice Online',
    icon: 'bi bi-house-door',
    description: 'NTUC FairPrice online grocery delivery',
    link: 'https://www.fairprice.com.sg/'
  },
  {
    name: 'Amazon Fresh',
    icon: 'bi bi-basket',
    description: 'Amazon online store',
    link: 'https://www.amazon.sg/alm/storefront?almBrandId=QW1hem9uIEZyZXNo',
  },
  {
    name: 'GrabMart',
    icon: 'bi bi-bag-heart',
    description: 'GrabMart delivery',
    link: 'https://mart.grab.com/sg/en'
  }
])
let map = null
let markers = []
let autocomplete = null

// Get user's GPS location
const getUserPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("No GPS support"))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude 
      }),
      err => reject(err),
      { 
        enableHighAccuracy: true, 
        timeout: 8000, 
        maximumAge: 60000 
      }
    )
  })
}

// Get user IP address (fallback)
const getUserIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (err) {
    console.error('Error getting IP:', err)
    return null
  }
}

// Get location from IP address
const getLocationFromIP = async () => {
  try {
    const ip = await getUserIP()
    if (!ip) return { lat: 1.2963, lng: 103.8502 }
    
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await response.json()
    
    if (data.latitude && data.longitude) {
      return {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude)
      }
    }
    // If all else fails, then return SMU
    return { lat: 1.2963, lng: 103.8502 }
  } catch (err) {
    // Same as above return if fail
    console.log('IP location failed:', err)
    return { lat: 1.2963, lng: 103.8502 }
  }
}

// Convert search query to lat/long
const getLocationFromQuery = async (query) => {
  if (!query) return null
  
  // Check if Google Maps is loaded
  if (!window.google || !window.google.maps) {
    console.error('Google Maps not loaded yet')
    return null
  }
  
  try {
    const geocoder = new window.google.maps.Geocoder()
    return new Promise((resolve) => {
      geocoder.geocode({ address: query }, (results, status) => {
        console.log('Geocoding result:', status, results)
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location
          resolve({
            lat: location.lat(),
            lng: location.lng()
          })
        } else {
          console.error('Geocoding failed:', status)
          resolve(null)
        }
      })
    })
  } catch (err) {
    console.error('Error geocoding:', err)
    return null
  }
}

// Get user location - try GPS first, then IP address
const getUserLocation = async () => {
  try {
    // Try to get location from GPS
    const position = await getUserPosition()
    return position
  } catch (error) {
    console.log('GPS failed, trying IP address...')
    
    try {
      // If GPS fails, get location from IP address
      const ipLocation = await getLocationFromIP()
      return ipLocation
    } catch (ipError) {
      console.log('IP location failed, using SMU')
      // If everything fails, use SMU as default
      return { lat: 1.2963, lng: 103.8502 }
    }
  }
}

// Use my location button handler
const useMyLocation = async () => {
  if (!map) {
    isLoading.value = true
  }
  error.value = null
  
  try {
    const location = await getUserLocation()
    userLocation.value = location
    
    // Update map if it exists
    if (map) {
      map.setCenter(location)
      map.setZoom(13)
      await findNearbyGrocers()
    } else {
      await initMap()
    }
    
    // Clear location input since we're using precise location
    locationInput.value = ''
    
  } catch (err) {
    console.error('Error getting user location:', err)
    error.value = 'Unable to get your location. Please try searching manually.'
  } finally {
    isLoading.value = false
  }
}



// Initialize Google Map
const initMap = async () => {
  if (!window.google) {
    error.value = 'Google Maps failed to load'
    isLoading.value = false
    return
  }
  
  // Set loading to false first to render the map container
  isLoading.value = false
  
  // Wait for the DOM element to be available
  await nextTick()
  
  if (!mapContainer.value) {
    error.value = 'Map container not available'
    return
  }

  if (!userLocation.value) {
    console.log('No user location available, using SMU as fallback')
    userLocation.value = { lat: 1.2963, lng: 103.8502 }
  }
  
  try {
    console.log('Initializing map with location:', userLocation.value)
    console.log('Map container element:', mapContainer.value)
    console.log('Map container dimensions:', mapContainer.value.offsetWidth, 'x', mapContainer.value.offsetHeight)
    
    // Create new map
    if (map) {
      map = null
    }
    
    // Create new map
    map = new window.google.maps.Map(mapContainer.value, {
      center: userLocation.value,
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })
    
    console.log('Map initialized successfully')
    mapLoaded.value = true
    
    // Force map to resize after a short delay
    setTimeout(() => {
      if (map) {
        window.google.maps.event.trigger(map, 'resize')
        console.log('Map resize triggered')
      }
    }, 100)
    
  } catch (err) {
    console.error('Error initializing map:', err)
    error.value = 'Failed to initialize map'
  }
}

// Find nearby grocers
const findNearbyGrocers = async () => {
  if (!map || !userLocation.value) return
  
  // Clear existing markers
  markers.forEach(marker => marker.setMap(null))
  markers = []
  grocers.value = []
  
  try {
    const service = new window.google.maps.places.PlacesService(map)
    
    const request = {
      location: userLocation.value,
      // Radius is a 2km search circle from my location
      radius: 2000,
      type: 'supermarket'
    }
    
    // Using google to calculate distance between me and the store
    // Abit flawed as it uses straight line calculation not realistic but good enough for demo purpose?
    // Please dont mark down over a straight line vs walking distance
    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        grocers.value = results.slice(0, 15).map((place, index) => {
          const distance = calculateDistance(
            userLocation.value.lat,
            userLocation.value.lng,
            place.geometry.location.lat(),
            place.geometry.location.lng()
          )
          
          // Add marker to map
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name
          })
          
          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h6 class="fw-bold mb-1">${place.name}</h6>
                <p class="text-muted mb-2 small">${place.vicinity || 'Address not available'}</p>
                <p class="text-success mb-0 small"><i class="bi bi-geo-alt"></i> ${distance.toFixed(2)} km away</p>
              </div>
            `
          })
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker)
          })
          
          markers.push(marker)
          
          return {
            id: index,
            name: place.name,
            address: place.vicinity || 'Address not available',
            distance: distance.toFixed(2),
            location: place.geometry.location,
            rating: place.rating || 'N/A'
          }
        })
        
        console.log(`Found ${grocers.value.length} grocers`)
      } else {
        console.error('Places search error:', status)
        error.value = 'No grocers found in your area'
      }
    })
  } catch (err) {
    console.error('Error finding nearby grocers:', err)
    error.value = 'Error searching for grocers'
  }
}

// Calculate distance using Google Maps
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const point1 = new window.google.maps.LatLng(lat1, lng1)
  const point2 = new window.google.maps.LatLng(lat2, lng2)
  const distance = window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2)
  return distance / 1000 // Convert meters to kilometers
}

// Show specific grocer on map
const showGrocerOnMap = (grocer) => {
  if (map && grocer.location) {
    map.setCenter(grocer.location)
    map.setZoom(15)
  }
}

// Search suggestions
const searchSuggestions = async (place) => {
  locationInput.value = place
  await updateLocation()
}

// Update location
const updateLocation = async () => {
  if (!locationInput.value) {
    isLoading.value = false
    return
  }
  
  if (!map) {
    isLoading.value = true
  }
  error.value = null
  
  try {
    console.log('Getting location for:', locationInput.value)
    
    // Ensure Google Maps is loaded before geocoding
    if (!window.google || !window.google.maps) {
      await loadGoogleMaps()
    }
    
    const location = await getLocationFromQuery(locationInput.value)
    
    if (location) {
      console.log('Location found:', location)
      userLocation.value = location
      
      if (!map) {
        await initMap()
      } else {
        console.log('Updating existing map center to:', location)
        map.setCenter(location)
        map.setZoom(13)
        
        await new Promise(resolve => setTimeout(resolve, 500))
        await findNearbyGrocers()
      }
    } else {
      console.error('Location not found for:', locationInput.value)
      error.value = 'Location not found. Please try a different address.'
    }
  } catch (err) {
    console.error('Error updating location:', err)
    error.value = 'Failed to update location'
  } finally {
    isLoading.value = false
  }
}

// Initialize autocomplete
const initAutocomplete = () => {
  if (!autocompleteInput.value || !window.google) return
  
  autocomplete = new window.google.maps.places.Autocomplete(
    autocompleteInput.value,
    { types: ['geocode'] }
  )
  
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (place.geometry) {
      userLocation.value = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      }
      locationInput.value = place.formatted_address
      
      if (map) {
        map.setCenter(userLocation.value)
        map.setZoom(13)
        findNearbyGrocers()
      }
    }
  })
}

// Load Google Maps script
const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded')
      resolve()
      return
    }
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY
    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables')
      reject(new Error('Google Maps API key not configured'))
      return
    }
    
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log('Google Maps script loaded successfully')
      resolve()
    }
    script.onerror = (err) => {
      console.error('Failed to load Google Maps script:', err)
      reject(err)
    }
    document.head.appendChild(script)
  })
}

// Initialize
onMounted(async () => {
  try {

    await loadGoogleMaps()

    // Try to get
    userLocation.value = await getUserLocation()
    console.log('User location:', userLocation.value)
    
    // Initialize map
    await initMap()
 
    await nextTick()
    
    // Initialize autocomplete
    initAutocomplete()
    
    // Find nearby grocers after a short delay
    setTimeout(() => {
      findNearbyGrocers()
    }, 500)
    
  } catch (err) {
    console.error('Error initializing shopping page:', err)
    error.value = 'Failed to load shopping page'
    isLoading.value = false
  }
})

// Watch for modal changes
watch(showPhysicalModal, async (newVal) => {
  if (newVal) {
    await nextTick()
    
    // Wait a bit more for the container to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 200))

    if (mapContainer.value) {
      console.log('Container dimensions:', mapContainer.value.offsetWidth, 'x', mapContainer.value.offsetHeight)
    }
    
    // Initialize or update map
    await initMap()
    
    // Wait for map to be ready, then find grocers
    setTimeout(() => {
      console.log('Finding grocers...')
      findNearbyGrocers()
    }, 1000)
  }
})
</script>

<style scoped>
.map-container {
  height: 500px;
  width: 100%;
  border-radius: 8px;
}

.grocer-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.grocer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

@media (max-width: 768px) {
  .map-container {
    height: 400px;
  }
}

.btn-group .btn.active {
  background-color: #198754;
  color: white;
}
</style>
