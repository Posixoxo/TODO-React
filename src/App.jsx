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
  
  // Timer Modal States
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [pendingTodoId, setPendingTodoId] = useState(null);
  const [customMin, setCustomMin] = useState("");

  // 1. Initial Setup: Theme & Service Worker Registration
  useEffect(() => {
    // Theme logic
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('SW Registered:', reg.scope))
        .catch((err) => console.log('SW Fail:', err));
    }
  }, []);

  // 2. Persist Todos
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const toggleTheme = () => {
    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
  };

  const handleAdd = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      const id = Date.now();
      setTodos([...todos, { id, text: inputValue, completed: false }]);
      setInputValue("");
      
      // Open Modal immediately
      setPendingTodoId(id);
      setShowTimerModal(true);
    }
  };

  // --- THE FIXED SCHEDULE FUNCTION ---
  const scheduleReminder = async (minutes) => {
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins <= 0) return;

    const todo = todos.find(t => t.id === pendingTodoId);
    const delayInMs = mins * 60000;

    // Step A: Request Permission explicitly
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      
      // Step B: Send to Service Worker (The Robust Way)
      if ('serviceWorker' in navigator) {
        try {
          // Wait until the Service Worker is actually READY and ACTIVE
          const registration = await navigator.serviceWorker.ready;
          
          if (registration.active) {
            registration.active.postMessage({
              type: 'SCHEDULE_NOTIFICATION',
              title: "Todo Reminder! ⏰",
              body: `Time to work on: ${todo.text}`,
              delay: delayInMs
            });
            console.log("Timer sent to background Service Worker");
          } else {
            console.error("Service Worker registered but not active.");
          }
        } catch (error) {
          console.error("Error communicating with Service Worker:", error);
        }
      }

      // Step C: Fallback Audio (Foreground Only)
      // This will play only if the app is still open when the timer hits
      setTimeout(() => {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log("Audio play blocked (app likely in background)"));
      }, delayInMs);
    }

    // Cleanup UI
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
          <div className="theme-toggle" onClick={toggleTheme}>
            <img src="/images/icon-sun.svg" alt="light" className="toggle sun" />
            <img src="/images/icon-moon.svg" alt="dark" className="toggle moon" />
          </div>
        </nav>
      </header>

      <section>
        <div className="Create">
          <div className="rounded"></div>
          <input 
            className="input" 
            placeholder="Create a new todo..." 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onKeyPress={handleAdd}
          />
        </div>

        <div className="todo-list">
          <Reorder.Group axis="y" values={todos} onReorder={setTodos}>
            <AnimatePresence initial={false}>
              {filtered.map((todo) => (
                <TodoItem 
                  key={todo.id} 
                  todo={todo} 
                  todos={todos} 
                  setTodos={setTodos} 
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
          
          <FilterBar 
            todos={todos} 
            setTodos={setTodos} 
            filter={filter} 
            setFilter={setFilter} 
          />
        </div>

        <div className="mobile-version">
          <div className="filters">
            {['All', 'Active', 'Completed'].map(f => (
              <p 
                key={f} 
                className={`filter ${filter === f ? 'active' : ''}`} 
                onClick={() => setFilter(f)}
              >
                {f}
              </p>
            ))}
          </div>
        </div>

        <div className="Instruction">
          <p>Drag and drop to reorder list</p>
        </div>
      </section>

      {/* --- TIMER MODAL --- */}
      <AnimatePresence>
        {showTimerModal && (
          <div className="modal-overlay">
            <motion.div 
              className="timer-modal" 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <p className="modal-title">Remind me</p>
              
              <motion.div 
                className="clock-icon" 
                animate={{ rotate: 360 }} 
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                ⏰
              </motion.div>
              
              <div className="custom-time-input">
                <input 
                  type="number" 
                  placeholder="0" 
                  value={customMin} 
                  onChange={(e) => setCustomMin(e.target.value)} 
                />
                <span>mins</span>
              </div>
              
              <div className="timer-options">
                <button onClick={() => scheduleReminder(customMin || 5)}>
                  Set Reminder
                </button>
              </div>
              
              <button 
                className="skip-btn" 
                onClick={() => setShowTimerModal(false)}
              >
                Skip
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;