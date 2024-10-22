const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

// Middleware
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
            if (stateData.breadcrumbSchemaEnabled === 'true') {
              insertBreadcrumbSchema();
            } else {
              removeBreadcrumbSchema();
            }

            if (stateData.articleSchemaEnabled === 'true') {
              insertArticleSchema();
            } else {
              removeArticleSchema();
            }
          } else if (pathParts[1] === "video") {
            if (stateData.videoSchemaEnabled === 'true') {
              insertVideoSchema();
            } else {
              removeVideoSchema();
            }
          }

          // General schemas for all pages
          if (stateData.organizationSchemaEnabled === 'true') {
            insertOrganizationSchema();
          } else {
            removeOrganizationSchema();
          }

          if (stateData.siteNameSchemaEnabled === 'true') {
            insertSiteNameSchema();
          } else {
            removeSiteNameSchema();
          }

          if (stateData.searchBoxSchemaEnabled === 'true') {
            insertSearchBoxSchema();
          } else {
            removeSearchBoxSchema();
          }

          if (stateData.recipeSchemaEnabled === 'true') {
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
      insertSchemaToDOM(schemaData, "product");
    }

    function insertCollectionSchemaData(collection, shop) {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Collection",
        "name": collection.title,
        "description": collection.body_html.replace(/<[^>]*>/g, ""),
        "url": window.location.href
      };
      insertSchemaToDOM(schemaData, "collection");
    }

    function insertOrganizationSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Organization",
        "name": shop,
        "url": window.location.href
      };
      insertSchemaToDOM(schemaData, "organization");
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
      insertSchemaToDOM(schemaData, "breadcrumb");
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
      insertSchemaToDOM(schemaData, "video");
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
      insertSchemaToDOM(schemaData, "article");
    }

    function insertSearchBoxSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "WebSite",
        "url": window.location.href,
        "potentialAction": {
          "@type": "SearchAction",
          "target": window.location.href + "?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      };
      insertSchemaToDOM(schemaData, "searchBox");
    }

    function insertSiteNameSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "WebSite",
        "name": shop,
        "url": window.location.href
      };
      insertSchemaToDOM(schemaData, "siteName");
    }

    function insertRecipeSchema() {
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Recipe",
        "name": "Sample Recipe",
        "recipeIngredient": ["Ingredient 1", "Ingredient 2"],
        "recipeInstructions": "Instructions go here"
      };
      insertSchemaToDOM(schemaData, "recipe");
    }

    function insertSchemaToDOM(schemaData, schemaType) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schemaData);
      script.dataset.schemaType = schemaType; // Tag the schema type for easy removal
      document.head.appendChild(script);
    }

    // Remove functions for each schema type
    function removeSchemaByType(schemaType) {
      const schemas = document.querySelectorAll('script[type="application/ld+json"][data-schema-type="' + schemaType + '"]');
      schemas.forEach(schema => {
        schema.remove();
        console.log(schemaType.charAt(0).toUpperCase() + schemaType.slice(1) + " schema removed.");
      });
    }

    function removeProductSchema() {
      removeSchemaByType("product");
    }

    function removeCollectionSchema() {
      removeSchemaByType("collection");
    }

    function removeOrganizationSchema() {
      removeSchemaByType("organization");
    }

    function removeBreadcrumbSchema() {
      removeSchemaByType("breadcrumb");
    }

    function removeVideoSchema() {
      removeSchemaByType("video");
    }

    function removeArticleSchema() {
      removeSchemaByType("article");
    }

    function removeSearchBoxSchema() {
      removeSchemaByType("searchBox");
    }

    function removeSiteNameSchema() {
      removeSchemaByType("siteName");
    }

    function removeRecipeSchema() {
      removeSchemaByType("recipe");
    }

    insertSchemaBasedOnPage();
  `);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
