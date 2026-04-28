import React, { useState, useEffect } from 'react';
import './App.css';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, set, onValue } from "firebase/database";

const initialData = {
  tasks: {
    'task-1': { id: 'task-1', title: 'Hoş Geldin!', description: 'Kartlarınızı buraya ekleyebilirsiniz.' },
  },
  columns: {
    'column-1': { id: 'column-1', title: 'Yapılacaklar', taskIds: ['task-1'] },
    'column-2': { id: 'column-2', title: 'Yapılıyor', taskIds: [] },
    'column-3': { id: 'column-3', title: 'Bitti', taskIds: [] },
  },
  columnOrder: ['column-1', 'column-2', 'column-3'],
};

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // Yeni eklendi
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false); // Kullanıcı durumu belirlendiğinde yüklemeyi bitir
      
      if (currentUser) {
        const userRef = ref(db, 'users/' + currentUser.uid);
        onValue(userRef, (snapshot) => {
          const cloudData = snapshot.val();
          if (cloudData) setData(cloudData);
          else {
            setData(initialData);
            set(userRef, initialData);
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && data) {
      const userRef = ref(db, 'users/' + user.uid);
      set(userRef, data);
    }
  }, [data, user]);

  const handleAuth = async (type) => {
    try {
      if (type === 'login') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  const addNewTask = (columnId) => {
    const title = prompt("Görev Başlığı:");
    if (!title || !data) return;
    const newTaskId = `task-${Date.now()}`;
    const newTask = { id: newTaskId, title, description: 'Detay ekleyin...' };
    const currentColumn = data.columns[columnId];
    const currentTaskIds = currentColumn && currentColumn.taskIds ? Array.from(currentColumn.taskIds) : [];
    setData({
      ...data,
      tasks: { ...data.tasks, [newTaskId]: newTask },
      columns: { ...data.columns, [columnId]: { ...currentColumn, taskIds: [...currentTaskIds, newTaskId] } }
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
    const currentColumn = data.columns[columnId];
    const newTaskIds = (currentColumn.taskIds || []).filter(id => id !== taskId);
    setData({
      ...data,
      tasks: newTasks,
      columns: { ...data.columns, [columnId]: { ...currentColumn, taskIds: newTaskIds } }
    });
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];
    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds || []);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      setData({ ...data, columns: { ...data.columns, [start.id]: { ...start, taskIds: newTaskIds } } });
      return;
    }
    const startIds = Array.from(start.taskIds || []);
    startIds.splice(source.index, 1);
    const finishIds = Array.from(finish.taskIds || []);
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

  if (!user) {
    // Eğer Firebase hala kullanıcının kim olduğunu kontrol ediyorsa hiçbir şey gösterme (veya yükleniyor yazısı göster)
if (authLoading) return <div className="loading-screen">Yükleniyor...</div>;

if (!user) {
  return (
    <div className="login-container">
      {/* ... login kodların ... */}
    </div>
  );
}
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>TaskFlow</h2>
          <p style={{color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px'}}>Kanban Proje Yönetim Tahtası</p>
          <input type="email" required placeholder="E-posta" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Şifre" onChange={(e) => setPassword(e.target.value)} />
          <div className="auth-buttons">
            <button onClick={() => handleAuth('login')}>Giriş Yap</button>
            <button onClick={() => handleAuth('signup')}>Kayıt Ol</button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="App">
      <header className="app-header">
  <h1>TaskFlow</h1>
  <button className="logout-btn" onClick={() => signOut(auth)}>Çıkış Yap</button>
</header>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board">
          {data.columnOrder.map(colId => {
            const column = data.columns[colId];
            const tasks = (column.taskIds || []).map(taskId => data.tasks[taskId]);
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
                        task && (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div className="card" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => setEditingTask(task)}>
                                <strong>{task.title}</strong>
                                <p>{task.description ? task.description.substring(0, 30) : ''}...</p>
                                <button className="del-btn" onClick={(e) => { e.stopPropagation(); deleteTask(task.id, column.id); }}>✕</button>
                              </div>
                            )}
                          </Draggable>
                        )
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

      {editingTask && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Düzenle</h3>
            <input id="edit-title" defaultValue={editingTask.title} />
            <textarea id="edit-desc" defaultValue={editingTask.description} />
            <div className="modal-buttons">
              <button onClick={() => updateTask(editingTask.id, document.getElementById('edit-title').value, document.getElementById('edit-desc').value)}>Kaydet</button>
              <button onClick={() => setEditingTask(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;