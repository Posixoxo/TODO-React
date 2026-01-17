import React, { useState, useEffect } from "react";
import TodoItem from "./TodoItem.jsx";
import FilterBar from "./FilterBar.jsx";
import "./styles.css";
import { Reorder, AnimatePresence, motion } from "framer-motion";

function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("todos");
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState("All");
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [pendingTodoId, setPendingTodoId] = useState(null);
  const [customMin, setCustomMin] = useState("");

  useEffect(() => {
    if (localStorage.getItem("theme") === "light") document.body.classList.add("light-theme");
    
    // Register Service Worker for Background Tasks
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const handleAdd = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      const id = Date.now();
      setTodos([...todos, { id, text: inputValue, completed: false }]);
      setInputValue("");
      setPendingTodoId(id);
      setShowTimerModal(true);
    }
  };

  const scheduleReminder = async (minutes) => {
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins <= 0) return;

    const todo = todos.find(t => t.id === pendingTodoId);
    const delayInMs = mins * 60000;

    // 1. Request Permission (Must be triggered by this button click)
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      // 2. Send to Service Worker (Handles the "Closed Tab" scenario)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          title: "Todo Reminder! ⏰",
          body: `Time for: ${todo.text}`,
          delay: delayInMs
        });
      }

      // 3. Audio Fallback (Only works if app is open)
      setTimeout(() => {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => console.log("Audio blocked by browser policy"));
      }, delayInMs);
    }

    setShowTimerModal(false);
    setPendingTodoId(null);
    setCustomMin("");
  };

  const filtered = todos.filter(t => {
    if (filter === "Active") return !t.completed;
    if (filter === "Completed") return t.completed;
    return true;
  });

  return (
    <>
      <header>
        <nav className="navbar">
          <h1>TODO</h1>
          <div className="theme-toggle" onClick={() => {
            const isLight = document.body.classList.toggle("light-theme");
            localStorage.setItem("theme", isLight ? "light" : "dark");
          }}>
            <img src="/images/icon-sun.svg" alt="" className="toggle sun" />
            <img src="/images/icon-moon.svg" alt="" className="toggle moon" />
          </div>
        </nav>
      </header>

      <section>
        <div className="Create">
          <div className="rounded"></div>
          <input 
            className="input" placeholder="Create a new todo..." 
            value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleAdd}
          />
        </div>

        <div className="todo-list">
          <Reorder.Group axis="y" values={todos} onReorder={setTodos}>
            <AnimatePresence initial={false}>
              {filtered.map((todo) => (
                <TodoItem key={todo.id} todo={todo} todos={todos} setTodos={setTodos} />
              ))}
            </AnimatePresence>
          </Reorder.Group>
          <FilterBar todos={todos} setTodos={setTodos} filter={filter} setFilter={setFilter} />
        </div>
      </section>

      <AnimatePresence>
        {showTimerModal && (
          <div className="modal-overlay">
            <motion.div className="timer-modal" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <p className="modal-title">Remind me</p>
              <motion.div className="clock-icon" animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>⏰</motion.div>
              <div className="custom-time-input">
                <input type="number" placeholder="0" value={customMin} onChange={(e) => setCustomMin(e.target.value)} />
                <span>mins</span>
              </div>
              <div className="timer-options">
                <button onClick={() => scheduleReminder(customMin || 5)}>Set Reminder</button>
              </div>
              <button className="skip-btn" onClick={() => setShowTimerModal(false)}>Skip</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;