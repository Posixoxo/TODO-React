import React from "react";
import { Reorder } from "framer-motion";

function TodoItem({ todo, todos, setTodos }) {
  const toggle = () => {
    const updated = todos.map(t => t.id === todo.id ? {...t, completed: !t.completed} : t);
    setTodos(updated);
  };

  const remove = (e) => {
    e.stopPropagation();
    const updated = todos.filter(t => t.id !== todo.id);
    setTodos(updated);
  };

  return (
    <Reorder.Item
      value={todo} 
      id={todo.id}
      className="todo-container"
      onClick={toggle}
      // Hover and Drag animations
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileDrag={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.3)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
    <div 
      className="rounded2" 
      style={{
        background: todo.completed 
          ? 'linear-gradient(135deg, hsl(192, 100%, 67%), hsl(280, 87%, 65%))' 
          : 'transparent',
        border: todo.completed ? 'none' : '1px solid var(--border-muted)'
      }}
    >
      {todo.completed && (
        <img 
          src="/images/icon-check.svg" 
          alt="check" 
          style={{ width: '11px', height: '9px', display: 'block', margin: '7px auto' }} 
        />
      )}
    </div>
      
      <p className="todo-text" style={todo.completed ? {textDecoration: 'line-through', opacity: 0.5} : {}}>
        {todo.text}
      </p>

      <img 
        src="/images/icon-cross.svg" 
        className="delete-btn" 
        onClick={remove} 
        alt="delete" 
      />
      
      <div className="line" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }}></div>
    </Reorder.Item>
  );
}

export default TodoItem;