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
        if (!OneSignal.initialized) {
          await OneSignal.init({ 
            appId: import.meta.env.VITE_ONESIGNAL_APP_ID, 
            allowLocalhostAsSecureOrigin: true,
            // Use absolute path for Vercel stability
            serviceWorkerPath: "/OneSignalSDK.sw.js", 
          });
          console.log("OneSignal Initialized");
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
    if (isNaN(mins) || mins <= 0) return;

    try {
      const todo = todos.find(t => t.id === pendingTodoId);
      const sendAfter = new Date();
      sendAfter.setMinutes(sendAfter.getMinutes() + mins);

      console.log("Checking subscription...");

      // SAFE CHECK: Use optional chaining (?.) so it doesn't crash if the SDK isn't ready
      const subscriptionId = OneSignal.User?.pushSubscription?.id;
      const permission = await OneSignal.Notifications?.permission;

      // If we don't have an ID yet, it means they need to click 'Allow' or the SW is still loading
      if (!subscriptionId) {
        console.log("Subscription not ready. Triggering prompt...");
        
        // This opens the browser popup
        await OneSignal.Notifications.requestPermission();
        
        alert("Please click 'Allow' on the browser prompt, then click 'Set Reminder' again.");
        return; 
      }

      // If we have the ID, send to the OneSignal API
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${import.meta.env.VITE_ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
          include_subscription_ids: [subscriptionId], 
          contents: { "en": `Reminder: ${todo.text}` },
          headings: { "en": "Todo App ⏰" },
          send_after: sendAfter.toISOString(), 
        })
      });

      if (response.ok) {
        console.log("Notification Scheduled!");
      } else {
        const errData = await response.json();
        console.error("OneSignal API Error:", errData);
      }

    } catch (err) {
      console.error("Function crashed, but we will close modal anyway:", err);
    }
    
    // ALWAYS close the modal and play the backup sound, even if the API call failed
    setTimeout(() => {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(() => {});
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