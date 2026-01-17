import React, { useState, useEffect } from "react";
import TodoItem from "./TodoItem.jsx";
import FilterBar from "./FilterBar.jsx";
import "./styles.css";
import { Reorder, AnimatePresence, motion } from "framer-motion";

function App() {
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem("todos");
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState("All");
  
  // New State for Timer Feature
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [pendingTodoId, setPendingTodoId] = useState(null);

  // 1. Request Notification Permission & Theme Load
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
    }
  }, []);

  // 2. Persistent Storage
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
      const newTodo = { id, text: inputValue, completed: false, reminderTime: null };
      setTodos([...todos, newTodo]);
      setInputValue("");
      
      // Open the timer modal for the todo just added
      setPendingTodoId(id);
      setShowTimerModal(true);
    }
  };

  // Logic to set the reminder/alarm
  const scheduleReminder = (minutes) => {
    const todoToRemind = todos.find(t => t.id === pendingTodoId);
    if (!todoToRemind) return;

    const delay = minutes * 60000; // convert to ms
    
    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("Todo Reminder! ⏰", {
          body: `Time to work on: ${todoToRemind.text}`,
          icon: "/images/icon-check.svg",
          tag: todoToRemind.id // prevents duplicate notifications
        });
        
        // Trigger Audio Alarm
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log("Audio play blocked until user interaction."));
      } else {
        alert(`Reminder: ${todoToRemind.text}`);
      }
    }, delay);

    setShowTimerModal(false);
    setPendingTodoId(null);
  };

  const filtered = todos.filter((t) => {
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
            <img src="/images/icon-sun.svg" alt="light mode" className="toggle sun" />
            <img src="/images/icon-moon.svg" alt="dark mode" className="toggle moon" />
          </div>
        </nav>
      </header>

      <section>
        <div className="Create">
          <div className="rounded"></div>
          <input 
            type="text"
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

      {/* --- REMINDER MODAL --- */}
    <AnimatePresence>
      {showTimerModal && (
        <div className="modal-overlay">
          <motion.div 
            className="timer-modal"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
          >
            <p className="modal-title">Remind me</p>
            
            {/* Animated Clock Icon */}
            <motion.div 
              className="clock-icon"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              ⏰
            </motion.div>

            <p className="modal-desc">How many minutes from now?</p>
            
            {/* Custom Time Input Area */}
            <div className="custom-time-input">
              <input 
                type="number" 
                min="1" 
                placeholder="00"
                id="customMinutes"
                onKeyDown={(e) => {
                  if (e.key === "Enter") scheduleReminder(e.target.value);
                }}
              />
              <span>mins</span>
            </div>

            <div className="timer-options">
              <button onClick={() => {
                const val = document.getElementById('customMinutes').value;
                scheduleReminder(val || 5); // Default to 5 if empty
              }}>
                Set Reminder
              </button>
            </div>
            
            <button 
              className="skip-btn" 
              onClick={() => setShowTimerModal(false)}
            >
              No, thanks
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

export default App;