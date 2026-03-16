import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

interface Job {
  id: string;
  title: string;
  status: string;
  fileUrl?: string; // Synchronisé avec le backend
}

function App() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      setMessage(`Étape 1 réussie !`);
      fetchJobs();
    } catch (error) {
      setMessage("Erreur lors de la création.");
    }
  };

  const handleUpload = async () => {
    if (!file || !jobId) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_BASE}/jobs/${jobId}/upload`, formData);
      setMessage("Processus terminé avec succès !");
      setJobId(null);
      setJobTitle("");
      setFile(null);
      fetchJobs();
    } catch (error) {
      setMessage("Erreur lors de l'upload.");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id); // Déclenche l'animation Tailwind
    setTimeout(async () => {
      try {
        await axios.delete(`${API_BASE}/jobs/${id}`);
        setJobs((prev) => prev.filter((job) => job.id !== id));
      } catch (error) {
        console.error("Erreur suppression", error);
      } finally {
        setDeletingId(null);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            💼 Job Manager Pro
          </h1>
          <p className="text-gray-600">
            Créez des missions et gérez vos documents en quelques clics.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 sticky top-10">
              {!jobId ? (
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <h3 className="text-lg font-bold text-indigo-700">
                    🆕 Nouveau Job
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre de la mission
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      type="text"
                      placeholder="Ex: Architecte Cloud"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition">
                    Créer le Job
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-green-600">
                    📁 Joindre un fichier
                  </h3>
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center bg-green-50">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-sm text-green-700 hover:underline"
                    >
                      {file ? file.name : "Cliquez pour choisir un fichier"}
                    </label>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={!file}
                    className={`w-full py-2 rounded-lg font-bold text-white transition ${file ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"}`}
                  >
                    🚀 Envoyer
                  </button>
                </div>
              )}
              {message && (
                <p className="mt-4 text-xs text-center font-medium text-indigo-500 bg-indigo-50 py-2 rounded">
                  {message}
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">📜 Historique</h3>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                  {jobs.length} Total
                </span>
              </div>
              <ul className="divide-y divide-gray-200">
                {jobs.length === 0 && (
                  <li className="p-10 text-center text-gray-400 italic">
                    Aucun job pour le moment...
                  </li>
                )}
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className={`p-6 hover:bg-gray-50 transition-all duration-300 transform ${
                      deletingId === job.id
                        ? "opacity-0 scale-95 -translate-x-10"
                        : "opacity-100 scale-100"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition">
                          {job.title}
                        </h4>
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          ID: {job.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded bg-indigo-50 text-indigo-700">
                          {job.status}
                        </span>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {job.fileUrl && (
                      <div className="mt-4">
                        <a
                          href={`${API_BASE}/${job.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-indigo-600 hover:underline inline-flex items-center"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          Consulter le document
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
