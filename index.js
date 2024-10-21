const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const mongoose = require('mongoose');

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

// Route to serve the dynamic JSON-LD schema script
app.get("/serve-schema-script/:shop/:schemaType", async (req, res) => {
    const { shop, schemaType } = req.params;

    // Fetch shop data
    const shopData = await Shop.findOne({ shop });

    if (!shopData) {
        return res.status(404).send('Shop not found');
    }

    // Define different schema templates based on schemaType
    const schemaTemplates = {
        product: `{
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "Example Product",
            "image": "https://example.com/image.jpg",
            "description": "Product description here.",
            "brand": {
                "@type": "Brand",
                "name": "Brand Name"
            }
        }`,
        article: `{
            "@context": "https://schema.org/",
            "@type": "Article",
            "headline": "Example Article",
            "image": "https://example.com/article.jpg",
            "author": "Author Name",
            "publisher": "Publisher Name"
        }`,
        organization: `{
            "@context": "https://schema.org/",
            "@type": "Organization",
            "name": "Organization Name",
            "url": "https://example.com",
            "logo": "https://example.com/logo.jpg"
        }`,
        breadcrumb: `{
            "@context": "https://schema.org/",
            "@type": "BreadcrumbList",
            "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://example.com/"
            }]
        }`,
        recipe: `{
            "@context": "https://schema.org/",
            "@type": "Recipe",
            "name": "Recipe Name",
            "image": "https://example.com/recipe.jpg",
            "author": "Author Name",
            "recipeCuisine": "Cuisine Type"
        }`,
        searchbox: `{
            "@context": "https://schema.org/",
            "@type": "WebSite",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://example.com/search?q={query}",
                "query-input": "required name=query"
            }
        }`,
        sitename: `{
            "@context": "https://schema.org/",
            "@type": "WebSite",
            "name": "Example Site",
            "url": "https://example.com"
        }`
    };

    // Select the correct schema based on schemaType
    const selectedSchema = schemaTemplates[schemaType];

    if (!selectedSchema) {
        return res.status(400).send('Invalid schema type');
    }

    const scriptContent = `
        document.addEventListener("DOMContentLoaded", () => {
            const script = document.createElement("script");
            script.type = "application/ld+json";
            script.text = ${JSON.stringify(selectedSchema)};
            document.head.appendChild(script);
            console.log("${schemaType} schema added.");
        });
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(scriptContent);
});

// Route to remove JSON-LD schema based on schema type
app.get("/remove-schema/:schemaType", (req, res) => {
    const { schemaType } = req.params;

    const removalScript = `
        document.addEventListener("DOMContentLoaded", () => {
            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            jsonLdScripts.forEach((script) => {
                const schema = JSON.parse(script.textContent);
                if (schema["@type"] === "${schemaType.charAt(0).toUpperCase() + schemaType.slice(1)}") {
                    script.remove();
                    console.log("${schemaType} schema removed.");
                }
            });
        });
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(removalScript);
});

// Server start-up
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
