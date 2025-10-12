<style>
body {

}
.fresh {
    background-color: lightgreen;
}
.expiring {
background-color: lightyellow;
}
.expired {
background-color: lightcoral;}
</style>


<template>
<div class="card p-3 mb-4 border border-1">
    <h5>New Item</h5>
    <form id="pantryForm" class="row g-3" @submit.prevent="createItem">
        <div class="col-10">
            <input type="text" id="itemName" class="New_item" placeholder="Item name" v-model="newItemText">
        </div>
        <div>
            <input type="date" id="itemExpiry" class="New_item" placeholder="Expiry date" v-model="itemExpiry">
        </div>
        <div>
            <select name="category" id="" v-model="category">
                <option value="meat">Meat</option>
                <option value="vegetable">Vegetable</option>
                <option value="fruit">Fruit</option>
                <option value="dairy">Dairy</option>
            </select>
        </div>
    <div class="col-2">
        <button type="submit" class="btn btn-primary w-100">Add</button>
        </div>
        </form>
    </div>

    <h3>Current Pantry</h3>
    <div id="itemList" class="container p-3 mb-4 border">
        <ul>
            <li v-for="(item, index) in items" :key="index" :class="item.freshness">
                <strong>{{ item.text }}</strong> (Expiry: {{ item.expiry }}, Category: {{ item.category }})
            </li>
        </ul>
    </div>
</template>

<script>
export default {
        data() {
            return {
                newItemText: '',
                itemExpiry: '',
                category: '',
                items: []
            };
        },
    methods: {
        createItem() {
            if (this.newItemText.trim() !== '' && this.itemExpiry && this.category) {
                let freshness = this.checkFreshness(this.itemExpiry);
                this.items.push({
                    text: this.newItemText.trim(),
                    expiry: this.itemExpiry,
                    category: this.category,
                    freshness: freshness
                });
                this.newItemText = '';
                this.itemExpiry = '';
                this.category = '';
            }
        },

    checkFreshness(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            return 'fresh';
        } else if (diffDays >= 0 && diffDays <= 7) {
            return 'expiring';
        } else {
            return 'expired';
        }
    }
}
}
</script>
