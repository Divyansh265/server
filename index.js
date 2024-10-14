const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));

app.get('/alert-product-page.js', (req, res) => {
    const jsCode = `if (window.location.pathname.includes("/products/")) {
        alert("This is the product page!");
    }`;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsCode);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
