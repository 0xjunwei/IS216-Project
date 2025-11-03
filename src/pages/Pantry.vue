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

            //Added create multiple item part
            createMultiple: false,
            itemCount:2,
            multipleItems: [],
            tempIdCounter: 0,
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

    mounted() {
        const modalEl = document.getElementById('addItemModal');
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', () => {
                this.resetForm();
            });
        }
    },

    beforeUnmount() {
        if (this.unsubscribe) this.unsubscribe();
    },
    components: {
        StreamBarcodeReader,
        ImageBarcodeReader
    },
    //To watch whenever create multiple is selected
    watch: {
        //Creates multiple version of the add item form
        createMultiple(newValue) {
            if (newValue) {
                    this.multipleItems = []; //resets the array
                    for (let i = 0; i < this.itemCount; i++) {
                        this.multipleItems.push(this.createBlankItem());
                    }
            }
        },
        // Changes the no. of item field if there are changes
        itemCount(newVal, oldVal) {
                if (!this.createMultiple) return;

                const diff = newVal - oldVal;
                if (diff > 0) { //add more item form
                    for (let i = 0; i < diff; i++) {
                        this.multipleItems.push(this.createBlankItem());
                    }
                } else if (diff < 0) { // Remove items form
                    this.multipleItems.splice(newVal); // remove based on the lower value
                }
            }
    },
    computed: {
    //Added a sorted pantry by date
        sortedPantry() {
            return [...this.pantry].sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        },
        meats() {
            return this.sortedPantry.filter(item => item.category === 'Meat');
        },
        fruitsVegetables() {
            return this.sortedPantry.filter(item => item.category === 'Fruits & Vegetable');
        },
        dairyDrinks() {
            return this.sortedPantry.filter(item => item.category === 'Dairy & Drinks');
        },
        others() {
            return this.sortedPantry.filter(item => item.category === 'Others');
        },
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

        formattedToday() {
            return this.today.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        isFormInvalid() {
            if (this.createMultiple) {
                if (this.multipleItems.length === 0) return true; 
                // Check if any items is not fulfilled
                return this.multipleItems.some(item => 
                    !item.name.trim() || !item.itemExpiry || !item.category || !item.quantity || !item.unit || item.quantity <= 0
                );
            } else {
                return !this.newItemName.trim() || !this.itemExpiry || !this.category || !this.quantity || !this.unit || this.quantity < 0;
            }
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
            if (this.isFormInvalid) {
                this.error = "Please fill in all required fields for all items.";
                return;
            }
            
            let itemsAdded = false;
            this.error = ''; // Clear error

            if (this.createMultiple) {
                // Loop through all items in the forms
                for (const item of this.multipleItems) {
                    // Validate each item again (double check JIC)
                    if (!item.name.trim() || !item.itemExpiry || !item.category || !item.quantity || !item.unit) {
                        continue; // Skip this invalid item
                    }

                    const freshness = this.checkFreshness(item.itemExpiry);
                    const newItem = {
                        name: item.name.trim(),
                        expiry: item.itemExpiry,
                        category: item.category,
                        freshness: freshness,
                        barcode: item.barcode || '',
                        quantity: item.quantity,
                        unit: item.unit,
                    };
                    this.pantry.push(newItem);
                    itemsAdded = true;
                }
            } else {
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
                itemsAdded = true;
            }

            if (itemsAdded) {
                await this.savePantry();
            }
            this.resetForm();
        },

        createBlankItem() { //Creates the empty new forms
            this.tempIdCounter++;

                return {
                    id: `temp-${this.tempIdCounter}`, // Have to force it into a string, dk y its bugs out
                    name: '',
                    quantity: null,
                    unit: '',
                    itemExpiry: '',
                    category: '',
                    barcode: '',
                    openCamera: false
                };
            },

        resetForm() {
                    // Reset single form fields
                    this.newItemName = '';
                    this.itemExpiry = '';
                    this.category = '';
                    this.decodedText = '';
                    this.quantity = null;
                    this.unit = '';
                    this.openCamera = false;

                    // Reset multiple form fields
                    this.createMultiple = false;
                    this.multipleItems = [];
                    this.itemCount = 2;
                    this.error = '';
                    this.tempIdCounter = 0
                },

        addItemRow() {
            // You are dynamically loading the item cards thus when itemCount++ it adds one, by pushing another its adding +2 everytime
            //this.multipleItems.push(this.createBlankItem());
            this.itemCount++; //Sync with submit counter
        },

        removeItemRow(index) {
            this.multipleItems.splice(index, 1);
            this.itemCount--; //Sync with submit
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
        
        onDecode(result, index = null) {
            if (this.createMultiple && index !== null) {
                // If in multiple mode, update the specific item in the array
                this.multipleItems[index].barcode = result;
                this.multipleItems[index].openCamera = false;
            } else if (!this.createMultiple) {
                this.decodedText = result;
                this.openCamera = false; 
            }
        },

        onLoaded() {
            console.log('Camera ready');
        },

        openEditExpiry(item) {
            this.itemBeingEdited = item;
            this.editExpiryDate = item?.expiry || '';
        },

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
        },

        async deleteCurrentItem() {
            if (!this.itemBeingEdited) return;
            await this.removeItem(this.itemBeingEdited);
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
<div class="min-vh-100 bg-light pt-5 pb-4">
    
    <div class="container-xl py-3 mb-2">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h2 class="mb-1">Pantry</h2>
                <p class="text-muted mb-0">{{ formattedToday }}</p>
            </div>
            <button class="btn btn-success d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#addItemModal">
                <i class="bi bi-plus-lg me-2"></i> Add item
            </button>
        </div>
    </div>

    <div class="container-xl mb-4">
        <div class="row gy-4">
            <div class="col-12 col-md-6 col-xl-3">
                <div class="bg-white h-100 p-3 rounded-4 border">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-box-seam me-2 text-muted"></i>
                        <span class="text-muted">Total items</span>
                    </div>
                    <div class="fw-semibold fs-2 mb-0">{{ totalItems }}</div>
                </div>
            </div>
            <div class="col-12 col-md-6 col-xl-3">
                <div class="bg-white h-100 p-3 rounded-4 border">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-check-circle me-2 text-success"></i>
                        <span class="text-muted">Fresh</span>
                    </div>
                    <div class="fw-semibold fs-2 mb-0">{{ freshItems }}</div>
                </div>
            </div>
            <div class="col-12 col-md-6 col-xl-3">
                <div class="bg-white h-100 p-3 rounded-4 border">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-clock-history me-2 text-warning"></i>
                        <span class="text-muted">Expiring soon</span>
                    </div>
                    <div class="fw-semibold fs-2 mb-0">{{ expiringItems }}</div>
                </div>
            </div>
            <div class="col-12 col-md-6 col-xl-3">
                <div class="bg-white h-100 p-3 rounded-4 border">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-x-octagon me-2 text-danger"></i>
                        <span class="text-muted">Expired</span>
                    </div>
                    <div class="fw-semibold fs-2 mb-0">{{ expiredItems }}</div>
                </div>
            </div>
        </div>
    </div>


    <div class="container-xl">
        <h3 class="text-center mb-3">Items</h3>
        <div class="row g-4">
            
            <div class="col-12 col-md-6 col-lg-3">
                <div class="card rounded-4 shadow-sm h-100 border-0">
                    <div class="card-header bg-white border-0 text-center fw-semibold p-3">
                        <i class="bi bi-box2-heart text-muted me-1"></i> Meats
                    </div>
                    <div class="card-body pt-0">
                        <div v-if="meats.length > 0">
                            <div class="d-flex justify-content-between align-items-start py-3 border-bottom cursor-pointer position-relative item-row" v-for="(item, index) in meats" :key="'meat-' + index" @click="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal" title="Click to edit expiry">
                                <div>
                                    <a href="#" class="text-reset fw-semibold text-decoration-none clickable-name stretched-link" @click.prevent.stop="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal" title="Edit expiry">{{ item.name }}</a>
                                    <div class="text-muted small">{{ item.quantity }} {{ item.unit }} Expiry: {{ item.expiry }}</div>
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
                                </div>
                            </div>
                        </div>
                        <p v-if="meats.length === 0" class="text-muted text-center pt-3">No meat items.</p>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
                <div class="card rounded-4 shadow-sm h-100 border-0">
                    <div class="card-header bg-white border-0 text-center fw-semibold p-3">
                        <i class="bi bi-apple text-muted me-1"></i> Fruits & Vegetables
                    </div>
                    <div class="card-body pt-0">
                        <div v-if="fruitsVegetables.length > 0">
                            <div class="d-flex justify-content-between align-items-start py-3 border-bottom cursor-pointer position-relative item-row" v-for="(item, index) in fruitsVegetables" :key="'fruit-' + index" @click="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal" title="Click to edit expiry">
                                <div>
                                    <a href="#" class="text-reset fw-semibold text-decoration-none clickable-name stretched-link" @click.prevent.stop="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal" title="Edit expiry">{{ item.name }}</a>
                                    <div class="text-muted small">{{ item.quantity }} {{ item.unit }} Expiry: {{ item.expiry }}</div>
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
                                </div>
                            </div>
                        </div>
                        <p v-if="fruitsVegetables.length === 0" class="text-muted text-center pt-3">No fruit or vegetable items.</p>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
                <div class="card rounded-4 shadow-sm h-100 border-0">
                    <div class="card-header bg-white border-0 text-center fw-semibold p-3">
                        <i class="bi bi-cup-straw text-muted me-1"></i> Dairy & Drinks
                    </div>
                    <div class="card-body pt-0">
                        <div v-if="dairyDrinks.length > 0">
                            <div class="d-flex justify-content-between align-items-start py-3 border-bottom cursor-pointer position-relative item-row" v-for="(item, index) in dairyDrinks" :key="'dairy-' + index" @click="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal" title="Click to edit expiry">
                                <div>
                                    <a href="#" class="text-reset fw-semibold text-decoration-none clickable-name stretched-link" @click.prevent.stop="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal" title="Edit expiry">{{ item.name }}</a>
                                    <div class="text-muted small">{{ item.quantity }} {{ item.unit }} Expiry: {{ item.expiry }}</div>
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
                                </div>
                            </div>
                        </div>
                        <p v-if="dairyDrinks.length === 0" class="text-muted text-center pt-3">No dairy or drink items.</p>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
                <div class="card rounded-4 shadow-sm h-100 border-0">
                    <div class="card-header bg-white border-0 text-center fw-semibold p-3">
                        <i class="bi bi-basket text-muted me-1"></i> Others
                    </div>
                    <div class="card-body pt-0">
                        <div v-if="others.length > 0">
                            <div class="d-flex justify-content-between align-items-start py-3 border-bottom cursor-pointer position-relative item-row" v-for="(item, index) in others" :key="'other-' + index" @click="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal" title="Click to edit expiry">
                                <div>
                                    <a href="#" class="text-reset fw-semibold text-decoration-none clickable-name stretched-link" @click.prevent.stop="openEditExpiry(item)" data-bs-toggle="modal" data-bs-target="#editExpiryModal" title="Edit expiry">{{ item.name }}</a>
                                    <div class="text-muted small">{{ item.quantity }} {{ item.unit }} Expiry: {{ item.expiry }}</div>
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
                                </div>
                            </div>
                        </div>
                        <p v-if="others.length === 0" class="text-muted text-center pt-3">No other items.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
<!-- Add New Item Popup -->
<div class="modal fade" id="addItemModal" tabindex="-1" aria-labelledby="addItemModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content rounded-4 shadow border-0">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold fs-5" id="addItemModalLabel">
                        <i class="bi bi-plus-circle text-success me-2"></i>Add New Item
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button> <!-- resetForm is called by event listener -->
                </div>
                
                <div class="modal-body p-4">
                    <!-- Checkbox to toggle modes -->
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" v-model="createMultiple" id="checkAddMultiple">
                        <label class="form-check-label" for="checkAddMultiple">
                            Add Multiple Items
                        </label>
                    </div>
                    <div v-if="createMultiple" class="col-12 mb-3">
                        <label for="itemCountInput" class="form-label fw-semibold">No. of items:</label>
                        <input type="number" id="itemCountInput" class="form-control" v-model.number="itemCount" min="1">
                    </div>
                    <!-- Error message display -->
                    <div v-if="error" class="alert alert-danger p-2 small">{{ error }}</div>

                    <!-- Main Form Container -->
                    <form id="pantryForm" @submit.prevent="createItem">
                        
                        <!-- Single Item Form -->
                        <div v-if="!createMultiple" class="row g-3">
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
                                <div v-if="openCamera" class="border rounded p-2 bg-light mt-2">
                                    <StreamBarcodeReader @decode="onDecode($event, null)" @loaded="onLoaded"/>
                                    <small class="text-muted d-block text-center mt-1">Point camera at barcode</small>
                                </div>
                            </div>
                        </div>

                        <!-- Multiple Item form -->
                        <div v-else>
                            <!-- Scrollable container-->
                            <div class="multi-item-container" style="max-height: 50vh; overflow-y: auto; padding-right: 10px;">
                                <div v-for="(item, index) in multipleItems" :key="item.id" class="row g-3 p-3 mb-3 border rounded-3 bg-light position-relative">
                                    
                                    <!-- Remove Row Button -->
                                    <button type="button" class="btn-close position-absolute" @click="removeItemRow(index)" aria-label="Remove item" style="top: 10px; right: 10px; z-index: 10;" v-if="multipleItems.length > 1"></button>
                                    <!-- Similar to Normal -->
                                    <div class="col-12">
                                        <label class="form-label fw-semibold">Item {{ index + 1 }}: Name</label>
                                        <input type="text" class="form-control" placeholder="e.g., Chicken breast" v-model="item.name" required>
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label fw-semibold">Quantity</label>
                                        <input type="number" class="form-control" placeholder="e.g., 2" v-model.number="item.quantity" required>
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label fw-semibold">Unit</label>
                                        <input type="text" class="form-control" placeholder="e.g., pcs, L" v-model="item.unit" required>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label fw-semibold">Category</label>
                                        <select class="form-select" v-model="item.category" required>
                                            <option value="" disabled>Select a category</option>
                                            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label fw-semibold">Expiry date</label>
                                        <input type="date" class="form-control" v-model="item.itemExpiry" required>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label small text-secondary">Scan or type barcode (optional)</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control" placeholder="Barcode" v-model="item.barcode">
                                            <button type="button" class="btn btn-outline-success" @click="item.openCamera = !item.openCamera">
                                                <i class="bi bi-upc-scan me-1"></i>{{ item.openCamera ? 'Close' : 'Scan' }}
                                            </button>
                                        </div>
                                        <div v-if="item.openCamera" class="border rounded p-2 bg-white mt-2">
                                            <StreamBarcodeReader @decode="onDecode($event, index)" @loaded="onLoaded"/>
                                            <small class="text-muted d-block text-center mt-1">Point camera at barcode</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Add Another Item Button -->
                            <div class="col-12 pt-3">
                                <button type="button" class="btn btn-outline-primary w-100" @click="addItemRow">
                                    <i class="bi bi-plus-lg me-1"></i> Add Another Item
                                </button>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <div class="col-12 pt-4">
                            <button type="submit" class="btn btn-success btn-lg w-100" 
                                    :data-bs-dismiss="isFormInvalid ? '' : 'modal'"
                                    :disabled="isFormInvalid">
                                {{ createMultiple ? `Add ${multipleItems.length} Item(s)` : 'Add Item to Pantry' }}
                            </button>
                            <div v-if="isFormInvalid" class="mt-2 text-center">
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
                    <div class="d-flex justify-content-between align-items-center">
                        <button type="button" class="btn btn-outline-danger" @click="deleteCurrentItem" data-bs-dismiss="modal">Delete item</button>
                        <div>
                            <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" :disabled="!editExpiryDate" @click="updateExpiry">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
.clickable-name:hover { text-decoration: underline; }
.item-row:hover { background-color: #f8f9fa; }
</style><template>
  <div class="dashboard-container bg-light min-vh-100">
    <div class="container py-5">
      <h2 class="fw-bold text-success text-center mb-2">Food Waste Dashboard</h2>
      <p class="text-muted text-center mb-5">
        Track your CO₂ savings, money saved, and food waste reduction.
      </p>

      <!-- Stats Section -->
      <div class="row g-4 mb-5 text-center">
        <div v-for="stat in stats" :key="stat.label" class="col-12 col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body py-4">
              <h5
                class="fw-semibold"
                :class="{
                  'text-success': stat.label.includes('Saved') || stat.label.includes('Avoided'),
                  'text-danger': stat.label.includes('Wasted'),
                }"
              >
                {{ stat.label }}
              </h5>
              <p
                class="display-6 fw-bold mb-0"
                :class="{
                  'text-success': stat.label.includes('Saved') || stat.label.includes('Avoided'),
                  'text-danger': stat.label.includes('Wasted'),
                }"
              >
                {{ stat.value }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="card border-0 shadow-sm p-4">
        <h5 class="fw-semibold text-danger text-center mb-3">Weekly Food Waste (kg)</h5>
        <div class="chart-container mx-auto" style="height:350px; max-width:900px;">
          <canvas id="wasteChart" class="chart-canvas"></canvas>
        </div>
        <p class="text-muted text-center mt-3">
          Each bar shows how much food was wasted (expired) during that week.
        </p>

        <!-- Summary -->
        <div class="text-center mt-4">
          <p class="mb-1 fw-bold text-danger">🍽️ Food Wasted: {{ totalWasted }} kg</p>
          <p class="mb-1 fw-bold text-success">🥬 Food Saved: {{ totalSaved }} kg</p>
          <p v-if="globalAverageWaste > 0" class="text-secondary fw-semibold">
            🌍 Global Average Waste: {{ globalAverageWaste }} kg
          </p>
        </div>

        <div class="text-center mt-4">
          <button class="btn btn-success px-4" @click="refreshData">
            <i class="fas fa-sync-alt me-2"></i>Refresh Data
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Chart from "chart.js/auto";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "../js/config";

const stats = ref([
  { label: "CO₂ Saved", value: "0.00 kg" },
  { label: "Money Saved", value: "$0.00" },
  { label: "Food Wasted", value: "0.00 kg" },
]);
const totalWasted = ref("0.00");
const totalSaved = ref("0.00");
const globalAverageWaste = ref(0);

let wasteChart = null;
let unsubscribe = null;

/* -------------------------------------------------------------
   Parse expiry safely
------------------------------------------------------------- */
function parseExpiryDate(raw) {
  if (!raw) return null;
  if (raw.toDate) return raw.toDate();
  if (typeof raw === "string") {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(raw);
}

/* -------------------------------------------------------------
   Unit-to-kg conversion
------------------------------------------------------------- */
function convertToKg(qty, unit, name = "") {
  const u = unit?.toLowerCase() || "";
  const n = name?.toLowerCase() || "";

  if (u.includes("kg")) return qty;
  if (u.includes("g")) return qty / 1000;
  if (u.includes("l")) return qty * 1.0;
  if (u.includes("ml")) return qty / 1000;
  if (n.includes("chicken")) return qty * 0.18;
  if (n.includes("broccoli")) return qty * 0.3;
  if (n.includes("egg")) return qty * 0.06;
  return qty * 0.25;
}

/* -------------------------------------------------------------
   Fetch Global Average (All Users)
------------------------------------------------------------- */
async function fetchGlobalAverage() {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    let totalWasteAll = 0;
    let userCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.pantry || !Array.isArray(data.pantry)) return;

      let expiredQty = 0;
      data.pantry.forEach((item) => {
        const expiry = parseExpiryDate(item.expiry);
        if (!expiry || isNaN(expiry)) return;
        const diffDays = (expiry - new Date()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) {
          const kg = convertToKg(parseFloat(item.qty || 1), item.unit, item.name);
          expiredQty += kg;
        }
      });

      if (expiredQty > 0) {
        totalWasteAll += expiredQty;
        userCount++;
      }
    });

    globalAverageWaste.value =
      userCount > 0 ? (totalWasteAll / userCount).toFixed(2) : 0;
  } catch (err) {
    console.error("Error fetching global average:", err);
  }
}

/* -------------------------------------------------------------
   Render Chart
------------------------------------------------------------- */
function renderChart(weeklyWaste, weeklyItems, weekLabels) {
  const ctx = document.getElementById("wasteChart");
  if (!ctx) return;
  if (wasteChart) wasteChart.destroy();

  const avg = parseFloat(globalAverageWaste.value) || 0;
  const avgLine = Array(weeklyWaste.length).fill(avg);

  // Red gradient for food waste
  const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 350);
  gradient.addColorStop(0, "#e74c3c");
  gradient.addColorStop(1, "#c0392b");

  wasteChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: weekLabels,
      datasets: [
        {
          label: "Your Food Waste (kg)",
          data: weeklyWaste,
          backgroundColor: gradient,
          borderRadius: 10,
          barThickness: 45,
          borderColor: "#922b21",
          borderWidth: 1.5,
          order: 1,
        },
        {
          label: "Global Average (kg)",
          data: avgLine,
          type: "line",
          borderColor: "#6c757d",
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          tension: 0.3,
          order: 0,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#333", usePointStyle: true, padding: 15 },
        },
      },
      scales: {
        x: {
          ticks: { color: "#495057", font: { size: 13 } },
          grid: { color: "rgba(0,0,0,0.05)" },
        },
        y: {
          beginAtZero: true,
          min: 0,
          suggestedMax: Math.max(...weeklyWaste, avg, 0.5) + 0.5,
          ticks: { color: "#495057" },
          grid: { color: "rgba(0,0,0,0.08)" },
        },
      },
    },
  });
}

/* -------------------------------------------------------------
   Update Stats
------------------------------------------------------------- */
async function updateStats(data) {
  const pantry = data.pantry || [];
  const now = new Date();

  const weekStarts = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    weekStarts.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  const weeklyWaste = [0, 0, 0, 0];
  const weeklyItems = [[], [], [], []];

  let expiredQty = 0;
  let expiringSoonQty = 0;
  let savedQty = 0;

  pantry.forEach((item) => {
    const expiry = parseExpiryDate(item.expiry);
    if (!expiry || isNaN(expiry)) return;
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    const kg = convertToKg(parseFloat(item.qty || 1), item.unit, item.name);

    if (diffDays < 0) {
      expiredQty += kg;
      for (let i = 0; i < 4; i++) {
        const start = weekStarts[i];
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        if (expiry >= start && expiry < end) {
          weeklyWaste[i] += kg;
          weeklyItems[i].push(item);
          break;
        }
      }
    } else if (diffDays <= 7) {
      expiringSoonQty += kg;
    } else {
      savedQty += kg;
    }
  });

  const wastedKg = expiredQty.toFixed(2);
  const savedKg = (expiringSoonQty * 0.5 + savedQty * 0.25).toFixed(2);
  const co2Saved = (savedKg * 1.5).toFixed(2);
  const moneySaved = (savedKg * 3.5).toFixed(2);

  stats.value = [
    { label: "CO₂ Saved", value: `${co2Saved} kg` },
    { label: "Money Saved", value: `$${moneySaved}` },
    { label: "Food Wasted", value: `${wastedKg} kg` },
  ];

  totalWasted.value = wastedKg;
  totalSaved.value = savedKg;

  await fetchGlobalAverage();

  const weekLabels = weekStarts.map((d) =>
    `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  );

  renderChart(weeklyWaste, weeklyItems, weekLabels);
}

/* -------------------------------------------------------------
   Firestore live sync
------------------------------------------------------------- */
function loadUserData(uid) {
  const userRef = doc(db, "users", uid);
  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(userRef, (snap) => {
    if (snap.exists()) updateStats(snap.data());
  });
}

function refreshData() {
  const user = auth.currentUser;
  if (user) loadUserData(user.uid);
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) loadUserData(user.uid);
    else console.warn("User not logged in.");
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  if (wasteChart) wasteChart.destroy();
});
</script>

<style scoped>
.dashboard-container {
  background-color: #f8f9fa;
  font-family: "Inter", "Segoe UI", sans-serif;
  color: #2c3e50;
}

.card {
  border-radius: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.chart-canvas {
  width: 100%;
  height: 100%;
}
</style>
