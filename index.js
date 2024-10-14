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

const cors = require('cors'); // Import CORS middleware
const PORT = process.env.PORT || 3000;

const app = express();

// Apply CORS middleware
app.use(cors({ origin: '*' }));

// Serve static files (like your fetchProductTitle.js)
app.use('/public', express.static(path.join(__dirname, 'public')));

// New route: Fetch product details by handle from Shopify API
app.get("/api/products/handle/:handle", async (req, res) => {
    const productHandle = req.params.handle;

    // Create GraphQL client with session
    const client = new shopify.api.clients.Graphql({
        session: res.locals.shopify.session,
    });

    try {
        const productData = await client.request(`
      query {
        product(handle: "${productHandle}") {
          title
          id
        }
      }
    `);

        if (productData.data.product) {
            res.status(200).send({ product: productData.data.product });
        } else {
            res.status(404).send({ error: 'Product not found' });
        }
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).send({ error: 'Failed to fetch product details' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
