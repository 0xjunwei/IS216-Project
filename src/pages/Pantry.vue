
<script>

import { StreamBarcodeReader, ImageBarcodeReader } from '@teckel/vue-barcode-reader'
import { auth, db } from "../js/config.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, collection, getDoc, setDoc, getDocs } from "firebase/firestore";
import {checkAuthentication } from "../js/authenticationCheck.js";
checkAuthentication();



async function retrievePantry() {
  const user = auth.currentUser;
  if (!user) {
    return;
  }

  try {
    const pantryRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(pantryRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log("Pantry data:", data);
      const pantryItems = data.pantry || [];
      const existingIngredients = [];
      console.log("Pantry items:", pantryItems);
      
      for (let i = 0; i < selectedIngredients.value.length; i++) {
        existingIngredients.push(selectedIngredients.value[i].name.toLowerCase());
      }
      for (let i = 0; i < pantryItems.length; i++) {
        const item = pantryItems[i];
        const itemName = item.name.toLowerCase();

        let alreadyExists = false;
        for (let j = 0; j < existingIngredients.length; j++) {
          if (existingIngredients[j] === itemName) {
            alreadyExists = true;
            break;
          }
        }
        
        if (!alreadyExists) {
          selectedIngredients.value.push({
            id: nextId++,
            name: itemName,
            expiry: item.expiry || null,
            fromPantry: true
          });
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}


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

window.testSetPantryToFirestore = testSetPantryToFirestore;


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
                quantity: 0,
                unit: '',
                itemExpiry: '',
                category: '',
                //Item categories
                categories: ['Meat','Fruits & Vegetable','Dairy & Drinks','Others'],
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
    computed: {
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
        }
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

            const newItem = {
                // previously you were using text, which is not matching to firestore
                name: this.newItemName.trim(),
                expiry: this.itemExpiry,
                category: this.category,
                freshness: freshness,
                barcode: this.decodedText,
                quantity: this.quantity,
                unit: this.unit,
            };


            this.pantry.push(newItem);

            // You didnt save too
            this.savePantry(); 


            this.newItemName = '';
            this.itemExpiry = '';
            this.category = '';
            this.decodedText = '';
            this.quantity = 0;
            this.unit = '';
            this.addItemVisible = false;
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
            return 'Expiring-Soon';
        } else {
            return 'Expired';
        }
    },
    
    async removeItem(itemToRemove) {
        const index = this.pantry.findIndex(item => item.name === itemToRemove.name && item.expiry === itemToRemove.expiry);
        
        if (index > -1) {
            this.pantry.splice(index, 1);
            // Previously you forgot to savePantry again
            await this.savePantry(); 
        }
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
<div class="page-container background-color">
    <div class="d-inline-block align-items-center my-3 mx-auto container overview-container rounded-2">
        <div class="d-flex align-items-center" style="width: 100%;">
            <div class="flex-grow-1 text-center"><h1>Welcome {{ userName }}</h1></div>
            <button class="btn btn-success ml-auto" @click="addItemVisible = !addItemVisible" v-if="!addItemVisible">Add item <img style="width: 25px;"src="../assets/add.png" alt=""></button>
            <button class="btn btn-success ml-auto" @click="addItemVisible = !addItemVisible" v-if="addItemVisible">Hide item <img style="width: 25px;"src="../assets/minus.png" alt=""></button>
            
        </div>

        <p class="text-start opacity-50">Today is {{ today }}</p>
        <!-- Display addItem -->
            <div class="card form-container d-flex p-4 mx-auto add-item-popup fade-in" v-if="addItemVisible" style="max-width: 500px;">
                <h3 class="text-center text-dark mb-3">New Item</h3>
                    <form id="pantryForm" class="row g-3" v-on:submit.prevent="createItem" v-on:keyup.enter="createItem" v-on:submit="this.decodedText = ''">
                    <div class="col-12 mb-2">
                        <input type="text" class="form-control" placeholder="New item name" v-model="newItemName">
                    </div>
                    <div class="d-flex gap-2">
                        <div class="col">
                        <input type="number" class="form-control" placeholder="Quantity" v-model="quantity">
                        </div>
                        <div class="col">
                        <input type="text" class="form-control" placeholder="Unit" v-model="unit">
                        </div>
                    </div>

        <div class="col-12 mb-2">
            <select name="category" class="form-select" v-model="category">
                <option value="" selected disabled>Select a category</option>
                <option v-for="category in categories" :key="category">{{ category }}</option>
            </select>
        </div>
                <div class="col-12 mb-2">
            <input type="date" id="itemExpiry" class="form-control" v-model="itemExpiry">
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

        <div class="col-12">
            <button type="submit" class="btn btn-success w-100" :disabled="!newItemName || !category || !itemExpiry ||!unit ||!quantity">Add</button>
            <div v-if="!newItemName || !category || !itemExpiry ||!unit ||!quantity" class="mt-1">
                <small class="text-danger">Please fill in all required fields</small>
            </div>
        </div>
    </form>
</div>
</div>

<!-- This is for the barcode reader part, uncomment & allow camera, it should appear on the page
    <div class="d-inline-block justify-content-center align-items-center">
    <ImageBarcodeReader @decode="onDecode"></ImageBarcodeReader>
    <StreamBarcodeReader @decode="onDecode" @loaded="onLoaded"/>
    <h2>Decoded value: {{ decodedText }}</h2>

    </div> -->
<div class="container my-3 overview-container rounded-2 p-3">
    <h1 class=" text-center">Pantry Overview</h1>
    <div class="row mx-2 my-3">
            <!--Total Items -->
            <div class="card shadow d-flex col mx-2 text-center hover-effect" >
                <h4>Total <br> Items</h4>
                <h1>{{ meats.length + fruitsVegetables.length + dairyDrinks.length + others.length }}</h1>
                <p class=" text-start">
                    Meats: {{ meats.length}} <br>
                    Fruits & Vegetables: {{ fruitsVegetables.length}} <br>
                    Dairy & Drinks: {{ dairyDrinks.length}} <br>
                    Others: {{ others.length}} <br>
                </p>
            </div>
            <!-- Fresh Items -->
            <div class="card shadow d-flex col mx-2 text-center hover-effect">
                <h4>Fresh <br>Items</h4>
                <h1>{{ (meats.filter(item=>item.freshness == 'Fresh').length) + (fruitsVegetables.filter(item=>item.freshness == 'Fresh').length) + (dairyDrinks.filter(item=>item.freshness == 'Fresh').length) + (others.filter(item=>item.freshness == 'Fresh').length) }}</h1>
                <p class=" text-start">
                    Meats: {{ (meats.filter(item=>item.freshness == 'Fresh').length)}} <br>
                    Fruits & Vegetables: {{ (fruitsVegetables.filter(item=>item.freshness == 'Fresh').length)}} <br>
                    Dairy & Drinks: {{ (dairyDrinks.filter(item=>item.freshness == 'Fresh').length)}} <br>
                    Others: {{ (others.filter(item=>item.freshness == 'Fresh').length)}} <br>
                </p>        
            </div>
            <!--Expiring  -->
            <div class="card d-flex col mx-2 text-center hover-effect">
                <h4>Expiring Items</h4>
                <h1>{{ (meats.filter(item=>item.freshness == 'Expiring-Soon').length) + (fruitsVegetables.filter(item=>item.freshness == 'Expiring-Soon').length) + (dairyDrinks.filter(item=>item.freshness == 'Expiring-Soon').length) + (others.filter(item=>item.freshness == 'Expiring-Soon').length) }}</h1>
                <p class=" text-start">
                    Meats: {{ (meats.filter(item=>item.freshness == 'Expiring-Soon').length)}} <br>
                    Fruits & Vegetables: {{ (fruitsVegetables.filter(item=>item.freshness == 'Expiring-Soon').length)}} <br>
                    Dairy & Drinks: {{ (dairyDrinks.filter(item=>item.freshness == 'Expiring-Soon').length)}} <br>
                    Others: {{ (others.filter(item=>item.freshness == 'Expiring-Soon').length)}} <br>
                </p>
            </div>
            <div class="card d-flex col mx-2 text-center hover-effect">
                <h4>Expired Items</h4>
                <h1>{{ (meats.filter(item=>item.freshness == 'Expired').length) + (fruitsVegetables.filter(item=>item.freshness == 'Expired').length) + (dairyDrinks.filter(item=>item.freshness == 'Expired').length) + (others.filter(item=>item.freshness == 'Expired').length) }}</h1>
                <p class=" text-start">
                    Meats: {{ (meats.filter(item=>item.freshness == 'Expired').length)}} <br>
                    Fruits & Vegetables: {{ (fruitsVegetables.filter(item=>item.freshness == 'Expired').length)}} <br>
                    Dairy & Drinks: {{ (dairyDrinks.filter(item=>item.freshness == 'Expired').length)}} <br>
                    Others: {{ (others.filter(item=>item.freshness == 'Expired').length)}} <br>
                </p>

            </div>
        </div>
    </div>


<!-- Displaying Pantry -->
    <div class="container overview-container rounded-2 p-3">
        <h1 style="text-align: center; color: #000;">Current Pantry</h1>
        <div class="row">
            <div class="card rounded-3 container border border-3 col pantry-height hover-effect">
                <h4 style="text-align: center;">Meats</h4>
                <ul>
                    <li class="rounded-2" v-for="(item, index) in meats" :key="item.name + index" :class="item.freshness">
                        <strong>{{ item.name }}, [{{ item.quantity }} {{ item.unit }}] </strong> <br>
                        (Expiry: {{ item.expiry }})
                        <div v-if="item.barcode">barcode: {{ item.barcode }}</div>
                        
                        <button class="btn btn-secondary" v-on:click="removeItem(item)"> delete </button>
                    </li>
                </ul>
            </div>
            <div class="card container border border-3  col pantry-height hover-effect">
                <h4 style="text-align: center;">Fruits & Vegetables</h4>
                <ul>
                    <li class="rounded-2" v-for="(item, index) in fruitsVegetables" :key="item.name + index" :class="item.freshness">
                        <strong>{{ item.name }}, [{{ item.quantity }} {{ item.unit }}]</strong> <br>
                        (Expiry: {{ item.expiry }}) 
                        <div v-if="item.barcode">barcode: {{ item.barcode }}</div>

                        <button class="btn btn-secondary" v-on:click="removeItem(item)"> delete </button>
                    </li>
                </ul>
            </div>
            <div class="card container border border-3 col pantry-height hover-effect">
                <h4 style="text-align: center">Dairy & Drinks</h4>
                <ul>
                    <li class="rounded-2" v-for="(item, index) in dairyDrinks" :key="item.name + index" :class="item.freshness">
                        <strong>{{ item.name }}, [{{ item.quantity }} {{ item.unit }}]</strong> <br>
                        (Expiry: {{ item.expiry }})
                        <div v-if="item.barcode">barcode: {{ item.barcode }}</div>
                        
                        <button class="btn btn-secondary" v-on:click="removeItem(item)"> delete </button>
                    </li>
                </ul>
            </div>
            <div class="card container border border-3 col pantry-height hover-effect">
                <h4 style="text-align: center">Others</h4>
                <ul>
                    <li class="rounded" v-for="(item, index) in others" :key="item.name + index" :class="item.freshness">
                        <strong>{{ item.name }}, [{{ item.quantity }} {{ item.unit }}]</strong> <br>
                        (Expiry: {{ item.expiry }}) 
                        <div v-if="item.barcode">barcode: {{ item.barcode }}</div>
                        
                        <button class="btn btn-secondary" v-on:click="removeItem(item)"> delete </button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>

    .background-color {
        background-color: #ffffff;
        background-size: cover;
        background-position: center;
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

    .overview-container, .pantry-container {
        overflow-y: auto; 
        background-color: #ffffff;
        color: #060149;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .subtle-white {
        color: #dfdada;
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
.Fresh{
    background-color: lightgreen;
}

.Expiring-Soon {
    background-color: orange;
}

.Expired {
    background-color: crimson;
}

.hover-effect:hover {
    background-color: rgb(180, 236, 180);
    box-shadow: 0 4px 20px rgba(20,120,50,0.13);
    transition: background-color 1s ease;
    border: dotted 2px green;
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