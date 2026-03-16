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

    console.log(`\n🆕 NOUVEAU JOB CRÉÉ`);
    console.log(`📌 Titre : ${title}`);
    console.log(`🆔 ID    : ${newJob.id}\n`);

    res.status(201).json(newJob);
});

// PUT: Modifier le titre d'un job
app.put('/jobs/:id', (req, res) => {
    const { id } = req.params;
    const { title } = req.body;

    const job = jobs.find(j => j.id === id);

    if (!job) return res.status(404).json({ error: "Job non trouvé." });
    if (!title) return res.status(400).json({ error: "Le nouveau titre est requis." });

    const oldTitle = job.title;
    job.title = title;

    console.log(`\n📝 MODIFICATION DE TITRE`);
    console.log(`🆔 ID           : ${id}`);
    console.log(`🔄 Ancien titre : ${oldTitle}`);
    console.log(`✨ Nouveau titre: ${title}\n`);

    res.json(job);
});

// POST: Upload ou REMPLACEMENT de fichier
app.post('/jobs/:id/upload', upload.single('file'), (req, res) => {
    const { id } = req.params;
    const job = jobs.find(j => j.id === id);

    if (!job) return res.status(404).json({ error: "Job non trouvé" });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

    // --- LOGIQUE DE SUPPRESSION SI REMPLACEMENT ---
    if (job.fileUrl) {
        const oldFilePath = path.join(__dirname, job.fileUrl);
        if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`\n♻️  ANCIEN FICHIER REMPLACÉ : ${job.fileUrl}`);
        }
    }

    job.fileUrl = `uploads/${req.file.filename}`;
    job.status = 'Complété';

    // --- LOGS DÉTAILLÉS ---
    console.log(`\n📂 RÉCEPTION DE DOCUMENT`);
    console.log(`-------------------------------------------`);
    console.log(`📄 Nom original : ${req.file.originalname}`);
    console.log(`💾 Nom stocké   : ${req.file.filename}`);
    console.log(`📏 Taille       : ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`🏷️  Type MIME    : ${req.file.mimetype}`);
    console.log(`🎯 Pour le Job  : ${job.title}`);
    console.log(`-------------------------------------------\n`);

    res.json({ message: "Succès", job });
});

// DELETE: Supprimer un job
app.delete('/jobs/:id', (req, res) => {
    const { id } = req.params;
    const job = jobs.find(j => j.id === id);

    if (job && job.fileUrl) {
        const filePath = path.join(__dirname, job.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`\n🗑️  FICHIER PHYSIQUE SUPPRIMÉ : ${job.fileUrl}`);
        }
    }

    jobs = jobs.filter(j => j.id !== id);
    console.log(`❌ JOB SUPPRIMÉ DU FLUX : ${id}\n`);
    res.json({ message: "Job supprimé" });
});

app.listen(PORT, () => {
    console.log(`
🚀 SERVEUR PRÊT : http://localhost:${PORT}
-------------------------------------------
Surveille ce terminal pour voir les logs...
    `);
});