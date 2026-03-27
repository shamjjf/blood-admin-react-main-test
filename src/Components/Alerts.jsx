import { useCallback, useState } from "react";

export function useAlert() {
  const [list, setList] = useState([]);
  const addAlert = useCallback(
    (alert) => {
      const delAlert = () => {
        clearTimeout(id);
        setList((l) => l.filter((a) => a.id !== id));
      };
      const id = setTimeout(() => delAlert(), 3000);
      setList((l) => l.concat({ id, delAlert, ...alert }));
    },
    [setList]
  );

  return [list, addAlert];
}

function Alert({ type, title, text, delAlert }) {
  return (
    <div className={`alert alert-${type}`} role="alert" onClick={delAlert}>
      <h4 className="alert-title">{title}</h4>
      <div className={`text-${type}`}>{text}</div>
    </div>
  );
}

export function AlertContainer({ alerts }) {
  return (
    <div className="alerts">
      <div className="alert-container">
        {alerts.map((alert) => (
          <Alert key={alert.id} {...alert} />
        ))}
      </div>
    </div>
  );
}
