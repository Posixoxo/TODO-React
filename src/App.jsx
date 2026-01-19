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
  const [isPushReady, setIsPushReady] = useState(false);

  // 1. STRENGTHENED INITIALIZATION
  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
    }

    const initOneSignal = async () => {
      try {
        await OneSignal.init({ 
          appId: import.meta.env.VITE_ONESIGNAL_APP_ID, 
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" } 
        });
        
        // Check if we are already subscribed
        if (OneSignal.User?.pushSubscription?.id) {
          setIsPushReady(true);
        }
        
        console.log("OneSignal Bridge Initialized");
      } catch (e) {
        console.error("OneSignal Init Error:", e);
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

  // 2. RE-DESIGNED SCHEDULING LOGIC
  const scheduleReminder = async (minutes) => {
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins <= 0) return;

    try {
      const todo = todos.find(t => t.id === pendingTodoId);
      // Buffering the time by 15 seconds to prevent "Time in the past" API errors
      const sendAfter = new Date(Date.now() + (mins * 60000) + 15000);
      
      console.log("Attempting to schedule for:", sendAfter.toISOString());

      // Attempt to get the Subscription ID
      let subscriptionId = OneSignal.User?.pushSubscription?.id;

      // If missing, try one forced permission request
      if (!subscriptionId) {
        console.log("No ID found. Requesting Permission...");
        await OneSignal.Notifications.requestPermission();
        
        // Check again after prompt
        subscriptionId = OneSignal.User?.pushSubscription?.id;
        
        if (!subscriptionId) {
          alert("Could not connect to notification service. Please refresh the page and ensure notifications are 'Allowed' in your browser settings.");
          return;
        }
      }

      // API CALL
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${import.meta.env.VITE_ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
          include_subscription_ids: [subscriptionId], 
          contents: { "en": `⏰ Task: ${todo.text}` },
          headings: { "en": "Todo Reminder" },
          send_after: sendAfter.toISOString(), 
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log("Push Queued Successfully:", result.id);
        // Modal closes automatically in 'finally' block
      } else {
        console.error("OneSignal API Error:", result);
        alert("Failed to schedule: " + (result.errors?.[0] || "Check Console"));
      }

    } catch (err) {
      console.error("Critical Reminder Error:", err);
    } finally {
      // 3. GUARANTEED CLEANUP
      setShowTimerModal(false);
      setPendingTodoId(null);
      setCustomMin("");

      // Foreground Sound Fallback (Only works if tab stays open)
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
              <motion.div 
                className="clock-icon" 
                animate={{ rotate: 360 }} 
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                ⏰
              </motion.div>
              <div className="custom-time-input">
                <input 
                  id="mins-field"
                  name="mins-field"
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