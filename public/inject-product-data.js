document.addEventListener('DOMContentLoaded', function () {
    // Check if we are on a product page by detecting the Shopify product object
    if (typeof Shopify !== 'undefined' && typeof Shopify.product !== 'undefined') {
        const product = Shopify.product;

        // Create a new title element
        const newTitle = document.createElement('title');
        newTitle.textContent = product.title; // Set the product title as the page title

        // Insert the new title element into the head
        document.head.appendChild(newTitle);

        console.log('Product title inserted into the head:', product.title);
    } else {
        console.log('Not on a product page.');
    }
});
