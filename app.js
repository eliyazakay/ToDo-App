// ---- State & Persistence ----
const STORAGE_KEY = "todo.tasks.v1";
let tasks = loadTasks();
let currentFilter = "all"; // 'all' | 'active' | 'completed'
let currentSort = "created"; // 'created' | 'dueDate' | 'title'
let editingTaskId = null;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ---- Helpers ----
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function byFilter(t) {
  if (currentFilter === "active") return !t.completed;
  if (currentFilter === "completed") return t.completed;
  return true;
}
function bySort(a, b) {
  if (currentSort === "title") return a.title.localeCompare(b.title);
  if (currentSort === "dueDate") {
    const av = a.dueDate || "";
    const bv = b.dueDate || "";
    return av.localeCompare(bv);
  }
  // created: newest first
  return (b.createdAt || 0) - (a.createdAt || 0);
}

// ---- CRUD ----
function addTask(title, dueDate) {
  tasks.push({ id: uid(), title, dueDate: dueDate || "", completed: false, createdAt: Date.now() });
  saveTasks(); render();
}
function toggleComplete(id) {
  const t = tasks.find(x => x.id === id);
  if (t) { t.completed = !t.completed; saveTasks(); render(); }
}
function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveTasks(); render();
}
function updateTask(id, updates) {
  const idx = tasks.findIndex(x => x.id === id);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...updates };
    saveTasks(); render();
  }
}

// ---- Rendering ----
const listEl = document.getElementById("task-list");
const tpl = document.getElementById("task-item");

function render() {
  listEl.innerHTML = "";
  tasks.filter(byFilter).sort(bySort).forEach(task => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    const checkbox = li.querySelector(".toggle");
    const titleSpan = li.querySelector(".title");
    const dueSpan = li.querySelector(".due");
    const editBtn = li.querySelector(".edit");
    const delBtn = li.querySelector(".delete");

    titleSpan.textContent = task.title;
    titleSpan.classList.toggle("completed", task.completed);
    dueSpan.textContent = task.dueDate ? `• due: ${task.dueDate}` : "";

    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleComplete(task.id));
    delBtn.addEventListener("click", () => deleteTask(task.id));
    editBtn.addEventListener("click", () => openEdit(task));

    listEl.appendChild(li);
  });
}

// ---- Add form ----
const form = document.getElementById("task-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const dueDate = document.getElementById("dueDate").value;
  if (!title) return;
  addTask(title, dueDate);
  form.reset();
});

// ---- Filters ----
document.querySelectorAll(".filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ---- Sort ----
document.getElementById("sortSelect").addEventListener("change", (e) => {
  currentSort = e.target.value;
  render();
});

// ---- Edit dialog ----
const editDialog = document.getElementById("editDialog");
const editTitle = document.getElementById("editTitle");
const editDueDate = document.getElementById("editDueDate");
const editForm = document.getElementById("editForm");
document.getElementById("editSave").addEventListener("click", () => {
  if (!editTitle.value.trim()) return;
  updateTask(editingTaskId, { title: editTitle.value.trim(), dueDate: editDueDate.value });
});

function openEdit(task) {
  editingTaskId = task.id;
  editTitle.value = task.title;
  editDueDate.value = task.dueDate || "";
  editDialog.showModal();
}
editForm.addEventListener("close", () => { editingTaskId = null; });

// ---- init ----
render();
