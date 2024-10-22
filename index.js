const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

app.use(cors());

// MongoDB connection string
const DB = "mongodb+srv://divyanshSharma:divyanshSharma@cluster0.qdqmptw.mongodb.net/store?retryWrites=true&w=majority";
mongoose.connect(DB)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(error => {
    console.error("Error connecting to MongoDB:", error);
  });

// MongoDB Shop model
const Shop = mongoose.model('Shop', new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
}));

// Route to check store registration and retrieve access token
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

// Route to serve the schema management script
app.get("/newproduct-script.js", (req, res) => {
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
          const stateResponse = await fetch('https://server-page-xo9v.onrender.com/check-schema-state/' + shop);
          const stateData = await stateResponse.json();

          // Identify the current page and inject the corresponding schema
          if (pathParts[1] === "products" && pathParts[2]) {
            const handle = pathParts[2];
            if (stateData.productSchemaEnabled === 'true') {
              await fetchProductAndInsertSchema(accessToken, shop, handle);
            } else {
              removeProductSchema();
              console.log("Product schema is disabled.");
            }
          } else if (pathParts[1] === "collections" && pathParts[2]) {
            const collectionHandle = pathParts[2];
            if (stateData.collectionSchemaEnabled === 'true') {
              await fetchCollectionAndInsertSchema(accessToken, shop, collectionHandle);
            } else {
              removeCollectionSchema();
              console.log("Collection schema is disabled.");
            }
          } else if (pathParts[1] === "pages") {
            // Check for Breadcrumb, Article, etc.
            if (stateData.breadcrumbSchemaEnabled === 'true') {
              insertBreadcrumbSchema();
            }
            if (stateData.articleSchemaEnabled === 'true') {
              insertArticleSchema();
            }
          } else if (pathParts[1] === "video") {
            if (stateData.videoSchemaEnabled === 'true') {
              insertVideoSchema();
            }
          }

          // General schemas for all pages
          if (stateData.organizationSchemaEnabled === 'true') {
            insertOrganizationSchema();
          }
          if (stateData.siteNameSchemaEnabled === 'true') {
            insertSiteNameSchema();
          }
          if (stateData.searchBoxSchemaEnabled === 'true') {
            insertSearchBoxSchema();
          }
          if (stateData.recipeSchemaEnabled === 'true') {
            insertRecipeSchema();
          }

        } else {
          console.warn("Access token not found for this shop.");
        }
      } catch (error) {
        console.error("Error fetching schema data:", error);
      }
    }

    // Product Schema
    async function fetchProductAndInsertSchema(accessToken, shop, handle) {
      try {
        const productResponse = await fetch('https://' + shop + '/admin/api/2024-04/products.json?handle=' + handle, {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          }
        });
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

    // Collection Schema
    async function fetchCollectionAndInsertSchema(accessToken, shop, handle) {
      try {
        const collectionResponse = await fetch('https://' + shop + '/admin/api/2024-04/collections.json?handle=' + handle, {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          }
        });
        const collectionData = await collectionResponse.json();

        if (collectionData.collections && collectionData.collections.length > 0) {
          const collection = collectionData.collections[0];
          insertCollectionSchemaData(collection, shop);
        } else {
          console.warn("Collection not found.");
        }
      } catch (error) {
        console.error("Error fetching collection data:", error);
      }
    }

    // Insert various schemas

    function insertProductSchemaData(product, shop) {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
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

    function insertSiteNameSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "WebSite",
        "name": shop,
        "url": window.location.href
      };
      insertSchemaToDOM(schemaData);
    }

    function insertRecipeSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Recipe",
        "name": "Sample Recipe",
        "recipeIngredient": ["Ingredient 1", "Ingredient 2"],
        "recipeInstructions": "Mix all ingredients."
      };
      insertSchemaToDOM(schemaData);
    }

    // Function to insert schema data into DOM
    function insertSchemaToDOM(schemaData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);
      console.log("JSON-LD schema inserted:", schemaData);
    }

    // Function to remove specific schemas from DOM
    function removeProductSchema() {
      removeSchemaFromDOM("Product");
    }

    function removeCollectionSchema() {
      removeSchemaFromDOM("Collection");
    }

    function removeSchemaFromDOM(schemaType) {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach((script) => {
        try {
          const schemaData = JSON.parse(script.textContent);
          if (schemaData['@type'] === schemaType) {
            script.remove();
            console.log(schemaType + " schema removed.");
          }
        } catch (error) {
          console.error("Error parsing JSON-LD schema for removal:", error);
        }
      });
    }

    // Call the function to manage the schema based on page type
    insertSchemaBasedOnPage();
  `);
});

// Server start-up
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
