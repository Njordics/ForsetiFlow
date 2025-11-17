from flask import Flask, render_template, request, jsonify, abort

app = Flask(__name__)

store = {"projects": {}, "tasks": {}}
counters = {"project": 1, "task": 1}


def next_id(kind: str) -> str:
    counters[kind] += 1
    return str(counters[kind] - 1)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/projects", methods=["GET"])
def list_projects():
    return jsonify(list(store["projects"].values()))


@app.route("/api/projects", methods=["POST"])
def create_project():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        abort(400, "Project name is required.")
    description = (data.get("description") or "").strip()

    project_id = next_id("project")
    project = {"id": project_id, "name": name, "description": description}
    store["projects"][project_id] = project
    return jsonify(project), 201


@app.route("/api/projects/<project_id>/tasks", methods=["GET"])
def list_tasks(project_id: str):
    if project_id not in store["projects"]:
        abort(404, "Project not found.")
    tasks = [task for task in store["tasks"].values() if task["project_id"] == project_id]
    return jsonify(tasks)


@app.route("/api/projects/<project_id>/tasks", methods=["POST"])
def create_task(project_id: str):
    if project_id not in store["projects"]:
        abort(404, "Project not found.")
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        abort(400, "Task title is required.")
    status = (data.get("status") or "todo").strip().lower()
    if status not in {"todo", "in-progress", "done"}:
        status = "todo"
    due_date = (data.get("due_date") or "").strip()

    task_id = next_id("task")
    task = {
        "id": task_id,
        "project_id": project_id,
        "title": title,
        "status": status,
        "due_date": due_date,
    }
    store["tasks"][task_id] = task
    return jsonify(task), 201


@app.route("/api/tasks/<task_id>", methods=["PATCH"])
def update_task(task_id: str):
    task = store["tasks"].get(task_id)
    if not task:
        abort(404, "Task not found.")

    data = request.get_json(silent=True) or {}
    if "title" in data:
        new_title = (data.get("title") or "").strip()
        if new_title:
            task["title"] = new_title
    if "status" in data:
        status = (data.get("status") or "").strip().lower()
        if status in {"todo", "in-progress", "done"}:
            task["status"] = status
    if "due_date" in data:
        task["due_date"] = (data.get("due_date") or "").strip()

    return jsonify(task)


if __name__ == "__main__":
    app.run(debug=True)
