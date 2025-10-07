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
    <div class="col-2">
        <button type="submit" class="btn btn-primary w-100">Add</button>
        </div>
        </form>
    </div>

    <h3>Current Pantry</h3>
    <div id="itemList">
    <ul>
    <li v-for="(item, index) in items" :key="index">
        {{ item }}
    </li>
    </ul>
    </div>
</template>

<script>
export default {
    data() {
        return {
        newItemText: '',
        items: []
    };
    },
    methods: {
    createItem() {
        if (this.newItemText.trim() !== '') {
        this.items.push(this.newItemText.trim());
        this.newItemText = '';
    }
        }
    }
};
</script>
