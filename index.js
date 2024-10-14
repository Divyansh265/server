const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the JavaScript code for alert on product pages
app.get('/alert-product-page.js', (req, res) => {
    const jsCode = `
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof Shopify !== 'undefined' && Shopify.product) {
                alert('This is a product page: ' + Shopify.product.title);
            } else {
                console.log('This is not a product page.');
            }
        });
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsCode);
});

// Listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
