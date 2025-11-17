const projectsEl = document.getElementById("projects");
const projectTemplate = document.getElementById("project-template");
const taskTemplate = document.getElementById("task-row-template");
const statProjects = document.getElementById("stat-projects");
const statTasks = document.getElementById("stat-tasks");
const statProgress = document.getElementById("stat-progress");

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || res.statusText);
  }
  return res.json();
}

function updateHeroStats(projectCount, taskCount, doneCount) {
  if (statProjects) statProjects.textContent = projectCount;
  if (statTasks) statTasks.textContent = taskCount;
  if (statProgress) {
    if (!taskCount) {
      statProgress.textContent = "-";
    } else {
      const pct = Math.round((doneCount / taskCount) * 100);
      statProgress.textContent = `${pct}%`;
    }
  }
}

async function loadProjects() {
  projectsEl.innerHTML = "";
  const stats = { tasks: 0, done: 0 };
  try {
    const projects = await api("/api/projects");
    updateHeroStats(projects.length, 0, 0);
    if (!projects.length) {
      projectsEl.innerHTML = '<p class="muted">No projects yet. Add one above.</p>';
      return;
    }
    for (const project of projects) {
      renderProject(project, stats);
    }
    updateHeroStats(projects.length, stats.tasks, stats.done);
  } catch (err) {
    console.error(err);
    projectsEl.innerHTML = `<p class="error">Failed to load projects: ${err.message}</p>`;
  }
}

function renderProject(project, stats) {
  const node = projectTemplate.content.cloneNode(true);
  node.querySelector(".project-title").textContent = project.name;
  node.querySelector(".project-desc").textContent = project.description || "No description";
  node.querySelector(".project-id").textContent = `ID ${project.id}`;

  const form = node.querySelector(".task-form");
  form.querySelector("input[name='project_id']").value = project.id;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.title) return;
    try {
      await api(`/api/projects/${project.id}/tasks`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      form.reset();
      await loadProjects();
    } catch (err) {
      alert(`Unable to add task: ${err.message}`);
    }
  });

  const taskListEl = node.querySelector(".task-list");
  loadTasks(project.id, taskListEl, stats);

  projectsEl.appendChild(node);
}

async function loadTasks(projectId, listEl, stats) {
  listEl.innerHTML = "";
  try {
    const tasks = await api(`/api/projects/${projectId}/tasks`);
    if (stats) {
      stats.tasks += tasks.length;
      stats.done += tasks.filter((t) => t.status === "done").length;
    }
    if (!tasks.length) {
      listEl.innerHTML = '<p class="muted">No tasks yet.</p>';
      return;
    }
    for (const task of tasks) {
      renderTask(task, listEl);
    }
  } catch (err) {
    listEl.innerHTML = `<p class="error">Failed to load tasks: ${err.message}</p>`;
  }
}

function renderTask(task, listEl) {
  const node = taskTemplate.content.cloneNode(true);
  const title = node.querySelector(".task-title");
  const status = node.querySelector(".task-status");
  const due = node.querySelector(".task-due");
  const saveBtn = node.querySelector(".task-save");

  title.textContent = task.title;
  status.value = task.status;
  if (task.due_date) due.value = task.due_date;

  saveBtn.addEventListener("click", async () => {
    try {
      const payload = {
        status: status.value,
        due_date: due.value,
      };
      await api(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      saveBtn.textContent = "Saved";
      await loadProjects();
      setTimeout(() => (saveBtn.textContent = "Save"), 1200);
    } catch (err) {
      alert(`Unable to update: ${err.message}`);
    }
  });

  listEl.appendChild(node);
}

const projectForm = document.getElementById("project-form");
projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(projectForm).entries());
  if (!data.name) return;
  try {
    await api("/api/projects", { method: "POST", body: JSON.stringify(data) });
    projectForm.reset();
    await loadProjects();
  } catch (err) {
    alert(`Unable to create project: ${err.message}`);
  }
});

document.getElementById("reload").addEventListener("click", loadProjects);

loadProjects();
