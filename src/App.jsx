import React, { useState, useEffect } from "react";
import TodoItem from "./TodoItem.jsx";
import FilterBar from "./FilterBar.jsx";
import "./styles.css";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import OneSignal from 'react-onesignal';

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
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
    }

    const initOneSignal = async () => {
      try {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/OneSignalSDKWorker.js');
        }
        await OneSignal.init({ 
          appId: import.meta.env.VITE_ONESIGNAL_APP_ID, 
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "OneSignalSDKWorker.js"
        });
      } catch (e) {
        if (!e.message?.includes("already initialized")) {
          console.error("OneSignal Error:", e);
        }
      }
    };
    initOneSignal();
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

  // --- OPTIMIZED SCHEDULE REMINDER ---
  const scheduleReminder = async (minutes) => {
    // 1. IMMEDIATE UI CLEANUP
    const mins = parseInt(minutes);
    setShowTimerModal(false);
    setCustomMin("");

    if (isNaN(mins) || mins <= 0) {
      setPendingTodoId(null);
      return;
    }

    console.log("Scheduling request for:", mins, "mins");
    const todo = todos.find(t => t.id === pendingTodoId);
    const todoText = todo?.text || "Todo Reminder";

    try {
      // 2. CHECK FOR ONESIGNAL (Handle Localhost Failures)
      let subscriptionId = null;
      try {
        subscriptionId = OneSignal.User?.pushSubscription?.id;
      } catch (e) {
        console.warn("OneSignal SDK checking failed.");
      }

      if (!subscriptionId) {
        console.warn("OneSignal not active (Localhost/Blocked). Fallback alert set.");
        
        // Browser Alert Fallback
        setTimeout(() => {
          alert(`⏰ Reminder: ${todoText}`);
        }, mins * 60000);

        // Request permission in background (no 'await' so it doesn't freeze)
        OneSignal.Notifications?.requestPermission().catch(() => {});
        setPendingTodoId(null);
        return; 
      }

      // 3. PRODUCTION API CALL (Only on Vercel)
      const sendAfter = new Date(Date.now() + (mins * 60000) + 15000);
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${import.meta.env.VITE_ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
          include_subscription_ids: [subscriptionId], 
          contents: { "en": `⏰ Task: ${todoText}` },
          headings: { "en": "Todo App" },
          send_after: sendAfter.toISOString(), 
        })
      });

    } catch (err) {
      console.error("API scheduling failed, using fallback alert:", err);
      setTimeout(() => {
        alert(`⏰ Reminder: ${todoText}`);
      }, mins * 60000);
    } finally {
      setPendingTodoId(null);
    }
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
                <TodoItem key={todo.id} todo={todo} todos={todos} setTodos={setTodos} />
              ))}
            </AnimatePresence>
          </Reorder.Group>
          <FilterBar todos={todos} setTodos={setTodos} filter={filter} setFilter={setFilter} isOutside={false} />
        </div>

        <FilterBar todos={todos} setTodos={setTodos} filter={filter} setFilter={setFilter} isOutside={true} />

        <div className="Instruction">
          <p>Drag and drop to reorder list</p>
        </div>
      </section>

      <AnimatePresence>
        {showTimerModal && (
          <div className="modal-overlay">
            <motion.div 
              className="timer-modal" 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <p className="modal-title">Remind me in...</p>
              
              <div className="clock-icon">
                ⏰
              </div>
              
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
                <button type="button" onClick={() => scheduleReminder(customMin)}>
                  Set Reminder
                </button>
              </div>

              <button className="skip-btn" onClick={() => setShowTimerModal(false)}>
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