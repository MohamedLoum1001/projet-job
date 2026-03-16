const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// --- CONFIGURATION ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DB EN MÉMOIRE ---
let jobs = [];

// --- ROUTES ---

// GET: Lister les jobs
app.get('/jobs', (req, res) => {
    res.json(jobs);
});

// POST: Créer un job
app.post('/jobs', (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Titre requis" });

    const newJob = {
        id: uuidv4(),
        title,
        status: 'En attente',
        fileUrl: null,
        createdAt: new Date()
    };

    jobs.push(newJob);
    res.status(201).json(newJob);
});

// POST: Upload fichier
app.post('/jobs/:id/upload', upload.single('file'), (req, res) => {
    const { id } = req.params;
    const job = jobs.find(j => j.id === id);

    if (!job) return res.status(404).json({ error: "Job non trouvé" });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

    job.fileUrl = `uploads/${req.file.filename}`;
    job.status = 'Complété';

    res.json({ message: "Succès", job });
});

// DELETE: Supprimer un job
app.delete('/jobs/:id', (req, res) => {
    const { id } = req.params;
    const job = jobs.find(j => j.id === id);

    // Supprimer le fichier physique si il existe
    if (job && job.fileUrl) {
        const filePath = path.join(__dirname, job.fileUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    jobs = jobs.filter(j => j.id !== id);
    res.json({ message: "Job supprimé" });
});

app.listen(PORT, () => {
    console.log(`🚀 SERVEUR PRÊT : http://localhost:${PORT}`);
});