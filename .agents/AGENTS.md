# Project Rules & Customizations

- **Project Structure**: The project follows a modular architecture where features are isolated in their own directories. Keep this structure consistent.
- **Dependency Installation**: When installing project dependencies, use the `--legacy-peer-deps` flag to avoid installation errors caused by React version mismatches. The command is: `npm install --legacy-peer-deps`.
- **PowerShell Command Chaining**: Never use `&&` to chain shell commands in Windows PowerShell (causes a parser error in PowerShell 5.1). Always execute commands as separate calls or use `;` as the statement separator.
- **Code Style**: Use Tailwind CSS utility classes for styling. Avoid inline styles where possible.
- **Component Design**: Keep components focused and reusable. Use functional components with React Hooks.
- **State Management**: Use React Context for global state management. Use `useState` and `useEffect` for local state.
