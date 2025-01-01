import styles from '../styles/Notifications.module.css';
import { CiHeart } from 'react-icons/ci';
import { BsReply } from 'react-icons/bs';
import { useState } from 'react';
import { IoMdHeart } from 'react-icons/io';
import useArrayRef from '../hooks/useArrayRef';

type NotificationBoxProps = {
  selectCount: number;
  checkBoxRef: React.MutableRefObject<HTMLInputElement[]>;
  setSelectCount: React.Dispatch<React.SetStateAction<number>>;
};

const NotificationBox = ({
  setSelectCount,
  checkBoxRef,
  selectCount,
}: NotificationBoxProps) => {
  const [like, setLike] = useState(false);
  const inputRef = useArrayRef(checkBoxRef);

  return (
    <article className={styles['notification-box']}>
      <img
        className={styles['notification-img']}
        src="../../assets/images/users/user12.jpeg"
      />

      <div className={styles['notification-details']}>
        <span className={styles['notification-message']}>
          <span className={styles['notification-name']}>Lyanna stark</span>{' '}
          replied to your comment<b>: </b>
          <span className={styles['notification-comment']}>
            omo d tin make sense die 😭😭
          </span>
        </span>
        <span className={styles['notification-btn-box']}>
          <button className={styles['notification-btn']}>
            <BsReply className={styles['notification-btn-icon']} />
            Reply
          </button>
          <button
            className={styles['notification-btn']}
            onClick={() => setLike(!like)}
          >
            {like ? (
              <IoMdHeart className={styles['like-icon']} />
            ) : (
              <CiHeart className={styles['notification-btn-icon']} />
            )}
            Like
          </button>
        </span>
        <time className={styles['notification-time']}>11:02 AM</time>
      </div>

      <div className={styles['content-box']}>
        <video className={styles['notification-content']}>
          <source
            src={`../../assets/images/content/content24.mp4`}
            type="video/mp4"
          />
          Your browser does not support playing video.
        </video>
      </div>

      <input
        type="checkbox"
        className={`${styles['notification-checkbox']} ${
          selectCount > 0 ? styles['show-checkbox'] : ''
        }`}
        ref={inputRef}
        onChange={(e) => {
          setSelectCount((prev) => (e.target.checked ? prev + 1 : prev - 1));
        }}
      />
    </article>
  );
};
export default NotificationBox;
