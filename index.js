const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the JavaScript code for product title injection
app.get('/inject-product-data.js', (req, res) => {
    const jsCode = `
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
    `;

    // Set the content type to JavaScript
    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsCode);
});

// Root route
app.get('/', (req, res) => {
    res.send(`alert("hello")`);
});

// Listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
