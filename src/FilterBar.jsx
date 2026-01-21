import React from "react";

function FilterBar({ todos, setTodos, filter, setFilter, isOutside }) {
  const left = todos.filter(t => !t.completed).length;
  const clear = () => setTodos(todos.filter(t => !t.completed));

  // The part that sits OUTSIDE the todo-list div (Mobile Filters)
  if (isOutside) {
    return (
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
    );
  }

  // The part that sits INSIDE the todo-list div (Analytics & Desktop)
  return (
    <>
      <div className="mobile-version">
        <div className="analytics">
          <p className="items-left">{left} items left</p>
          <p className="clear-completed" onClick={clear}>Clear Completed</p>
        </div>
      </div>

      <div className="desktop-version">
        <div className="analytics">
          <p className="items-left">{left} items left</p>
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
          <p className="clear-completed" onClick={clear}>Clear Completed</p>
        </div>
      </div>
    </>
  );
}

export default FilterBar;