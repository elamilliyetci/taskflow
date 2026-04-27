import React, { useState, useEffect } from 'react';
import './App.css';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const initialData = {
  tasks: {
    'task-1': { id: 'task-1', title: 'React Projesi', description: 'Vercel yayını yapılacak.' },
  },
  columns: {
    'column-1': { id: 'column-1', title: 'Yapılacaklar', taskIds: ['task-1'] },
    'column-2': { id: 'column-2', title: 'Yapılıyor', taskIds: [] },
    'column-3': { id: 'column-3', title: 'Bitti', taskIds: [] },
  },
  columnOrder: ['column-1', 'column-2', 'column-3'],
};

function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('taskflow-pro');
    return saved ? JSON.parse(saved) : initialData;
  });
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    localStorage.setItem('taskflow-pro', JSON.stringify(data));
  }, [data]);

  const addNewTask = (columnId) => {
    const title = prompt("Görev Başlığı:");
    if (!title) return;

    const newTaskId = `task-${Date.now()}`;
    const newTask = { id: newTaskId, title: title, description: 'Açıklama eklemek için tıklayın...' };

    setData({
      ...data,
      tasks: { ...data.tasks, [newTaskId]: newTask },
      columns: {
        ...data.columns,
        [columnId]: { ...data.columns[columnId], taskIds: [...data.columns[columnId].taskIds, newTaskId] }
      }
    });
  };

  const updateTask = (id, newTitle, newDesc) => {
    setData({
      ...data,
      tasks: { ...data.tasks, [id]: { ...data.tasks[id], title: newTitle, description: newDesc } }
    });
    setEditingTask(null);
  };

  const deleteTask = (taskId, columnId) => {
    const newTasks = { ...data.tasks };
    delete newTasks[taskId];
    const newTaskIds = data.columns[columnId].taskIds.filter(id => id !== taskId);
    setData({
      ...data,
      tasks: newTasks,
      columns: { ...data.columns, [columnId]: { ...data.columns[columnId], taskIds: newTaskIds } }
    });
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      setData({ ...data, columns: { ...data.columns, [start.id]: { ...start, taskIds: newTaskIds } } });
      return;
    }

    const startIds = Array.from(start.taskIds);
    startIds.splice(source.index, 1);
    const finishIds = Array.from(finish.taskIds);
    finishIds.splice(destination.index, 0, draggableId);
    setData({
      ...data,
      columns: {
        ...data.columns,
        [start.id]: { ...start, taskIds: startIds },
        [finish.id]: { ...finish, taskIds: finishIds }
      }
    });
  };

  return (
    <div className="App">
      <h1>TaskFlow Pro</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board">
          {data.columnOrder.map(colId => {
            const column = data.columns[colId];
            const tasks = column.taskIds.map(taskId => data.tasks[taskId]);
            return (
              <div className="column" key={column.id}>
                <div className="column-header">
                  <h2>{column.title}</h2>
                  <button onClick={() => addNewTask(column.id)}>+</button>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="task-list">
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              className="card"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setEditingTask(task)}
                            >
                              <div className="card-content">
                                <strong>{task.title}</strong>
                                <p>{task.description.substring(0, 30)}...</p>
                              </div>
                              <button className="del-btn" onClick={(e) => { e.stopPropagation(); deleteTask(task.id, column.id); }}>✕</button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* DÜZENLEME MODALI */}
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Görevi Düzenle</h3>
            <input 
              id="edit-title" 
              defaultValue={editingTask.title} 
              placeholder="Başlık"
            />
            <textarea 
              id="edit-desc" 
              defaultValue={editingTask.description} 
              placeholder="Açıklama"
            />
            <div className="modal-buttons">
              <button onClick={() => updateTask(
                editingTask.id, 
                document.getElementById('edit-title').value, 
                document.getElementById('edit-desc').value
              )}>Kaydet</button>
              <button onClick={() => setEditingTask(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;