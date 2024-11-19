import styles from '../styles/CommentContent.module.css';
import { FiHeart } from 'react-icons/fi';
import { IoIosArrowDown } from 'react-icons/io';
import { MdDelete } from 'react-icons/md';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { useRef, useState } from 'react';

const CommentContent = () => {
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const subCommentRef = useRef<HTMLDivElement>(null!);

  return (
    <article
      className={styles['comment-box']}
      onMouseOver={(e) => {
        if (!subCommentRef.current.contains(e.target as Node))
          setShowMenu(true);
      }}
      onMouseOut={() => setShowMenu(false)}
    >
      <span className={styles['comment-img-box']}>
        <img
          className={styles['comment-img']}
          src={`../../assets/images/users/user10.jpeg`}
        />
      </span>

      <div className={styles['comment-details']}>
        <span className={styles['comment-owner']}>Jon_snow</span>

        <div className={styles['comment-content']}>
          <div className={styles.comment}>man is so boring</div>
          <span className={styles['comment-options']}>
            <time className={styles['comment-time']}>34m</time>

            <span className={styles['reply-text']}>Reply</span>
          </span>
        </div>

        <div className={styles['sub-comments-container']} ref={subCommentRef}>
          <article className={styles['sub-comment-box']}>
            <span className={styles['comment-img-box']}>
              <img
                className={styles['sub-comment-img']}
                src={`../../assets/images/users/user10.jpeg`}
              />
            </span>

            <div className={styles['sub-comment-details']}>
              <span className={styles['comment-owner']}>Jon_snow</span>

              <div className={styles['comment-content']}>
                <div className={styles.comment}>man is so boring</div>
                <span className={styles['comment-options']}>
                  <time className={styles['comment-time']}>34m</time>

                  <span className={styles['reply-text']}>Reply</span>
                </span>
              </div>
            </div>

            <div className={styles['sub-comment-likes-box']}>
              <div className={styles['sub-comment-menu-box']}>
                <HiOutlineDotsHorizontal
                  className={styles['sub-comment-menu-icon']}
                />

                <span className={styles['sub-comment-menu-item']}>
                  <MdDelete className={styles['sub-delete-comment-icon']} />
                  Delete
                </span>
              </div>

              <FiHeart className={styles['comment-likes-icon']} />

              <span className={styles['comment-likes']}>100</span>
            </div>
          </article>

          <article className={styles['sub-comment-box']}>
            <span className={styles['comment-img-box']}>
              <img
                className={styles['sub-comment-img']}
                src={`../../assets/images/users/user10.jpeg`}
              />
            </span>

            <div className={styles['sub-comment-details']}>
              <span className={styles['comment-owner']}>Jon_snow</span>

              <div className={styles['comment-content']}>
                <div className={styles.comment}>man is so boring</div>
                <span className={styles['comment-options']}>
                  <time className={styles['comment-time']}>34m</time>

                  <span className={styles['reply-text']}>Reply</span>
                </span>
              </div>
            </div>

            <div className={styles['sub-comment-likes-box']}>
              <div className={styles['sub-comment-menu-box']}>
                <HiOutlineDotsHorizontal
                  className={styles['sub-comment-menu-icon']}
                />

                <span className={styles['sub-comment-menu-item']}>
                  <MdDelete className={styles['sub-delete-comment-icon']} />
                  Delete
                </span>
              </div>

              <FiHeart className={styles['comment-likes-icon']} />

              <span className={styles['comment-likes']}>100</span>
            </div>
          </article>
        </div>

        <span className={styles['other-replies-text']}>
          View 17 more
          <IoIosArrowDown className={styles['down-arrow-icon']} />
        </span>
      </div>

      <div className={styles['comment-likes-box']}>
        <div
          className={`${styles['comment-menu-box']} ${
            showMenu ? styles['show-menu'] : ''
          }`}
        >
          <HiOutlineDotsHorizontal className={styles['comment-menu-icon']} />

          <span className={styles['comment-menu-item']}>
            <MdDelete className={styles['delete-comment-icon']} />
            Delete
          </span>
        </div>

        <FiHeart className={styles['comment-likes-icon']} />

        <span className={styles['comment-likes']}>100</span>
      </div>
    </article>
  );
};

export default CommentContent;
