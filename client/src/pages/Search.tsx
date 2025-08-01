import { useState, useEffect, useRef, useContext } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Search.module.css';
import { HiPlus } from 'react-icons/hi';
import { PiCheckFatFill } from 'react-icons/pi';
import { FaPlay } from 'react-icons/fa6';
import SwitchAccount from '../components/SwitchAccount';
import AsideHeader from '../components/AsideHeader';
import { IoClose, IoSearchSharp, IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { GeneralContext } from '../Contexts';

const mediumSize = window.matchMedia('(max-width: 1100px)').matches;

const Search = () => {
  const [isMediumSize, setIsMediumSize] = useState<boolean>(mediumSize);
  const [category, setCategory] = useState<'all' | 'users' | 'contents'>('all');
  const [switchAccount, setSwitchAccount] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [overlaySearch, setOverlaySearch] = useState<boolean>(false);

  const { setShowSearchPage } = useContext(GeneralContext);

  const navigate = useNavigate();

  const searchInputRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    document.title = 'Buzzer - Search';

    const resizeHandler = () => {
      const mediumSize = window.matchMedia('(max-width: 1100px)').matches;
      setIsMediumSize(mediumSize);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      setShowSearchPage(false);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return (
    <>
      <NavBar
        page="search"
        overlaySearch={overlaySearch}
        setOverlaySearch={setOverlaySearch}
      />

      <section className={styles.section}>
        <header className={styles['section-header']}>
          <div className={styles['show-search-div']}>
            <IoArrowBack
              className={styles['back-icon']}
              onClick={() => navigate(-1)}
            />

            <div className={styles['search-box']}>
              <IoSearchSharp className={styles['search-icon']} />
              <input
                type="text"
                className={styles['search-input']}
                placeholder="Search...."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                ref={searchInputRef}
                onClick={() => setOverlaySearch(true)}
              />

              <IoClose
                className={`${styles['close-search-icon']} ${
                  searchText.trim().length < 1 ? styles['hide-search'] : ''
                }`}
                title="Clear"
                onClick={() => {
                  setSearchText('');
                  searchInputRef.current.focus();
                }}
              />
            </div>
          </div>

          <ul className={styles['header-list']}>
            <li
              className={`${styles['header-item']} ${
                category === 'all' ? styles['active-item'] : ''
              }`}
              onClick={() => setCategory('all')}
            >
              Top Results
            </li>
            <li
              className={`${styles['header-item']} ${
                category === 'users' ? styles['active-item'] : ''
              }`}
              onClick={() => setCategory('users')}
            >
              Users
            </li>
            <li
              className={`${styles['header-item']} ${
                category === 'contents' ? styles['active-item'] : ''
              }`}
              onClick={() => setCategory('contents')}
            >
              Contents
            </li>
          </ul>

          {!isMediumSize && <AsideHeader second />}
        </header>

        {category === 'all' && (
          <>
            <div className={styles['users-container']}>
              <span className={styles['users-container-head']}>Users</span>

              <div className={styles['users-div']}>
                <article className={styles.user}>
                  <div className={styles['user-content']}>
                    <span className={styles['user-img-box']}>
                      <img
                        className={styles['user-img']}
                        src="../../assets/images/users/user14.jpeg"
                      />

                      <span className={styles['follow-icon-box2']}>
                        <PiCheckFatFill className={styles['follow-icon2']} />
                      </span>
                    </span>

                    <div className={styles['user-details']}>
                      <span className={styles['user-name']}>Davido</span>
                      <span className={styles['user-handle']}>@davido_001</span>
                      <span className={styles['user-followers']}>
                        <span className={styles['user-follower-count']}>
                          10.2m
                        </span>{' '}
                        Followers
                      </span>
                    </div>
                  </div>

                  <div className={styles['user-latest-content']}>
                    <img
                      className={styles['user-latest-img']}
                      src="../../assets/images/content/content22.jpeg"
                    />

                    <img
                      className={styles['user-latest-img']}
                      src="../../assets/images/content/content12.jpeg"
                    />
                  </div>
                </article>

                <article className={styles.user}>
                  <div className={styles['user-content']}>
                    <span className={styles['user-img-box']}>
                      <img
                        className={styles['user-img']}
                        src="../../assets/images/users/user3.jpeg"
                      />

                      <span className={styles['follow-icon-box']}>
                        <HiPlus className={styles['follow-icon']} />
                      </span>
                    </span>

                    <div className={styles['user-details']}>
                      <span className={styles['user-name']}>Fave</span>
                      <span className={styles['user-handle']}>
                        @favethebaddie
                      </span>
                      <span className={styles['user-followers']}>
                        <span className={styles['user-follower-count']}>
                          4.2m
                        </span>{' '}
                        Followers
                      </span>
                    </div>
                  </div>

                  <div className={styles['user-latest-content']}>
                    <video
                      className={styles['user-latest-img']}
                      autoPlay
                      muted={true}
                      loop={true}
                    >
                      <source
                        src="../../assets/images/content/content25.mp4"
                        type="video/mp4"
                      />
                      Your browser does not support playing video.
                    </video>

                    <img
                      className={styles['user-latest-img']}
                      src="../../assets/images/content/content2.jpeg"
                    />
                  </div>
                </article>

                <article className={styles.user}>
                  <div className={styles['user-content']}>
                    <span className={styles['user-img-box']}>
                      <img
                        className={styles['user-img']}
                        src="../../assets/images/users/user12.jpeg"
                      />

                      <span className={styles['follow-icon-box']}>
                        <HiPlus className={styles['follow-icon']} />
                      </span>
                    </span>

                    <div className={styles['user-details']}>
                      <span className={styles['user-name']}>Felicia</span>
                      <span className={styles['user-handle']}>
                        @felicia_thunderman
                      </span>
                      <span className={styles['user-followers']}>
                        <span className={styles['user-follower-count']}>
                          500k
                        </span>{' '}
                        Followers
                      </span>
                    </div>
                  </div>

                  <div className={styles['user-latest-content']}>
                    <video
                      className={styles['user-latest-img']}
                      autoPlay
                      muted={true}
                      loop={true}
                    >
                      <source
                        src="../../assets/images/content/content24.mp4"
                        type="video/mp4"
                      />
                      Your browser does not support playing video.
                    </video>

                    <video
                      className={styles['user-latest-img']}
                      autoPlay
                      muted={true}
                      loop={true}
                    >
                      <source
                        src="../../assets/images/content/content6.mp4"
                        type="video/mp4"
                      />
                      Your browser does not support playing video.
                    </video>
                  </div>
                </article>
              </div>
            </div>

            <div className={styles['contents-container']}>
              <span className={styles['users-container-head']}>Contents</span>

              <div className={styles['contents-div']}>
                <article className={styles.content}>
                  <span className={styles['content-name']}>
                    <img
                      className={styles['content-img']}
                      src="../../assets/images/users/user1.jpeg"
                    />

                    <span className={styles['content-handle']}>davido_001</span>
                  </span>

                  <div className={styles['content-item-box']}>
                    <img
                      className={styles['content-item']}
                      src="../../assets/images/content/content23.jpeg"
                    />

                    <time className={styles['content-time']}>07-11</time>
                    <span className={styles['content-views']}>
                      <FaPlay className={styles['content-views-icon']} /> 3.5M
                    </span>
                  </div>
                  <div className={styles['content-description']}>
                    Lorem ipsum dolor sit amet, illum definitiones no quo,
                    maluisset concludaturque et eum, altera fabulas ut quo.
                    Atqui causae gloriatur ius te, id agam omnis evertitur eum.
                    Affert laboramus repudiandae nec et. Inciderint efficiantur
                    his ad. Eum no molestiae voluptatibus.
                  </div>
                </article>

                <article className={styles.content}>
                  <span className={styles['content-name']}>
                    <img
                      className={styles['content-img']}
                      src="../../assets/images/users/user11.jpeg"
                    />

                    <span className={styles['content-handle']}>
                      sandrabaddie
                    </span>
                  </span>

                  <div className={styles['content-item-box']}>
                    <img
                      className={styles['content-item']}
                      src="../../assets/images/people.avif"
                    />

                    <time className={styles['content-time']}>15-06</time>
                    <span className={styles['content-views']}>
                      <FaPlay className={styles['content-views-icon']} /> 189K
                    </span>
                  </div>
                  <div className={styles['content-description']}>
                    Lorem ipsum dolor sit amet, maluisset concludaturque et eum,
                    altera fabulas ut quo.
                  </div>
                </article>

                <article className={styles.content}>
                  <span className={styles['content-name']}>
                    <img
                      className={styles['content-img']}
                      src="../../assets/images/users/user20.jpeg"
                    />

                    <span className={styles['content-handle']}>techdude</span>
                  </span>

                  <div className={styles['content-item-box']}>
                    <video
                      className={styles['content-item']}
                      autoPlay
                      muted={true}
                      loop={true}
                    >
                      <source
                        src="../../assets/images/content/content21.mp4"
                        type="video/mp4"
                      />
                      Your browser does not support playing video.
                    </video>
                    <time className={styles['content-time']}>09-11-23</time>
                    <span className={styles['content-views']}>
                      <FaPlay className={styles['content-views-icon']} /> 5.9M
                    </span>
                  </div>
                  <div className={styles['content-description']}>
                    Lorem ipsum dolor sit amet.
                  </div>
                </article>

                <article className={styles.content}>
                  <span className={styles['content-name']}>
                    <img
                      className={styles['content-img']}
                      src="../../assets/images/users/user11.jpeg"
                    />

                    <span className={styles['content-handle']}>
                      sandrabaddie
                    </span>
                  </span>

                  <div className={styles['content-item-box']}>
                    <img
                      className={styles['content-item']}
                      src="../../assets/images/people.avif"
                    />

                    <time className={styles['content-time']}>15-06</time>
                    <span className={styles['content-views']}>
                      <FaPlay className={styles['content-views-icon']} /> 189K
                    </span>
                  </div>
                  <div className={styles['content-description']}>
                    Lorem ipsum dolor sit amet, maluisset concludaturque et eum,
                    altera fabulas ut quo.
                  </div>
                </article>

                <article className={styles.content}>
                  <span className={styles['content-name']}>
                    <img
                      className={styles['content-img']}
                      src="../../assets/images/users/user20.jpeg"
                    />

                    <span className={styles['content-handle']}>techdude</span>
                  </span>

                  <div className={styles['content-item-box']}>
                    <video
                      className={styles['content-item']}
                      autoPlay
                      muted={true}
                      loop={true}
                    >
                      <source
                        src="../../assets/images/content/content21.mp4"
                        type="video/mp4"
                      />
                      Your browser does not support playing video.
                    </video>
                    <time className={styles['content-time']}>09-11-23</time>
                    <span className={styles['content-views']}>
                      <FaPlay className={styles['content-views-icon']} /> 5.9M
                    </span>
                  </div>
                  <div className={styles['content-description']}>
                    Lorem ipsum dolor sit amet.
                  </div>
                </article>

                <article className={styles.content}>
                  <span className={styles['content-name']}>
                    <img
                      className={styles['content-img']}
                      src="../../assets/images/users/user1.jpeg"
                    />

                    <span className={styles['content-handle']}>davido_001</span>
                  </span>

                  <div className={styles['content-item-box']}>
                    <img
                      className={styles['content-item']}
                      src="../../assets/images/content/content23.jpeg"
                    />

                    <time className={styles['content-time']}>07-11</time>
                    <span className={styles['content-views']}>
                      <FaPlay className={styles['content-views-icon']} /> 3.5M
                    </span>
                  </div>
                  <div className={styles['content-description']}>
                    Lorem ipsum dolor sit amet, illum definitiones no quo,
                    maluisset concludaturque et eum, altera fabulas ut quo.
                    Atqui causae gloriatur ius te, id agam omnis evertitur eum.
                    Affert laboramus repudiandae nec et. Inciderint efficiantur
                    his ad. Eum no molestiae voluptatibus.
                  </div>
                </article>
              </div>
            </div>
          </>
        )}

        {category === 'users' && (
          <div className={styles['users-category-container']}>
            <article className={styles['user-category-item']}>
              <img
                className={styles['user-img']}
                src="../../assets/images/users/user14.jpeg"
              />
              <div className={styles['user-details2']}>
                <span className={styles['user-name']}>Davido</span>
                <span className={styles['user-handle']}>@davido_001</span>
                <span className={styles['user-followers']}>
                  <span className={styles['user-follower-count']}>10.2m</span>{' '}
                  Followers
                </span>
              </div>

              <span className={styles['following-box']}>
                <span className={styles['following-txt']}>Following</span>
              </span>
            </article>

            <article className={styles['user-category-item']}>
              <img
                className={styles['user-img']}
                src="../../assets/images/users/user3.jpeg"
              />

              <div className={styles['user-details2']}>
                <span className={styles['user-name']}>Fave</span>
                <span className={styles['user-handle']}>@favethebaddie</span>
                <span className={styles['user-followers']}>
                  <span className={styles['user-follower-count']}>4.2m</span>{' '}
                  Followers
                </span>
              </div>

              <span className={styles['following-box']}>
                <button className={styles['follow-btn']}>Follow</button>
              </span>
            </article>

            <article className={styles['user-category-item']}>
              <img
                className={styles['user-img']}
                src="../../assets/images/users/user12.jpeg"
              />

              <div className={styles['user-details2']}>
                <span className={styles['user-name']}>Felicia</span>
                <span className={styles['user-handle']}>
                  @felicia_thunderman
                </span>
                <span className={styles['user-followers']}>
                  <span className={styles['user-follower-count']}>500k</span>{' '}
                  Followers
                </span>
              </div>

              <span className={styles['following-box']}>
                <button className={styles['follow-btn']}>Follow</button>
              </span>
            </article>

            <article className={styles['user-category-item']}>
              <img
                className={styles['user-img']}
                src="../../assets/images/users/user10.jpeg"
              />

              <div className={styles['user-details2']}>
                <span className={styles['user-name']}>Andrew Tate</span>
                <span className={styles['user-handle']}>
                  @tatethemovitationalspeaker
                </span>
                <span className={styles['user-followers']}>
                  <span className={styles['user-follower-count']}>6.7m</span>{' '}
                  Followers
                </span>
              </div>

              <span className={styles['following-box']}>
                <span className={styles['following-txt']}>Following</span>
              </span>
            </article>

            <article className={styles['user-category-item']}>
              <img
                className={styles['user-img']}
                src="../../assets/images/users/user19.jpeg"
              />

              <div className={styles['user-details2']}>
                <span className={styles['user-name']}>Tech Guru</span>
                <span className={styles['user-handle']}>@stevejobs089</span>
                <span className={styles['user-followers']}>
                  <span className={styles['user-follower-count']}>55K</span>{' '}
                  Followers
                </span>
              </div>

              <span className={styles['following-box']}>
                <button className={styles['follow-btn']}>Follow</button>
              </span>
            </article>

            <article className={styles['user-category-item']}>
              <img
                className={styles['user-img']}
                src="../../assets/images/users/user4.jpeg"
              />

              <div className={styles['user-details2']}>
                <span className={styles['user-name']}>Sansa Stark</span>
                <span className={styles['user-handle']}>@queeninthenorth</span>
                <span className={styles['user-followers']}>
                  <span className={styles['user-follower-count']}>16.1m</span>{' '}
                  Followers
                </span>
              </div>

              <span className={styles['following-box']}>
                <span className={styles['following-txt']}>Following</span>
              </span>
            </article>

            <article className={styles['user-category-item']}>
              <img
                className={styles['user-img']}
                src="../../assets/images/users/user20.jpeg"
              />

              <div className={styles['user-details2']}>
                <span className={styles['user-name']}>Stargazer</span>
                <span className={styles['user-handle']}>@dastargazer_100</span>
                <span className={styles['user-followers']}>
                  <span className={styles['user-follower-count']}>5387</span>{' '}
                  Followers
                </span>
              </div>

              <span className={styles['following-box']}>
                <button className={styles['follow-btn']}>Follow</button>
              </span>
            </article>
          </div>
        )}

        {category === 'contents' && (
          <div className={styles['contents-div']}>
            <article className={styles.content}>
              <span className={styles['content-name']}>
                <img
                  className={styles['content-img']}
                  src="../../assets/images/users/user1.jpeg"
                />

                <span className={styles['content-handle']}>davido_001</span>
              </span>

              <div className={styles['content-item-box']}>
                <img
                  className={styles['content-item']}
                  src="../../assets/images/content/content23.jpeg"
                />

                <time className={styles['content-time']}>07-11</time>
                <span className={styles['content-views']}>
                  <FaPlay className={styles['content-views-icon']} /> 3.5M
                </span>
              </div>
              <div className={styles['content-description']}>
                Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset
                concludaturque et eum, altera fabulas ut quo. Atqui causae
                gloriatur ius te, id agam omnis evertitur eum. Affert laboramus
                repudiandae nec et. Inciderint efficiantur his ad. Eum no
                molestiae voluptatibus.
              </div>
            </article>

            <article className={styles.content}>
              <span className={styles['content-name']}>
                <img
                  className={styles['content-img']}
                  src="../../assets/images/users/user11.jpeg"
                />

                <span className={styles['content-handle']}>sandrabaddie</span>
              </span>

              <div className={styles['content-item-box']}>
                <img
                  className={styles['content-item']}
                  src="../../assets/images/people.avif"
                />

                <time className={styles['content-time']}>15-06</time>
                <span className={styles['content-views']}>
                  <FaPlay className={styles['content-views-icon']} /> 189K
                </span>
              </div>
              <div className={styles['content-description']}>
                Lorem ipsum dolor sit amet, maluisset concludaturque et eum,
                altera fabulas ut quo.
              </div>
            </article>

            <article className={styles.content}>
              <span className={styles['content-name']}>
                <img
                  className={styles['content-img']}
                  src="../../assets/images/users/user20.jpeg"
                />

                <span className={styles['content-handle']}>techdude</span>
              </span>

              <div className={styles['content-item-box']}>
                <video
                  className={styles['content-item']}
                  autoPlay
                  muted={true}
                  loop={true}
                >
                  <source
                    src="../../assets/images/content/content21.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support playing video.
                </video>
                <time className={styles['content-time']}>09-11-23</time>
                <span className={styles['content-views']}>
                  <FaPlay className={styles['content-views-icon']} /> 5.9M
                </span>
              </div>
              <div className={styles['content-description']}>
                Lorem ipsum dolor sit amet.
              </div>
            </article>

            <article className={styles.content}>
              <span className={styles['content-name']}>
                <img
                  className={styles['content-img']}
                  src="../../assets/images/users/user11.jpeg"
                />

                <span className={styles['content-handle']}>sandrabaddie</span>
              </span>

              <div className={styles['content-item-box']}>
                <img
                  className={styles['content-item']}
                  src="../../assets/images/people.avif"
                />

                <time className={styles['content-time']}>15-06</time>
                <span className={styles['content-views']}>
                  <FaPlay className={styles['content-views-icon']} /> 189K
                </span>
              </div>
              <div className={styles['content-description']}>
                Lorem ipsum dolor sit amet, maluisset concludaturque et eum,
                altera fabulas ut quo.
              </div>
            </article>

            <article className={styles.content}>
              <span className={styles['content-name']}>
                <img
                  className={styles['content-img']}
                  src="../../assets/images/users/user20.jpeg"
                />

                <span className={styles['content-handle']}>techdude</span>
              </span>

              <div className={styles['content-item-box']}>
                <video
                  className={styles['content-item']}
                  autoPlay
                  muted={true}
                  loop={true}
                >
                  <source
                    src="../../assets/images/content/content21.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support playing video.
                </video>
                <time className={styles['content-time']}>09-11-23</time>
                <span className={styles['content-views']}>
                  <FaPlay className={styles['content-views-icon']} /> 5.9M
                </span>
              </div>
              <div className={styles['content-description']}>
                Lorem ipsum dolor sit amet.
              </div>
            </article>

            <article className={styles.content}>
              <span className={styles['content-name']}>
                <img
                  className={styles['content-img']}
                  src="../../assets/images/users/user1.jpeg"
                />

                <span className={styles['content-handle']}>davido_001</span>
              </span>

              <div className={styles['content-item-box']}>
                <img
                  className={styles['content-item']}
                  src="../../assets/images/content/content23.jpeg"
                />

                <time className={styles['content-time']}>07-11</time>
                <span className={styles['content-views']}>
                  <FaPlay className={styles['content-views-icon']} /> 3.5M
                </span>
              </div>
              <div className={styles['content-description']}>
                Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset
                concludaturque et eum, altera fabulas ut quo. Atqui causae
                gloriatur ius te, id agam omnis evertitur eum. Affert laboramus
                repudiandae nec et. Inciderint efficiantur his ad. Eum no
                molestiae voluptatibus.
              </div>
            </article>
          </div>
        )}
      </section>

      {switchAccount && <SwitchAccount setSwitchAccount={setSwitchAccount} />}
    </>
  );
};

export default Search;
