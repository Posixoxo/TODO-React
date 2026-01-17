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

  // 1. Initialize OneSignal using Environment Variables
  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
    }

    // This uses the key from your .env file
    OneSignal.init({ 
      appId: process.env.REACT_APP_ONESIGNAL_APP_ID, 
      allowLocalhostAsSecureOrigin: true 
    }).then(() => {
      console.log("OneSignal Initialized");
    });
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

  // --- THE SECURE ONESIGNAL SCHEDULE FUNCTION ---
  const scheduleReminder = async (minutes) => {
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins <= 0) return;

    const todo = todos.find(t => t.id === pendingTodoId);
    
    // Create the timestamp for when the notification should fire
    const sendAfter = new Date();
    sendAfter.setMinutes(sendAfter.getMinutes() + mins);

    // 1. Ensure user is subscribed
    const isSubscribed = await OneSignal.isPushNotificationsEnabled();
    if (!isSubscribed) {
      await OneSignal.showNativePrompt();
    }

    // 2. Get the unique User ID for this device
    const userId = await OneSignal.getUserId();

    // 3. Post to OneSignal API using secure keys
    try {
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${process.env.REACT_APP_ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: process.env.REACT_APP_ONESIGNAL_APP_ID,
          include_player_ids: [userId], 
          contents: { "en": `Task: ${todo.text}` },
          headings: { "en": "Todo Reminder! ⏰" },
          send_after: sendAfter.toISOString(), 
          chrome_web_icon: "/logo192.png",
          ios_badgeType: "Increase",
          ios_badgeCount: 1
        })
      });

      if (response.ok) {
        console.log(`Notification scheduled for ${sendAfter.toLocaleTimeString()}`);
      }
    } catch (err) {
      console.error("OneSignal scheduling failed:", err);
    }

    // 4. Local Audio Fallback (Only plays if tab is open)
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