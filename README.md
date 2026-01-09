Todo App with Drag-and-Drop

(https://www.frontendmentor.io/challenges/todo-app-Su1_tWLnK). 
This project is a highly interactive, responsive task management application with persistent data and theme switching.

## 🚀 Features

- **Drag and Drop Reordering:** Smooth list reordering using `Framer Motion`.
- **Data Persistence:** Tasks and completion states are saved to `localStorage`.
- **Theme Memory:** Remembers user preference (Light/Dark mode) across sessions.
- **Dynamic Filtering:** Filter tasks by All, Active, and Completed states.
- **Responsive Design:** Optimized for mobile, tablet, and desktop views.

## 🛠️ Built With

- **React** - Component-based UI library.
- **Vite** - Lightning-fast frontend build tool.
- **Framer Motion** - Production-ready motion library for React.
- **CSS3** - Custom properties (variables) for theme switching.

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
Install dependencies:

Bash

npm install
Run the development server:

Bash

npm run dev
Build for production:

Bash

npm run build
📝 Lessons Learned
During this project, I focused on:

Managing complex state transitions with useEffect.

Implementing the Reorder component from Framer Motion for accessible drag-and-drop.

Handling persistent storage to ensure a seamless user experience after browser refreshes.

👤 Author
Website - Your Name/Portfolio

Frontend Mentor - @yourusername


---

### Before you push to GitHub:
1. **Check your `.gitignore`:** Make sure it has a line that says `node_modules`. If you don't have a `.gitignore` file, create one and add that line. This prevents your project from being massive and slow to upload.
2. **Screenshots:** It’s a great idea to add a folder named `screenshots` and include an image of your finished app. You can then reference it in the README with `![App Screenshot](./screenshots/desktop-preview.jpg)`.



**Since you are heading to Vercel, would you like me to explain how to set up the "Environment Variables" if you ever decide to add a database later, or are you all set with the LocalStorage version?**





# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
