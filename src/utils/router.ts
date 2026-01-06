type Listener = (path: string) => void;

const listeners = new Set<Listener>();
let popstateBound = false;

function notify(path: string) {
  listeners.forEach((listener) => listener(path));
}

export function getCurrentPath() {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

export function listenToRouteChange(listener: Listener) {
  listeners.add(listener);

  if (!popstateBound && typeof window !== 'undefined') {
    window.addEventListener('popstate', () => notify(window.location.pathname));
    popstateBound = true;
  }

  return () => {
    listeners.delete(listener);
  };
}
