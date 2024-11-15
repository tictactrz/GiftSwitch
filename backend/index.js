const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = 5002;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend is working!');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
