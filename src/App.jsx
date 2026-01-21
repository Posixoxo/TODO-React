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

  // Sound Fallback Helper
  const playNotificationSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play().catch(e => console.log("Sound blocked by browser until user interacts."));
  };

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
          serviceWorkerPath: "OneSignalSDKWorker.js",
          // Disable the default welcome notification to avoid confusion
          welcomeNotification: { disable: true } 
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

  const scheduleReminder = async (minutes) => {
    const mins = parseInt(minutes);
    setShowTimerModal(false);
    setCustomMin("");

    if (isNaN(mins) || mins <= 0) {
      setPendingTodoId(null);
      return;
    }

    const todo = todos.find(t => t.id === pendingTodoId);
    const todoText = todo?.text || "Todo Reminder";

    try {
      let subscriptionId = OneSignal.User?.pushSubscription?.id;

      if (!subscriptionId) {
        console.warn("Using Browser Fallback...");
        
        setTimeout(() => {
          playNotificationSound();
          // Try showing a real browser notification first
          if (Notification.permission === "granted") {
            new Notification("Todo Reminder", { body: todoText, icon: "/favicon-32x32.png" });
          } else {
            alert(`⏰ Reminder: ${todoText}`);
          }
        }, mins * 60000);

        OneSignal.Notifications?.requestPermission().catch(() => {});
        return; 
      }

      // PRODUCTION API CALL
      const sendAfter = new Date(Date.now() + (mins * 60000));
      
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
          headings: { "en": "Todo Reminder" },
          send_after: sendAfter.toISOString(),
          // Use a built-in sound for the push notification
          android_sound: "notification",
          ios_sound: "notification.wav"
        })
      });

    } catch (err) {
      console.error("API failed:", err);
      setTimeout(() => {
        playNotificationSound();
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
              <div className="clock-icon">⏰</div>
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