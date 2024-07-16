const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FILES_DIR = path.join(__dirname, 'files');

// Ensure the files directory exists
if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR);
}

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, FILES_DIR);
    },
    filename: (req, file, cb) => {
        const username = req.query.username;
        if (!username) {
            return cb(new Error('Username is required'));
        }
        const uniqueFileName = `${username}-${file.originalname}`;
        cb(null, uniqueFileName);
    }
});
const upload = multer({ storage: storage });

// Upload Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const username = req.query.username;

    // Check if username is unique
    const files = fs.readdirSync(FILES_DIR);
    const userFiles = files.filter(file => file.startsWith(username + '-'));

    res.send('File uploaded successfully');
});

// Search Endpoint
app.post('/search', (req, res) => {
    const { query, type, user } = req.body;

    fs.readdir(FILES_DIR, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading files');
        }

        let results = files.filter(file => {
            const filePath = path.join(FILES_DIR, file);
            

            if (type && path.extname(file).slice(1) !== type) {
                return false;
            }

            if (user && !file.startsWith(user + '-')) {
                return false;
            }

            if (query) {
                const content = fs.readFileSync(filePath, 'utf-8');
                return content.includes(query) || file.includes(query);
            }

            return true;
        });

        res.json(results);
    });
});

// Download Endpoint
app.get('/download', (req, res) => {
    const { fileName } = req.query;
    const filePath = path.join(FILES_DIR, fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
