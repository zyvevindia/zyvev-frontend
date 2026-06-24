import "../../styles/assistant.css";

export default function AssistantShell({ children }) {
  return (
    <main className="assistant-page">
      <div className="assistant-page__inner">{children}</div>
    </main>
  );
}
