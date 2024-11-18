import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import styles from '../styles/Carousel.module.css';
import { useRef, useState, useEffect } from 'react';
import CarouselItem, { Content } from './CarouselItem';

type CarouselProps = {
  data: Content[];
  aspectRatio: number;
  setDescriptionWidth?: React.Dispatch<React.SetStateAction<number>>;
};

const Carousel = ({
  data,
  aspectRatio,
  setDescriptionWidth,
}: CarouselProps) => {
  const [contentIndex, setContentIndex] = useState<number>(0);
  const [hideData, setHideData] = useState<boolean>(false);
  const [descriptionHeight, setDescriptionHeight] = useState<number>(0);
  const [showMore, setShowMore] = useState<boolean>(false);
  const [webkit, setWebkit] = useState<boolean>(true);

  const carouselRef = useRef<HTMLDivElement>(null!);
  const moreRef = useRef<HTMLSpanElement>(null!);
  const descriptionRef = useRef<HTMLDivElement>(null!);
  const dotRef = useRef<HTMLSpanElement>(null!);

  useEffect(() => {
    const resizeHandler = () => {
      if (setDescriptionWidth)
        setDescriptionWidth(carouselRef.current.offsetWidth);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  useEffect(() => {
    setDescriptionHeight(descriptionRef.current.scrollHeight);
    setShowMore(false);
  }, [contentIndex]);

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

      // alert(contentIndex);
      if (contentIndex < 9) dotRef.current.scrollLeft -= 10;
    }

    setHideData(false);
  };

  const handleDescription = () => {
    let animation;

    setWebkit(false);
    if (showMore) {
      animation = descriptionRef.current.animate(
        {
          maxHeight: [`${descriptionRef.current.scrollHeight}px`, '50px'],
        },
        {
          fill: 'both',
          duration: 300,
        }
      );
    } else {
      animation = descriptionRef.current.animate(
        {
          maxHeight: ['50px', `${descriptionRef.current.scrollHeight}px`],
        },
        {
          fill: 'both',
          duration: 300,
        }
      );
    }

    setShowMore(!showMore);
    animation.onfinish = () => {
      setWebkit(true);
    };
  };

  return (
    <div className={styles.carousel}>
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

      <div className={styles['carousel-container']} ref={carouselRef}>
        {data.map(({ type, src, description }, index) => (
          <CarouselItem
            key={index}
            item={{
              type,
              src,
              description,
            }}
            itemIndex={index}
            contentIndex={contentIndex}
            aspectRatio={aspectRatio}
            hideData={hideData}
            setHideData={setHideData}
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
        className={`${styles['media-description-container']} ${
          showMore ? styles['show-description'] : ''
        } ${
          !data[contentIndex].description || hideData ? styles['hide-data'] : ''
        }`}
        ref={descriptionRef}
      >
        <span
          className={`${styles['media-description']} ${
            showMore ? styles['show-desc'] : ''
          }  ${webkit ? styles['webkit-style'] : ''}`}
        >
          {data[contentIndex].description}
        </span>

        {descriptionHeight > 50 && (
          <span
            className={`${styles['more-text']}`}
            ref={moreRef}
            onClick={handleDescription}
          >
            {showMore ? 'less' : 'more'}
          </span>
        )}
      </div>
    </div>
  );
};

export default Carousel;
