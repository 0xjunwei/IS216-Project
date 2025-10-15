
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
                if (this.category == 'Meat') {
                    this.meats.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness,
                        barcode: this.decodedText,
                });
                } else if (this.category == 'Fruits & Vegetable') {
                    this.fruitsVegetables.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness,
                        barcode: this.decodedText,
                });
                } else if (this.category == 'Dairy & Drinks') {
                    this.dairyDrinks.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness,
                        barcode: this.decodedText,
                });
                } else if (this.category == 'Others') {
                    this.others.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness,
                        barcode: this.decodedText,
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

        const defaultBootStrap = 'rounded-3 my-2 text-center'        

        if (diffDays > 7) {
            return defaultBootStrap + ' bg-success';
        } else if (diffDays >= 0 && diffDays <= 7) {
            return defaultBootStrap + ' bg-warning';
        } else {
            return defaultBootStrap + ' bg-danger';
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
<!-- Adding new items form -->
<div class="p-3 bg-light">
    <h3 style="text-align: center;">Add new Item</h3>
    <form id="pantryForm" class="row g-3" v-on:submit.prevent="createItem" v-on:keyup.enter="createItem" v-on:submit="this.decodedText = ''">
        <!-- New Item input & Category -->
        <div class="input-group">
            <input type="text" class="col-6" placeholder="New item Name" v-model="newItemName">
            <select name="category" class="form-select d-block col-3" v-model="category">
                <option value="" selected disabled>Select a category</option>
                <option v-for="category in categories">{{ category }}</option>
            </select>
        </div>
        <div>
            <div>
                <input type="text" class="col-3" placeholder="Barcode (optional)" v-model="decodedText" v-if="!this.decodedText">
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
        <div class="col-2">
            <button type="submit" class="btn btn-secondary w-100" v-if="this.newItemName == ''|| this.category == '' || this.itemExpiry == ''">Add</button>
            <button type="submit" class="btn btn-primary w-100" v-else>Add</button>

            <div v-if="this.newItemName == ''|| this.category == '' || this.itemExpiry == ''">
                <small class="text-danger">Please fill in all required fields</small>
            </div>
        </div>
        </form>
    </div>
<!-- Displaying Pantry -->
    <div class="bg-light p-3" style="height: auto;">
    <h3 style="text-align: center;">Current Pantry</h3>
    <div class="row">
        <div class="card container border border-3 secondary col-3 ">
            <h4 style="text-align: center; text-decoration: underline;">Meats</h4>
            <ul>
                <li v-for="(item, index) in meats" :class="item.freshness">
                    <strong>{{ item.text }} (Expiry: {{ item.expiry }}) </strong>
                    <div v-if="item.barcode">barcode: {{ item.barcode }}</div>
                    
                    <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <div class="card container border border-3 col-3">
            <h4 style="text-align: center; text-decoration: underline;">Fruits & Vegetables</h4>
            <ul>
                <li v-for="(item, index) in fruitsVegetables"  :class="item.freshness">
                    <strong>{{ item.text }}</strong> (Expiry: {{ item.expiry }}) <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <div class="card container border border-3 col-3">
            <h4 style="text-align: center; text-decoration: underline;">Dairy & Drinks</h4>
            <ul>
                <li v-for="(item, index) in dairyDrinks" :class="item.freshness">
                    <strong class="">{{ item.text }}</strong> (Expiry: {{ item.expiry }})  <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <div class="card container border border-3 col-3 ">
            <h4 style="text-align: center; text-decoration: underline;">Others</h4>
            <ul>
                <li v-for="(item, index) in others" :class="item.freshness">
                    <strong>{{ item.text }}</strong> (Expiry: {{ item.expiry }}) <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
    </div class="bg-light">
    </div>
</template>

<style scoped>
    .bg-light {
    background: rgb(1, 12, 48)!important;
    color: #f5f5f5 !important;
    }

html, body {
    height: 100%;
    margin: 0;
    padding: 0;
}
body {
    min-height: 100vh;
    background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
    background-size: cover;
    background-repeat: no-repeat;
}
</style>