const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));

app.get('/alert-product-page.js', (req, res) => {
    const jsCode = `if (window.location.pathname.includes("/products/")) {
        alert("This is the product page!");
        if (typeof Shopify !== 'undefined' && Shopify.product) {
        const productTitle = Shopify.product.title;

 
        let titleTag = document.querySelector('head title');
        if (!titleTag) {
            titleTag = document.createElement('title');
            document.head.appendChild(titleTag);
        }
        titleTag.textContent = productTitle; // Set the title to the product title

       
        alert('This is a product page: ' + productTitle);

        console.log('Product title added to <head>: ', productTitle);
    } else {
        console.log('This is not a product page.');
    }
    }`;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsCode);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
