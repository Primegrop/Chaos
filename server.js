import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Game available at http://localhost:${PORT}/index.html`);
}); 