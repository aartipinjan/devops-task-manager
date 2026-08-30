import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/tasks`);
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Failed to fetch tasks. Is the backend running?');
    }
    setLoading(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      if (editingId) {
        // Update existing task
        await axios.put(`${API_URL}/api/tasks/${editingId}`, {
          title,
          description,
          status: 'pending',
        });
        setEditingId(null);
      } else {
        // Create new task
        await axios.post(`${API_URL}/api/tasks`, {
          title,
          description,
          status: 'pending',
        });
      }

      setTitle('');
      setDescription('');
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${API_URL}/api/tasks/${id}`);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="container">
      <header className="header">
        <h1>📋 Task Manager</h1>
        <p className="subtitle">DevOps Demo Application with Docker & PostgreSQL</p>
      </header>

      <main className="main-content">
        {/* Form Section */}
        <section className="form-section">
          <form onSubmit={handleAddTask} className="task-form">
            <div className="form-group">
              <label htmlFor="title">Task Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                className="input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                className="textarea"
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn btn-primary">
                {editingId ? '✏️ Update Task' : '➕ Add Task'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                  ❌ Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Tasks List Section */}
        <section className="tasks-section">
          <div className="section-header">
            <h2>Your Tasks</h2>
            <span className="task-count">{tasks.length} tasks</span>
          </div>

          {loading && <p className="loading">Loading tasks...</p>}

          {tasks.length === 0 && !loading && (
            <div className="empty-state">
              <p>📭 No tasks yet. Create one to get started!</p>
            </div>
          )}

          <div className="tasks-list">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span className="task-status">{task.status}</span>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                <div className="task-meta">
                  <small>Created: {new Date(task.created_at).toLocaleDateString()}</small>
                </div>
                <div className="task-actions">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="btn btn-small btn-edit"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="btn btn-small btn-delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          DevOps Task Manager | React + Node.js + PostgreSQL | Containerized with Docker
        </p>
      </footer>
    </div>
  );
}

export default App;
