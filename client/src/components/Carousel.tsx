import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { GoUnmute, GoMute } from 'react-icons/go';
import styles from '../styles/Carousel.module.css';
import { useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';
import { BiSolidErrorAlt } from 'react-icons/bi';

export interface Content {
  type: 'image' | 'video';
  src: string;
  description?: string;
  currentTime?: number;
}

type CarouselProps = {
  data: Content[];
};

const Carousel = ({ data }: CarouselProps) => {
  const [showMore, setShowMore] = useState<boolean>(false);
  const [contentIndex, setContentIndex] = useState<number>(0);
  const [descriptionHeight, setDescriptionHeight] = useState<number>(0);
  const [hideData, setHideData] = useState<boolean>(false);
  const [mute, setMute] = useState<boolean>(false);
  const [pause, setPause] = useState<boolean>(false);
  const [hidePause, setHidePause] = useState<boolean>(true);
  const [carouselData, setCarouselData] = useState<Content[]>(
    data.map((value) => value)
  );
  const [loading, setLoading] = useState<
    boolean | 'error' | 'empty' | 'notfound'
  >(true);

  const descriptionRef = useRef<HTMLSpanElement>(null!);
  const moreRef = useRef<HTMLSpanElement>(null!);
  const videoRef = useRef<HTMLVideoElement>(null!);

  useEffect(() => {
    setDescriptionHeight(descriptionRef.current.scrollHeight);

    if (data[contentIndex].type === 'video') {
      videoRef.current.currentTime =
        carouselData[contentIndex].currentTime || 0;
    }
  }, [contentIndex]);

  const handleDescription = () => {
    if (showMore) {
      descriptionRef.current.animate(
        {
          maxHeight: [`${descriptionRef.current.scrollHeight}px`, '50px'],
        },
        {
          fill: 'both',
          duration: 200,
        }
      );

      moreRef.current.animate(
        {
          height: [`${descriptionRef.current.scrollHeight}px`, '50px'],
        },
        {
          fill: 'both',
          duration: 200,
        }
      );
    } else {
      descriptionRef.current.animate(
        {
          maxHeight: ['50px', `${descriptionRef.current.scrollHeight}px`],
        },
        {
          fill: 'both',
          duration: 200,
        }
      );

      moreRef.current.animate(
        {
          height: ['50px', `${descriptionRef.current.scrollHeight}px`],
        },
        {
          fill: 'both',
          duration: 200,
        }
      );
    }
    setShowMore(!showMore);
  };

  const handleImageClick = () => {
    if (loading === false) setHideData(!hideData);
  };

  const handleClick = () => {
    if (loading === false) {
      if (hideData) {
        setHidePause(false);
        if (videoRef.current.paused) {
          videoRef.current.play();
          setHideData(!hideData);
          setPause(false);
        } else {
          videoRef.current.pause();
          setPause(true);
        }

        setTimeout(() => {
          setHidePause(true);
        }, 300);
      } else {
        setHideData(!hideData);
      }
    }
  };

  const changeMedia = (type: 'prev' | 'next') => () => {
    const media = data[contentIndex].type;

    if (media === 'video') {
      const newData = [...carouselData];
      newData[contentIndex].currentTime = videoRef.current.currentTime;
      setCarouselData(newData);
    }

    if (type === 'next') {
      setContentIndex((prev) => prev + 1);
    } else {
      setContentIndex((prev) => prev - 1);
    }

    setShowMore(false);
    setHideData(false);
    setMute(false);
    setPause(false);
    setLoading(true);
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

      <span className={styles['dot-box']}>
        {data.length <= 10
          ? data.map((content, index) => (
              <span
                key={index}
                className={`${
                  contentIndex === index ? styles['current-index'] : ''
                } ${content.currentTime}`}
              >
                .
              </span>
            ))
          : new Array(10).fill(true).map((content, index) => (
              <span
                key={index}
                className={`${
                  contentIndex % 10 === index ? styles['current-index'] : ''
                } ${
                  contentIndex > 9 && index > data.length - 11
                    ? styles['hide-data']
                    : ''
                } ${content.currentTime}`}
              >
                .
              </span>
            ))}
      </span>

      {loading === true && <div className={styles.loader}></div>}

      <div className={styles['loading-error-box']}>
        {loading === 'error' ? (
          <span className={styles['error-box']}>
            <BiSolidErrorAlt className={styles['error-icon']} />
            An error occured while loading media.
          </span>
        ) : loading === 'empty' ? (
          <span className={styles['error-box']}>
            <BiSolidErrorAlt className={styles['error-icon']} />
            Unable to load media.
          </span>
        ) : loading === 'notfound' ? (
          <span className={styles['error-box']}>
            <BiSolidErrorAlt className={styles['error-icon']} />
            This media no longer exists.
          </span>
        ) : (
          ''
        )}
      </div>

      {contentIndex !== 0 && (
        <span
          className={styles['left-arrow-box']}
          onClick={changeMedia('prev')}
        >
          <MdKeyboardArrowLeft className={styles['left-arrow']} />
        </span>
      )}

      {data[contentIndex].type === 'image' ? (
        <img
          src={`../../assets/images/content/${data[contentIndex].src}.jpeg`}
          className={styles['media']}
          onLoad={() => setLoading(false)}
          onClick={handleImageClick}
          onError={() => setLoading('error')}
          onAbort={() => setLoading('error')}
        />
      ) : (
        <>
          <video
            className={styles['media']}
            ref={videoRef}
            onClick={handleClick}
            autoPlay
            muted={mute}
            loop={true}
            onCanPlay={() => setLoading(false)}
            onError={() => setLoading('error')}
            onAbort={() => setLoading('error')}
            onEmptied={() => setLoading('notfound')}
            onStalled={() => setLoading('empty')}
          >
            <source
              src={`../../assets/images/content/${data[contentIndex].src}.mp4`}
              type="video/mp4"
            />
            Your browser does not support playing video.
          </video>

          {pause ? (
            <span
              className={`${styles['pause-icon-box']} ${
                hidePause ? styles['hide-data'] : ''
              }`}
              onClick={handleClick}
            >
              <FaPause className={styles['pause-icon']} />
            </span>
          ) : (
            <span
              className={`${styles['pause-icon-box']} ${
                hidePause ? styles['hide-data'] : ''
              }`}
              onClick={handleClick}
            >
              <FaPlay className={styles['pause-icon']} />
            </span>
          )}
        </>
      )}

      {contentIndex !== data.length - 1 && (
        <span
          className={styles['right-arrow-box']}
          onClick={changeMedia('next')}
        >
          <MdKeyboardArrowRight className={styles['right-arrow']} />
        </span>
      )}

      <span
        className={`${styles['media-description']} ${
          showMore ? styles['show-description'] : ''
        }  ${hideData ? styles['hide-data'] : ''}`}
        ref={descriptionRef}
      >
        {data[contentIndex].description}
      </span>

      {descriptionHeight > 50 && (
        <span
          className={`${styles['more-description']} ${
            showMore ? styles['show-description'] : ''
          } ${hideData ? styles['hide-data'] : ''}`}
          ref={moreRef}
          onClick={handleDescription}
        >
          {showMore ? 'less' : 'more'}
        </span>
      )}

      {data[contentIndex].type === 'video' && (
        <span
          className={styles['mute-icon-box']}
          onClick={() => setMute(!mute)}
        >
          {mute ? (
            <GoMute className={styles['mute-icon']} />
          ) : (
            <GoUnmute className={styles['mute-icon']} />
          )}
        </span>
      )}
    </div>
  );
};

export default Carousel;
