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

  // 1. IMPROVED INITIALIZATION
  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
    }

    const initOneSignal = async () => {
      try {
        // Prevent double-initialization crash
        if (!OneSignal.initialized) {
          await OneSignal.init({ 
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID, 
            allowLocalhostAsSecureOrigin: true,
            // Explicitly point to the file we created to fix the 404
            serviceWorkerPath: "OneSignalSDK.sw.js", 
          });
          console.log("OneSignal Initialized Successfully");
        }
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

  const scheduleReminder = async (minutes) => {
    const mins = parseInt(minutes);
    
    try {
      if (isNaN(mins) || mins <= 0) return;

      const todo = todos.find(t => t.id === pendingTodoId);
      const sendAfter = new Date();
      sendAfter.setMinutes(sendAfter.getMinutes() + mins);

      console.log("Attempting to schedule...");

      // SAFETY CHECK: Ensure OneSignal is actually initialized
      if (!OneSignal.User || !OneSignal.User.pushSubscription) {
        console.error("OneSignal User or PushSubscription is not defined.");
        
        try {
          // Force the prompt if they aren't subscribed
          await OneSignal.Slidedown.promptPush();
        } catch (e) {
          console.error("Prompt failed", e);
        }
        
        alert("Notification system not ready. Please allow permissions in the popup and try again.");
        return;
      }

      // Get Subscription ID
      const userId = OneSignal.User.pushSubscription.id;
      
      if (!userId) {
        alert("Subscription ID not found. Please click 'Allow' on the notification prompt.");
        return;
      }

      // API Call using Vite Env Variables
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${import.meta.env.VITE_ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
          include_subscription_ids: [userId], 
          contents: { "en": `Task: ${todo.text}` },
          headings: { "en": "Todo Reminder! ⏰" },
          send_after: sendAfter.toISOString(), 
        })
      });

      const result = await response.json();
      console.log("OneSignal Response:", result);

      if (response.ok) {
        setShowTimerModal(false);
        setPendingTodoId(null);
        setCustomMin("");
      } else {
        alert("OneSignal Error: " + (result.errors?.[0] || "Unknown error"));
      }

    } catch (err) {
      console.error("CRITICAL ERROR:", err);
      alert("Check console for error details");
    }
    
    // Local Audio Fallback
    setTimeout(() => {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(() => console.log("Foreground audio blocked"));
    }, mins * 60000);

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