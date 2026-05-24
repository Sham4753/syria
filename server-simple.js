const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req, res) => {
    res.json({ name: 'سوريا الإلكترونية', status: 'running' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server: http://0.0.0.0:${PORT}`);
});

