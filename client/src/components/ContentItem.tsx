import { useEffect, useRef, useState } from 'react';
import styles from '../styles/ContentItem.module.css';
import CarouselItem from './CarouselItem';

type ContentItemProps = {
  src: string;
  aspectRatio: number;
  setDescriptionWidth?: React.Dispatch<React.SetStateAction<number>>;
  type: 'image' | 'video';
  contentType: 'single' | 'reels';
  description: string;
  name?: string;
  hideData: boolean;
  setHideData: React.Dispatch<React.SetStateAction<boolean>>;
  viewObj: {
    viewed: boolean;
    setViewed: React.Dispatch<React.SetStateAction<boolean>>;
    handleView: () => Promise<void>;
  };
};

const ContentItem = ({
  src,
  aspectRatio,
  setDescriptionWidth,
  type,
  contentType,
  description,
  name,
  hideData,
  setHideData,
  viewObj,
}: ContentItemProps) => {
  const [seenSlides, setSeenSlides] = useState(new Set());

  const { viewed, setViewed, handleView } = viewObj;

  const contentRef = useRef<HTMLDivElement>(null!);
  const timeout = useRef<number | NodeJS.Timeout | undefined>(undefined);
  const waitTime = useRef(3000);
  const time = useRef<Date>(null!);
  const viewValue = useRef(viewed);

  useEffect(() => {
    const resizeHandler = () => {
      if (setDescriptionWidth)
        setDescriptionWidth(contentRef.current.offsetWidth);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    viewValue.current = viewed;

    const elem = contentRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!viewValue.current) {
            if (entry.isIntersecting) {
              time.current = new Date();
              timeout.current = setTimeout(handleView, waitTime.current);
            } else {
              if (timeout.current) {
                const diff = Math.max(
                  0,
                  waitTime.current -
                    (Date.parse(new Date().toString()) -
                      Date.parse(time.current.toString()))
                );

                waitTime.current = diff;

                clearTimeout(timeout.current);
                timeout.current = undefined;
              }
            }
          }
        });
      },
      {
        threshold: 0.4,
      }
    );

    observer.observe(elem);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      observer.unobserve(elem);
    };
  }, []);

  useEffect(() => {
    viewValue.current = viewed;

    time.current = null!;
    waitTime.current = 3000;
    clearTimeout(timeout.current);
    timeout.current = undefined;
  }, [viewed]);

  useEffect(() => {
    if (seenSlides.size === 0) setViewed(false);
  }, [seenSlides]);

  return (
    <div className={styles.content} ref={contentRef}>
      <CarouselItem
        item={{ type, src }}
        aspectRatio={aspectRatio}
        hideData={hideData}
        setHideData={setHideData}
        itemIndex={0}
        contentIndex={0}
        viewType="content"
        contentType={contentType}
        description={description}
        name={name}
        viewsData={{ seenSlides, setSeenSlides }}
      />
    </div>
  );
};

export default ContentItem;
