import os
from datetime import datetime, timezone

from flask import Flask, jsonify, render_template, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

app = Flask(__name__)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "taskdb")
DB_USER = os.getenv("DB_USER", "taskuser")
DB_PASSWORD = os.getenv("DB_PASSWORD", "taskpassword")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "completed": self.completed,
            "created_at": self.created_at.isoformat(),
        }


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/health")
def health():
    try:
        db.session.execute(text("SELECT 1"))

        return jsonify(
            {
                "status": "healthy",
                "database": "connected",
            }
        ), 200

    except SQLAlchemyError:
        return jsonify(
            {
                "status": "unhealthy",
                "database": "not connected",
            }
        ), 503


@app.get("/api/tasks")
def get_tasks():
    tasks = Task.query.order_by(Task.completed.asc(), Task.id.desc()).all()

    return jsonify(
        {
            "count": len(tasks),
            "tasks": [task.to_dict() for task in tasks],
        }
    ), 200


@app.post("/api/tasks")
def create_task():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()

    if not title:
        return jsonify(
            {
                "error": "Task title is required",
            }
        ), 400

    if len(title) > 200:
        return jsonify(
            {
                "error": "Task title must be 200 characters or fewer",
            }
        ), 400

    try:
        task = Task(title=title)
        db.session.add(task)
        db.session.commit()

        return jsonify(task.to_dict()), 201

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"error": "Could not create task"}), 500


@app.put("/api/tasks/<int:task_id>/complete")
def complete_task(task_id):
    task = db.session.get(Task, task_id)

    if task is None:
        return jsonify({"error": "Task not found"}), 404

    try:
        task.completed = True
        db.session.commit()

        return jsonify(task.to_dict()), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"error": "Could not update task"}), 500


@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id):
    task = db.session.get(Task, task_id)

    if task is None:
        return jsonify({"error": "Task not found"}), 404

    try:
        db.session.delete(task)
        db.session.commit()

        return jsonify(
            {
                "message": "Task deleted successfully",
                "task_id": task_id,
            }
        ), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"error": "Could not delete task"}), 500


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
