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
const sqlite3 = require('sqlite3');
const app = express();
const PORT = process.env.PORT || 3000;

const DB_PATH = `${process.cwd()}/database.sqlite`; // Assuming the SQLite database is here



// Route to serve the updated JavaScript code for product pages
app.get('/alert-product-page.js', (req, res) => {
    const shop = req.query.shop; // Get the shop name from query params

    // Fetch the store's storefront access token from your database
    const db = new sqlite3.Database(DB_PATH);
    db.get("SELECT storefrontAccessToken FROM shopify_sessions WHERE shop = ?", [shop], (err, row) => {
        if (err || !row) {
            return res.status(500).send('Error retrieving storefront access token');
        }

        const storefrontAccessToken = row.storefrontAccessToken;

        // JavaScript code to be injected into the page
        const jsCode = `
            (function() {
                
                if (window.location.pathname.includes("/products/")) {
                    const handle = window.location.pathname.split('/').pop();

                  
                    const apiUrl = 'https://' + window.location.hostname + '/api/2023-07/graphql.json';

                    // GraphQL query to fetch product title by handle
                    const query = \`
                        query($handle: String!) {
                            productByHandle(handle: $handle) {
                                id
                                title
                            }
                        }
                    \`;

                  
                    fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Shopify-Storefront-Access-Token': 'shpua_e92a2801cc55fffe66f0852a74fa5f67'
                        },
                        body: JSON.stringify({
                            query: query,
                            variables: { handle: handle }
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        const product = data.data.productByHandle;

                        if (product) {
                            const titleDiv = document.createElement('div');
                            titleDiv.innerHTML = '<strong>Product Title:</strong> ' + product.title;

                            document.body.appendChild(titleDiv);
                        } else {
                            console.error('Product not found.');
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching product:', error);
                    });
                }
            })();
        `;

        // Set the response header to JavaScript content type
        res.setHeader('Content-Type', 'application/javascript');
        res.send(jsCode);

        db.close();
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
