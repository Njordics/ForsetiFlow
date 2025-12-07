// Enhanced Task kanban + project header with Trello-like features
(function () {
  const columns = {
    todo: document.getElementById("col-todo"),
    "in-progress": document.getElementById("col-in-progress"),
    done: document.getElementById("col-done"),
    later: document.getElementById("col-later"),
  };
  const cardTemplate = document.getElementById("kanban-card-template");
  const form = document.getElementById("task-form");
  const metricTotal = document.getElementById("metric-total");
  const metricDone = document.getElementById("metric-done");
  const metricTodo = document.getElementById("metric-todo");
  const metricPct = document.getElementById("metric-pct");
  const nameEl = document.getElementById("project-name");
  const descEl = document.getElementById("project-desc");
  const taskResourceFormSelect = document.getElementById("task-resource-select");
  const collapsedState = new Map();
  let draggingTaskId = null;
  let resources = [];
  let allTasks = [];
  let filterText = "";
  let filterPoints = "";
  let filterDue = "";
  let filterLabel = "";

  const columnCounts = {
    todo: document.querySelector('.kanban-count[data-status="todo"]'),
    "in-progress": document.querySelector('.kanban-count[data-status="in-progress"]'),
    done: document.querySelector('.kanban-count[data-status="done"]'),
    later: document.querySelector('.kanban-count[data-status="later"]'),
  };

  const wipLimits = {
    "in-progress": 5,
  };

  const trashTarget = document.getElementById("kanban-trash");

  async function loadProject() {
    try {
      const project = await window.api(`/api/projects/${window.PROJECT_ID}`);
      if (nameEl) nameEl.textContent = project.name;
      if (descEl) descEl.textContent = project.description || "";
    } catch (err) {
      if (nameEl) nameEl.textContent = "Project not found";
      if (descEl) descEl.textContent = err.message;
    }
  }

  async function loadTasks() {
    Object.values(columns).forEach((col) => (col.innerHTML = ""));
    try {
      const tasks = await window.api(`/api/projects/${window.PROJECT_ID}/tasks`);
      allTasks = tasks;
      syncLabelFilterOptions();
      if (!tasks.length) {
        Object.values(columns).forEach((col) => (col.innerHTML = '<p class="muted">No tasks yet.</p>'));
      }
      renderFilteredTasks();
    } catch (err) {
      if (metricTotal) metricTotal.textContent = "0";
      if (metricDone) metricDone.textContent = "0";
      if (metricTodo) metricTodo.textContent = "0";
      if (metricPct) metricPct.textContent = "-";
    }
  }

  function syncLabelFilterOptions() {
    const labelSelect = document.getElementById("kanban-filter-label");
    if (!labelSelect) return;
    const seen = new Set();
    const labels = [];
    allTasks.forEach((t) => {
      (t.task_labels || []).forEach((l) => {
        const name = (l.label_name || "").trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          labels.push(name);
        }
      });
    });
    const current = labelSelect.value;
    labelSelect.innerHTML = '<option value="">All labels</option>';
    labels.sort((a, b) => a.localeCompare(b)).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name.toLowerCase();
      opt.textContent = name;
      labelSelect.appendChild(opt);
    });
    if (current && seen.has(current)) {
      labelSelect.value = current;
    }
  }

  function matchesFilters(task) {
    // Text search across title/description/labels
    if (filterText) {
      const hay = `${task.title || ""} ${task.description || ""} ${(task.labels || "").replace(/,/g, " ")}`.toLowerCase();
      if (!hay.includes(filterText)) return false;
    }

    // Filter by story points
    if (filterPoints) {
      const points = task.story_points || 0;
      if (filterPoints === "0" && points !== 0) return false;
      if (filterPoints === "1-3" && (points < 1 || points > 3)) return false;
      if (filterPoints === "5-8" && (points < 5 || points > 8)) return false;
      if (filterPoints === "13+" && points < 13) return false;
    }

    // Filter by label
    if (filterLabel) {
      const labelHits = (task.task_labels || []).some((l) => (l.label_name || "").toLowerCase() === filterLabel);
      if (!labelHits) return false;
    }

    // Filter by due date
    if (filterDue && task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const monthEnd = new Date(today);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      dueDate.setHours(0, 0, 0, 0);

      if (filterDue === "overdue" && dueDate >= today) return false;
      if (filterDue === "today" && (dueDate < today || dueDate >= tomorrow)) return false;
      if (filterDue === "week" && (dueDate < today || dueDate >= weekEnd)) return false;
      if (filterDue === "month" && (dueDate < today || dueDate >= monthEnd)) return false;
    }

    return true;
  }

  function updateColumnCounts(tasks) {
    const counts = { todo: 0, "in-progress": 0, done: 0, later: 0 };
    tasks.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    Object.entries(columnCounts).forEach(([status, el]) => {
      if (!el) return;
      el.textContent = counts[status];
      const limit = wipLimits[status];
      el.classList.toggle("over-limit", Boolean(limit && counts[status] > limit));
    });
  }

  async function renderFilteredTasks() {
    Object.values(columns).forEach((col) => (col.innerHTML = ""));
    const tasks = allTasks.filter(matchesFilters);

    if (!tasks.length) {
      updateColumnCounts(tasks);
      Object.values(columns).forEach((col) => (col.innerHTML = '<p class="muted">No tasks match filters.</p>'));
      if (metricTotal) metricTotal.textContent = 0;
      if (metricDone) metricDone.textContent = 0;
      if (metricTodo) metricTodo.textContent = 0;
      if (metricPct) metricPct.textContent = "0%";
      return;
    }

    let doneCount = 0;
    for (const task of tasks) {
      if (task.status === "done") doneCount++;
      renderTask(task);
    }

    updateColumnCounts(tasks);

    const total = tasks.length;
    const todo = total - doneCount;
    const pct = total ? `${Math.round((doneCount / total) * 100)}%` : "0%";
    if (metricTotal) metricTotal.textContent = total;
    if (metricDone) metricDone.textContent = doneCount;
    if (metricTodo) metricTodo.textContent = todo;
    if (metricPct) metricPct.textContent = pct;
  }

  function setupFilters() {
    const pointsFilter = document.getElementById("kanban-filter-points");
    const dueFilter = document.getElementById("kanban-filter-due");
    const resetBtn = document.getElementById("kanban-reset-filters");
    const textFilter = document.getElementById("kanban-filter-text");
    const labelFilter = document.getElementById("kanban-filter-label");

    if (textFilter) {
      textFilter.addEventListener("input", (e) => {
        filterText = (e.target.value || "").toLowerCase();
        renderFilteredTasks();
      });
    }

    if (pointsFilter) {
      pointsFilter.addEventListener("change", (e) => {
        filterPoints = e.target.value;
        renderFilteredTasks();
      });
    }

    if (labelFilter) {
      labelFilter.addEventListener("change", (e) => {
        filterLabel = (e.target.value || "").toLowerCase();
        renderFilteredTasks();
      });
    }

    if (dueFilter) {
      dueFilter.addEventListener("change", (e) => {
        filterDue = e.target.value;
        renderFilteredTasks();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        filterText = "";
        filterPoints = "";
        filterDue = "";
        filterLabel = "";
        if (textFilter) textFilter.value = "";
        if (pointsFilter) pointsFilter.value = "";
        if (labelFilter) labelFilter.value = "";
        if (dueFilter) dueFilter.value = "";
        renderFilteredTasks();
      });
    }
  }

  function formatAssignee() { return "Owner: You"; }

  function renderTask(task) {
    const node = cardTemplate.content.cloneNode(true);
    const card = node.querySelector(".kanban-card");
    const collapseToggle = node.querySelector(".collapse-toggle");
    const collapsedDue = node.querySelector(".collapsed-due");
    const storyPointsBadge = node.querySelector(".story-points-badge");
    const title = node.querySelector(".kanban-title");
    const parent = node.querySelector(".kanban-parent");
    const resourceSel = node.querySelector(".task-resource");
    const desc = node.querySelector(".task-desc");
    const due = node.querySelector(".task-due");
    const assigneeDisplay = node.querySelector(".task-assignee-display");
    const descDisplay = node.querySelector(".task-desc-display");
    const saveBtn = node.querySelector(".task-save");
    const deleteBtn = node.querySelector(".task-delete");
    const dueField = node.querySelector(".due-field");
    const dueEmpty = node.querySelector(".due-empty");
    const setDueBtn = node.querySelector(".set-due");
    const metaPanel = node.querySelector(".meta-panel");
    const metaToggle = node.querySelector(".meta-toggle");
    const openModalBtn = node.querySelector(".card-open-modal");
    const labelsContainer = node.querySelector(".labels-container");
    const coverEl = node.querySelector(".kanban-cover");
    const storyPointsInput = node.querySelector(".task-story-points");
    const coverColorInput = node.querySelector(".task-cover-color");

    title.textContent = task.title;
    parent.textContent = task.parent_id ? `Parent #${task.parent_id}` : "";
    setResourceOptions(resourceSel, "");
    if (desc) desc.value = task.description || "";
    if (assigneeDisplay) assigneeDisplay.textContent = formatAssignee();
    if (descDisplay) descDisplay.textContent = (task.description || "").trim() || "No description";

    // Story points display
    if (storyPointsBadge) {
      if (task.story_points && task.story_points > 0) {
        storyPointsBadge.textContent = task.story_points;
        storyPointsBadge.hidden = false;
        if (storyPointsInput) storyPointsInput.value = task.story_points;
      } else {
        storyPointsBadge.hidden = true;
        if (storyPointsInput) storyPointsInput.value = 0;
      }
    } else if (storyPointsInput) {
      storyPointsInput.value = task.story_points || 0;
    }

    // Cover color
    if (coverEl) {
      if (task.cover_color) {
        coverEl.style.backgroundColor = task.cover_color;
        coverEl.style.display = "block";
        if (coverColorInput) coverColorInput.value = task.cover_color;
      } else {
        coverEl.style.display = "none";
        if (coverColorInput) coverColorInput.value = "#ffffff";
      }
    } else if (coverColorInput) {
      coverColorInput.value = task.cover_color || "#ffffff";
    }

    // Labels/tags
    if (labelsContainer) {
      if (task.task_labels && task.task_labels.length > 0) {
        labelsContainer.innerHTML = "";
        task.task_labels.forEach((label) => {
          const labelEl = document.createElement("span");
          labelEl.className = "kanban-label";
          labelEl.style.backgroundColor = label.label_color || "#808080";
          labelEl.textContent = label.label_name;
          labelsContainer.appendChild(labelEl);
        });
      }
    }

    if (desc && descDisplay) {
      desc.addEventListener("input", () => {
        descDisplay.textContent = desc.value.trim() || "No description";
      });
    }

    if (task.due_date) {
      due.value = task.due_date;
      due.classList.remove("no-due");
      dueField.style.display = "grid";
      dueEmpty.style.display = "none";
      if (collapsedDue) {
        collapsedDue.textContent = task.due_date;
        collapsedDue.hidden = false;
      }
    } else {
      due.value = "";
      due.classList.add("no-due");
      dueField.style.display = "none";
      dueEmpty.style.display = "flex";
      if (collapsedDue) collapsedDue.hidden = true;
    }

    saveBtn.addEventListener("click", async () => {
      try {
        const payload = {
          due_date: due.value,
          description: desc ? desc.value : "",
          story_points: storyPointsInput ? parseInt(storyPointsInput.value) || 0 : 0,
          cover_color: coverColorInput ? coverColorInput.value : "",
        };
        await window.api(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        saveBtn.textContent = "Saved";
        await loadTasks();
        setTimeout(() => (saveBtn.textContent = "Save"), 1200);
      } catch (err) {
        alert(`Unable to update: ${err.message}`);
      }
    });

    setDueBtn.addEventListener("click", () => {
      dueField.style.display = "grid";
      dueEmpty.style.display = "none";
      due.focus();
    });

    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Delete this task?")) return;
      try {
        await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
        await loadTasks();
      } catch (err) {
        alert(`Unable to delete: ${err.message}`);
      }
    });

    // Open card detail modal
    if (openModalBtn) {
      openModalBtn.addEventListener("click", () => openCardDetailModal(task));
    }

    card.dataset.taskId = task.id;
    if (metaToggle && metaPanel) {
      metaToggle.addEventListener("click", () => {
        const isOpen = metaPanel.classList.toggle("open");
        metaToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    const initialCollapsed = collapsedState.has(task.id) ? collapsedState.get(task.id) : true;
    applyCollapsedState(card, collapseToggle, metaPanel, metaToggle, initialCollapsed);

    if (collapseToggle) {
      collapseToggle.addEventListener("click", () => {
        const next = !card.classList.contains("collapsed");
        collapsedState.set(task.id, next);
        applyCollapsedState(card, collapseToggle, metaPanel, metaToggle, next);
      });
    }

    card.addEventListener("dragstart", () => {
      draggingTaskId = task.id;
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      draggingTaskId = null;
      card.classList.remove("dragging");
      clearDragOver();
    });

    const col = columns[task.status] || columns.todo;
    col.appendChild(node);
  }

  function setResourceOptions(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Owner: You";
    selectEl.append(opt);
    selectEl.disabled = true;
  }

  Object.entries(columns).forEach(([status, col]) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      col.classList.add("drag-over");
    });
    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
    col.addEventListener("drop", async (e) => {
      e.preventDefault();
      col.classList.remove("drag-over");
      if (!draggingTaskId) return;
      try {
        await window.api(`/api/tasks/${draggingTaskId}`, { method: "PATCH", body: JSON.stringify({ status }) });
        await loadTasks();
      } catch (err) {
        alert(`Unable to move task: ${err.message}`);
      }
    });
  });

  if (trashTarget) {
    trashTarget.addEventListener("dragover", (e) => {
      e.preventDefault();
      trashTarget.classList.add("drag-over");
    });
    trashTarget.addEventListener("dragleave", () => {
      trashTarget.classList.remove("drag-over");
    });
    trashTarget.addEventListener("drop", async (e) => {
      e.preventDefault();
      trashTarget.classList.remove("drag-over");
      if (!draggingTaskId) return;
      const ok = confirm("Delete this task?");
      if (!ok) return;
      try {
        await window.api(`/api/tasks/${draggingTaskId}`, { method: "DELETE" });
        draggingTaskId = null;
        await loadTasks();
      } catch (err) {
        alert(`Unable to delete: ${err.message}`);
      }
    });
  }

  function clearDragOver() {
    Object.values(columns).forEach((col) => col.classList.remove("drag-over"));
  }

  function applyCollapsedState(card, collapseToggle, metaPanel, metaToggle, collapsed) {
    card.classList.toggle("collapsed", collapsed);
    if (collapseToggle) {
      collapseToggle.textContent = collapsed ? "+" : "−";
      collapseToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      collapseToggle.title = collapsed ? "Expand card" : "Collapse card";
    }
    if (collapsed && metaPanel) {
      metaPanel.classList.remove("open");
      if (metaToggle) metaToggle.setAttribute("aria-expanded", "false");
    }
  }

  function setupTaskForm() {
    if (!form) return;
    setResourceOptions(taskResourceFormSelect, "");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.title) return;
      try {
        await window.api(`/api/projects/${window.PROJECT_ID}/tasks`, { method: "POST", body: JSON.stringify(data) });
        form.reset();
        await loadTasks();
      } catch (err) {
        alert(`Unable to add task: ${err.message}`);
      }
    });
  }

  function bindKanbanAddButtons() {
    const buttons = document.querySelectorAll(".add-task-btn");
    if (!buttons.length) return;
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => openQuickTaskModal(btn.dataset.status || "todo"));
    });
  }

  function statusLabel(status) {
    const labels = {
      todo: "To do",
      "in-progress": "In progress",
      done: "Done",
      later: "Later",
    };
    return labels[status] || status;
  }

  async function ensureResourceCache() { return []; }

  function populateQuickModalResources(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Owner: You</option>';
    selectEl.disabled = true;
  }

  async function openQuickTaskModal(targetStatus) {
    const status = targetStatus || "todo";
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal">
        <header>
          <h3>Add task</h3>
          <button class="pill ghost tiny" type="button" data-action="close">Close</button>
        </header>
        <form class="form-grid" autocomplete="off">
          <label>
            <span>Name</span>
            <input type="text" name="title" required placeholder="Task name" />
          </label>
          <label>
            <span>Status</span>
            <input type="text" value="${statusLabel(status)}" readonly />
            <input type="hidden" name="status" value="${status}" />
          </label>
          <label>
            <span>Description</span>
            <textarea name="description" rows="3" placeholder="Optional description"></textarea>
          </label>
          
          <label>
            <span>Due date</span>
            <input type="date" name="due_date" />
          </label>
          <label>
            <span>Story Points</span>
            <input type="number" name="story_points" min="0" value="0" />
          </label>
          <div class="actions">
            <button type="button" class="pill ghost" data-action="discard">Discard</button>
            <button type="submit" class="pill primary">Save</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.addEventListener("click", (e) => {
      if (e.target === modal || (e.target instanceof HTMLElement && e.target.dataset.action === "close")) {
        closeModal();
      }
    });
    modal.querySelector('[data-action="discard"]')?.addEventListener("click", closeModal);

    const formEl = modal.querySelector("form");
    await ensureResourceCache();

    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(formEl);
      const title = (formData.get("title") || "").trim();
      if (!title) return;
      const payload = Object.fromEntries(formData.entries());
      payload.description = payload.description || "";
      payload.due_date = payload.due_date || "";
      payload.story_points = parseInt(payload.story_points) || 0;
      
      try {
        await window.api(`/api/projects/${window.PROJECT_ID}/tasks`, { method: "POST", body: JSON.stringify(payload) });
        closeModal();
        await loadTasks();
      } catch (err) {
        alert(`Unable to add task: ${err.message}`);
      }
    });
  }

  async function openCardDetailModal(task) {
    const backdrop = document.createElement("div");
    backdrop.className = "card-modal-backdrop";

    let commentsHtml = "";
    let checklistsHtml = "";
    let attachmentsHtml = "";

    try {
      // Load comments
      const comments = await window.api(`/api/tasks/${task.id}/comments`);
      if (comments.length > 0) {
        commentsHtml = comments.map(c => `
          <div class="comment-item">
            <div class="comment-meta">
              <span>Owner: You</span>
              <span>${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <div class="comment-text">${escapeHtml(c.comment_text)}</div>
          </div>
        `).join("");
      }

      // Load checklists
      const checklists = await window.api(`/api/tasks/${task.id}/checklists`);
      if (checklists.length > 0) {
        checklistsHtml = checklists.map(cl => {
          const completed = cl.items.filter(i => i.is_complete).length;
          const total = cl.items.length;
          return `
            <div>
              <h4>${escapeHtml(cl.checklist_title)}</h4>
              <div class="checklist-progress">${completed}/${total} completed</div>
              <div class="card-modal-section-content">
                ${cl.items.map(item => `
                  <div class="checklist-item ${item.is_complete ? 'complete' : ''}">
                    <input type="checkbox" ${item.is_complete ? 'checked' : ''} class="checklist-checkbox" data-item-id="${item.id}" />
                    <span class="item-text">${escapeHtml(item.item_text)}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          `;
        }).join("");
      }

      // Load attachments
      const attachments = await window.api(`/api/tasks/${task.id}/attachments`);
      if (attachments.length > 0) {
        attachmentsHtml = attachments.map(a => `
          <div class="attachment-item">
            <a href="${escapeHtml(a.file_url)}" target="_blank" rel="noopener" class="attachment-name">${escapeHtml(a.file_name)}</a>
          </div>
        `).join("");
      }
    } catch (err) {
      console.error("Error loading card details:", err);
    }

    backdrop.innerHTML = `
      <div class="card-modal">
        <div class="card-modal-header">
          <h2>${escapeHtml(task.title)}</h2>
          <button class="card-modal-close" type="button" aria-label="Close">×</button>
        </div>

        ${task.description ? `
        <div class="card-modal-section">
          <div class="card-modal-section-title">Description</div>
          <p>${escapeHtml(task.description)}</p>
        </div>
        ` : ''}

        <div class="card-modal-section">
          <div class="card-modal-section-title">Details</div>
          <div class="card-modal-section-content">
            <div><strong>Status:</strong> ${statusLabel(task.status)}</div>
            ${task.due_date ? `<div><strong>Due Date:</strong> ${task.due_date}</div>` : ''}
            ${task.story_points ? `<div><strong>Story Points:</strong> ${task.story_points}</div>` : ''}
            ${task.task_labels && task.task_labels.length > 0 ? `
              <div>
                <strong>Labels:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
                  ${task.task_labels.map(l => `
                    <span class="kanban-label" style="background-color: ${l.label_color || '#808080'}">${escapeHtml(l.label_name)}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        ${checklistsHtml ? `
        <div class="card-modal-section">
          <div class="card-modal-section-title">Checklists</div>
          <div class="card-modal-section-content">
            ${checklistsHtml}
          </div>
        </div>
        ` : ''}

        ${attachmentsHtml ? `
        <div class="card-modal-section">
          <div class="card-modal-section-title">Attachments</div>
          <div class="card-modal-section-content">
            ${attachmentsHtml}
          </div>
        </div>
        ` : ''}

        <div class="card-modal-section">
          <div class="card-modal-section-title">Comments</div>
          <div class="card-modal-section-content">
            ${commentsHtml || '<p class="muted">No comments yet</p>'}
            <form class="comment-form" style="margin-top: 12px; display: grid; gap: 8px;">
              <textarea class="comment-input" placeholder="Add a comment..." rows="2" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.2); color: #fff;"></textarea>
              <button type="submit" class="pill primary" style="width: fit-content;">Add comment</button>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Close modal
    const closeBtn = backdrop.querySelector(".card-modal-close");
    closeBtn.addEventListener("click", () => backdrop.remove());
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.remove();
    });

    // Handle checklist updates
    backdrop.querySelectorAll(".checklist-checkbox").forEach(checkbox => {
      checkbox.addEventListener("change", async (e) => {
        const itemId = e.target.dataset.itemId;
        const isComplete = e.target.checked;
        try {
          await window.api(`/api/checklist-items/${itemId}`, {
            method: "PATCH",
            body: JSON.stringify({ is_complete: isComplete }),
          });
          // Refresh modal to show updated state
          backdrop.remove();
          openCardDetailModal(task);
        } catch (err) {
          console.error("Error updating checklist:", err);
        }
      });
    });

    // Handle comment submission
    const commentForm = backdrop.querySelector(".comment-form");
    if (commentForm) {
      commentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = commentForm.querySelector(".comment-input");
        const text = (input.value || "").trim();
        if (!text) return;
        try {
          await window.api(`/api/tasks/${task.id}/comments`, {
            method: "POST",
            body: JSON.stringify({ comment_text: text }),
          });
          input.value = "";
          // Refresh modal to show new comment
          backdrop.remove();
          openCardDetailModal(task);
        } catch (err) {
          alert("Error adding comment: " + err.message);
        }
      });
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function handleResourceUpdate(list) {
    resources = list || [];
    setResourceOptions(taskResourceFormSelect, "");
    loadTasks();
  }

  window.addEventListener("resources:update", (e) => handleResourceUpdate(e.detail));

  window.initTasks = function initTasks() {
    loadProject();
    loadTasks();
    setupTaskForm();
    bindKanbanAddButtons();
    setupFilters();
  };
})();
