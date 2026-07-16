import { useContext, useState, useEffect } from "react"
import { Plus, Upload } from "lucide-react"
import ProjectModal from "../components/projects/ProjectModal"
import ProjectsContext from "../contexts/ProjectsContext"
import DeleteProjectModal from "../components/projects/DeleteProjectModal"
import ProjectCard from "../components/projects/ProjectCard"
import ICSImportModal from "../ics/ICSImportModal"
import { PROJECT_SORT_OPTIONS, USER_PREFERENCE_KEYS, readStoredPreference, writeStoredPreference } from '../utils/userPreferences'

function ProjectsOverview() {
  const { projects, setProjects } = useContext(ProjectsContext)

  // Default category filter option
  const ALL_CATEGORIES_OPTION = "ALL_CATEGORIES"

  // States to track status of modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [sortBy, setSortBy] = useState(() => {
    return readStoredPreference(USER_PREFERENCE_KEYS.PROJECT_SORT, PROJECT_SORT_OPTIONS.PRIORITY_DESC)
  });
  const [titleSearch, setTitleSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const saved = localStorage.getItem("tempo-projects-overview-category");
    return saved !== null ? JSON.parse(saved) : ALL_CATEGORIES_OPTION;
  });
  const [showCompleted, setShowCompleted] = useState(() => {
    const saved = localStorage.getItem("tempo-projects-overview-show-completed");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    writeStoredPreference(USER_PREFERENCE_KEYS.PROJECT_SORT, sortBy)
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem("tempo-projects-overview-category", JSON.stringify(selectedCategory));
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem("tempo-projects-overview-show-completed", JSON.stringify(showCompleted));
  }, [showCompleted]);

  // State to track which project is selected for editing or deleting
  const [selectedProject, setSelectedProject] = useState(null)

  // Add created project to list of projects in state
  const handleCreatedProject = (newProject) => {
    setProjects((prevProjects) => [...prevProjects, newProject])
  }

  const handleImportedProjects = (importedProjects) => {
    setProjects((prevProjects) => [...prevProjects, ...importedProjects])
  }

  // Updates the metadata of a project
  const handleUpdatedProject = (updatedProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.projectId === updatedProject.projectId ? updatedProject : project
      )
    )
    setSelectedProject(null)
  }

  // Removes a project with a given projectId from the state of projects
  const handleDeletedProject = (projectId) => {
    setProjects((prevProjects) => 
      prevProjects.filter((project) =>
        project.projectId !== projectId
      )
    )
  }

  // Opens the project edit modal for a specific project
  const handleOpenEditModal = (event, project) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedProject(project)
    setIsEditModalOpen(true)
  }

  // Opens the project delete modal for a specific project
  const handleOpenDeleteModal = (event, project) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedProject(project)
    setIsDeleteModalOpen(true)
  }

  // Normalizes date string to timestamp in milliseconds for sorting comparison
  const getTimestamp = (dateString) => {
    return new Date(dateString).getTime()
  }

  const normalizedTitleSearch = titleSearch.trim().toLowerCase()

  // Build category options from all projects so the dropdown always reflects every category (alphabetized)
  const categoryOptions = [...new Set(
    projects
      .map((project) => project.category?.trim())
      .filter((category) => Boolean(category))
  )].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))

  // Filter projects by title and selected category
  const filteredProjects = projects.filter((project) => {
    const matchesTitle = project.title.toLowerCase().includes(normalizedTitleSearch)
    const matchesCategory =
      selectedCategory === ALL_CATEGORIES_OPTION || project.category === selectedCategory

    return matchesTitle && matchesCategory
  })

  // Sorts projects based on the selected sort option in the dropdown
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === PROJECT_SORT_OPTIONS.TITLE_ASC) {
      return a.title.localeCompare(b.title, "en", {
        sensitivity: "base",
        numeric: true,
      })
    }

    if (sortBy === PROJECT_SORT_OPTIONS.PRIORITY_ASC) {
      return a.priority - b.priority
    }

    if (sortBy === PROJECT_SORT_OPTIONS.DUE_DATE_ASC) {
      return getTimestamp(a.dueDate) - getTimestamp(b.dueDate)
    }

    if (sortBy === PROJECT_SORT_OPTIONS.DUE_DATE_DESC) {
      return getTimestamp(b.dueDate) - getTimestamp(a.dueDate)
    }

    if (sortBy === PROJECT_SORT_OPTIONS.CREATED_AT_DESC) {
      return getTimestamp(b.createdAt) - getTimestamp(a.createdAt)
    }

    // Default: priority descending
    return b.priority - a.priority
  })

  // Projects that will be rendered as cards. These are calculated after filtering and sorting have been completed
  const activeProjects = sortedProjects.filter((project) => project.status !== "COMPLETED")
  const completedProjects = sortedProjects.filter((project) => project.status === "COMPLETED")

  const allActiveProjectsCount = projects.filter((project) => project.status !== "COMPLETED").length
  const allCompletedProjectsCount = projects.filter((project) => project.status === "COMPLETED").length

  const isSearching = normalizedTitleSearch.length > 0
  const allProjectsCompleted = projects.length > 0 && projects.every((project) => project.status === "COMPLETED")

  // If not searching and all projects are completed: show the no active projects default message.
  // If searching with no active project matches: show that all matching projects are completed.
  const activeProjectsEmptyMessage = !isSearching && allProjectsCompleted
    ? "No active projects right now."
    : "No active projects match your filters. All matching projects are completed."

  return (
    <div className="p-6">

      {/** Top Section of Projects Overview */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-600 pt-0.5">
              Active ({allActiveProjectsCount}) : Completed ({allCompletedProjectsCount})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1 rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors duration-200 hover:bg-indigo-50"
            >
              <Upload size={16} />
              Import from Calendar
            </button>

            {/** New Project Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors duration-200"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>

        {/** Search/Filter/Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="text"
            value={titleSearch}
            onChange={(event) => setTitleSearch(event.target.value)}
            placeholder="Search titles"
            aria-label="Search projects by title"
            className="flex-1 min-w-30 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />

          {categoryOptions.length > 0 && (
            <select
              id="project-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="min-w-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value={ALL_CATEGORIES_OPTION}>All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}

          <select
            id="project-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="min-w-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value={PROJECT_SORT_OPTIONS.PRIORITY_DESC}>Priority (High-Low)</option>
            <option value={PROJECT_SORT_OPTIONS.PRIORITY_ASC}>Priority (Low-High)</option>
            <option value={PROJECT_SORT_OPTIONS.DUE_DATE_ASC}>Due date (Soonest)</option>
            <option value={PROJECT_SORT_OPTIONS.DUE_DATE_DESC}>Due date (Latest)</option>
            <option value={PROJECT_SORT_OPTIONS.CREATED_AT_DESC}>Newest first</option>
            <option value={PROJECT_SORT_OPTIONS.TITLE_ASC}>Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/** Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No projects yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create your first project to start tracking deadlines and momentum.
          </p>
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No matching projects</h2>
          <p className="mt-2 text-sm text-gray-500">
            Try a different title search or category filter.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/** Active Projects Section with Hide/Show Toggle */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Active Projects</h2>
              {completedProjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCompleted((prev) => !prev)}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
                >
                  {showCompleted ? "Hide" : "Show"} completed ({completedProjects.length})
                </button>
              )}
            </div>

            {activeProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
                <p className="text-sm text-gray-600">{activeProjectsEmptyMessage}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                    isCompleted={false}
                    onEdit={handleOpenEditModal}
                    onDelete={handleOpenDeleteModal}
                  />
                ))}
              </div>
            )}
          </section>

          {/** Completed Projects Section */}
          {showCompleted && completedProjects.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Completed Projects</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {completedProjects.map((project) => (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                    isCompleted={true}
                    onEdit={handleOpenEditModal}
                    onDelete={handleOpenDeleteModal}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/** Modals for creating, editing, and deleting projects. */}
      {isCreateModalOpen && (
        <ProjectModal
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onProjectSaved={handleCreatedProject}
        />
      )}

      {isEditModalOpen && (
        <ProjectModal
          mode="edit"
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedProject(null)
          }}
          onProjectSaved={handleUpdatedProject}
          project={selectedProject}
        />
      )}

      {isImportModalOpen && (
        <ICSImportModal
          onClose={() => setIsImportModalOpen(false)}
          onProjectsImported={handleImportedProjects}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteProjectModal
          onClose={() => {
            setIsDeleteModalOpen(false)
            setSelectedProject(null)
          }}
          onProjectDeleted={handleDeletedProject}
          project={selectedProject}
        />
      )}
    </div>
  )
}

export default ProjectsOverview
