import { useContext, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight, Folder, FolderKanban, LayoutDashboard } from "lucide-react";
import ProjectsContext from "../../contexts/ProjectsContext";

function Sidebar({ isOpen, onClose }) {
  // Use state to track dropdown toggle, persisted to localStorage
  const [projectsOpen, setProjectsOpen] = useState(() => {
    const saved = localStorage.getItem("tempo-sidebar-projects-open");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [activeProjectsOpen, setActiveProjectsOpen] = useState(() => {
    const saved = localStorage.getItem("tempo-sidebar-active-projects-open");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [completedProjectsOpen, setCompletedProjectsOpen] = useState(() => {
    const saved = localStorage.getItem("tempo-sidebar-completed-projects-open");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("tempo-sidebar-projects-open", JSON.stringify(projectsOpen));
  }, [projectsOpen]);

  useEffect(() => {
    localStorage.setItem("tempo-sidebar-active-projects-open", JSON.stringify(activeProjectsOpen));
  }, [activeProjectsOpen]);

  useEffect(() => {
    localStorage.setItem("tempo-sidebar-completed-projects-open", JSON.stringify(completedProjectsOpen));
  }, [completedProjectsOpen]);

  const { projects } = useContext(ProjectsContext)

  // Sort projects alphabetically by title, ignoring case and handling numeric sorting (e.g. "Project 2" before "Project 10")
  const alphabetizedProjects = [...projects].sort((a, b) =>
    a.title.localeCompare(b.title, "en", { 
      sensitivity: "base", 
      numeric: true 
    })
  );

  const activeProjects = alphabetizedProjects.filter((project) => project.status !== "COMPLETED");
  const completedProjects = alphabetizedProjects.filter((project) => project.status === "COMPLETED");

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 min-h-dvh bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar with transform transition for mobile*/}
      <aside className={`fixed top-0 left-0 min-h-dvh z-40 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 
        ease-in-out lg:static lg:w-48 lg:translate-x-0 lg:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex-1 p-3 space-y-1">
          {/** Link to Dashboard */}
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
              ${isActive ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"}`
            }
          >
            <LayoutDashboard size={16} className="mr-2 shrink-0" />
            Dashboard
          </NavLink>

          {/** Link to Projects */}
          <div className="flex items-center rounded-md hover:bg-gray-100 transition-colors duration-200">
            <NavLink
              to="/projects"
              onClick={onClose}
              className={({ isActive }) =>
                `flex-1 px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive ? "text-indigo-600" : "text-gray-700"}`
              }
            >
              <span className="flex items-center">
                <FolderKanban size={16} className="mr-2 shrink-0" />
                Projects
              </span>
            </NavLink>

            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className="px-2 py-2 text-gray-400"
            >
              <ChevronRight
                size={16}
                className={`transition-transform duration-200 ${projectsOpen ? "rotate-90" : "rotate-0"}`}
              />
            </button>
          </div>

          {/** Render all projects with a link to their ProjectDetail pages via id */}
          {projectsOpen && (
            <div className="space-y-1 pl-3 overflow-y-auto max-h-96">
              {/** Active Projects */}
              {activeProjects.length > 0 && (
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveProjectsOpen(!activeProjectsOpen)}
                    className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-100 rounded-md"
                  >
                    <span>Active Projects ({activeProjects.length})</span>
                    <ChevronRight
                      size={14}
                      className={`ml-2 shrink-0 transition-transform duration-200 ${activeProjectsOpen ? "rotate-90" : "rotate-0"}`}
                    />
                  </button>

                  {activeProjectsOpen &&
                    activeProjects.map((project) => (
                      <NavLink
                        key={project.projectId}
                        to={`/projects/${project.projectId}`}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-1.5 rounded-md text-sm transition-colors duration-200 truncate
                          ${isActive ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`
                        }
                      >
                        <Folder size={14} className="mr-2 shrink-0" />
                        <span className="truncate" title={project.title}>
                          {project.title}
                        </span>
                      </NavLink>
                    ))}
                </div>
              )}

              {/** Completed Projects */}
              {completedProjects.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => setCompletedProjectsOpen(!completedProjectsOpen)}
                    className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100 rounded-md"
                  >
                    <span>Completed Projects ({completedProjects.length})</span>
                    <ChevronRight
                      size={14}
                      className={`ml-2 shrink-0 transition-transform duration-200 ${completedProjectsOpen ? "rotate-90" : "rotate-0"}`}
                    />
                  </button>

                  {completedProjectsOpen &&
                    completedProjects.map((project) => (
                      <NavLink
                        key={project.projectId}
                        to={`/projects/${project.projectId}`}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-1.5 rounded-md text-sm transition-colors duration-200 truncate
                          ${isActive ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`
                        }
                      >
                        <Folder size={14} className="mr-2 shrink-0" />
                        <span className="truncate" title={project.title}>
                          {project.title}
                        </span>
                      </NavLink>
                    ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
