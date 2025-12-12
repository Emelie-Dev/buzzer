import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import styles from '../styles/Carousel.module.css';
import { useRef, useState, useEffect } from 'react';
import CarouselItem from './CarouselItem';

type CarouselProps = {
  data: any[];
  aspectRatio: number;
  setDescriptionWidth?: React.Dispatch<React.SetStateAction<number>>;
  type: 'comment' | 'content';
  hideData: boolean;
  setHideData: React.Dispatch<React.SetStateAction<boolean>>;
  viewObj: {
    viewed: boolean;
    setViewed: React.Dispatch<React.SetStateAction<boolean>>;
    handleView: () => Promise<void>;
  };
};

const Carousel = ({
  data,
  aspectRatio,
  setDescriptionWidth,
  type: viewType,
  hideData,
  setHideData,
  viewObj,
}: CarouselProps) => {
  const [contentIndex, setContentIndex] = useState<number>(0);
  const [showMore, setShowMore] = useState<boolean>(false);
  const [webkit, setWebkit] = useState<boolean>(true);
  const [truncated, setTruncated] = useState(false);
  const [seenSlides, setSeenSlides] = useState(new Set());
  const [resetSeen, setResetSeen] = useState(false);

  const { viewed, setViewed, handleView } = viewObj;

  const carouselRef = useRef<HTMLDivElement>(null!);
  const descriptionRef = useRef<HTMLDivElement>(null!);
  const textRef = useRef<HTMLDivElement>(null!);
  const dotRef = useRef<HTMLSpanElement>(null!);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchMoveType = useRef('');
  const timeout = useRef<number | undefined>(undefined);
  const waitTime = useRef(3000);
  const time = useRef<Date>(null!);
  const viewValue = useRef(viewed);

  useEffect(() => {
    const resizeHandler = () => {
      if (setDescriptionWidth)
        setDescriptionWidth(carouselRef.current.offsetWidth);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    viewValue.current = viewed;

    const elem = carouselRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (viewType === 'content' && !viewValue.current) {
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
        threshold: 0.4, // fires when 40% visible
      }
    );

    observer.observe(elem);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      observer.unobserve(elem);
    };
  }, []);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setTruncated(el.scrollHeight > el.clientHeight);
    }

    setShowMore(false);
    setWebkit(true);
  }, [contentIndex, data]);

  useEffect(() => {
    viewValue.current = viewed;

    if (viewed) {
      time.current = null!;
      waitTime.current = 3000;
      clearTimeout(timeout.current);
      timeout.current = undefined;
    }
  }, [viewed]);

  useEffect(() => {
    if (resetSeen) {
      return setResetSeen(false);
    }
    //
    if (seenSlides.size === data.length) {
      const lastElem: any = [...seenSlides][seenSlides.size - 1];

      setResetSeen(true);
      setSeenSlides(new Set([lastElem]));
      setViewed(false);
    } else if (seenSlides.size >= (2 / 3) * data.length) {
      handleView();
    }
  }, [seenSlides]);

  const changeMedia = (type: 'prev' | 'next') => () => {
    if (type === 'next') {
      setContentIndex((prev) => prev + 1);
      carouselRef.current.style.transform = `translateX(${
        -(contentIndex + 1) * 100
      }%)`;

      if (contentIndex > 6) dotRef.current.scrollLeft += 10;
    } else {
      setContentIndex((prev) => prev - 1);
      carouselRef.current.style.transform = `translateX(${
        -(contentIndex - 1) * 100
      }%)`;

      if (contentIndex < 9) dotRef.current.scrollLeft -= 10;
    }

    setHideData(false);
  };

  const handleDescription = () => {
    let animation;

    setWebkit(false);
    if (showMore) {
      animation = textRef.current.animate(
        {
          maxHeight: [`${textRef.current.scrollHeight}px`, '50px'],
        },
        {
          fill: 'both',
          duration: 300,
        }
      );

      animation.onfinish = () => {
        setWebkit(true);
      };
    } else {
      animation = textRef.current.animate(
        {
          maxHeight: ['50px', `${textRef.current.scrollHeight}px`],
        },
        {
          fill: 'both',
          duration: 300,
        }
      );
    }

    setShowMore(!showMore);
  };

  const handleSwipe =
    (type: 'start' | 'move' | 'end') =>
    (e: React.TouchEvent<HTMLDivElement>) => {
      const width = (e.target as HTMLDivElement).offsetWidth;

      if (type === 'start') {
        touchStartX.current = e.touches[0].clientX;
      } else if (type === 'move') {
        const swipedWidth = Math.min(
          Math.abs(e.touches[0].clientX - touchStartX.current),
          width
        );

        const ratio = Math.min((swipedWidth / width) * 2, 1);

        if (e.touches[0].clientX - touchStartX.current < 0) {
          if (contentIndex < data.length - 1) {
            carouselRef.current.style.transform = `translateX(${
              -(contentIndex + ratio) * 100
            }%)`;
            touchMoveType.current = 'next';
            touchEndX.current = swipedWidth;
          }
        } else {
          if (contentIndex !== 0) {
            carouselRef.current.style.transform = `translateX(${
              -(contentIndex - ratio) * 100
            }%)`;
            touchMoveType.current = 'prev';
            touchEndX.current = swipedWidth;
          }
        }
      } else {
        if (touchEndX.current > 100) {
          if (touchMoveType.current === 'next') {
            if (contentIndex < data.length - 1) changeMedia('next')();
          } else {
            if (contentIndex !== 0) changeMedia('prev')();
          }
        } else {
          carouselRef.current.style.transform = `translateX(${
            -contentIndex * 100
          }%)`;
        }

        touchStartX.current = 0;
        touchEndX.current = 0;
        touchMoveType.current = '';
      }
    };

  return (
    <div
      className={`${styles.carousel} ${
        viewType === 'comment' ? styles['comment-carousel'] : ''
      }`}
    >
      <span
        className={`${styles['pagination-box']} ${
          hideData ? styles['hide-data'] : ''
        }`}
      >
        <span>{contentIndex + 1}</span>&nbsp;/&nbsp;<span>{data.length}</span>
      </span>
      <span className={styles['dot-cover']}>&nbsp;</span>
      <span className={styles['dot-box']} ref={dotRef}>
        {data.map((content, index) => (
          <span
            key={index}
            className={`${
              contentIndex === index ? styles['current-index'] : ''
            } ${new Date().getTime() || content}`}
          >
            .
          </span>
        ))}
      </span>
      {contentIndex !== 0 && (
        <span
          className={styles['left-arrow-box']}
          onClick={changeMedia('prev')}
        >
          <MdKeyboardArrowLeft className={styles['left-arrow']} />
        </span>
      )}
      <div
        className={styles['carousel-container']}
        ref={carouselRef}
        onTouchStart={handleSwipe('start')}
        onTouchMove={handleSwipe('move')}
        onTouchEnd={handleSwipe('end')}
      >
        {data.map(({ mediaType, src, description, _id }, index) => (
          <CarouselItem
            key={_id}
            item={{
              type: mediaType,
              src,
              description,
            }}
            viewType={viewType}
            itemIndex={index}
            contentIndex={contentIndex}
            aspectRatio={aspectRatio}
            hideData={hideData}
            setHideData={setHideData}
            contentType="carousel"
            description={''}
            viewsData={{ seenSlides, setSeenSlides }}
          />
        ))}
      </div>
      {contentIndex !== data.length - 1 && (
        <span
          className={styles['right-arrow-box']}
          onClick={changeMedia('next')}
        >
          <MdKeyboardArrowRight className={styles['right-arrow']} />
        </span>
      )}
      <div
        className={`${styles['description-container']} ${
          showMore ? styles['show-description'] : ''
        }  ${
          !data[contentIndex].description || hideData ? styles['hide-data'] : ''
        }`}
        ref={descriptionRef}
      >
        <div
          className={`${styles['media-description']} ${
            showMore ? styles['show-desc'] : ''
          } ${webkit ? styles['webkit-style'] : ''}`}
          ref={textRef}
        >
          {data[contentIndex].description}
        </div>

        {truncated && (
          <span className={styles['more-text']} onClick={handleDescription}>
            {showMore ? 'less' : 'more'}
          </span>
        )}
      </div>
    </div>
  );
};

export default Carousel;
