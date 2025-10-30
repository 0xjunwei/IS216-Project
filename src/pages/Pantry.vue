<script>
import { StreamBarcodeReader, ImageBarcodeReader } from '@teckel/vue-barcode-reader'
import { auth, db } from "../js/config.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { checkAuthentication } from "../js/authenticationCheck.js";

checkAuthentication();

export default {
    data() {
        return {
            user: null,
            pantry: [],
            loading: false,
            error: '',
            today: new Date(),
            
            // Item details for the modal
            newItemName: '',
            quantity: null,
            unit: '',
            itemExpiry: '',
            category: '',
            // Edit expiry modal
            itemBeingEdited: null,
            editExpiryDate: '',
            
            // Item categories
            categories: ['Meat', 'Fruits & Vegetable', 'Dairy & Drinks', 'Others'],
            
            // Barcode Scanner usage
            decodedText: "",
            openCamera: false
        };
    },
    created() {
        // Listen for auth changes
        this.unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            this.user = currentUser;
            if (this.user) {
                this.retrievePantry();
            } else {
                // Clear data if logged out
                this.pantry = [];
            }
        });
    },

    // MODIFICATION: Added mounted() hook
    mounted() {
        // Get the modal element by its ID
        const modalEl = document.getElementById('addItemModal');
        if (modalEl) {
            // Add an event listener that fires when the modal is completely hidden
            // This catches backdrop clicks, Esc key presses, and button dismissals
            modalEl.addEventListener('hidden.bs.modal', () => {
                this.resetForm();
            });
        }
    },

    beforeUnmount() {
        if (this.unsubscribe) this.unsubscribe();
        // Note: In a complex app, you might also remove the 'hidden.bs.modal'
        // listener here, but for this component it's generally safe.
    },
    components: {
        StreamBarcodeReader,
        ImageBarcodeReader
    },
    computed: {
        // --- Computed properties for filtering pantry items ---
        meats() {
            return this.pantry.filter(item => item.category === 'Meat');
        },
        fruitsVegetables() {
            return this.pantry.filter(item => item.category === 'Fruits & Vegetable');
        },
        dairyDrinks() {
            return this.pantry.filter(item => item.category === 'Dairy & Drinks');
        },
        others() {
            return this.pantry.filter(item => item.category === 'Others');
        },

        // --- Computed properties for the dashboard cards ---
        totalItems() {
            return this.pantry.length;
        },
        freshItems() {
            return this.pantry.filter(item => item.freshness === 'Fresh').length;
        },
        expiringItems() {
            return this.pantry.filter(item => item.freshness === 'Expiring-Soon').length;
        },
        expiredItems() {
            return this.pantry.filter(item => item.freshness === 'Expired').length;
        },

        // --- Computed property for a nicely formatted date ---
        formattedToday() {
            return this.today.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    },
    methods: {
        async savePantry() {
            if (!this.user) return;
            const pantryRef = doc(db, "users", this.user.uid);
            try {
                await setDoc(pantryRef, { pantry: this.pantry }, { merge: true });
            } catch (err) {
                console.error("Error saving pantry", err);
                this.error = "Failed to save pantry.";
            }
        },

        async retrievePantry() {
            if (!this.user) return;
            this.loading = true;
            this.error = '';
            const pantryRef = doc(db, "users", this.user.uid);
            try {
                const snapshot = await getDoc(pantryRef);
                if (snapshot.exists()) {
                    // Load pantry and check freshness
                    const pantryData = snapshot.data().pantry || [];
                    this.pantry = pantryData.map(item => ({
                        ...item,
                        freshness: this.checkFreshness(item.expiry)
                    }));
                } else {
                    this.pantry = []; // No pantry data found
                }
            } catch (err) {
                console.error("Error retrieving pantry", err);
                this.error = "Failed to retrieve pantry.";
            } finally {
                this.loading = false;
            }
        },

        async createItem() {
            // Validate required fields
            if (!this.newItemName.trim() || !this.itemExpiry || !this.category || !this.quantity || !this.unit) {
                this.error = "Please fill in all required fields.";
                return;
            }
            
            const freshness = this.checkFreshness(this.itemExpiry);

            const newItem = {
                name: this.newItemName.trim(),
                expiry: this.itemExpiry,
                category: this.category,
                freshness: freshness,
                barcode: this.decodedText || '',
                quantity: this.quantity,
                unit: this.unit,
            };

            this.pantry.push(newItem);
            await this.savePantry();
            this.resetForm();
        },

        async removeItem(itemToRemove) {
            const index = this.pantry.findIndex(item => 
                item.name === itemToRemove.name && item.expiry === itemToRemove.expiry
            );
            
            if (index > -1) {
                this.pantry.splice(index, 1);
                await this.savePantry(); 
            }
        },

        resetForm() {
            this.newItemName = '';
            this.itemExpiry = '';
            this.category = '';
            this.decodedText = '';
            this.quantity = null;
            this.unit = '';
            // This is the line that stops the camera
            this.openCamera = false;
        },

        checkFreshness(expiryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            const expiry = new Date(expiryDate);
            expiry.setHours(0, 0, 0, 0); 

            const difference = expiry.getTime() - today.getTime();
            const diffDays = Math.ceil(difference / (1000 * 60 * 60 * 24));

            if (diffDays > 7) {
                return 'Fresh';
            } else if (diffDays >= 0 && diffDays <= 7) {
                return 'Expiring-Soon';
            } else {
                return 'Expired';
            }
        },
        
        onDecode(result) {
            this.decodedText = result;
            this.openCamera = false; 
        },
        onLoaded() {
            console.log('Camera ready');
        },

        // Open modal to edit expiry for a clicked item
        openEditExpiry(item) {
            this.itemBeingEdited = item;
            this.editExpiryDate = item?.expiry || '';
            // Rely on data-bs-toggle to show the modal, avoid requiring window.bootstrap
        },

        // Save updated expiry and freshness, persist to Firestore
        async updateExpiry() {
            if (!this.itemBeingEdited || !this.editExpiryDate) return;
            this.itemBeingEdited.expiry = this.editExpiryDate;
            this.itemBeingEdited.freshness = this.checkFreshness(this.editExpiryDate);
            await this.savePantry();
            const modalEl = document.getElementById('editExpiryModal');
            if (modalEl && window.bootstrap && window.bootstrap.Modal) {
                const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.hide();
            }
            this.itemBeingEdited = null;
            this.editExpiryDate = '';
        }
    }
}
</script>

<template>
<div class="page-container bg-light">
    
    <div class="container-xl py-4 mb-3">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1 class="mb-0">Your Pantry</h1>
                <p class="text-muted mb-0">Today is {{ formattedToday }}</p>
            </div>
            <button class="btn btn-success btn-lg d-flex align-items-center shadow-sm" data-bs-toggle="modal" data-bs-target="#addItemModal">
                <i class="bi bi-plus-lg me-2"></i> Add Item
            </button>
        </div>
    </div>

    <div class="container-xl mb-4">
        <div class="row gy-4">
            <div class="col-12 col-md-6 col-xl-3">
                <div class="bg-white h-100 p-4 rounded-4 shadow-sm">
                    <div class="d-flex align-items-center text-primary mb-3">
                        <i class="bi bi-box-seam-fill fs-3 me-3"></i>
                        <span class="fw-semibold">Total Items</span>
                    </div>
                    <div class="fw-bold display-4 mb-0">{{ totalItems }}</div>
                </div>
            </div>
            <div class="col-12 col-md-6 col-xl-3">
                <div class="bg-white h-100 p-4 rounded-4 shadow-sm">
                    <div class="d-flex align-items-center text-success mb-3">
                        <i class="bi bi-check-circle-fill fs-3 me-3"></i>
                        <span class="fw-semibold">Fresh Items</span>
                    </div>
                    <div class="fw-bold display-4 mb-0">{{ freshItems }}</div>
                </div>
            </div>
            <div class="col-12 col-md-6 col-xl-3">
                <div class="bg-white h-100 p-4 rounded-4 shadow-sm">
                    <div class="d-flex align-items-center text-warning mb-3">
                        <i class="bi bi-exclamation-triangle-fill fs-3 me-3"></i>
                        <span class="fw-semibold">Expiring Soon</span>
                    </div>
                    <div class="fw-bold display-4 mb-0">{{ expiringItems }}</div>
                </div>
            </div>
            <div class="col-12 col-md-6 col-xl-3">
                <div class="bg-white h-100 p-4 rounded-4 shadow-sm">
                    <div class="d-flex align-items-center text-danger mb-3">
                        <i class="bi bi-x-octagon-fill fs-3 me-3"></i>
                        <span class="fw-semibold">Expired</span>
                    </div>
                    <div class="fw-bold display-4 mb-0">{{ expiredItems }}</div>
                </div>
            </div>
        </div>
    </div>


    <div class="container-xl">
        <h2 class="text-center mb-4">Pantry Items</h2>
        <div class="row g-4">
            
            <div class="col-12 col-md-6 col-lg-3">
                <div class="card rounded-4 shadow-sm h-100 border-0">
                    <div class="card-header bg-white border-0 text-center fw-semibold fs-5 p-3">
                        <i class="bi bi-box2-heart text-danger fs-2 mb-1"></i><br>Meats
                    </div>
                    <div class="card-body pt-0">
                        <div v-if="meats.length > 0">
                            <div class="pantry-item" v-for="(item, index) in meats" :key="'meat-' + index" @click="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal">
                                <div>
                                    <div class="fw-semibold">{{ item.name }}</div>
                                    <div class="text-muted small">{{ item.quantity }} {{ item.unit }} &bull; Exp: {{ item.expiry }}</div>
                                    <div v-if="item.barcode" class="text-muted small fst-italic">Barcode: {{ item.barcode }}</div>
                                </div>
                                <div class="d-flex flex-column align-items-end gap-2">
                                    <span class="badge rounded-pill" :class="{
                                        'bg-success-subtle text-success-emphasis': item.freshness === 'Fresh',
                                        'bg-warning-subtle text-warning-emphasis': item.freshness === 'Expiring-Soon',
                                        'bg-danger-subtle text-danger-emphasis': item.freshness === 'Expired'
                                    }">
                                        {{ item.freshness }}
                                    </span>
                                    <button class="btn btn-sm btn-outline-danger border-0" @click.stop="removeItem(item)" title="Remove">
                                        <i class="bi bi-trash-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p v-if="meats.length === 0" class="text-muted text-center pt-3">No meat items.</p>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
                <div class="card rounded-4 shadow-sm h-100 border-0">
                    <div class="card-header bg-white border-0 text-center fw-semibold fs-5 p-3">
                        <i class="bi bi-apple text-success fs-2 mb-1"></i><br>Fruits & Vegetables
                    </div>
                    <div class="card-body pt-0">
                        <div v-if="fruitsVegetables.length > 0">
                            <div class="pantry-item" v-for="(item, index) in fruitsVegetables" :key="'fruit-' + index" @click="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal">
                                <div>
                                    <div class="fw-semibold">{{ item.name }}</div>
                                    <div class="text-muted small">{{ item.quantity }} {{ item.unit }} &bull; Exp: {{ item.expiry }}</div>
                                    <div v-if="item.barcode" class="text-muted small fst-italic">Barcode: {{ item.barcode }}</div>
                                </div>
                                <div class="d-flex flex-column align-items-end gap-2">
                                    <span class="badge rounded-pill" :class="{
                                        'bg-success-subtle text-success-emphasis': item.freshness === 'Fresh',
                                        'bg-warning-subtle text-warning-emphasis': item.freshness === 'Expiring-Soon',
                                        'bg-danger-subtle text-danger-emphasis': item.freshness === 'Expired'
                                    }">
                                        {{ item.freshness }}
                                    </span>
                                    <button class="btn btn-sm btn-outline-danger border-0" @click.stop="removeItem(item)" title="Remove">
                                        <i class="bi bi-trash-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p v-if="fruitsVegetables.length === 0" class="text-muted text-center pt-3">No fruit or vegetable items.</p>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
                <div class="card rounded-4 shadow-sm h-100 border-0">
                    <div class="card-header bg-white border-0 text-center fw-semibold fs-5 p-3">
                        <i class="bi bi-cup-straw text-info fs-2 mb-1"></i><br>Dairy & Drinks
                    </div>
                    <div class="card-body pt-0">
                        <div v-if="dairyDrinks.length > 0">
                            <div class="pantry-item" v-for="(item, index) in dairyDrinks" :key="'dairy-' + index" @click="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal">
                                <div>
                                    <div class="fw-semibold">{{ item.name }}</div>
                                    <div class="text-muted small">{{ item.quantity }} {{ item.unit }} &bull; Exp: {{ item.expiry }}</div>
                                    <div v-if="item.barcode" class="text-muted small fst-italic">Barcode: {{ item.barcode }}</div>
                                </div>
                                <div class="d-flex flex-column align-items-end gap-2">
                                    <span class="badge rounded-pill" :class="{
                                        'bg-success-subtle text-success-emphasis': item.freshness === 'Fresh',
                                        'bg-warning-subtle text-warning-emphasis': item.freshness === 'Expiring-Soon',
                                        'bg-danger-subtle text-danger-emphasis': item.freshness === 'Expired'
                                    }">
                                        {{ item.freshness }}
                                    </span>
                                    <button class="btn btn-sm btn-outline-danger border-0" @click.stop="removeItem(item)" title="Remove">
                                        <i class="bi bi-trash-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p v-if="dairyDrinks.length === 0" class="text-muted text-center pt-3">No dairy or drink items.</p>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
                <div class="card rounded-4 shadow-sm h-100 border-0">
                    <div class="card-header bg-white border-0 text-center fw-semibold fs-5 p-3">
                        <i class="bi bi-basket text-secondary fs-2 mb-1"></i><br>Others
                    </div>
                    <div class="card-body pt-0">
                        <div v-if="others.length > 0">
                            <div class="pantry-item" v-for="(item, index) in others" :key="'other-' + index" @click="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal">
                                <div>
                                    <div class="fw-semibold">{{ item.name }}</div>
                                    <div class="text-muted small">{{ item.quantity }} {{ item.unit }} &bull; Exp: {{ item.expiry }}</div>
                                    <div v-if="item.barcode" class="text-muted small fst-italic">Barcode: {{ item.barcode }}</div>
                                </div>
                                <div class="d-flex flex-column align-items-end gap-2">
                                    <span class="badge rounded-pill" :class="{
                                        'bg-success-subtle text-success-emphasis': item.freshness === 'Fresh',
                                        'bg-warning-subtle text-warning-emphasis': item.freshness === 'Expiring-Soon',
                                        'bg-danger-subtle text-danger-emphasis': item.freshness === 'Expired'
                                    }">
                                        {{ item.freshness }}
                                    </span>
                                    <button class="btn btn-sm btn-outline-danger border-0" @click.stop="removeItem(item)" title="Remove">
                                        <i class="bi bi-trash-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p v-if="others.length === 0" class="text-muted text-center pt-3">No other items.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="addItemModal" tabindex="-1" aria-labelledby="addItemModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4 shadow border-0">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold fs-5" id="addItemModalLabel">
                        <i class="bi bi-plus-circle text-success me-2"></i>Add New Item
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="resetForm"></button>
                </div>
                <div class="modal-body p-4">
                    <form id="pantryForm" class="row g-3" @submit.prevent="createItem">
                        <div class="col-12">
                            <label class="form-label fw-semibold">Item name</label>
                            <input type="text" class="form-control" placeholder="e.g., Chicken breast" v-model="newItemName" required>
                        </div>
                        <div class="col-6">
                            <label class="form-label fw-semibold">Quantity</label>
                            <input type="number" class="form-control" placeholder="e.g., 2" v-model.number="quantity" required>
                        </div>
                        <div class="col-6">
                            <label class="form-label fw-semibold">Unit</label>
                            <input type="text" class="form-control" placeholder="e.g., pcs, L" v-model="unit" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Category</label>
                            <select class="form-select" v-model="category" required>
                                <option value="" disabled>Select a category</option>
                                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Expiry date</label>
                            <input type="date" class="form-control" v-model="itemExpiry" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label small text-secondary">Scan or type barcode (optional)</label>
                            <div class="input-group">
                                <input type="text" class="form-control" placeholder="Barcode" v-model="decodedText">
                                <button type="button" class="btn btn-outline-success" @click="openCamera = !openCamera">
                                    <i class="bi bi-upc-scan me-1"></i>{{ openCamera ? 'Close' : 'Scan' }}
                                </button>
                            </div>
                            
                            <div v-if="openCamera" class="camera-stream-wrapper">
                                <StreamBarcodeReader @decode="onDecode" @loaded="onLoaded"/>
                                <small class="text-muted d-block text-center mt-1">Point camera at barcode</small>

                            </div>
                        </div>
                        <div class="col-12 pt-2">
                            <button type="submit" class="btn btn-success btn-lg w-100" 
                                    :data-bs-dismiss="(!newItemName || !category || !itemExpiry || !unit || !quantity) ? '' : 'modal'"
                                    :disabled="!newItemName || !category || !itemExpiry || !unit || !quantity">
                                Add Item to Pantry
                            </button>
                            <div v-if="!newItemName || !category || !itemExpiry || !unit || !quantity" class="mt-2 text-center">
                                <small class="text-danger">Please fill in all required fields.</small>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Edit Expiry Modal -->
    <div class="modal fade" id="editExpiryModal" tabindex="-1" aria-labelledby="editExpiryModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4 shadow border-0">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold fs-5" id="editExpiryModalLabel">
                        <i class="bi bi-calendar-event text-primary me-2"></i>Update Expiry Date
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">New expiry date</label>
                        <input type="date" class="form-control" v-model="editExpiryDate">
                    </div>
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" :disabled="!editExpiryDate" @click="updateExpiry">Save</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
.page-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding-top: 72px; /* Adjust if your navbar is a different height */
    padding-bottom: 4rem; 
}

.pantry-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem 0.5rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
}

.pantry-item:last-child {
    border-bottom: none;
}

.camera-stream-wrapper {
    margin-top: 0.5rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem; 
    padding: 0.5rem;          
    overflow: hidden;          
    position: relative;
    background: #f8f9fa;       
}

.camera-stream-wrapper :deep(video),
.camera-stream-wrapper :deep(canvas) {
    max-width: 100%;
    height: auto;
    border-radius: 0.25rem; 
}
</style>