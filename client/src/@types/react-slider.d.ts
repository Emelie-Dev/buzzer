declare module 'react-slider' {
  import * as React from 'react';

  interface ReactSliderProps {
    className?: string;
    trackClassName?: string;
    thumbClassName?: string;
    defaultValue?: number | number[];
    value?: number | number[];
    min?: number;
    max?: number;
    step?: number;
    pearling?: boolean;
    minDistance?: number;
    renderThumb?: (
      props: object,
      state: { index: number; value: number; valueNow: number }
    ) => React.ReactNode;
    onChange?: (value: number | number[]) => void;
    onAfterChange?: (value: number | number[]) => void;
  }

  const ReactSlider: React.FC<ReactSliderProps>;
  export default ReactSlider;
}
