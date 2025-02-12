import styles from '../styles/Profile.module.css';
import NavBar from '../components/NavBar';
import { RiGitRepositoryPrivateLine } from 'react-icons/ri';
import { HiOutlineBookmark } from 'react-icons/hi';
import { FiHeart } from 'react-icons/fi';
import { MdOutlineGridOn } from 'react-icons/md';
import { useRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa6';
import { FaHeart, FaCommentDots } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { QRCodeCanvas } from 'qrcode.react';
import { FaCopy } from 'react-icons/fa6';
import { Arrow } from '../pages/Home';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import Engagements from '../components/Engagements';

const Profile = () => {
  const [category, setcategory] = useState<
    'contents' | 'reels' | 'private' | 'saved' | 'liked'
  >('contents');
  const [shareModal, setShareModal] = useState<boolean>(false);
  const [profileLink] = useState<string>(
    'http://www.buzzer.com/josephlouis_100/profile'
  );
  const [showArrow, setShowArrow] = useState<Arrow>({
    left: false,
    right: true,
  });
  const [engagementModal, setEngagementModal] = useState<
    'followers' | 'following' | 'friends' | 'suggested' | null
  >(null);

  const optionsRef = useRef<HTMLDivElement>(null!);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    setShowArrow({
      left: target.scrollLeft > 30,
      right: !(
        target.scrollLeft + target.clientWidth >=
        target.scrollWidth - 5
      ),
    });
  };

  return (
    <>
      <NavBar page="profile" />

      <section className={styles.main}>
        <section className={styles['top-section']}>
          <figure className={styles['img-box']}>
            <img
              className={styles.img}
              src="../../assets/images/users/user14.jpeg"
            />
            <figcaption className={styles['user-name']}>
              The Godfather👑👑
            </figcaption>
          </figure>

          <div className={styles['profile-details']}>
            <span className={styles['user-handle']}>josephlouis_100</span>

            <div className={styles['btn-div']}>
              <button className={styles['edit-btn']}>Edit Profile</button>
              <button
                className={styles['share-btn']}
                onClick={() => setShareModal(true)}
              >
                Share Profile
              </button>
            </div>

            <div className={styles['profile-data']}>
              <span
                className={`${styles['data-box']} ${styles['data-box2']}`}
                onClick={() => setEngagementModal('followers')}
              >
                <span className={styles['data-value']}>2000</span>
                <span className={styles['data-field']}>Followers</span>
              </span>

              <span
                className={`${styles['data-box']} ${styles['data-box2']}`}
                onClick={() => setEngagementModal('following')}
              >
                <span className={styles['data-value']}>105</span>
                <span className={styles['data-field']}>Following</span>
              </span>

              <span
                className={`${styles['data-box']} ${styles['data-box2']}`}
                onClick={() => setEngagementModal('friends')}
              >
                <span className={styles['data-value']}>15</span>
                <span className={styles['data-field']}>Friends</span>
              </span>

              <span className={styles['data-box']}>
                <span className={styles['data-value']}>98</span>
                <span className={styles['data-field']}>Posts</span>
              </span>

              <span className={styles['data-box']}>
                <span className={styles['data-value']}>15k</span>
                <span className={styles['data-field']}>Likes</span>
              </span>
            </div>

            <div className={styles.description}>
              Young Full stack developer 💻💻.
            </div>

            <div className={styles.links}>
              <span className={styles.link}>
                api.whatsapp.com/send?phone=6283129725143
              </span>
            </div>
          </div>
        </section>

        <section className={styles['bottom-section']}>
          <header className={styles['bottom-header']}>
            <ul className={styles['category-list']}>
              <li
                className={`${styles['category-item']} ${
                  category === 'contents' ? styles['current-category'] : ''
                }`}
                onClick={() => setcategory('contents')}
              >
                <MdOutlineGridOn className={styles['category-icon']} />
                Contents
              </li>
              <li
                className={`${styles['category-item']} ${
                  category === 'reels' ? styles['current-category'] : ''
                }`}
                onClick={() => setcategory('reels')}
              >
                <svg
                  className={styles['category-icon']}
                  version="1.1"
                  viewBox="0 0 100 100"
                >
                  <defs></defs>
                  <g
                    style={{
                      stroke: 'none',
                      strokeWidth: 0,
                      strokeDasharray: 'none',
                      strokeLinecap: 'butt',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                      fill: 'none',
                      fillRule: 'nonzero',
                      opacity: 1,
                      transform:
                        'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                    }}
                  >
                    <linearGradient
                      id="SVGID_44"
                      gradientUnits="userSpaceOnUse"
                      x1="20.9489"
                      y1="70.2584"
                      x2="72.2486"
                      y2="16.3831"
                    >
                      <stop offset="0%" />
                      <stop offset="50%" />
                      <stop offset="100%" />
                    </linearGradient>
                    <path
                      d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                      style={{
                        stroke: 'none',
                        strokeWidth: 1,
                        strokeDasharray: 'none',
                        strokeLinecap: 'butt',
                        strokeLinejoin: 'miter',
                        strokeMiterlimit: 10,
                        fillRule: 'nonzero',
                        opacity: 1,
                        transform: ' matrix(1 0 0 1 0 0) ',
                      }}
                      className={`${styles.path} ${
                        category === 'reels' ? styles['current-path'] : ''
                      }`}
                      strokeLinecap="round"
                    />
                    <linearGradient
                      id="SVGID_45"
                      gradientUnits="userSpaceOnUse"
                      x1="24.1901"
                      y1="73.3447"
                      x2="75.4898"
                      y2="19.4693"
                    >
                      <stop offset="0%" />
                      <stop offset="50%" />
                      <stop offset="100%" />
                    </linearGradient>
                    <path
                      d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                      style={{
                        stroke: 'none',
                        strokeWidth: 1,
                        strokeDasharray: 'none',
                        strokeLinecap: 'butt',
                        strokeLinejoin: 'miter',
                        strokeMiterlimit: 10,
                        fillRule: 'nonzero',
                        opacity: 1,
                        transform: ' matrix(1 0 0 1 0 0) ',
                      }}
                      className={`${styles.path} ${
                        category === 'reels' ? styles['current-path'] : ''
                      }`}
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
                Reels
              </li>

              <li
                className={`${styles['category-item']} ${
                  category === 'private' ? styles['current-category'] : ''
                }`}
                onClick={() => setcategory('private')}
              >
                <RiGitRepositoryPrivateLine
                  className={styles['category-icon']}
                />
                Private
              </li>

              <li
                className={`${styles['category-item']} ${
                  category === 'saved' ? styles['current-category'] : ''
                }`}
                onClick={() => setcategory('saved')}
              >
                <HiOutlineBookmark className={styles['category-icon']} />
                Saved
              </li>

              <li
                className={`${styles['category-item']} ${
                  category === 'liked' ? styles['current-category'] : ''
                }`}
                onClick={() => setcategory('liked')}
              >
                <FiHeart className={styles['category-icon']} />
                Liked
              </li>
            </ul>

            <div className={styles['sort-div']}>
              <span className={styles['sort-div-txt']}>Sort by:</span>

              <select className={styles['sort-select']}>
                <option>Latest</option>
                <option>Oldest</option>
                <option>Popular</option>
              </select>
            </div>
          </header>

          <div className={styles['contents-container']}>
            <article className={styles.content}>
              <svg
                className={styles['reel-icon']}
                version="1.1"
                viewBox="0 0 100 100"
              >
                <defs></defs>
                <g
                  style={{
                    stroke: 'none',
                    strokeWidth: 0,
                    strokeDasharray: 'none',
                    strokeLinecap: 'butt',
                    strokeLinejoin: 'miter',
                    strokeMiterlimit: 10,
                    fill: 'none',
                    fillRule: 'nonzero',
                    opacity: 1,
                    transform:
                      'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                  }}
                >
                  <linearGradient
                    id="SVGID_44"
                    gradientUnits="userSpaceOnUse"
                    x1="20.9489"
                    y1="70.2584"
                    x2="72.2486"
                    y2="16.3831"
                  >
                    <stop offset="0%" />
                    <stop offset="50%" />
                    <stop offset="100%" />
                  </linearGradient>
                  <path
                    d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                    style={{
                      stroke: 'none',
                      strokeWidth: 1,
                      strokeDasharray: 'none',
                      strokeLinecap: 'butt',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                      fill: `white`,
                      fillRule: 'nonzero',
                      opacity: 1,
                      transform: ' matrix(1 0 0 1 0 0) ',
                    }}
                    strokeLinecap="round"
                  />
                  <linearGradient
                    id="SVGID_45"
                    gradientUnits="userSpaceOnUse"
                    x1="24.1901"
                    y1="73.3447"
                    x2="75.4898"
                    y2="19.4693"
                  >
                    <stop offset="0%" />
                    <stop offset="50%" />
                    <stop offset="100%" />
                  </linearGradient>
                  <path
                    d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                    style={{
                      stroke: 'none',
                      strokeWidth: 1,
                      strokeDasharray: 'none',
                      strokeLinecap: 'butt',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                      fill: `white`,
                      fillRule: 'nonzero',
                      opacity: 1,
                      transform: ' matrix(1 0 0 1 0 0) ',
                    }}
                    strokeLinecap="round"
                  />
                </g>
              </svg>

              <video className={styles.media}>
                <source src="../../assets/images/content/content24.mp4" />
                Your browser does not support playing video.
              </video>

              <div className={styles['content-details']}>
                <span className={styles['content-data']}>2h</span>

                <span className={styles['content-data']}>
                  <FaPlay className={styles['views-icon']} /> 250
                </span>
              </div>

              <div className={styles['engagement-div']}>
                <span className={styles['engagement-box']}>
                  <FaHeart className={styles['engagement-icon']} /> 53
                </span>
                <span className={styles['engagement-box']}>
                  <FaCommentDots className={styles['engagement-icon']} /> 12
                </span>
              </div>
            </article>

            <article className={styles.content}>
              <img
                className={styles.media}
                src="../../assets/images/content/content10.jpeg"
              />

              <div className={styles['content-details']}>
                <span className={styles['content-data']}>01-23</span>

                <span className={styles['content-data']}>
                  <FaPlay className={styles['views-icon']} /> 50K
                </span>
              </div>

              <div className={styles['engagement-div']}>
                <span className={styles['engagement-box']}>
                  <FaHeart className={styles['engagement-icon']} /> 12K
                </span>
                <span className={styles['engagement-box']}>
                  <FaCommentDots className={styles['engagement-icon']} /> 9025
                </span>
              </div>
            </article>

            <article className={styles.content}>
              <svg
                className={styles['reel-icon']}
                version="1.1"
                viewBox="0 0 100 100"
              >
                <defs></defs>
                <g
                  style={{
                    stroke: 'none',
                    strokeWidth: 0,
                    strokeDasharray: 'none',
                    strokeLinecap: 'butt',
                    strokeLinejoin: 'miter',
                    strokeMiterlimit: 10,
                    fill: 'none',
                    fillRule: 'nonzero',
                    opacity: 1,
                    transform:
                      'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                  }}
                >
                  <linearGradient
                    id="SVGID_44"
                    gradientUnits="userSpaceOnUse"
                    x1="20.9489"
                    y1="70.2584"
                    x2="72.2486"
                    y2="16.3831"
                  >
                    <stop offset="0%" />
                    <stop offset="50%" />
                    <stop offset="100%" />
                  </linearGradient>
                  <path
                    d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                    style={{
                      stroke: 'none',
                      strokeWidth: 1,
                      strokeDasharray: 'none',
                      strokeLinecap: 'butt',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                      fill: `white`,
                      fillRule: 'nonzero',
                      opacity: 1,
                      transform: ' matrix(1 0 0 1 0 0) ',
                    }}
                    strokeLinecap="round"
                  />
                  <linearGradient
                    id="SVGID_45"
                    gradientUnits="userSpaceOnUse"
                    x1="24.1901"
                    y1="73.3447"
                    x2="75.4898"
                    y2="19.4693"
                  >
                    <stop offset="0%" />
                    <stop offset="50%" />
                    <stop offset="100%" />
                  </linearGradient>
                  <path
                    d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                    style={{
                      stroke: 'none',
                      strokeWidth: 1,
                      strokeDasharray: 'none',
                      strokeLinecap: 'butt',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                      fill: `white`,
                      fillRule: 'nonzero',
                      opacity: 1,
                      transform: ' matrix(1 0 0 1 0 0) ',
                    }}
                    strokeLinecap="round"
                  />
                </g>
              </svg>

              <video className={styles.media}>
                <source src="../../assets/images/content/content25.mp4" />
                Your browser does not support playing video.
              </video>

              <div className={styles['content-details']}>
                <span className={styles['content-data']}>23-12-24</span>

                <span className={styles['content-data']}>
                  <FaPlay className={styles['views-icon']} /> 103K
                </span>
              </div>

              <div className={styles['engagement-div']}>
                <span className={styles['engagement-box']}>
                  <FaHeart className={styles['engagement-icon']} /> 46.4K
                </span>
                <span className={styles['engagement-box']}>
                  <FaCommentDots className={styles['engagement-icon']} /> 10.1K
                </span>
              </div>
            </article>
          </div>
        </section>
      </section>

      {shareModal && (
        <section
          className={styles['edit-section']}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShareModal(false);
          }}
        >
          <div className={styles['edit-container']}>
            <span className={styles['edit-head']}>
              Share Profile
              <span
                className={styles['close-icon-box']}
                onClick={() => setShareModal(false)}
              >
                <IoClose className={styles['close-icon']} title="Close" />
              </span>
            </span>

            <div className={styles['qrcode-box']}>
              <QRCodeCanvas
                value={profileLink}
                size={200}
                level="Q"
                title="Profile Link"
              />
            </div>

            <span className={styles['link-box']}>
              <input
                className={styles['link-value']}
                value={profileLink}
                readOnly
              />
              <FaCopy className={styles['copy-icon']} title="copy" />
            </span>

            <div
              className={styles['options-container']}
              ref={optionsRef}
              onScroll={handleScroll}
            >
              <span
                className={`${styles['left-arrow-box']} ${
                  !showArrow.left ? styles['hide-icon'] : ''
                }`}
                onClick={() => (optionsRef.current.scrollLeft -= 300)}
              >
                <MdKeyboardArrowLeft className={styles['left-arrow']} />
              </span>

              <div className={styles['share-option']}>
                <img
                  className={styles['option-img']}
                  src="../../assets/images/media/1_Whatsapp2_colored_svg-128.webp"
                />
                <span className={styles['share-icon-text']}>Whatsapp</span>
              </div>

              <div className={styles['share-option']}>
                <img
                  className={styles['option-img']}
                  src="../../assets/images/media/x-logo-twitter-new-brand-contained-128.webp"
                />
                <span className={styles['share-icon-text']}>X</span>
              </div>

              <div className={styles['share-option']}>
                <img
                  className={styles['option-img']}
                  src="../../assets/images/media/1_Instagram_colored_svg_1-128.webp"
                />
                <span className={styles['share-icon-text']}>Instagram</span>
              </div>

              <div className={styles['share-option']}>
                <img
                  className={styles['option-img']}
                  src="../../assets/images/media/Colored_Facebook3_svg-128.webp"
                />
                <span className={styles['share-icon-text']}>Facebook</span>
              </div>

              <div className={styles['share-option']}>
                <img
                  className={styles['option-img']}
                  src="../../assets/images/media/telegram-64.webp"
                />
                <span className={styles['share-icon-text']}>Telegram</span>
              </div>

              <div className={styles['share-option']}>
                <img
                  className={styles['option-img']}
                  src="../../assets/images/media/112-gmail_email_mail-64.webp"
                />
                <span className={styles['share-icon-text']}>Email</span>
              </div>

              <div className={styles['share-option']}>
                <img
                  className={styles['option-img']}
                  src="../../assets/images/media/social-facebook-messenger-square2-64.webp"
                />
                <span className={styles['share-icon-text']}>Messenger</span>
              </div>

              <div
                className={`${styles['share-option']} ${styles['last-option']}`}
              >
                <img
                  className={styles['option-img']}
                  src="../../assets/images/media/1_Snapchat_colored_svg-64.webp"
                />
                <span className={styles['share-icon-text']}>Snapchat</span>
              </div>

              <span
                className={`${styles['right-arrow-box']} ${
                  !showArrow.right ? styles['hide-icon'] : ''
                }`}
                onClick={() => (optionsRef.current.scrollLeft += 300)}
              >
                <MdKeyboardArrowRight className={styles['right-arrow']} />
              </span>
            </div>
          </div>
        </section>
      )}

      {engagementModal && (
        <Engagements value={engagementModal} setValue={setEngagementModal} />
      )}
    </>
  );
};
export default Profile;
