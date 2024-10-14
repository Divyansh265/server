const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
// Root route
app.get('/', (req, res) => {
    res.send(`alert("hello")`);

});
// Listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


