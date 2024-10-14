document.addEventListener('DOMContentLoaded', function () {
    // Check if we are on a product page by detecting the Shopify product object
    if (typeof Shopify !== 'undefined' && Shopify.product) {
        const productTitle = Shopify.product.title;

        // Create or replace the <title> tag in the head section
        let titleTag = document.querySelector('head title');
        if (!titleTag) {
            titleTag = document.createElement('title');
            document.head.appendChild(titleTag);
        }
        titleTag.textContent = productTitle;

        console.log('Product title added to <head>:', productTitle);
    } else {
        console.log('This is not a product page.');
    }
});
