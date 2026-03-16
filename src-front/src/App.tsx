import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://job-manager-api-dkb7cvcvavfqc5cp.francecentral-01.azurewebsites.net";

interface Job {
  id: string;
  title: string;
  status: string;
  fileUrl?: string;
}

function App() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error("Erreur API", error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle) return;
    try {
      const response = await axios.post(`${API_BASE}/jobs`, {
        title: jobTitle,
      });
      setJobId(response.data.id);
      setMessage(`Job créé ! Passez à l'upload.`);
      fetchJobs();
    } catch (error) {
      setMessage("Erreur création.");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle) return;
    try {
      await axios.put(`${API_BASE}/jobs/${id}`, { title: editTitle });
      setEditingId(null);
      setMessage("Job mis à jour !");
      fetchJobs();
    } catch (error) {
      setMessage("Erreur lors de la modification.");
    }
  };

  const handleUpload = async () => {
    if (!file || !jobId) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(1);
      await axios.post(`${API_BASE}/jobs/${jobId}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(progress);
          }
        },
      });

      setMessage("Fichier enregistré avec succès !");
      setTimeout(() => {
        setJobId(null);
        setJobTitle("");
        setFile(null);
        setUploadProgress(0);
        fetchJobs();
      }, 1000);
    } catch (error) {
      setMessage("Erreur lors de l'upload.");
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setTimeout(async () => {
      try {
        await axios.delete(`${API_BASE}/jobs/${id}`);
        setJobs((prev) => prev.filter((job) => job.id !== id));
      } catch (error) {
        console.error(error);
      } finally {
        setDeletingId(null);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans text-left">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            💼 Job Manager Pro
          </h1>
          <p className="text-gray-500 italic">
            Interface de gestion avec monitoring d'upload en temps réel.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-10">
              {!jobId ? (
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <h3 className="text-lg font-bold text-indigo-600">
                    🆕 Créer une mission
                  </h3>
                  <input
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all"
                    type="text"
                    placeholder="Titre du poste..."
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                  <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                    Continuer
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-emerald-600">
                    {jobs.find((j) => j.id === jobId)?.fileUrl
                      ? "🔄 Remplacer fichier"
                      : "📁 Document requis"}
                  </h3>
                  <div className="relative border-2 border-dashed border-emerald-200 rounded-xl p-4 bg-emerald-50 text-center">
                    <input
                      type="file"
                      id="upload"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="upload"
                      className="cursor-pointer text-sm text-emerald-700 font-medium block"
                    >
                      {file ? file.name : "Cliquez pour joindre un fichier"}
                    </label>
                  </div>

                  {uploadProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2.5 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                      <p className="text-[10px] text-right mt-1 font-bold text-emerald-600">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={!file || uploadProgress > 0}
                    className={`w-full py-3 rounded-xl text-white font-bold transition-all ${file && uploadProgress === 0 ? "bg-emerald-600 shadow-lg shadow-emerald-100" : "bg-gray-300"}`}
                  >
                    {uploadProgress > 0
                      ? "Téléchargement..."
                      : "🚀 Valider l'envoi"}
                  </button>
                  <button
                    onClick={() => setJobId(null)}
                    className="w-full text-xs text-gray-400 font-bold uppercase py-2"
                  >
                    Annuler
                  </button>
                </div>
              )}
              {message && (
                <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-semibold text-center">
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/50 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-800">📜 Flux d'activité</h3>
                <span className="text-xs font-bold text-gray-400">
                  {jobs.length} JOB(S)
                </span>
              </div>
              <ul className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className={`p-6 transition-all duration-300 ${deletingId === job.id ? "opacity-0 -translate-x-4" : ""}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        {editingId === job.id ? (
                          <div className="flex gap-2">
                            <input
                              className="border-2 border-indigo-100 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-500 w-full"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdate(job.id)}
                              className="text-emerald-500 font-bold text-xs uppercase"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-400 font-bold text-xs uppercase"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <h4 className="text-xl font-bold text-gray-800">
                            {job.title}
                          </h4>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${job.fileUrl ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {job.status}
                          </span>
                          <span className="text-[10px] text-gray-300 font-mono italic">
                            #{job.id.split("-")[0]}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {/* Bouton Modifier Titre */}
                        <button
                          onClick={() => {
                            setEditingId(job.id);
                            setEditTitle(job.title);
                          }}
                          className="text-gray-300 hover:text-indigo-500 p-2 transition-colors"
                        >
                          ✏️
                        </button>
                        {/* Bouton Remplacer Document */}
                        <button
                          onClick={() => {
                            setJobId(job.id);
                            setMessage("Remplacement du document...");
                          }}
                          className="text-gray-300 hover:text-emerald-500 p-2 transition-colors"
                        >
                          🔄
                        </button>
                        {/* Bouton Supprimer */}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {job.fileUrl && (
                      <div className="mt-4">
                        <a
                          href={`${API_BASE}/${job.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          📄 Consulter la pièce jointe
                        </a>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
