import { useState, useRef, useEffect, useContext } from 'react';
import { GeneralContext } from '../Contexts';

const useScrollHandler = (disableFunctionality?: boolean) => {
  const [activeVideo, setActiveVideo] = useState<HTMLVideoElement | null>(null);
  const [prevTop, setPrevTop] = useState<number>(0);

  const { setScrollingUp } = useContext(GeneralContext);

  const contentRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const blurHandler = () => {
      if (activeVideo) activeVideo.pause();
    };

    const focusHandler = () => {
      if (activeVideo) activeVideo.play();
    };

    if (!disableFunctionality) {
      window.addEventListener('blur', blurHandler);
      window.addEventListener('focus', focusHandler);
    }

    return () => {
      if (!disableFunctionality) {
        window.removeEventListener('blur', blurHandler);
        window.removeEventListener('focus', focusHandler);
      }
    };
  }, [activeVideo]);

  const scrollHandler = (e?: React.UIEvent<HTMLElement, UIEvent>) => {
    const target = e && (e.target as HTMLDivElement);
    if (!disableFunctionality) {
      const videos = contentRef.current;
      const deviceHeight = window.innerHeight;

      const activeVideos = videos.filter((video) => {
        const top = video.getBoundingClientRect().top;
        const bottom = video.getBoundingClientRect().bottom;
        const active = video.getAttribute('data-active');

        let condition;

        if (active === 'true') {
          if (
            (top > 0 && top < deviceHeight * 0.6) ||
            (bottom < deviceHeight && bottom > deviceHeight * 0.4)
          ) {
            condition = true;
          } else {
            condition = false;
          }
        } else condition = false;

        if (!condition) video.querySelector('video')?.pause();

        return condition;
      });

      activeVideos.forEach((video, index) => {
        if (index === 0) {
          video.querySelector('video')?.play();
          setActiveVideo(null);
          setActiveVideo(video.querySelector('video'));
        } else video.querySelector('video')?.pause();
      });

      if (activeVideos.length === 0) setActiveVideo(null);
    }

    if (target) {
      setScrollingUp(
        target.scrollTop - prevTop < 0
          ? true
          : target.scrollTop < 208
          ? null
          : false
      );
      setPrevTop(target.scrollTop);
    }
  };

  return { activeVideo, setActiveVideo, contentRef, scrollHandler };
};

export default useScrollHandler;
