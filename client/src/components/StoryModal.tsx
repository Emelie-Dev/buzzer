import styles from '../styles/StoryModal.module.css';
import { IoClose } from 'react-icons/io5';
import { BsDot } from 'react-icons/bs';
import { FaPause } from 'react-icons/fa6';
import { BiSolidVolumeMute } from 'react-icons/bi';
import { HiDotsHorizontal } from 'react-icons/hi';
import { FaRegHeart } from 'react-icons/fa';
import { AiOutlineSend } from 'react-icons/ai';

type StoryModalProps = {
  setViewStory: React.Dispatch<React.SetStateAction<boolean>>;
};

const StoryModal = ({ setViewStory }: StoryModalProps) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setViewStory(false);
  };

  return (
    <section className={styles.section} onClick={handleClick}>
      <span
        className={styles['close-icon-box']}
        title="Close"
        onClick={() => setViewStory(false)}
      >
        <IoClose className={styles['close-icon']} />
      </span>

      <div className={styles['story-container']}>
        <article className={styles['current-story']}>
          <div className={styles['line-container']}>
            <span className={styles['line-box']}>
              <span className={styles['line-item']}>&nbsp;</span>
            </span>

            <span className={styles['line-box']}>
              <span className={styles['line-item']}>&nbsp;</span>
            </span>

            <span className={styles['line-box']}>
              <span className={styles['line-item']}>&nbsp;</span>
            </span>
          </div>

          <div className={styles['details-box']}>
            <div className={styles['story-details']}>
              <span className={styles['name-box']}>
                <img
                  className={styles['user-pic']}
                  src="../../assets/images/users/user12.jpeg"
                />
                <span className={styles['user-name']}>lyanna_Stark</span>
              </span>
              <BsDot className={styles.dot} />
              <time className={styles['time-sent']}>2h</time>
            </div>

            <div className={styles['menu-details']}>
              <FaPause className={styles['pause-icon']} />
              <BiSolidVolumeMute className={styles['mute-icon']} />
              <HiDotsHorizontal className={styles['menu-icon']} />
            </div>
          </div>

          <div className={styles['content-div']}>
            {/* <video className={styles.content} autoPlay>
              <source
                src="../../public/assets/images/content/content21.mp4"
                type="video/mp4"
              />
              Your browser does not support playing video.
            </video> */}

            <img
              className={styles.content}
              src="../../public/assets/images/content/content22.jpeg"
            />
          </div>

          <div className={styles['reply-div']}>
            <input
              className={styles['reply-input']}
              type="text"
              placeholder="Reply to lyanna...."
            />

            <FaRegHeart className={styles['like-icon']} />
            <AiOutlineSend className={styles['send-icon']} />
          </div>
        </article>
      </div>
    </section>
  );
};

export default StoryModal;
