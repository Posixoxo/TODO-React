import React, { useState, useEffect } from "react";
import TodoItem from "./TodoItem.jsx";
import FilterBar from "./FilterBar.jsx";
import "./styles.css";
import { Reorder, AnimatePresence } from "framer-motion";

function App() {
  // 1. Initialize state from LocalStorage immediately
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem("todos");
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState("All");

  // 2. Load Theme Preference on first mount
  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
    }
  }, []);

  // 3. Save to LocalStorage whenever the todos list changes (including reordering)
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const toggleTheme = () => {
    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
  };

  const handleAdd = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      const newTodo = { id: Date.now(), text: inputValue, completed: false };
      setTodos([...todos, newTodo]);
      setInputValue("");
    }
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
          {/* Reorder.Group tracks the 'todos' state and updates it on drop */}
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
    </>
  );
}

export default App;