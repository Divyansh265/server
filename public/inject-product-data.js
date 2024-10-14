// public/fetchProductTitle.js
(async () => {
    const productHandle = window.location.pathname.split('/').pop(); // Get product handle from URL
    const shop = window.location.hostname; // Get shop domain

    // Set the port number dynamically
    const port = location.port ? `:${location.port}` : ''; // Get the port number from the current location
    const apiUrl = `https://${shop}${port}/api/products/handle/${productHandle}`; // Construct the API URL

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data && data.product) {
            // Print the product title
            const titleElement = document.createElement('h1'); // Create an H1 element for the title
            titleElement.textContent = data.product.title; // Set the text to product title
            document.body.appendChild(titleElement); // Append the title to the body
        } else {
            console.log('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product title:', error);
    }
})();
