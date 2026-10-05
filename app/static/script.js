const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const refreshButton = document.getElementById("refresh-button");
const apiStatus = document.getElementById("api-status");
const statusPill = document.querySelector(".status-pill");
const toast = document.getElementById("toast");

const totalCount = document.getElementById("total-count");
const activeCount = document.getElementById("active-count");
const completedCount = document.getElementById("completed-count");

let toastTimer;

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
}

function formatDate(dateValue) {
    const date = new Date(dateValue);

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function showToast(message, isError = false) {
    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function updateStats(tasks) {
    const completed = tasks.filter((task) => task.completed).length;
    const active = tasks.length - completed;

    totalCount.textContent = tasks.length;
    activeCount.textContent = active;
    completedCount.textContent = completed;
}

function renderTasks(tasks) {
    updateStats(tasks);

    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✦</div>
                <h3>Your workspace is clear</h3>
                <p>Create your first task and begin building momentum.</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = tasks
        .map(
            (task) => `
                <article class="task-item ${task.completed ? "completed" : ""}">
                    <div class="task-content">
                        <button
                            class="task-check"
                            onclick="completeTask(${task.id})"
                            title="Mark task as complete"
                            ${task.completed ? "disabled" : ""}
                        >
                            ✓
                        </button>

                        <div>
                            <p class="task-title">${escapeHtml(task.title)}</p>
                            <p class="task-date">Created ${formatDate(task.created_at)}</p>
                        </div>
                    </div>

                    <div class="task-actions">
                        <span class="task-tag">
                            ${task.completed ? "COMPLETED" : "IN PROGRESS"}
                        </span>

                        <button
                            class="delete-button"
                            onclick="deleteTask(${task.id})"
                            title="Delete task"
                        >
                            ×
                        </button>
                    </div>
                </article>
            `
        )
        .join("");
}

async function loadTasks() {
    taskList.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>
            <p>Loading your tasks...</p>
        </div>
    `;

    try {
        const response = await fetch("/api/tasks");

        if (!response.ok) {
            throw new Error("Could not load tasks");
        }

        const data = await response.json();
        renderTasks(data.tasks);
    } catch (error) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠</div>
                <h3>Could not load tasks</h3>
                <p>Check whether Flask and PostgreSQL are running correctly.</p>
            </div>
        `;

        showToast("Could not load tasks", true);
    }
}

async function checkHealth() {
    try {
        const response = await fetch("/health");

        if (!response.ok) {
            throw new Error("API is unavailable");
        }

        const data = await response.json();

        if (data.database === "connected") {
            apiStatus.textContent = "API online";
            statusPill.classList.remove("offline");
            statusPill.classList.add("online");
        } else {
            throw new Error("Database unavailable");
        }
    } catch (error) {
        apiStatus.textContent = "API offline";
        statusPill.classList.remove("online");
        statusPill.classList.add("offline");
    }
}

taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = taskTitleInput.value.trim();

    if (!title) {
        showToast("Please enter a task title", true);
        return;
    }

    const submitButton = taskForm.querySelector("button");
    submitButton.disabled = true;
    submitButton.innerHTML = "Creating...";

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not create task");
        }

        taskTitleInput.value = "";
        showToast("Task created successfully");
        await loadTasks();
    } catch (error) {
        showToast(error.message, true);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = "<span>+</span> Create task";
    }
});

async function completeTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: "PUT",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not complete task");
        }

        showToast("Task completed. Nice work!");
        await loadTasks();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function deleteTask(taskId) {
    const confirmed = window.confirm("Delete this task?");

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not delete task");
        }

        showToast("Task deleted");
        await loadTasks();
    } catch (error) {
        showToast(error.message, true);
    }
}

refreshButton.addEventListener("click", async () => {
    refreshButton.disabled = true;
    await loadTasks();
    await checkHealth();
    refreshButton.disabled = false;
});

checkHealth();
loadTasks();
