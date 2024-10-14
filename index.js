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

// Route to serve the updated JavaScript code for product pages
app.get('/alert-product-page.js', (req, res) => {
    const jsCode = `
        if (window.location.pathname.includes("/products/")) {
            if (typeof Shopify !== 'undefined' && Shopify.product) {
                const productTitle = Shopify.product.title;

                const titleDiv = document.createElement('div');
                titleDiv.style.position = 'fixed';
                titleDiv.style.top = '20px';
                titleDiv.style.right = '20px';
                titleDiv.style.padding = '10px';
                titleDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                titleDiv.style.border = '1px solid #ccc';
                titleDiv.style.zIndex = '1000';

                titleDiv.innerHTML = \`<strong>Product Title:</strong> \${productTitle}\`;

                document.body.appendChild(titleDiv);
            } else {
                console.log('Product object is not available.');
            }
        }
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsCode);
});

// Listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
