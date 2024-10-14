// const express = require('express');
// const path = require('path');
// const app = express();
// const PORT = process.env.PORT || 3000;


// app.use(express.static(path.join(__dirname, 'public')));

// app.get('/alert-product-page.js', (req, res) => {
//     const jsCode = `if (window.location.pathname.includes("/products/")) {
//         alert("This is the product page!");
//     }`;

//     res.setHeader('Content-Type', 'application/javascript');
//     res.send(jsCode);
// });

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });


const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the JavaScript code for product pages
app.get('/alert-product-page.js', (req, res) => {
    const jsCode = `
        async function fetchProductTitle() {
            const handle = window.location.pathname.split('/').pop(); // Get the product handle from the URL

            try {
                const response = await fetch('/products/' + handle + '.js'); // Fetch product data from Shopify
                const product = await response.json();

                if (product && product.title) {
                    const titleDiv = document.createElement('div'); 
                    titleDiv.innerHTML = '<strong>Product Title:</strong> ' + product.title;
                    document.body.appendChild(titleDiv);
                } else {
                    console.log('Product not found.');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }

        if (window.location.pathname.includes("/products/")) {
            fetchProductTitle();
        }
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsCode);
});

// Listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
