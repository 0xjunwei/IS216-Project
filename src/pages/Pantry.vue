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
        background-color: lightcoral;
    }
</style>

<template>

    
<div class="card p-3 mb-4 border border-1">
    <h5>New Item</h5>
    <form id="pantryForm" class="row g-3">
    <div class="col-6">
        <input type="text" id="itemName" class="New_item" placeholder="Item name">
    </div>
<div class="dropdown">
    <button class="btn btn-secondary dropdown-toggle d-block" type="button" data-bs-toggle="dropdown" aria-expanded="false">
    Food Category
    </button>
    <ul class="dropdown-menu">
        <li><a class="dropdown-item" href="#">Fruits</a></li>
        <li><a class="dropdown-item" href="#">Vegetables</a></li>
        <li><a class="dropdown-item" href="#">Meats</a></li>
    </ul>
</div>
    <div class="col-2">
        <input type="date" id="expiryDate" class="form-control">
    </div>
    <div class="col-md-2">
        <button type="submit" class="btn btn-primary w-100">Add</button>
    </div>
    </form>
</div>

<h3>Current Pantry</h3>
<div id="itemList">
    <ul>
        <li>
            <div v-for="item in items" :key="index">
                {{ item.text }}
            </div>
        </li>
    </ul>
    
</div>

</template>

<script>

    export default {
        itemList() {
            return {
                fruits: [],
                vegetable: [],
                meat: [],
                items: ["apple"]
            }
        },

    methods: {
        createItem() {

        }
    }
    }

</script>