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

  // 1. FORCED ONESIGNAL INITIALIZATION
  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
    }

    const initOneSignal = async () => {
      try {
        if (!OneSignal.initialized) {
          await OneSignal.init({ 
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID, 
            allowLocalhostAsSecureOrigin: true,
            // Using absolute path and forcing root scope to fix the 'postMessage' error
            serviceWorkerPath: "/OneSignalSDKWorker.js", 
            serviceWorkerParam: { scope: "/" } 
          });
          console.log("OneSignal Bridge Established");
        }
      } catch (e) {
        console.error("OneSignal Bridge Error:", e);
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

  // 2. RELIABLE BACKGROUND SCHEDULING
  const scheduleReminder = async (minutes) => {
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins <= 0) return;

    try {
      const todo = todos.find(t => t.id === pendingTodoId);
      
      // Calculate exact time: Now + minutes + 10-second safety buffer
      const sendAfter = new Date(Date.now() + mins * 60000 + 10000);
      
      console.log("Local Time Now:", new Date().toString());
      console.log("Scheduling Push for (UTC):", sendAfter.toISOString());

      const subscriptionId = OneSignal.User?.pushSubscription?.id;

      // If subscription bridge is broken, prompt immediately
      if (!subscriptionId) {
        console.warn("No Subscription ID found. Prompting user...");
        setShowTimerModal(false);
        await OneSignal.Notifications.requestPermission();
        alert("Notifications weren't ready. Please 'Allow' permissions and try setting the reminder again.");
        return; 
      }

      // API Call to OneSignal REST API
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${import.meta.env.VITE_ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
          include_subscription_ids: [subscriptionId], 
          contents: { "en": `⏰ REMINDER: ${todo.text}` },
          headings: { "en": "Todo App" },
          send_after: sendAfter.toISOString(), 
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log("Success! OneSignal ID:", result.id);
        alert(`Notification scheduled for ${mins} min(s). You can close this tab.`);
      } else {
        console.error("OneSignal API Error:", result);
        alert("API Error: " + (result.errors?.[0] || "Unknown Error"));
      }

    } catch (err) {
      console.error("Critical Function Error:", err);
    } finally {
      // 3. CLEANUP: Always close modal and reset state
      setShowTimerModal(false);
      setPendingTodoId(null);
      setCustomMin("");
      
      // Local Foreground Sound Fallback
      setTimeout(() => {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => {});
      }, mins * 60000);
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
            id="todo-input"
            name="todo-input"
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
          <FilterBar todos={todos} setTodos={setTodos} filter={filter} setFilter={setFilter} />
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
              <motion.div className="clock-icon" animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>⏰</motion.div>
              <div className="custom-time-input">
                <input 
                  id="mins-input"
                  name="mins-input"
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