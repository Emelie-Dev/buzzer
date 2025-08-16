import { useState, useRef, useEffect, useContext } from 'react';
import { GeneralContext } from '../Contexts';
import { apiClient } from '../Utilities';
import { toast } from 'sonner';

const useScrollHandler = (disableFunctionality?: boolean, url?: string) => {
  const [activeVideo, setActiveVideo] = useState<HTMLVideoElement | null>(null);
  const [prevTop, setPrevTop] = useState<number>(0);
  const [posts, setPosts] = useState<any[]>(null!);
  const [postData, setPostData] = useState({
    loading: false,
    end: false,
  });

  const { setScrollingUp } = useContext(GeneralContext);

  const contentRef = useRef<HTMLDivElement[]>([]);

  const getPosts = async () => {
    const dataArray = posts || [];

    try {
      const { data } = await apiClient(url!);
      let result = data.data.posts;

      if (dataArray.length > 0)
        result = result.filter(
          (post: any) => !posts.find((obj) => obj._id === post._id)
        );

      setPosts([...dataArray, ...result]);
      setPostData({
        loading: false,
        end: result.length < 10,
      });
    } catch {
      setPosts(dataArray);
      setPostData({
        ...postData,
        loading: false,
      });

      toast.error(
        `Error loading posts. ${
          dataArray.length > 0 ? 'Please try again' : 'Refresh to try again'
        }.`
      );
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  useEffect(() => {
    const blurHandler = () => {
      if (activeVideo) activeVideo.pause();
    };

    const focusHandler = () => {
      if (activeVideo) activeVideo.play();
    };

    window.removeEventListener('blur', blurHandler);
    window.removeEventListener('focus', focusHandler);

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

      if (target) {
        const isBottom =
          target.scrollTop + target.clientHeight >= target.scrollHeight - 200;

        if (isBottom && !postData.end) getPosts();
      }
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

  return {
    activeVideo,
    setActiveVideo,
    contentRef,
    scrollHandler,
    posts,
    setPosts,
    postData,
  };
};

export default useScrollHandler;
