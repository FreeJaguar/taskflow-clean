'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface Task {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  startDate: string | null
  endDate: string | null
  tags: string
  assignee: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

const Dashboard = () => {
  const { data: session, status } = useSession()
  const [darkMode, setDarkMode] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    tags: ''
  })

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  const statusConfig = {
    OPEN: { label: 'פתוחה', emoji: '⭕', color: '#3b82f6', bg: '#eff6ff' },
    IN_PROGRESS: { label: 'בביצוע', emoji: '⏰', color: '#eab308', bg: '#fefce8' },
    COMPLETED: { label: 'הושלמה', emoji: '✅', color: '#22c55e', bg: '#f0fdf4' },
    PAUSED: { label: 'מושהית', emoji: '⏸️', color: '#6b7280', bg: '#f9fafb' },
    CANCELLED: { label: 'מבוטלת', emoji: '❌', color: '#ef4444', bg: '#fef2f2' }
  }

  const priorityConfig = {
    HIGH: { label: 'גבוה', color: '#dc2626', bg: '#fee2e2' },
    MEDIUM: { label: 'בינוני', color: '#ca8a04', bg: '#fef3c7' },
    LOW: { label: 'נמוך', color: '#16a34a', bg: '#dcfce7' }
  }

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks')
        if (response.ok) {
          const data = await response.json()
          setTasks(data)
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchTasks()
    }
  }, [session])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'COMPLETED').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const open = tasks.filter(t => t.status === 'OPEN').length
    const paused = tasks.filter(t => t.status === 'PAUSED').length
    return {
      total,
      completed,
      inProgress,
      open,
      paused,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tasks, searchTerm, filterStatus, filterPriority])

  const createTask = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      if (response.ok) {
        const newTask = await response.json()
        setTasks(prev => [newTask, ...prev])
        return true
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
    return false
  }

  const updateTask = async (taskId: string, updates: any) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev => prev.map(task =>
          task.id === taskId ? updatedTask : task
        ))
        return true
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
    return false
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
        return true
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
    return false
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    updateTask(taskId, { status: newStatus })
  }

  const exportToCSV = () => {
    const headers = ['שם המשימה', 'תיאור', 'סטטוס', 'עדיפות', 'אחראי', 'תאריך התחלה', 'תאריך סיום', 'תגיות']
    const data = tasks.map(task => [
      task.title,
      task.description,
      statusConfig[task.status].label,
      priorityConfig[task.priority].label,
      task.assignee.name,
      task.startDate || '',
      task.endDate || '',
      task.tags || ''
    ])

    const csvContent = [headers, ...data]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim()) return

    const taskData = {
      ...newTask,
      tags: newTask.tags
    }

    const success = await createTask(taskData)
    if (success) {
      setShowCreateModal(false)
      setNewTask({
        title: '',
        description: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        startDate: '',
        endDate: '',
        tags: ''
      })
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask || !editingTask.title.trim()) return

    const success = await updateTask(editingTask.id, editingTask)
    if (success) {
      setEditingTask(null)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: darkMode ? '#111' : '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: darkMode ? 'white' : '#111' }}>טוען משימות...</p>
        </div>
      </div>
    )
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      style={{
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #ddd',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        backgroundColor: darkMode ? '#444' : 'white',
        cursor: 'move',
        marginBottom: '0.75rem'
      }}
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h4 style={{ fontWeight: '600', color: darkMode ? 'white' : '#111', fontSize: '0.875rem' }}>
          {task.title}
        </h4>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => setEditingTask(task)}
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '0.25rem'
            }}
          >
            ✏️
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444',
              borderRadius: '0.25rem'
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      <p style={{
        fontSize: '0.75rem',
        color: darkMode ? '#ccc' : '#666',
        marginBottom: '0.75rem',
        lineHeight: '1.4'
      }}>
        {task.description}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '1rem',
          backgroundColor: priorityConfig[task.priority].bg,
          color: priorityConfig[task.priority].color
        }}>
          {priorityConfig[task.priority].label}
        </span>
        <span style={{ color: darkMode ? '#aaa' : '#666' }}>
          {task.assignee?.name}
        </span>
      </div>

      {task.tags && (
        <div style={{ marginTop: '0.5rem' }}>
          {task.tags.split(',').map((tag, index) => (
            <span
              key={index}
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                margin: '0 0.25rem 0.25rem 0',
                fontSize: '0.625rem',
                backgroundColor: darkMode ? '#555' : '#f3f4f6',
                color: darkMode ? '#ccc' : '#666',
                borderRadius: '0.25rem'
              }}
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: darkMode ? '#111' : '#f9fafb' }}>
      {/* Header */}
      <header style={{
        backgroundColor: darkMode ? '#222' : 'white',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid ' + (darkMode ? '#374151' : '#e5e7eb')
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: darkMode ? 'white' : '#111' }}>
            TaskFlow
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              ➕ משימה חדשה
            </button>

            <button
              onClick={exportToCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                color: darkMode ? '#d1d5db' : '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              📥 ייצוא
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '0.5rem',
                backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1.125rem'
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.125rem' }}>👤</span>
              <span style={{ color: darkMode ? '#d1d5db' : '#374151', fontSize: '0.875rem' }}>
                {session?.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{
          width: '320px',
          backgroundColor: darkMode ? '#222' : 'white',
          borderRight: '1px solid ' + (darkMode ? '#374151' : '#e5e7eb'),
          minHeight: 'calc(100vh - 73px)',
          padding: '1.5rem'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <span style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}>🔍</span>
              <input
                type="text"
                placeholder="חיפוש משימות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingRight: '2.5rem',
                  paddingLeft: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : '#111'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : '#111'
                }}
              >
                <option value="all">כל הסטטוסים</option>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <option key={status} value={status}>{config.label}</option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : '#111'
                }}
              >
                <option value="all">כל העדיפויות</option>
                {Object.entries(priorityConfig).map(([priority, config]) => (
                  <option key={priority} value={priority}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 style={{
              fontWeight: '600',
              fontSize: '0.875rem',
              color: darkMode ? 'white' : '#111',
              marginBottom: '0.75rem'
            }}>
              סטטיסטיקות מהירות
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#f0fdf4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: '#166534' }}>הושלמו</span>
                  <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{stats.completed}</span>
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fefce8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: '#854d0e' }}>בביצוע</span>
                  <span style={{ fontWeight: 'bold', color: '#ca8a04' }}>{stats.inProgress}</span>
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#eff6ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: '#1e40af' }}>פתוחות</span>
                  <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{stats.open}</span>
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#faf5ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b21a8' }}>אחוז השלמה</span>
                  <span style={{ fontWeight: 'bold', color: '#9333ea' }}>{stats.completionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Kanban Board */}
        <main style={{ flex: 1, padding: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1rem'
          }}>
            {Object.entries(statusConfig).map(([status, config]) => {
              const statusTasks = filteredTasks.filter(task => task.status === status)
              
              return (
                <div
                  key={status}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '2px dashed #d1d5db',
                    minHeight: '400px',
                    backgroundColor: darkMode ? '#1f2937' : '#f9fafb'
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>{config.emoji}</span>
                    <h3 style={{ fontWeight: '600', color: darkMode ? 'white' : '#111' }}>
                      {config.label}
                    </h3>
                    <span style={{
                      backgroundColor: darkMode ? '#374151' : 'white',
                      color: darkMode ? '#d1d5db' : '#6b7280',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem'
                    }}>
                      {statusTasks.length}
                    </span>
                  </div>

                  <div>
                    {statusTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            margin: '0 1rem',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: darkMode ? '#1f2937' : 'white'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: darkMode ? 'white' : '#111827'
            }}>
              משימה חדשה
            </h2>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="שם המשימה"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : '#111'
                }}
                required
              />

              <textarea
                placeholder="תיאור המשימה"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  height: '5rem',
                  resize: 'none',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : '#111'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : '#111'
                  }}
                >
                  {Object.entries(priorityConfig).map(([priority, config]) => (
                    <option key={priority} value={priority}>{config.label}</option>
                  ))}
                </select>

                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value as any }))}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : '#111'
                  }}
                >
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <option key={status} value={status}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : '#111'
                  }}
                />

                <input
                  type="date"
                  value={newTask.endDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, endDate: e.target.value }))}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : '#111'
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="תגיות (מופרדות בפסיק)"
                value={newTask.tags}
                onChange={(e) => setNewTask(prev => ({ ...prev, tags: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : '#111'
                }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  יצירה
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                    color: darkMode ? '#d1d5db' : '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            margin: '0 1rem',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: darkMode ? '#1f2937' : 'white'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: darkMode ? 'white' : '#111827'
            }}>
              עריכת משימה
            </h2>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="שם המשימה"
                value={editingTask.title}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : '#111'
                }}
                required
              />

              <textarea
                placeholder="תיאור המשימה"
                value={editingTask.description}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  height: '5rem',
                  resize: 'none',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : '#111'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, priority: e.target.value as any } : null)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : '#111'
                  }}
                >
                  {Object.entries(priorityConfig).map(([priority, config]) => (
                    <option key={priority} value={priority}>{config.label}</option>
                  ))}
                </select>

                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : '#111'
                  }}
                >
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <option key={status} value={status}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="date"
                  value={editingTask.startDate || ''}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : '#111'
                  }}
                />

                <input
                  type="date"
                  value={editingTask.endDate || ''}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? 'white' : '#111'
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="תגיות (מופרדות בפסיק)"
                value={editingTask.tags || ''}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, tags: e.target.value } : null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? 'white' : '#111'
                }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  שמירה
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                    color: darkMode ? '#d1d5db' : '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Dashboard