"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  getMasterProjectsFromStorage,
  saveMasterProjectToStorage,
  deleteMasterProjectFromStorage,
  MasterProjectItem,
} from "@/lib/firebase";
import {
  FolderKanban,
  Plus,
  Search,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<MasterProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch Master Projects
  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const data = await getMasterProjectsFromStorage();
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  // Save Project Handler
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setSaving(true);
    try {
      const created = await saveMasterProjectToStorage(newProjectName.trim());
      setProjects((prev) => [created, ...prev]);
      setNewProjectName("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save project:", err);
    } finally {
      setSaving(false);
    }
  };

  // Delete Project Handler
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteMasterProjectFromStorage(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 rounded-lg text-[#0B4FBA]">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Projects</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  {projects.length} Total
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage master company projects used in employee allocations and timesheet logs.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>

        {/* Data Container: Search Toolbar & Table */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-gray-200/80 flex items-center justify-between bg-gray-50/40">
            <span className="text-xs font-semibold text-gray-700">Project Directory</span>

            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderKanban className="w-10 h-10 text-gray-300 mx-auto" />
              <div className="text-sm font-semibold text-gray-700">No projects found</div>
              <p className="text-xs text-gray-500">Click Add Project to create your first master project.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Project Name</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map((project) => (
                    <tr key={project.id || project.name} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900 flex items-center space-x-2.5">
                        <FolderKanban className="w-4 h-4 text-[#0B4FBA]" />
                        <span>{project.name}</span>
                      </td>

                      <td className="py-3 px-4 text-gray-500">
                        {project.createdAt
                          ? new Date(project.createdAt).toLocaleDateString()
                          : "Created"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-[#003882] to-[#0B4FBA] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-5 h-5" />
                <h3 className="text-sm font-bold">Add New Project</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-blue-100 hover:text-white hover:bg-blue-800/50 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. GamaNext ERP Portal / CRM Redesign"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newProjectName.trim()}
                  className="px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
