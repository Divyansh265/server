document.addEventListener('DOMContentLoaded', function () {

    if (typeof Shopify !== 'undefined' && typeof Shopify.product !== 'undefined') {
        const product = Shopify.product;


        const productTitleElement = document.querySelector('.product-title');


        if (productTitleElement) {
            productTitleElement.textContent = product.title;
        } else {
            console.error('Product title element not found.');
        }
    } else {
        console.log('Not on a product page.');
    }
});
