
<script>

import { StreamBarcodeReader, ImageBarcodeReader } from '@teckel/vue-barcode-reader'
import { auth, db } from "../js/config.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, collection, getDoc, setDoc, getDocs } from "firebase/firestore";
import {checkAuthentication } from "../js/authenticationCheck.js";
checkAuthentication();

async function testSetPantryToFirestore() {
    const user = auth.currentUser;
    if (!user) {
    console.warn("User not logged in");
    return;
    }

    const pantryRef = doc(db, "users", user.uid);

  // Example pantry data
    const testPantry = [
    { name: "chicken breast", qty: 2, unit: "pcs", expiry: "2025-10-20" },
    { name: "milk", qty: 1, unit: "L", expiry: "2025-10-10" },
    { name: "broccoli", qty: 3, unit: "pcs", expiry: "2025-10-09" },
    ];

    try {
    await setDoc(pantryRef, { pantry: testPantry }, { merge: true });
    console.log("Test pantry written to Firestore!");
    } catch (err) {
    console.error("Error writing pantry:", err);
    }
}


async function retrievePantry() {
    const user = auth.currentUser;
    if (!user) {
    console.warn("User not logged in");
    return;
    }

    const pantryRef = doc(db, "users", user.uid);
    try {
    const snapshot = await getDoc(pantryRef);
    if (snapshot.exists()) {
        const data = snapshot.data();
        console.log("Retrieved pantry:", data.pantry);
      // I have a pantry variable to track thus i write into it below
        pantry.value = data.pantry || [];
    } else {
        console.log("No pantry found for this user.");
    }
    } catch (err) {
    console.error("Error getting pantry:", err);
    }
}




export default {
        data() {
            return {
                user: null,
                pantry: [],
                loading: false,
                error: '',
                addItemVisible: false,
                today: new Date(),
                //Item details and requirements
                userName: '',
                newItemName: '',
                itemExpiry: '',
                category: '',
                //Item categories
                categories: ['Meat','Fruits & Vegetable','Dairy & Drinks','Others'],
                //Arrays of different categories
                meats: [],
                fruitsVegetables: [],
                dairyDrinks: [],
                others: [],
                //Barcode Scanner usage
                decodedText: "",
                openCamera: false
            };
        },
        created() {
    // Listen for auth changes (not async)
        this.unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        this.user = currentUser;
        if (this.user) {
            this.retrievePantry();
        } else {
            this.pantry = [];
        }
        });
    },
    beforeDestroy() {
    if (this.unsubscribe) this.unsubscribe();
    },
        components: {
            //Barcode Scanner components
            StreamBarcodeReader,
            ImageBarcodeReader
        },
    methods: {
    async retrievePantry() {
        if (!this.user) return;
      // async read pantry data from Firestore
    },
    async savePantry() {
        if (!this.user) return;
      // async write pantry data to Firestore
    },
        async savePantry() {
        if (!this.user) return;
        const pantryRef = doc(db, "users", this.user.uid);
        try {
        await setDoc(pantryRef, { pantry: this.pantry }, { merge: true });
        } catch (err) {
        console.error("Error saving pantry", err);
        }
    },
    async retrievePantry() {
        if (!this.user) return;
        this.loading = true;
        const pantryRef = doc(db, "users", this.user.uid);
        try {
        const snapshot = await getDoc(pantryRef);
        if (snapshot.exists()) {
            this.pantry = snapshot.data().pantry || [];
        }
        } catch (err) {
        console.error("Error retrieving pantry", err);
        } finally {
        this.loading = false;
        }
    },
    async addItem(newItem) {
        this.pantry.push(newItem);
        await this.savePantry();
    },
    async removeItem(index) {
        this.pantry.splice(index, 1);
        await this.savePantry();
    },
    async clearPantry() {
        this.pantry = [];
        await this.savePantry();
    },
        createItem() {
            if (this.newItemName.trim() !== '' && this.itemExpiry && this.category) {
                let freshness = this.checkFreshness(this.itemExpiry);
                const defaultBootStrap = 'rounded-3 my-2 text-center';
                let freshnessColor = '';
                //colouring based on freshness
                if (freshness == 'Fresh') {
                    freshnessColor = defaultBootStrap + ' bg-success';
                } else if (freshness == 'Expiring Soon') {
                    freshnessColor = defaultBootStrap + ' bg-warning';
                } else if (freshness == 'Expired') {
                    freshnessColor = defaultBootStrap + ' bg-danger';
                }

                if (this.category == 'Meat') {
                    this.meats.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness,
                        barcode: this.decodedText,
                        freshnessColor: freshnessColor
                });
                } else if (this.category == 'Fruits & Vegetable') {
                    this.fruitsVegetables.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness,
                        barcode: this.decodedText,
                        freshnessColor: freshnessColor
                });
                } else if (this.category == 'Dairy & Drinks') {
                    this.dairyDrinks.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness,
                        barcode: this.decodedText,
                        freshnessColor: freshnessColor
                });
                } else if (this.category == 'Others') {
                    this.others.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness,
                        barcode: this.decodedText,
                        freshnessColor: freshnessColor
                });
                }
                this.newItemName = '';
                this.itemExpiry = '';
                this.category = '';
            }
        },

    checkFreshness(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const difference = expiry - today;
        const diffDays = Math.ceil(difference / (1000 * 60 * 60 * 24));

                

        if (diffDays > 7) {
            return 'Fresh';
        } else if (diffDays >= 0 && diffDays <= 7) {
            return 'Expiring Soon';
        } else {
            return 'Expired';
        }
    },
    
    removeItem(index) {
        this.items.splice(index,1)
    },


    onDecode(result) {
        console.log('hi')
        this.decodedText = result
        console.log('Decoded:', result)
    },
    onLoaded() {
        console.log('Camera ready')
    },

    toggleAddItem() {
        this.addItemVisible = !this.addItemVisible;
    }
    }
}
</script>

<template>

<!-- Adding new items form -->
<div class="page-container bg-light">
    <div class="d-inline-block align-items-center my-3 mx-auto container overview-container rounded-2">
        <div class="d-flex align-items-center" style="width: 100%;">
            <div class="flex-grow-1 text-center"><h1>Welcome {{ userName }}</h1></div>
            <button class="btn btn-info ml-auto" @click="addItemVisible = !addItemVisible" v-if="!addItemVisible">Add item <img style="width: 25px;"src="../assets/add.png" alt=""></button>
            <button class="btn btn-info ml-auto" @click="addItemVisible = !addItemVisible" v-if="addItemVisible">Hide item <img style="width: 25px;"src="../assets/minus.png" alt=""></button>
            
        </div>

        <p class="text-start opacity-50">Today is {{ today }}</p>
        <!-- Display addItem -->
            <div class="card form-container p-4 mx-auto add-item-popup fade-in" v-if="addItemVisible" style="max-width: 500px;">
                <h3 class="text-center text-dark mb-3">New Item</h3>
                    <form id="pantryForm" class="row g-3" v-on:submit.prevent="createItem" v-on:keyup.enter="createItem" v-on:submit="this.decodedText = ''">
                    <div class="col-12 mb-2">
                        <input type="text" class="form-control" placeholder="New item name" v-model="newItemName">
                    </div>
        <div class="col-12 mb-2">
            <select name="category" class="form-select" v-model="category">
                <option value="" selected disabled>Select a category</option>
                <option v-for="category in categories" :key="category">{{ category }}</option>
            </select>
        </div>
        <!-- Barcode input/scanner -->
        <div class="col-12 mb-2 border rounded p-2 bg-white">
            <label class="form-label small text-secondary">Scan or type barcode (optional):</label>
            <div class="d-flex flex-row gap-2">
                <input type="text" class="form-control" placeholder="Barcode" v-model="decodedText">
                <button type="button" class="btn btn-outline-primary" v-on:click="openCamera = !openCamera">
                    {{ openCamera ? 'Close Scanner' : 'Scan Barcode' }}
                </button>
            </div>
            <div v-if="openCamera && this.decodedText == ''" class="mt-2">
                <StreamBarcodeReader @decode="onDecode" @loaded="onLoaded"/>
            </div>
            <div class="mt-1">
                <ImageBarcodeReader @decode="onDecode"/>
            </div>
        </div>
        <div class="col-12 mb-2">
            <input type="date" id="itemExpiry" class="form-control" v-model="itemExpiry">
        </div>
        <div class="col-12">
            <button type="submit" class="btn btn-primary w-100" :disabled="!newItemName || !category || !itemExpiry">Add</button>
            <div v-if="!newItemName || !category || !itemExpiry" class="mt-1">
                <small class="text-danger">Please fill in all required fields</small>
            </div>
        </div>
    </form>
</div>
</div>

<div class="container my-3 overview-container rounded-2 p-3">
    <h1 class=" text-center">Pantry Overview</h1>
    <div class="row mx-2 my-3">
            <!--Total Items -->
            <div class="card shadow d-flex col mx-2 text-center total-items-card">
                <h4>Total Items</h4>
                <h1>{{ meats.length + fruitsVegetables.length + dairyDrinks.length + others.length }}</h1>
                <p class=" text-start subtle-white">
                    Meats: {{ meats.length}} <br>
                    Fruits & Vegetables: {{ fruitsVegetables.length}} <br>
                    Dairy & Drinks: {{ dairyDrinks.length}} <br>
                    Others: {{ others.length}} <br>
                </p>
            </div>
            <!-- Fresh Items -->
            <div class="card shadow d-flex col mx-2 text-center">
                <h4>Fresh Items</h4>
                <h1>{{ (meats.filter(item=>item.freshness == 'Fresh').length) + (fruitsVegetables.filter(item=>item.freshness == 'Fresh').length) + (dairyDrinks.filter(item=>item.freshness == 'Fresh').length) + (others.filter(item=>item.freshness == 'Fresh').length) }}</h1>
                <p class=" text-start text-secondary">
                    Meats: {{ (meats.filter(item=>item.freshness == 'Fresh').length)}} <br>
                    Fruits & Vegetables: {{ (fruitsVegetables.filter(item=>item.freshness == 'Fresh').length)}} <br>
                    Dairy & Drinks: {{ (dairyDrinks.filter(item=>item.freshness == 'Fresh').length)}} <br>
                    Others: {{ (others.filter(item=>item.freshness == 'Fresh').length)}} <br>
                </p>        
            </div>
            <!--Expiring  -->
            <div class="card d-flex col mx-2 text-lg-center">
                <h4>Expiring Items</h4>
                <h1>{{ (meats.filter(item=>item.freshness == 'Expiring Soon').length) + (fruitsVegetables.filter(item=>item.freshness == 'Expiring Soon').length) + (dairyDrinks.filter(item=>item.freshness == 'Expiring Soon').length) + (others.filter(item=>item.freshness == 'Expiring Soon').length) }}</h1>
                <p class=" text-start text-secondary">
                    Meats: {{ (meats.filter(item=>item.freshness == 'Expiring Soon').length)}} <br>
                    Fruits & Vegetables: {{ (fruitsVegetables.filter(item=>item.freshness == 'Expiring Soon').length)}} <br>
                    Dairy & Drinks: {{ (dairyDrinks.filter(item=>item.freshness == 'Expiring Soon').length)}} <br>
                    Others: {{ (others.filter(item=>item.freshness == 'Expiring Soon').length)}} <br>
                </p>
            </div>
            <div class="card d-flex col mx-2 text-center">
                <h4>Expired Items</h4>
                <h1>{{ (meats.filter(item=>item.freshness == 'Expired').length) + (fruitsVegetables.filter(item=>item.freshness == 'Expired').length) + (dairyDrinks.filter(item=>item.freshness == 'Expired').length) + (others.filter(item=>item.freshness == 'Expired').length) }}</h1>
                <p class=" text-start text-secondary">
                    Meats: {{ (meats.filter(item=>item.freshness == 'Expired').length)}} <br>
                    Fruits & Vegetables: {{ (fruitsVegetables.filter(item=>item.freshness == 'Expired').length)}} <br>
                    Dairy & Drinks: {{ (dairyDrinks.filter(item=>item.freshness == 'Expired').length)}} <br>
                    Others: {{ (others.filter(item=>item.freshness == 'Expired').length)}} <br>
                </p>

            </div>
        </div>
    </div>

    
<!-- Displaying Pantry -->
    <div class="container rounded-2 p-3">
    <h1 style="text-align: center;">Current Pantry</h1>
    <div class="row ">
        <!-- Meat Card -->
        <div class="card rounded-3 container border border-3 col pantry-height meat-card">
            <h4 style="text-align: center;">Meats</h4>
            <ul>
                <li v-for="(item, index) in meats" :class="item.freshnessColor">
                    <strong>{{ item.text }} (Expiry: {{ item.expiry }}) </strong>
                    <div v-if="item.barcode">barcode: {{ item.barcode }}</div>
                    
                    <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <!-- F&V card -->
        <div class="card container border border-3  col pantry-height fruits-vegetables-card">
            <h4 style="text-align: center;">Fruits & Vegetables</h4>
            <ul>
                <li v-for="(item, index) in fruitsVegetables"  :class="item.freshnessColor">
                    <strong>{{ item.text }}</strong> (Expiry: {{ item.expiry }}) <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <!-- Dairy and Drinks card-->
        <div class="card container border border-3 col pantry-height dairy-drinks-card">
            <h4 style="text-align: center">Dairy & Drinks</h4>
            <ul>
                <li v-for="(item, index) in dairyDrinks" :class="item.freshnessColor">
                    <strong class="">{{ item.text }}</strong> (Expiry: {{ item.expiry }})  <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <!-- Others card-->
        <div class="card container border border-3 col pantry-height others-card">
            <h4 style="text-align: center">Others</h4>
            <ul>
                <li v-for="(item, index) in others" :class="item.freshnessColor">
                    <strong>{{ item.text }}</strong> (Expiry: {{ item.expiry }}) <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
    </div>
    </div>
</div>
</template>

<style scoped>

    .bg-light {
        background-image: url('../assets/background.jpg');
        color: #f5f5f5 !important;
    }

    .page-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh; /* full viewport height */
        padding-top: 72px; /* space for fixed navbar (adjust if navbar height differs) */
    }

    .pantry-height {
        min-height: 200px;
    }

    .overview-container {
        overflow-y: auto; 
        background: linear-gradient(to left, rgb(226, 224, 224), rgb(211, 209, 209));
        color: #060149;
    }

    .total-items-card {
        background: linear-gradient(to bottom, rgb(2, 68, 32),rgb(3, 179, 61));
        color: #f5f5f5;
        border: solid 3px black;
    }
    .subtle-white {
        color: #dfdada;
    }

    .meat-card {
        background: linear-gradient(to bottom, rgb(190, 23, 23), rgb(238, 191, 191));
        color: #f5f5f5;
    }
    .fruits-vegetables-card {
        background: linear-gradient(to bottom, rgb(14, 104, 14), rgb(191, 238, 191));
        color: #f5f5f5;
    }
    .dairy-drinks-card {
        background: linear-gradient(to bottom, rgb(8, 56, 156), rgb(173, 201, 238));
        color: #f5f5f5;
    }
    .others-card {
        background: linear-gradient(to bottom, rgb(156, 78, 8), rgb(238, 201, 173));
        color: #f5f5f5;
    }

    .total-items-card, .overview-card, .fresh-card, .expiring-card, .expired-card {
    transition: box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }
    .total-items-card:hover, .overview-card:hover {
        box-shadow: 0 4px 20px rgba(20,120,50,0.13);
    }

    .add-item-popup {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 380px;
        position: relative;
        background: #fff;
        box-shadow: 0 8px 32px rgba(0,20,80,0.10);
}

.fade-in {
    animation: fadeInCard 0.6s ease;
}

@keyframes fadeInCard {
    from {
        opacity: 0;
        transform: translateY(24px) scale(0.97);
    }
    to {
        opacity: 1;
        transform: none;
    }
}


</style>