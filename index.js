const express = require('express');
const path = require('path');
const axios = require('axios'); // Make sure to install axios with npm install axios
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Replace YOUR_SHOPIFY_DOMAIN and YOUR_ACCESS_TOKEN with your actual shop domain and access token
const SHOPIFY_DOMAIN = 'mynewopenedstore.myshopify.com'; // e.g., 'your-store.myshopify.com'
const ACCESS_TOKEN = 'shpua_e92a2801cc55fffe66f0852a74fa5f67'; // Your access token

app.get('/alert-product-page.js', (req, res) => {
    const jsCode = `
        async function fetchProductTitle() {
            const handle = window.location.pathname.split('/').pop(); // Get the product handle from URL
            const query = \`{
                product(handle: "\${handle}") {
                    title
                }
            }\`;

            try {
                const response = await fetch('https://${SHOPIFY_DOMAIN}/admin/api/2024-01/graphql.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': '${ACCESS_TOKEN}',
                    },
                    body: JSON.stringify({ query })
                });

                const data = await response.json();
                const title = data.data.product.title;
                alert("Product Title: " + title);
            } catch (error) {
                console.error('Error fetching product title:', error);
            }
        }

        if (window.location.pathname.includes("/products/")) {
            fetchProductTitle();
        }
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsCode);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
