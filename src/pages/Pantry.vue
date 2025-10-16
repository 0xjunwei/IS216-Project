
<script>

import { StreamBarcodeReader, ImageBarcodeReader } from '@teckel/vue-barcode-reader'

export default {
        data() {
            return {
                //Item details and requirements
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
        components: {
            //Barcode Scanner components
            StreamBarcodeReader,
            ImageBarcodeReader
        },
    methods: {
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
    }
}
}
</script>

<template>
<div class="page-container bg-light">
<!-- Adding new items form -->
<div class="row">
  <div class="card form-container p-2 mx-5 my-2 col-5 h-100">
    <h3 style="text-align: center;">Add new Item</h3>
    <form id="pantryForm" class="row g-3" v-on:submit.prevent="createItem" v-on:keyup.enter="createItem" v-on:submit="this.decodedText = ''">
        <!-- New Item input & Category -->
        <div class="input-group col-6 d-flex ">
            <input type="text" class="col-6 border border-2 border-black" placeholder="New item Name" v-model="newItemName">
        </div>
        <div class="col-6">
        <select name="category" class="form-select d-block col-3 border border-2 border-black" v-model="category">
                <option value="" selected disabled>Select a category</option>
                <option v-for="category in categories">{{ category }}</option>
            </select>
        </div>
        <div>
            <div>
                <input type="text" class="col-3 border border-2 border-black" placeholder="Barcode (optional)" v-model="decodedText" v-if="!this.decodedText">
                <input type="text" class="col-3" v-model="decodedText" v-if="this.decodedText">
            </div>
            <button v-on:click="openCamera = !openCamera">Scan Barcode</button>
            <div v-if="openCamera && this.decodedText == ''">
                <StreamBarcodeReader @decode="onDecode" @loaded="onLoaded"/>
            </div>
            <ImageBarcodeReader @decode="onDecode"></ImageBarcodeReader>
        </div>
        <div>
            <h5>Expiry Date:</h5>
            <input type="date" id="itemExpiry" class="New_item" placeholder="Expiry date" v-model="itemExpiry">
        </div>
        <div>
        </div>
        <div class="">
            <button type="submit" class="btn btn-secondary w-100" v-if="this.newItemName == ''|| this.category == '' || this.itemExpiry == ''">Add</button>
            <button type="submit" class="btn btn-primary w-100" v-else>Add</button>

            <div v-if="this.newItemName == ''|| this.category == '' || this.itemExpiry == ''">
                <small class="text-danger">Please fill in all required fields</small>
            </div>
        </div>
        </form>
    </div>
    <!-- Overview Card -->
    <div class="card d-flex p-2 ms-auto mx-5 my-2 col-5 h-100 text-center">
        <div>
            <h2>Overview</h2>
            <table class="table table-bordered table-striped">
                <tr>
                    <th>Categories</th>
                    <th>No. of Items</th>
                    <th>Fresh</th>
                    <th>Expiring Soon</th>
                    <th>Expired</th>
                </tr>
                <tr>
                    <td>Meat Items:</td>
                    <td>{{  meats.length }}</td>
                    <td>{{ (meats.filter(item=>item.freshness == 'Fresh').length)}}</td>
                    <td>{{ (meats.filter(item=>item.freshness == 'Expiring Soon').length)}}</td>
                    <td>{{ (meats.filter(item=>item.freshness == 'Expired').length)}}</td>
                </tr>
                <tr>
                    <td>Fruits & Vegetables Items:</td>
                    <td>{{  fruitsVegetables.length }}</td>
                    <td>{{ (fruitsVegetables.filter(item=>item.freshness == 'Fresh').length)}}</td>
                    <td>{{ (fruitsVegetables.filter(item=>item.freshness == 'Expiring Soon').length)}}</td>
                    <td>{{ (fruitsVegetables.filter(item=>item.freshness == 'Expired').length)}}</td>
                </tr>
                <tr>
                    <td>Dairy & Drinks Items:</td>
                    <td>{{  dairyDrinks.length }}</td>
                    <td>{{ (dairyDrinks.filter(item=>item.freshness == 'Fresh').length)}}</td>
                    <td>{{ (dairyDrinks.filter(item=>item.freshness == 'Expiring Soon').length)}}</td>
                    <td>{{ (dairyDrinks.filter(item=>item.freshness == 'Expired').length)}}</td>
                </tr>
                <tr>
                    <td>Other Items:</td>
                    <td>{{  others.length }}</td>
                    <td>{{ (others.filter(item=>item.freshness == 'Fresh').length)}}</td>
                    <td>{{ (others.filter(item=>item.freshness == 'Expiring Soon').length)}}</td>
                    <td>{{ (others.filter(item=>item.freshness == 'Expired').length)}}</td>
                </tr>
                <tr>
                    <td>Total Items:</td>
                    <td>{{ meats.length + fruitsVegetables.length + dairyDrinks.length + others.length }}</td>
                    <td>{{ (meats.filter(item=>item.freshness == 'Fresh').length) + (fruitsVegetables.filter(item=>item.freshness == 'Fresh').length) + (dairyDrinks.filter(item=>item.freshness == 'Fresh').length) + (others.filter(item=>item.freshness == 'Fresh').length) }}</td>
                    <td>{{ (meats.filter(item=>item.freshness == 'Expiring Soon').length) + (fruitsVegetables.filter(item=>item.freshness == 'Expiring Soon').length) + (dairyDrinks.filter(item=>item.freshness == 'Expiring Soon').length) + (others.filter(item=>item.freshness == 'Expiring Soon').length) }}</td>
                    <td>{{ (meats.filter(item=>item.freshness == 'Expired').length) + (fruitsVegetables.filter(item=>item.freshness == 'Expired').length) + (dairyDrinks.filter(item=>item.freshness == 'Expired').length) + (others.filter(item=>item.freshness == 'Expired').length) }}</td>
                </tr>
            </table>
        </div>
    </div>
</div>

    
<!-- Displaying Pantry -->
    <div class="pantry-container bg-light p-3">
    <h3 style="text-align: center;">Current Pantry</h3>
    <div class="row">
        <div class="card container border border-3 secondary col-3 ">
            <h4 style="text-align: center; text-decoration: underline;">Meats</h4>
            <ul>
                <li v-for="(item, index) in meats" :class="item.freshnessColor">
                    <strong>{{ item.text }} (Expiry: {{ item.expiry }}) </strong>
                    <div v-if="item.barcode">barcode: {{ item.barcode }}</div>
                    
                    <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <div class="card container border border-3 col-3">
            <h4 style="text-align: center; text-decoration: underline;">Fruits & Vegetables</h4>
            <ul>
                <li v-for="(item, index) in fruitsVegetables"  :class="item.freshnessColor">
                    <strong>{{ item.text }}</strong> (Expiry: {{ item.expiry }}) <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <div class="card container border border-3 col-3">
            <h4 style="text-align: center; text-decoration: underline;">Dairy & Drinks</h4>
            <ul>
                <li v-for="(item, index) in dairyDrinks" :class="item.freshnessColor">
                    <strong class="">{{ item.text }}</strong> (Expiry: {{ item.expiry }})  <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <div class="card container border border-3 col-3 ">
            <h4 style="text-align: center; text-decoration: underline;">Others</h4>
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
    background: rgb(1, 12, 48)!important;
    color: #f5f5f5 !important;
    }

.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* full viewport height */
}

.form-container {
}

.pantry-container {
  flex-grow: 1; /* occupy remaining space */
  overflow-y: auto; /* scroll if content overflows */
  height: 0; /* important to allow flex-grow to work properly */
}

</style>