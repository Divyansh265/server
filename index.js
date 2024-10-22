const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const mongoose = require('mongoose');

const axios = require('axios');


const DB = "mongodb+srv://divyanshSharma:divyanshSharma@cluster0.qdqmptw.mongodb.net/store?retryWrites=true&w=majority";
mongoose.connect(DB)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(error => {
    console.error("Error connecting to MongoDB:", error);
  });


const Shop = mongoose.model('Shop', new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  isEnabled: { type: String, default: false },
  collection_isEnabled: { type: String, default: "false" },
  article_isEnabled: { type: String, default: "false" },
  organization_isEnabled: { type: String, default: "false" },
  breadcrumb_isEnabled: { type: String, default: "false" },
  video_isEnabled: { type: String, default: "false" },
  searchbox_isEnabled: { type: String, default: "false" },
  recipe_isEnabled: { type: String, default: "false" },
}));


app.get('/serve-script/:shop', async (req, res) => {
  // Extract the shop parameter from the query string
  const shopName = req.params.shop;

  if (!shopName) {
    return res.status(400).send('Shop name is required');
  }

  // Find shop details in MongoDB
  const shopData = await Shop.findOne({ shop: shopName });

  if (!shopData) {
    return res.status(404).send('Shop not found');
  }

  // Generate dynamic JavaScript
  const scriptContent = `
    document.addEventListener("DOMContentLoaded", async () => {
      const urlParts = window.location.pathname.split("/");
      const handle = urlParts[urlParts.length - 1];
      
      if (handle) {
        const response = await fetch("https://${shopData.shop}/admin/api/2024-04/products.json?handle=" + handle, {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": "${shopData.accessToken}",
            "Content-Type": "application/json",
          },
        });
        
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
          alert("Product title: " + data.products[0].title);
        } else {
          alert("Product not found.");
        }
      }
    });
  `;

  // Set Content-Type to JavaScript
  res.setHeader('Content-Type', 'application/javascript');
  res.send(scriptContent);
});








app.get("/check-store", async (req, res) => {
  const { shop } = req.query;

  try {
    const store = await Shop.findOne({ shop });

    if (!store) {
      return res.status(404).json({ message: "Store not registered." });
    }

    res.json({ accessToken: store.accessToken });
  } catch (error) {
    console.error("Error retrieving store data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




app.get("/server-script.js", (req, res) => {
  res.set("Content-Type", "application/javascript");




  res.send(`
    const shop = window.location.hostname;
  
    async function insertProductSchema() {
      try {
        const tokenResponse = await fetch(\`https://server-page-xo9v.onrender.com/check-store?shop=\${shop}\`);
        const tokenData = await tokenResponse.json();
  
        if (tokenData && tokenData.accessToken) {
          const accessToken = tokenData.accessToken;
          const pathParts = window.location.pathname.split("/");
  
          if (pathParts[1] === "products") {
            const handle = pathParts[2];
  
            let productData;
            if (handle) {
              const productResponse = await fetch(
                \`https://\${shop}/admin/api/2024-04/products.json?handle=\${handle}\`,
                {
                  method: "GET",
                  headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                  },
                }
              );
              productData = await productResponse.json();
              if (productData.products && productData.products.length > 0) {
                const product = productData.products[0];
                insertSchema(product);
              } else {
                console.warn("Product not found.");
              }
            } else {
              const allProductsResponse = await fetch(
                \`https://\${shop}/admin/api/2024-04/products.json\`,
                {
                  method: "GET",
                  headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                  },
                }
              );
              productData = await allProductsResponse.json();
              if (productData.products && productData.products.length > 0) {
                productData.products.forEach(insertSchema);
              } else {
                console.warn("No products found.");
              }
            }
          } else {
            console.warn("Not on products page.");
          }
        } else {
          console.warn("Access token not found for this shop.");
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    }
  
    function insertSchema(product) {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "shipping_fee": 100,
        "shipping_Address": "India",
        "image": product.images.map(image => image.src),
        "description": product.body_html.replace(/<[^>]*>/g, ""),
        "sku": product.variants[0].sku,
        "mpn": product.variants[0].sku,
        "brand": {
          "@type": "Brand",
          "name": product.vendor
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": product.variants[0].currency,
          "price": product.variants[0].price,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": product.variants[0].inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "url": window.location.href,
          "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
          "seller": {
            "@type": "Organization",
            "name": shop
          }
        }
      };
  
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);
      console.log("JSON-LD schema inserted for product:", product.title);
    }
  
    insertProductSchema();
  `);


});



app.get('/', (req, res) => {

  res.send(`alert('hello')`)
});



app.get('/static/product-title-script.js', (req, res) => {
  res.send(`
    document.addEventListener("DOMContentLoaded", async () => {
      const urlParts = window.location.pathname.split("/");
      if (urlParts[1] === "products") {
        const handle = urlParts[urlParts.length - 1];
        
        try {
          const response = await fetch('/admin/api/products/' + handle);
          const product = await response.json();
          alert(product.title || "Product not found");
        } catch (error) {
          console.error("Error fetching product title:", error);
          alert("Error fetching product title");
        }
      }
    });
  `);
});



app.get('/remove-server-script', (req, res) => {
  res.set("Content-Type", "application/javascript");

  // JavaScript to remove the script tag
  res.send(`
    async function removeServerScript() {
      const scriptUrl = "https://server-page-xo9v.onrender.com/server-script.js";
      
      // Find the script tag
      const scriptTag = document.querySelector('script[src="' + scriptUrl + '"]');
      if (scriptTag) {
        scriptTag.parentNode.removeChild(scriptTag);
        console.log("Server script removed successfully.");
      } else {
        console.warn("Server script not found.");
      }
    }
  
    removeServerScript();
  `);

});




app.get('/removetag/:shopname', async (req, res) => {

  const shop = req.params.shopname;

  const scriptUrl = "https://server-page-xo9v.onrender.com/product-script.js";


  try {
    // Fetch shop data
    // const store = await Shop.findOne({ shop });
    const shopData = await Shop.findOne({ shop });
    console.log(shopData);

    if (!shopData || !shopData.accessToken) {
      return res.status(404).json({ message: `No access token found for store ${shop}` });
    }

    const accessToken = shopData.accessToken;

    // Step 1: Check for existing script tags
    const existingResponse = await axios.get(`https://${shop}/admin/api/2024-10/script_tags.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    const existingData = existingResponse.data;

    // Step 2: Normalize the script URL
    const normalizedScriptUrl = new URL(scriptUrl).href;

    // Step 3: Find the script tag ID to remove
    const scriptTag = existingData.script_tags.find(tag => new URL(tag.src).href === normalizedScriptUrl);

    if (scriptTag) {
      // Step 4: Remove the script tag
      await axios.delete(`https://${shop}/admin/api/2024-10/script_tags/${scriptTag.id}.json`, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      console.log(`Script tag removed for store ${shop}`);
      return res.status(200).json({ message: `Script tag removed for store ${shop}` });
    } else {
      console.log(`No matching script tag found for store ${shop}`);
      return res.status(404).json({ message: `No matching script tag found for store ${shop}` });
    }
  } catch (error) {
    console.error(`Error removing script tag for store ${shop}:`, error.message);
    return res.status(500).json({ message: `Error removing script tag for store ${shop}`, error: error.message });
  }
});




app.get("/product-script.js", (req, res) => {
  res.set("Content-Type", "application/javascript");
  res.send(`
    const shop = window.location.hostname;

    async function insertProductSchema() {
      try {
        const tokenResponse = await fetch(\`https://server-page-xo9v.onrender.com/check-store?shop=\${shop}\`);
        const tokenData = await tokenResponse.json();

        if (tokenData && tokenData.accessToken) {
          const accessToken = tokenData.accessToken;
          const pathParts = window.location.pathname.split("/");

          // Check if on the product page
          if (pathParts[1] === "products") {
            const handle = pathParts[2];
            if (handle) {
              await fetchProductAndInsertSchema(accessToken, shop, handle);
            } else {
              console.warn("Product handle not found in the URL.");
            }
          } else {
            console.warn("Not on a product page.");
          }
        } else {
          console.warn("Access token not found for this shop.");
        }
      } catch (error) {
        console.error("Error fetching schema data:", error);
      }
    }

    async function fetchProductAndInsertSchema(accessToken, shop, handle) {
      try {
        const productResponse = await fetch(
          \`https://\${shop}/admin/api/2024-04/products.json?handle=\${handle}\`,
          {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            }
          }
        );
        
        const productData = await productResponse.json();
        
        if (productData.products && productData.products.length > 0) {
          const product = productData.products[0];
          insertProductSchemaData(product, shop);
        } else {
          console.warn("Product not found.");
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    }

    function insertProductSchemaData(product, shop) {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "shipping_fee":100,
        "Shipping_Country":"India",
        "image": product.images.map(image => image.src),
        "description": product.body_html.replace(/<[^>]*>/g, ""),
        "sku": product.variants[0].sku,
        "brand": { "@type": "Brand", "name": product.vendor },
        "offers": {
          "@type": "Offer",
          "price": product.variants[0].price,
          "priceCurrency": product.variants[0].currency,
          "availability": product.variants[0].inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "url": window.location.href,
          "seller": { "@type": "Organization", "name": shop }
        }
      };
      insertSchemaToDOM(schemaData);
    }

    function insertSchemaToDOM(schemaData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);
      console.log("JSON-LD product schema inserted:", schemaData);
    }

    insertProductSchema();
  `);
});





app.get("/newproduct-script.js", (req, res) => {
  res.set("Content-Type", "application/javascript");
  res.send(`
    const shop = window.location.hostname;

    async function insertProductSchema() {
      try {
        const tokenResponse = await fetch('https://server-page-xo9v.onrender.com/check-store?shop=' + shop);
        const tokenData = await tokenResponse.json();

        if (tokenData && tokenData.accessToken) {
          const accessToken = tokenData.accessToken;
          const pathParts = window.location.pathname.split("/");

          // Fetch the isEnabled state
          const stateResponse = await fetch('https://server-page-xo9v.onrender.com/check-schema-state/' + shop);
          const stateData = await stateResponse.json();

          // Check if on a product page
          if (pathParts[1] === "products") {
            const handle = pathParts[2];
            if (handle) {
              if (stateData.isEnabled == 'true') {
                // If schema is enabled, insert schema
                await fetchProductAndInsertSchema(accessToken, shop, handle);
              } else {
                // If schema is disabled, remove schema
                removeProductSchema();
                console.log("Product schema is disabled.");
              }
            } else {
              console.warn("Product handle not found in the URL.");
            }
          } else {
            console.warn("Not on a product page.");
          }
        } else {
          console.warn("Access token not found for this shop.");
        }
      } catch (error) {
        console.error("Error fetching schema data:", error);
      }
    }

    async function fetchProductAndInsertSchema(accessToken, shop, handle) {
      try {
        const productResponse = await fetch(
          'https://' + shop + '/admin/api/2024-04/products.json?handle=' + handle,
          {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            }
          }
        );

        const productData = await productResponse.json();

        if (productData.products && productData.products.length > 0) {
          const product = productData.products[0];
          insertProductSchemaData(product, shop);
        } else {
          console.warn("Product not found.");
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    }

    function insertProductSchemaData(product, shop) {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "shipping_fee": 800,
        "Shipping_Country": "India",
        "image": product.images.map(image => image.src),
        "description": product.body_html.replace(/<[^>]*>/g, ""),
        "sku": product.variants[0].sku,
        "brand": { "@type": "Brand", "name": product.vendor },
        "offers": {
          "@type": "Offer",
          "price": product.variants[0].price,
          "priceCurrency": product.variants[0].currency,
          "availability": product.variants[0].inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "url": window.location.href,
          "seller": { "@type": "Organization", "name": shop }
        }
      };
      insertSchemaToDOM(schemaData);
    }

    function insertSchemaToDOM(schemaData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);
      console.log("JSON-LD product schema inserted:", schemaData);
    }

    // Function to remove all relevant product schema
    function removeProductSchema() {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach((script) => {
        try {
          const schemaData = JSON.parse(script.textContent);
          if (schemaData['@type'] === "Product") {
            script.remove(); // Remove only the product-related schema
            console.log("Product schema removed.");
          }
        } catch (error) {
          console.error("Error parsing JSON-LD schema for removal:", error);
        }
      });
    }

    // Call the function to manage the schema
    insertProductSchema();
  `);
});




// Endpoint to check the schema state
app.get("/check-schema-state/:shopname", async (req, res) => {
  try {
    const shopName = req.params.shopname;
    const shop = await Shop.findOne({ shop: shopName });

    if (shop) {
      return res.status(200).json({ isEnabled: shop.isEnabled });
    } else {
      // If shop does not exist, create it with default state
      const newShop = new Shop({ shop: shopName });
      await newShop.save();
      return res.status(200).json({ isEnabled: newShop.isEnabled });
    }
  } catch (error) {
    console.error("Error fetching schema state:", error);
    res.status(500).json({ message: "Error fetching schema state" });
  }
});


app.post("/update-state/:shopname/:isEnable", async (req, res) => {
  try {
    const shopName = req.params.shopname;
    const value = req.params.isEnable;

    const updatedShop = await Shop.findOneAndUpdate(
      { shop: shopName }, // Find document by shopName
      { $set: { isEnabled: value } }, // Use $set to update only specific fields
      { new: true, upsert: false } // Return the updated document
    );
    res.status(200).send({ success: true, data: updatedShop })
  } catch (error) {
    res.status(500).json({ message: "Error fetching schema state" });

  }
})



// Endpoint to check the schema state
app.get("/check-state/:shopname", async (req, res) => {
  try {
    const shopName = req.params.shopname;
    const shop = await Shop.findOne({ shop: shopName });

    if (shop) {

      return res.status(200).json({ shop });

    } else {
      // If shop does not exist, you can return an error or create the shop with default values
      const newShop = new Shop({ shop: shopName });
      await newShop.save();
      return res.status(404).json({ message: "Shop not found, created new shop with default values." });
    }
  } catch (error) {
    console.error("Error fetching schema state:", error);
    res.status(500).json({ message: "Error fetching schema state" });
  }
});



// Endpoint to update the schema state
app.post("/update-state/:shopname/:schema/:value", async (req, res) => {
  try {
    const shopName = req.params.shopname;
    const schemaKey = req.params.schema; // Get the schema key from params
    const value = req.params.value; // Get the value to be updated from params

    // Build the dynamic update object
    const update = { $set: { [schemaKey]: value } }; // Use [schemaKey] to dynamically update the specific field

    // Find the shop and update the schema field
    const updatedShop = await Shop.findOneAndUpdate(
      { shop: shopName }, // Find document by shopName
      update,             // Dynamic field update
      { new: true, upsert: false } // Return the updated document, don't create if not found
    );

    if (updatedShop) {
      return res.status(200).json({ success: true, data: updatedShop });
    } else {
      return res.status(404).json({ message: "Shop not found" });
    }
  } catch (error) {
    console.error("Error updating schema state:", error);
    res.status(500).json({ message: "Error updating schema state" });
  }
});





app.get("/newschema-script.js", (req, res) => {
  res.set("Content-Type", "application/javascript");
  res.send(`
    const shop = window.location.hostname;

    async function insertSchemaBasedOnPage() {
      try {
        const tokenResponse = await fetch('https://server-page-xo9v.onrender.com/check-store?shop=' + shop);
        const tokenData = await tokenResponse.json();

        if (tokenData && tokenData.accessToken) {
          const accessToken = tokenData.accessToken;
          const pathParts = window.location.pathname.split("/");

          // Fetch the isEnabled state for all schemas
          const stateResponse = await fetch('https://server-page-xo9v.onrender.com/check-state/' + shop);
          const stateData = await stateResponse.json();

          // Identify the current page and inject the corresponding schema
          if (pathParts[1] === "products" && pathParts[2]) {
            const handle = pathParts[2];
            if (stateData.isEnabled == 'true') {
              await fetchProductAndInsertSchema(accessToken, shop, handle);
            } else {
              removeProductSchema();
              console.log("Product schema is disabled.");
            }
          } else if (pathParts[1] === "collections" && pathParts[2]) {
            const collectionHandle = pathParts[2];
            if (stateData.collection_isEnabled == 'true') {
              await fetchCollectionAndInsertSchema(accessToken, shop, collectionHandle);
            } else {
              removeCollectionSchema();
              console.log("Collection schema is disabled.");
            }
          } else if (pathParts[1] == "pages") {
            // Check for Breadcrumb, Article, etc.
            if (stateData.breadcrumb_isEnabled == 'true') {
              insertBreadcrumbSchema();
            } else {
              removeBreadcrumbSchema();
            }
            if (stateData.article_isEnabled == 'true') {
              insertArticleSchema();
            } else {
              removeArticleSchema();
            }
          } else if (pathParts[1] == "video") {
            if (stateData.video_isEnabled == 'true') {
              insertVideoSchema();
            } else {
              removeVideoSchema();
            }
          }

          // General schemas for all pages
          if (stateData.organization_isEnabled === 'true') {
            insertOrganizationSchema();
          } else {
            removeOrganizationSchema();
          }
          if (stateData.searchbox_isEnabled === 'true') {
            insertSearchBoxSchema();
          } else {
            removeSearchBoxSchema();
          }
          if (stateData.recipe_isEnabled === 'true') {
            insertRecipeSchema();
          } else {
            removeRecipeSchema();
          }

        } else {
          console.warn("Access token not found for this shop.");
        }
      } catch (error) {
        console.error("Error fetching schema data:", error);
      }
    }

    // Functions to insert various schemas

    function insertProductSchemaData(product, shop) {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "shipping_fee": 900,
        "Shipping_Country": "Bharat",
        "image": product.images.map(image => image.src),
        "description": product.body_html.replace(/<[^>]*>/g, ""),
        "sku": product.variants[0].sku,
        "brand": { "@type": "Brand", "name": product.vendor },
        "offers": {
          "@type": "Offer",
          "price": product.variants[0].price,
          "priceCurrency": product.variants[0].currency,
          "availability": product.variants[0].inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "url": window.location.href,
          "seller": { "@type": "Organization", "name": shop }
        }
      };
      insertSchemaToDOM(schemaData);
    }

    function insertCollectionSchemaData(collection, shop) {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Collection",
        "name": collection.title,
        "description": collection.body_html.replace(/<[^>]*>/g, ""),
        "url": window.location.href
      };
      insertSchemaToDOM(schemaData);
    }

    function insertOrganizationSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Organization",
        "name": shop,
        "url": window.location.href
      };
      insertSchemaToDOM(schemaData);
    }

    function insertBreadcrumbSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": window.location.origin
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Page",
            "item": window.location.href
          }
        ]
      };
      insertSchemaToDOM(schemaData);
    }

    function insertVideoSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "VideoObject",
        "name": "Sample Video",
        "description": "This is a sample video description",
        "thumbnailUrl": "https://example.com/video-thumbnail.jpg",
        "uploadDate": "2024-01-01",
        "contentUrl": window.location.href
      };
      insertSchemaToDOM(schemaData);
    }

    function insertArticleSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Article",
        "headline": "Sample Article",
        "author": "Author Name",
        "datePublished": "2024-01-01",
        "url": window.location.href
      };
      insertSchemaToDOM(schemaData);
    }

    function insertSearchBoxSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "WebSite",
        "url": window.location.href,
        "potentialAction": {
          "@type": "SearchAction",
          "target": window.location.origin + "/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      };
      insertSchemaToDOM(schemaData);
    }

    function insertRecipeSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Recipe",
        "name": "Sample Recipe",
        "recipeIngredient": ["Ingredient 1", "Ingredient 2"],
        "recipeInstructions": ["Step 1", "Step 2"],
        "url": window.location.href
      };
      insertSchemaToDOM(schemaData);
    }

    // Functions to remove schemas by type
    function removeProductSchema() {
      removeSchemaByType("Product");
    }

    function removeCollectionSchema() {
      removeSchemaByType("Collection");
    }

    function removeOrganizationSchema() {
      removeSchemaByType("Organization");
    }

    function removeBreadcrumbSchema() {
      removeSchemaByType("BreadcrumbList");
    }

    function removeVideoSchema() {
      removeSchemaByType("VideoObject");
    }

    function removeArticleSchema() {
      removeSchemaByType("Article");
    }

    function removeSearchBoxSchema() {
      removeSchemaByType("WebSite");
    }

    function removeRecipeSchema() {
      removeSchemaByType("Recipe");
    }

    function removeSchemaByType(schemaType) {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach((script) => {
        try {
          const schemaData = JSON.parse(script.textContent);
          if (schemaData['@type'] === schemaType) {
            script.remove(); // Remove only the schema related to the given type
            console.log(schemaType + " schema removed.");
          }
        } catch (error) {
          console.error("Error parsing JSON-LD schema:", error);
        }
      });
    }

    // Helper to insert schema data to DOM
    function insertSchemaToDOM(schemaData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);
      console.log("JSON-LD schema inserted:", schemaData);
    }

    // Initialize schema insertion/removal
    insertSchemaBasedOnPage();
  `);
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
