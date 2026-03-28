import { useEffect, useRef, useState } from "react";

export function useApiState(loader, watchKey) {
  const loaderRef = useRef(loader);
  const [state, setState] = useState({ data: null, loading: true });

  loaderRef.current = loader;

  useEffect(() => {
    let active = true;

    loaderRef.current()
      .then((data) => {
        if (active) {
          setState({ data, loading: false });
        }
      })
      .catch(() => {
        if (active) {
          setState({ data: null, loading: false });
        }
      });

    return () => {
      active = false;
    };
  }, [watchKey]);

  return state;
}
