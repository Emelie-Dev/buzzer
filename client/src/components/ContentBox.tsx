import { BsDot } from 'react-icons/bs';
import { HiOutlineDotsHorizontal, HiPlus } from 'react-icons/hi';
import Carousel, { Content } from '../components/Carousel';
import { FaHeart, FaCommentDots, FaShare } from 'react-icons/fa';
import { IoBookmark } from 'react-icons/io5';
import styles from '../styles/ContentBox.module.css';
import { useEffect, useRef, useState } from 'react';

type ContentBoxProps = {
  data: {
    media: Content[];
    description?: string;
    username: string;
    name?: string;
    time: string;
    photo: string;
  };
};

const ContentBox = ({ data }: ContentBoxProps) => {
  const { media, description, username, name, time, photo } = data;

  const [showMore, setShowMore] = useState<boolean>(false);

  const descriptionRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.innerHTML = description!;
  }, []);

  const handleDescription = () => {
    descriptionRef.current.animate(
      {
        maxHeight: ['50px', `${descriptionRef.current.scrollHeight}px`],
      },
      {
        fill: 'both',
        duration: 200,
      }
    );

    setShowMore(true);
  };

  return (
    <article className={styles.content}>
      <h1 className={styles['content-head']}>
        <span className={styles['content-head-box']}>
          <span className={styles['content-name-box']}>
            <span className={styles['content-nickname']}>{name}</span>
            <span className={styles['content-username']}>{username}</span>
          </span>
          <BsDot className={styles.dot} />
          <span className={styles['content-time']}>{time}</span>
        </span>

        <HiOutlineDotsHorizontal className={styles['content-menu']} />
      </h1>
      <div className={styles['content-box']}>
        <Carousel data={media} />

        <div className={styles['menu-container']}>
          <div className={styles['profile-img-box']}>
            <img
              src={`../../assets/images/users/${photo}`}
              className={styles['profile-img']}
            />

            <span className={styles['profile-icon-box']} title="Follow">
              <HiPlus className={styles['profile-icon']} />
            </span>
          </div>

          <div className={styles['menu-box']}>
            <span className={styles['menu-icon-box']} title="Like">
              <FaHeart className={styles['menu-icon']} />
            </span>
            <span className={styles['menu-text']}>21K</span>
          </div>

          <div className={styles['menu-box']}>
            <span className={styles['menu-icon-box']} title="Comment">
              <FaCommentDots className={styles['menu-icon']} />
            </span>
            <span className={styles['menu-text']}>2345</span>
          </div>

          <div className={styles['menu-box']}>
            <span className={styles['menu-icon-box']} title="Save">
              <IoBookmark className={styles['menu-icon']} />
            </span>
            <span className={styles['menu-text']}>954</span>
          </div>

          <div className={styles['menu-box']}>
            <span className={styles['menu-icon-box']} title="Share">
              <FaShare className={styles['menu-icon']} />
            </span>
            <span className={styles['menu-text']}>217</span>
          </div>
        </div>
      </div>

      {description && (
        <>
          <div
            className={`${styles['content-description']}  ${
              !showMore ? styles['content-description2'] : ''
            } ${showMore ? styles['show-more'] : ''}`}
            ref={descriptionRef}
          ></div>

          {!showMore && (
            <div className={styles['more-text']} onClick={handleDescription}>
              show more
            </div>
          )}
        </>
      )}
    </article>
  );
};

export default ContentBox;
