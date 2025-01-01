const useArrayRef = (ref: React.MutableRefObject<HTMLElement[]>) => {
  const addToRef = (el: HTMLElement | null) => {
    if (el && !ref.current.includes(el)) {
      ref.current.push(el);
    }
  };

  return addToRef;
};

export default useArrayRef;
