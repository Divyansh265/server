const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the JavaScript code for product title injection
app.get('/', (req, res) => {
    const jsCode = `
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof Shopify !== 'undefined' && Shopify.product) {
                const productTitle = Shopify.product.title;
                let titleTag = document.querySelector('head title');
                if (!titleTag) {
                    titleTag = document.createElement('title');
                    document.head.appendChild(titleTag);
                }
                titleTag.textContent = productTitle;
                console.log('Product title added to <head>: ', productTitle);
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
