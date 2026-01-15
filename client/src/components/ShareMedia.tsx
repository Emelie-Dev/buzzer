import ReactDOM from 'react-dom';
import styles from '../styles/ShareMedia.module.css';
import { IoClose, IoSearchSharp } from 'react-icons/io5';
import { PiLinkBold } from 'react-icons/pi';
import { SiWhatsapp } from 'react-icons/si';
import { RiTwitterXFill } from 'react-icons/ri';
import { LuFacebook } from 'react-icons/lu';
import { PiTelegramLogoFill } from 'react-icons/pi';
import { HiOutlineMail } from 'react-icons/hi';
import { RiMessengerLine } from 'react-icons/ri';
import { PiSnapchatLogoBold } from 'react-icons/pi';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { Arrow } from '../pages/Home';
import { useState, useRef, useEffect, useContext } from 'react';
import { FaCheck } from 'react-icons/fa';
import { ContentContext } from '../Contexts';
import { apiClient, debounce, getUrl, serverUrl } from '../Utilities';
import LoadingAnimation from './LoadingAnimation';
import { BsDot } from 'react-icons/bs';
import { toast } from 'sonner';
import { PiRedditLogoBold } from 'react-icons/pi';
import { BiMessageRoundedDots } from 'react-icons/bi';

type ShareMediaProps = {
  setShareMedia: React.Dispatch<React.SetStateAction<boolean>>;
  activeVideo: HTMLVideoElement | null;
  post: any;
  postType: 'content' | 'reel';
  setShares: React.Dispatch<React.SetStateAction<number>>;
};

const getUsers = async (...args: any[]) => {
  const [query, cursor] = args;

  try {
    const { data } = await apiClient(
      `v1/search/users?query=${query}&cursor=${cursor}&page=1`
    );

    return data.data.result;
  } catch {
    return 'error';
  }
};

const debouncedQuery = debounce(getUsers, 300);

const ShareMedia = ({
  setShareMedia,
  activeVideo,
  post,
  postType,
  setShares,
}: ShareMediaProps) => {
  const [showArrow, setShowArrow] = useState<Arrow>({
    left: false,
    right: true,
  });

  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [searchData, setSearchData] = useState({
    cursor: null,
    end: false,
  });
  const [loading, setLoading] = useState<{
    query: string;
    value: boolean | 'error';
  }>({ value: false, query: '' });
  const [suggestions, setSuggestions] = useState<any[] | 'error'>(null!);

  const { setActiveVideo } = useContext(ContentContext);

  const optionsRef = useRef<HTMLDivElement>(null!);
  const searchRef = useRef<HTMLDivElement>(null!);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const target = document.getElementById('share-portal') || document.body;

  useEffect(() => {
    if (suggestions === null) getSuggestions();
  }, [suggestions]);

  const getSuggestions = async () => {
    try {
      const { data } = await apiClient(`v1/search/users?&page=1`);
      setSuggestions(data.data.result);
    } catch {
      setSuggestions('error');
    }
  };

  const handleSearch = async () => {
    if (loading.value === true && loading.query) {
      const result = await debouncedQuery(loading.query, searchData.cursor);

      if (result === 'error') {
        setLoading({ ...loading, value: 'error' });
      } else {
        const filteredResults = (result as []).filter(
          (obj: any) => !searchResult.find((data) => data._id === obj._id)
        );

        setSearchResult([...searchResult, ...filteredResults]);
        setSearchData({ ...searchData, end: (result as []).length < 30 });
        setLoading({ ...loading, value: false });
      }
    }
  };

  useEffect(() => {
    videoRef.current = activeVideo;
    setActiveVideo(null);
  }, []);

  useEffect(() => {
    handleSearch();
  }, [loading]);

  useEffect(() => {
    const container = searchRef.current;

    if (
      searchResult.length !== 0 &&
      loading.value !== 'error' &&
      container &&
      container.scrollHeight <= container.clientHeight &&
      !searchData.end
    ) {
      handleSearch();
    }
  }, [searchResult]);

  useEffect(() => {
    if (!searching) {
      setSearchResult([]);
      setSearchData({
        cursor: null,
        end: false,
      });
      setLoading({ value: false, query: '' });
      setSelected([]);
    }
  }, [searching]);

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
    if (e.target === e.currentTarget) {
      setShareMedia(false);
      setActiveVideo(videoRef.current);
      videoRef.current?.play();
    }
  };

  const updateUsers = (id: string) => () => {
    setSelected((prev) => {
      const set = new Set(prev);

      if (set.has(id)) set.delete(id);
      else set.add(id);

      return [...set];
    });
  };

  const handleUsersScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !searchData.end && loading.value !== true) {
      if (loading.value === 'error') {
        setSearchData({
          ...searchData,
        });
      } else {
        setSearchData({
          ...searchData,
          cursor: searchResult[searchResult.length - 1].createdAt,
        });
      }
      setLoading({ ...loading, value: true });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${serverUrl}${postType}/${post._id}`
      );
      toast.success('Link copied!');

      await shareItem();
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const getAppLink = (type: string) => {
    let link;

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const message = `Check out this post by ${post.user.name} on Buzzer:\n${serverUrl}${postType}/${post._id}`;

    const smsHref = isIOS ? `sms:&body=${message}` : `sms:?body=${message}`;

    switch (type) {
      case 'whatsapp':
        link = `https://wa.me/?text=${encodeURIComponent(
          `*Check out this post by _${post.user.name}_ on Buzzer:*\n${serverUrl}${postType}/${post._id}`
        )}`;
        break;

      case 'x':
        link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Check out this post by ${post.user.name} #Buzzer\n${serverUrl}${postType}/${post._id}`
        )}`;
        break;

      case 'facebook':
        link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          `${serverUrl}${postType}/${post._id}`
        )}`;
        break;

      case 'telegram':
        link = `https://t.me/share/url?url=${encodeURIComponent(
          `${serverUrl}${postType}/${post._id}`
        )}&text=${encodeURIComponent(
          `\nCheck out this post by ${post.user.name} on Buzzer.`
        )}`;
        break;

      case 'email':
        link = `mailto:?subject=${encodeURIComponent(
          'Check out this post on Buzzer!'
        )}&body=${encodeURIComponent(
          `Check out this post by ${post.user.name} on Buzzer:\n${serverUrl}${postType}/${post._id}`
        )}`;
        break;

      case 'messenger':
        link = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(
          `${serverUrl}${postType}/${post._id}`
        )}&app_id=1830966198299023&redirect_uri=${encodeURIComponent(
          serverUrl
        )}`;
        break;

      case 'snapchat':
        link = `https://www.snapchat.com/share?link=${encodeURIComponent(
          `${serverUrl}${postType}/${post._id}`
        )}`;
        break;

      case 'reddit':
        link = `https://www.reddit.com/submit?url=${encodeURIComponent(
          `${serverUrl}${postType}/${post._id}`
        )}&title=${encodeURIComponent(
          `Check out this post by ${post.user.name} on Buzzer!`
        )}`;
        break;

      case 'sms':
        link = smsHref;
        break;
    }

    return link;
  };

  const shareItem = async () => {
    setShareMedia(false);
    setActiveVideo(videoRef.current);
    videoRef.current?.play();

    try {
      await apiClient.post(`v1/share`, {
        collection: postType,
        documentId: post._id,
      });

      setShares((prev) => prev + 1);
      // eslint-disable-next-line no-empty
    } catch {}
  };

  return ReactDOM.createPortal(
    <section className={styles.section} onClick={handleClick}>
      <div className={styles.container}>
        <h1 className={styles['head']}>
          <span className={styles['head-text']}>Share</span>

          <span
            className={styles['close-icon-box']}
            title="Close"
            onClick={() => {
              setShareMedia(false);
              setActiveVideo(videoRef.current);
              videoRef.current?.play();
            }}
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
              value={loading.query}
              onChange={(e) => {
                setSearching(true);
                setLoading({ value: true, query: e.target.value });
                setSearchData({
                  cursor: null,
                  end: false,
                });
                setSearchResult([]);
              }}
            />

            {loading.query.trim().length > 0 && (
              <IoClose
                className={styles['close-search-icon']}
                onClick={() => setLoading({ value: true, query: '' })}
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
          <div className={styles['suggestions-container']}>
            {suggestions === null ? (
              <div className={styles['error-text']}>
                <LoadingAnimation
                  style={{
                    width: '4rem',
                    height: '4rem',
                    transform: 'scale(2.5)',
                  }}
                />
              </div>
            ) : suggestions === 'error' ? (
              <div className={styles['error-text']}>
                Couldn’t load users. Please try again.
                <button
                  className={styles['error-btn']}
                  onClick={() => setSuggestions(null!)}
                >
                  Try again
                </button>
              </div>
            ) : suggestions.length === 0 ? (
              <div className={styles['error-text']}>
                No suggestions available.
              </div>
            ) : (
              <div className={styles['friends-container']}>
                {suggestions.map((user) => (
                  <article
                    key={user._id}
                    className={styles.user}
                    onClick={updateUsers(user._id)}
                  >
                    <span className={styles['img-box']}>
                      <img
                        src={getUrl(user.photo, 'users')}
                        className={styles.img}
                      />

                      {selected.includes(user._id) && (
                        <span className={styles['check-box']}>
                          <FaCheck className={styles['check-icon']} />
                        </span>
                      )}
                    </span>

                    <span className={styles.username}>{user.username}</span>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {searching ? (
          loading.value === true && searchData.cursor === null ? (
            <div className={styles['search-result-container']}>
              <div className={styles['error-text']}>
                <LoadingAnimation
                  style={{
                    width: '4rem',
                    height: '4rem',
                    transform: 'scale(2.5)',
                  }}
                />
              </div>
            </div>
          ) : loading.value === 'error' && searchData.cursor === null ? (
            <div className={styles['search-result-container']}>
              <div className={styles['error-text']}>
                Couldn’t load users. Please try again.
                <button
                  className={styles['error-btn']}
                  onClick={() => {
                    setSearching(true);
                    setLoading((prev) => ({ ...prev, value: true }));
                    setSearchData({
                      cursor: null,
                      end: false,
                    });
                    setSearchResult([]);
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : searchResult.length === 0 ? (
            <div className={styles['search-result-container']}>
              <div className={styles['error-text']}>
                No matching user found.
              </div>
            </div>
          ) : (
            <div
              className={styles['search-result-container']}
              onScroll={handleUsersScroll}
              ref={searchRef}
            >
              {searchResult.map((user) => (
                <article
                  key={user._id}
                  className={styles['search-result']}
                  onClick={updateUsers(user._id)}
                >
                  <img
                    src={getUrl(user.photo, 'users')}
                    className={styles['search-img']}
                  />

                  <span className={styles['name-box']}>
                    <span className={styles['search-username']}>
                      {user.name}

                      {user.type && (
                        <span className={styles['type-text']}>
                          <BsDot className={styles.dot} />
                          {user.type}
                        </span>
                      )}
                    </span>
                    <span className={styles['search-handle']}>
                      {user.username}
                    </span>
                  </span>

                  <input
                    className={styles['checkbox']}
                    type="checkbox"
                    checked={selected.includes(user._id)}
                    readOnly
                  />
                </article>
              ))}

              {loading.value === true && searchData.cursor !== null && (
                <div className={styles['loader-box']}>
                  <LoadingAnimation
                    style={{
                      width: '2rem',
                      height: '2rem',
                      transform: 'scale(2.5)',
                    }}
                  />
                </div>
              )}
            </div>
          )
        ) : (
          ''
        )}

        {!searching && selected.length === 0 && (
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
              <span className={styles['share-icon-box']} onClick={copyLink}>
                <PiLinkBold className={styles['share-icon']} />
              </span>
              <span className={styles['share-icon-text']}>Copy link</span>
            </div>

            <div className={styles['share-option']}>
              <a
                className={styles['share-icon-box']}
                href={getAppLink('whatsapp')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={shareItem}
              >
                <SiWhatsapp className={styles['share-icon']} />
              </a>
              <span className={styles['share-icon-text']}>Whatsapp</span>
            </div>

            <div className={styles['share-option']}>
              <a
                className={styles['share-icon-box']}
                href={getAppLink('x')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={shareItem}
              >
                <RiTwitterXFill className={styles['share-icon']} />
              </a>
              <span className={styles['share-icon-text']}>X</span>
            </div>

            <div className={styles['share-option']}>
              <a
                className={styles['share-icon-box']}
                href={getAppLink('facebook')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={shareItem}
              >
                <LuFacebook className={styles['share-icon']} />
              </a>
              <span className={styles['share-icon-text']}>Facebook</span>
            </div>

            <div className={styles['share-option']}>
              <a
                className={styles['share-icon-box']}
                href={getAppLink('telegram')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={shareItem}
              >
                <PiTelegramLogoFill className={styles['share-icon']} />
              </a>
              <span className={styles['share-icon-text']}>Telegram</span>
            </div>

            <div className={styles['share-option']}>
              <a
                className={styles['share-icon-box']}
                href={getAppLink('email')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={shareItem}
              >
                <HiOutlineMail className={styles['share-icon']} />
              </a>
              <span className={styles['share-icon-text']}>Email</span>
            </div>

            <div className={styles['share-option']}>
              <a
                className={styles['share-icon-box']}
                href={getAppLink('messenger')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={shareItem}
              >
                <RiMessengerLine className={styles['share-icon']} />
              </a>
              <span className={styles['share-icon-text']}>Messenger</span>
            </div>

            <div className={styles['share-option']}>
              <a
                className={styles['share-icon-box']}
                href={getAppLink('snapchat')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={shareItem}
              >
                <PiSnapchatLogoBold className={styles['share-icon']} />
              </a>
              <span className={styles['share-icon-text']}>Snapchat</span>
            </div>

            <div className={styles['share-option']}>
              <a
                className={styles['share-icon-box']}
                href={getAppLink('reddit')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={shareItem}
              >
                <PiRedditLogoBold className={styles['share-icon']} />
              </a>
              <span className={styles['share-icon-text']}>Reddit</span>
            </div>

            <div
              className={`${styles['share-option']} ${styles['last-option']}`}
            >
              <a
                className={styles['share-icon-box']}
                href={getAppLink('sms')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={shareItem}
              >
                <BiMessageRoundedDots className={styles['share-icon']} />
              </a>
              <span className={styles['share-icon-text']}>SMS</span>
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
        )}

        {(searching || selected.length > 0) && (
          <div className={styles['send-box']}>
            <button className={styles['send-btn']}>Send</button>
          </div>
        )}
      </div>
    </section>,
    target
  );
};

export default ShareMedia;
