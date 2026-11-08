const form = document.querySelector("#task-form"),
  titleInput = document.querySelector("#task-title"),
  descriptionInput = document.querySelector("#task-description"),
  submitButton = document.querySelector("#task-submit"),
  cancelButton = document.querySelector("#task-cancel"),
  list = document.querySelector("#task-list"),
  statusMessage = document.querySelector("#status-message"),
  count = document.querySelector("#task-count"),
  formTitle = document.querySelector("#form-title");
let config,
  editingId = null,
  tasks = [];
function setMessage(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = ("status-message " + type).trim();
}
function apiUrl(query = "") {
  return (
    config.supabaseUrl.replace(/\/$/, "") +
    "/rest/v1/" +
    encodeURIComponent(config.tableName) +
    query
  );
}
async function request(path = "", options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      apikey: config.supabasePublishableKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.message || parsed.error_description || parsed.error || body;
    } catch {
      // Some API and network failures return plain text instead of JSON.
    }
    throw new Error(
      (detail || "Request failed") + " (HTTP " + response.status + ")",
    );
  }
  if (response.status === 204) return null;
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}
function textElement(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}
function render() {
  list.replaceChildren();
  count.textContent = String(tasks.length);
  if (!tasks.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.append(
      textElement("p", "empty-icon", "✳"),
      textElement("h3", "", "Nothing on the list yet"),
      textElement("p", "", "Add one small thing to get started."),
    );
    list.append(empty);
    return;
  }
  for (const task of tasks) {
    const item = document.createElement("article");
    item.className = "task-item" + (task.completed ? " is-complete" : "");
    item.dataset.id = String(task.id);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "task-check toggle-task";
    toggle.setAttribute(
      "aria-label",
      task.completed ? "Mark incomplete" : "Mark complete",
    );
    toggle.setAttribute("aria-pressed", String(Boolean(task.completed)));
    toggle.textContent = task.completed ? "✓" : "";
    const copy = document.createElement("div");
    copy.className = "task-copy";
    copy.append(textElement("h3", "task-title", task.title));
    copy.append(textElement("p", "task-description", task.description || ""));
    copy.append(
      textElement(
        "span",
        "task-status",
        task.completed ? "Done for now" : "On your list",
      ),
    );
    const controls = document.createElement("div");
    controls.className = "task-controls";
    const edit = textElement("button", "icon-button edit-task", "Edit");
    edit.type = "button";
    const remove = textElement("button", "icon-button delete-task", "Delete");
    remove.type = "button";
    controls.append(edit, remove);
    item.append(toggle, copy, controls);
    list.append(item);
  }
}
function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = "A fresh start";
  submitButton.innerHTML = 'Add to my list <span aria-hidden="true">↗</span>';
  cancelButton.hidden = true;
}
async function loadTasks() {
  setMessage("Refreshing your list…");
  try {
    tasks = await request("?select=*&order=id.desc");
    render();
    setMessage(
      tasks.length
        ? "Your list is up to date."
        : "A clear page is a good place to begin.",
      "success",
    );
  } catch (error) {
    setMessage("Could not load tasks. " + error.message, "error");
  }
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    setMessage("Add a task title before saving.", "error");
    return;
  }
  submitButton.disabled = true;
  setMessage(editingId === null ? "Saving your task…" : "Saving your changes…");
  try {
    if (editingId === null) {
      const created = await request("", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          title,
          description: descriptionInput.value.trim(),
          completed: false,
        }),
      });
      if (!Array.isArray(created) || !created.length)
        throw new Error("The server did not confirm the new task.");
    } else
      await request("?id=eq." + encodeURIComponent(editingId), {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          title,
          description: descriptionInput.value.trim(),
        }),
      });
    resetForm();
    await loadTasks();
  } catch (error) {
    setMessage("Could not save the task. " + error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});
cancelButton.addEventListener("click", resetForm);
list.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const item = button.closest(".task-item"),
    id = item && item.dataset.id,
    task = tasks.find((entry) => String(entry.id) === id);
  if (!task) return;
  if (button.matches(".edit-task")) {
    editingId = task.id;
    titleInput.value = task.title;
    descriptionInput.value = task.description || "";
    formTitle.textContent = "A small update";
    submitButton.innerHTML = 'Save changes <span aria-hidden="true">↗</span>';
    cancelButton.hidden = false;
    titleInput.focus();
    return;
  }
  button.disabled = true;
  try {
    if (button.matches(".toggle-task"))
      await request("?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ completed: !task.completed }),
      });
    else if (button.matches(".delete-task")) {
      await request("?id=eq." + encodeURIComponent(id), {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
      if (String(editingId) === id) resetForm();
    } else return;
    await loadTasks();
  } catch (error) {
    setMessage("Could not update this task. " + error.message, "error");
  } finally {
    button.disabled = false;
  }
});
async function start() {
  try {
    const response = await fetch("./config.json", { cache: "no-store" });
    if (!response.ok)
      throw new Error(
        "config.json could not be loaded (" + response.status + ")",
      );
    config = await response.json();
    let endpoint;
    try {
      endpoint = new URL(config.supabaseUrl);
    } catch {
      endpoint = null;
    }
    if (
      !endpoint ||
      !["http:", "https:"].includes(endpoint.protocol) ||
      !config.supabasePublishableKey ||
      config.tableName !== "tasks"
    )
      throw new Error(
        "Add the Supabase project URL and public publishable key to config.json.",
      );
    await loadTasks();
  } catch (error) {
    setMessage("Setup needed: " + error.message, "error");
    list.replaceChildren();
  }
}
start();
