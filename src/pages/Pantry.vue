
<script>

import { StreamBarcodeReader, ImageBarcodeReader } from '@teckel/vue-barcode-reader'

export default {
        data() {
            return {
                newItemName: '',
                itemExpiry: '',
                category: '',
                categories: ['Meat','Fruits & Vegetable','Dairy & Drinks','Others'],
                meats: [],
                fruitsVegetables: [],
                dairyDrinks: [],
                others: [],
                // barcode reader
                decodedText: "",
            };
        },
        components: {
            StreamBarcodeReader,
            // ImageBarcodeReader
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
                        freshness: freshness
                });
                } else if (this.category == 'Fruits & Vegetable') {
                    this.fruitsVegetables.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness
                });
                } else if (this.category == 'Dairy & Drinks') {
                    this.dairyDrinks.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness
                });
                } else if (this.category == 'Others') {
                    this.others.push({
                        text: this.newItemName.trim(),
                        expiry: this.itemExpiry,
                        category: this.category,
                        freshness: freshness
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

// Barcode reader methods based on official documentation
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
<div class="card p-3 mb-4">
    <h3 style="text-align: center;">Add new Item</h3>
    <form id="pantryForm" class="row g-3" v-on:submit.prevent="createItem" v-on:keyup.enter="createItem">
        <!-- New Item input & Category -->
        <div class="input-group">
            <input type="text" class="col-8" placeholder="New item Name" v-model="newItemName">
            <select name="category" class="form-select d-block col-4" v-model="category">
                <option value="" selected disabled>Select a category</option>
                <option v-for="category in categories">{{ category }}</option>
            </select>
        </div>
        <div>
            <h5>Expiry Date:</h5>
            <input type="date" id="itemExpiry" class="New_item" placeholder="Expiry date" v-model="itemExpiry">
        </div>
        <div>
        </div>
        <div class="col-2">
            <button type="submit" class="btn btn-primary w-100">Add</button>
        </div>
        </form>
    </div>

<!-- This is for the barcode reader part, uncomment & allow camera, it should appear on the page -->
    <!-- <div class="d-inline-block justify-content-center align-items-center">
    <ImageBarcodeReader @decode="onDecode"></ImageBarcodeReader>
    <StreamBarcodeReader @decode="onDecode" @loaded="onLoaded"/>
    <h2>Decoded value: {{ decodedText }}</h2>

    </div> -->
<!-- Displaying Pantry -->
    <h3 style="text-align: center;">Current Pantry</h3>
    <div class="row">
        <div class="container border border-3 secondary col-3">
            <h4 style="text-align: center; text-decoration: underline;">Meats</h4>
            <ul>
                <li v-for="(item, index) in meats" :class="item.freshness">
                    <strong>{{ item.text }}</strong> (Expiry: {{ item.expiry }}) <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <div class="container border border-3 col-3">
            <h4 style="text-align: center; text-decoration: underline;">Fruits & Vegetables</h4>
            <ul>
                <li v-for="(item, index) in fruitsVegetables"  :class="item.freshness">
                    <strong>{{ item.text }}</strong> (Expiry: {{ item.expiry }}) <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <div class="container border border-3 col-3">
            <h4 style="text-align: center; text-decoration: underline;">Dairy & Drinks</h4>
            <ul>
                <li v-for="(item, index) in dairyDrinks" :class="item.freshness">
                    <strong class="">{{ item.text }}</strong> (Expiry: {{ item.expiry }})  <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
        <div class="container border border-3 col-3">
            <h4 style="text-align: center; text-decoration: underline;">Others</h4>
            <ul>
                <li v-for="(item, index) in others" :class="item.freshness">
                    <strong>{{ item.text }}</strong> (Expiry: {{ item.expiry }}) <button class="btn btn-secondary" v-on:click="removeItem"> delete </button>
                </li>
            </ul>
        </div>
    </div>
</template>
