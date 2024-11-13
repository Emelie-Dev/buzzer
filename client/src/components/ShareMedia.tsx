import styles from '../styles/ShareMedia.module.css';
import { IoClose, IoSearchSharp } from 'react-icons/io5';
import { PiLinkBold } from 'react-icons/pi';
import { SiWhatsapp } from 'react-icons/si';
import { RiTwitterXFill } from 'react-icons/ri';
import { FaInstagram } from 'react-icons/fa';
import { LuFacebook } from 'react-icons/lu';
import { PiTelegramLogoFill } from 'react-icons/pi';
import { HiOutlineMail } from 'react-icons/hi';
import { RiMessengerLine } from 'react-icons/ri';
import { PiSnapchatLogoBold } from 'react-icons/pi';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { Arrow } from '../pages/Home';
import { useState, useRef } from 'react';
import { FaCheck } from 'react-icons/fa';

type ShareMediaProps = {
  setShareMedia: React.Dispatch<React.SetStateAction<boolean>>;
};

const users: number[] = [1, 2, 3, 4, 5];

const ShareMedia = ({ setShareMedia }: ShareMediaProps) => {
  const [showArrow, setShowArrow] = useState<Arrow>({
    left: false,
    right: true,
  });
  const [searching, setSearching] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selected, setSelected] = useState<number[]>([]);

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

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setShareMedia(false);
  };

  const updateUsers = (id: number) => () => {
    const set = new Set(selected);

    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }

    setSelected([...set]);
  };

  return (
    <section className={styles.section} onClick={handleClick}>
      <div className={styles.container}>
        <h1 className={styles['head']}>
          <span className={styles['head-text']}>Share</span>

          <span
            className={styles['close-icon-box']}
            title="Close"
            onClick={() => setShareMedia(false)}
          >
            <IoClose className={styles['close-icon']} />
          </span>
        </h1>

        <div className={styles['search-container']}>
          <div className={styles['search-box']}>
            <IoSearchSharp className={styles['search-icon']} />
            <input
              type="text"
              className={styles['search-input']}
              placeholder="Search...."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onFocus={() => setSearching(true)}
            />

            {searchText.trim().length > 0 && (
              <IoClose
                className={styles['close-search-icon']}
                onClick={() => setSearchText('')}
                title="Clear"
              />
            )}
          </div>

          {searching && (
            <span
              className={styles['cancel-text']}
              onClick={() => setSearching(false)}
              title="Cancel"
            >
              Cancel
            </span>
          )}
        </div>

        {!searching && (
          <div className={styles['friends-container']}>
            {users.map((user, index) => (
              <article
                key={index}
                className={styles.user}
                onClick={updateUsers(user)}
              >
                <span className={styles['img-box']}>
                  <img
                    src="../../assets/images/users/user1.jpeg"
                    className={styles.img}
                  />

                  {selected.includes(user) && (
                    <span className={styles['check-box']}>
                      <FaCheck className={styles['check-icon']} />
                    </span>
                  )}
                </span>

                <span className={styles.username}>
                  Godfather 👑👑mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
                </span>
              </article>
            ))}
          </div>
        )}

        {searching && (
          <div className={styles['search-result-container']}>
            <article
              className={styles['search-result']}
              onClick={() => {
                setSearching(false);
                updateUsers(1);
              }}
            >
              <img
                src="../../assets/images/users/user2.jpeg"
                className={styles['search-img']}
              />

              <span className={styles['name-box']}>
                <span className={styles['search-username']}>Jon Snow</span>
                <span className={styles['search-handle']}>king_snow</span>
              </span>
            </article>

            <article
              className={styles['search-result']}
              onClick={() => {
                setSearching(false);
                updateUsers(2);
              }}
            >
              <img
                src="../../assets/images/users/user2.jpeg"
                className={styles['search-img']}
              />

              <span className={styles['name-box']}>
                <span className={styles['search-username']}>Jon Snow</span>
                <span className={styles['search-handle']}>king_snow</span>
              </span>
            </article>
          </div>
        )}

        {selected.length === 0 && (
          <div
            className={styles['options-container']}
            ref={optionsRef}
            onScroll={handleScroll}
          >
            {showArrow.left && (
              <span
                className={styles['left-arrow-box']}
                onClick={() => (optionsRef.current.scrollLeft -= 300)}
              >
                <MdKeyboardArrowLeft className={styles['left-arrow']} />
              </span>
            )}

            <div className={styles['share-option']}>
              <span className={styles['share-icon-box']}>
                <PiLinkBold className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>Copy link</span>
            </div>

            <div className={styles['share-option']}>
              <span className={styles['share-icon-box']}>
                <SiWhatsapp className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>Whatsapp</span>
            </div>

            <div className={styles['share-option']}>
              <span className={styles['share-icon-box']}>
                <RiTwitterXFill className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>X</span>
            </div>

            <div className={styles['share-option']}>
              <span className={styles['share-icon-box']}>
                <FaInstagram className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>Instagram</span>
            </div>

            <div className={styles['share-option']}>
              <span className={styles['share-icon-box']}>
                <LuFacebook className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>Facebook</span>
            </div>

            <div className={styles['share-option']}>
              <span className={styles['share-icon-box']}>
                <PiTelegramLogoFill className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>Telegram</span>
            </div>

            <div className={styles['share-option']}>
              <span className={styles['share-icon-box']}>
                <HiOutlineMail className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>Email</span>
            </div>

            <div className={styles['share-option']}>
              <span className={styles['share-icon-box']}>
                <RiMessengerLine className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>Messenger</span>
            </div>

            <div
              className={`${styles['share-option']} ${styles['last-option']}`}
            >
              <span className={styles['share-icon-box']}>
                <PiSnapchatLogoBold className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>Snapchat</span>
            </div>

            {showArrow.right && (
              <span
                className={styles['right-arrow-box']}
                onClick={() => (optionsRef.current.scrollLeft += 300)}
              >
                <MdKeyboardArrowRight className={styles['right-arrow']} />
              </span>
            )}
          </div>
        )}

        {selected.length > 0 && (
          <div className={styles['send-box']}>
            <button className={styles['send-btn']}>Send</button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ShareMedia;
