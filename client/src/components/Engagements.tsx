import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Engagements.module.css';
import { IoClose, IoSearchSharp } from 'react-icons/io5';
import ReactDOM from 'react-dom';

type EngagementsProps = {
  value: 'followers' | 'following' | 'friends' | 'suggested' | 'private' | null;
  setValue: React.Dispatch<
    React.SetStateAction<
      'followers' | 'following' | 'friends' | 'suggested' | 'private' | null
    >
  >;
};

const Engagements = ({ value, setValue }: EngagementsProps) => {
  const [category, setCategory] = useState<
    'followers' | 'following' | 'friends' | 'private' | 'suggested' | null
  >(value);
  const [searchValue, setSearchValue] = useState<string>('');

  const searchRef = useRef<HTMLInputElement>(null!);
  const itemRef = useRef<{
    followers: HTMLLIElement;
    following: HTMLLIElement;
    friends: HTMLLIElement;
    private: HTMLLIElement;
    suggested: HTMLLIElement;
  }>({
    followers: null!,
    following: null!,
    friends: null!,
    private: null!,
    suggested: null!,
  });

  useEffect(() => {
    if (category) itemRef.current[category].scrollIntoView();
  }, [category]);

  const target = document.getElementById('engagements-portal') || document.body;

  const addToRef =
    (
      ref: React.MutableRefObject<{
        followers: HTMLLIElement;
        following: HTMLLIElement;
        friends: HTMLLIElement;
        private: HTMLLIElement;
        suggested: HTMLLIElement;
      }>,
      prop: 'followers' | 'following' | 'friends' | 'private' | 'suggested'
    ) =>
    (el: HTMLLIElement) => {
      if (el && !ref.current[prop]) {
        ref.current[prop] = el;
      }
    };

  return ReactDOM.createPortal(
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) setValue(null);
      }}
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.head}>josephlouis_100</h1>

          <span
            className={styles['close-icon-box']}
            onClick={() => setValue(null)}
          >
            <IoClose className={styles['close-icon']} title="Close" />
          </span>
        </header>

        <ul className={styles['category-list']}>
          <li
            className={`${styles['category-item']} ${
              category === 'followers' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('followers')}
            ref={addToRef(itemRef, 'followers')}
          >
            Followers <span className={styles['category-value']}>2000</span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'following' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('following')}
            ref={addToRef(itemRef, 'following')}
          >
            Following <span className={styles['category-value']}>105</span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'friends' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('friends')}
            ref={addToRef(itemRef, 'friends')}
          >
            Friends <span className={styles['category-value']}>15</span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'private' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('private')}
            ref={addToRef(itemRef, 'private')}
          >
            Private audience
            <span className={styles['category-value']}>5</span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'suggested' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('suggested')}
            ref={addToRef(itemRef, 'suggested')}
          >
            Suggested
          </li>
        </ul>

        <div className={styles['search-box']}>
          <IoSearchSharp className={styles['search-icon']} />

          <input
            className={styles['search-value']}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            ref={searchRef}
            placeholder="Search...."
          />

          {searchValue.length > 0 && (
            <IoClose
              className={styles['clear-search']}
              onClick={() => {
                setSearchValue('');
                searchRef.current.focus();
              }}
            />
          )}
        </div>

        {category === 'followers' ? (
          <div className={styles['users-container']}>
            <article className={styles.user}>
              <div className={styles['user-details']}>
                <span className={styles['img-box']}>
                  <img
                    className={styles['user-img']}
                    src="../../assets/images/users/user12.jpeg"
                  />
                </span>

                <div className={styles['name-box']}>
                  <span className={styles['user-name']}>Godfather👑👑</span>
                  <span className={styles['user-handle']}>dagodfather_001</span>
                </div>
              </div>

              <div className={styles['btn-div']}>
                <button className={styles['engage-btn']}>Follow</button>
                <button
                  className={`${styles['engage-btn']} ${styles['engage-btn2']}`}
                >
                  Remove
                </button>
              </div>
            </article>
          </div>
        ) : category === 'following' ? (
          <div className={styles['users-container']}>
            <article className={styles.user}>
              <div className={styles['user-details']}>
                <span className={styles['img-box']}>
                  <img
                    className={styles['user-img']}
                    src="../../assets/images/users/user12.jpeg"
                  />
                </span>

                <div className={styles['name-box']}>
                  <span className={styles['user-name']}>Godfather👑👑</span>
                  <span className={styles['user-handle']}>dagodfather_001</span>
                </div>
              </div>

              <div className={styles['btn-div']}>
                <button className={styles['engage-btn']}>Unfollow</button>
                <button
                  className={`${styles['engage-btn']} ${styles['engage-btn2']}`}
                >
                  Add Friend
                </button>
              </div>
            </article>
          </div>
        ) : category === 'friends' ? (
          <div className={styles['users-container']}>
            <article className={styles.user}>
              <div className={styles['user-details']}>
                <span className={styles['img-box']}>
                  <img
                    className={styles['user-img']}
                    src="../../assets/images/users/user12.jpeg"
                  />
                </span>

                <div className={styles['name-box']}>
                  <span className={styles['user-name']}>Godfather👑👑</span>
                  <span className={styles['user-handle']}>dagodfather_001</span>
                </div>
              </div>

              <div className={styles['btn-div']}>
                <button className={styles['engage-btn']}>Message</button>
                <button
                  className={`${styles['engage-btn']} ${styles['engage-btn2']}`}
                >
                  Remove
                </button>
              </div>
            </article>
          </div>
        ) : category === 'suggested' ? (
          <div className={styles['users-container']}>
            <article className={styles.user}>
              <div className={styles['user-details']}>
                <span className={styles['img-box']}>
                  <img
                    className={styles['user-img']}
                    src="../../assets/images/users/user12.jpeg"
                  />
                </span>

                <div className={styles['name-box']}>
                  <span className={styles['user-name']}>Godfather👑👑</span>
                  <span className={styles['user-handle']}>dagodfather_001</span>
                </div>
              </div>

              <div className={styles['btn-div']}>
                <button className={styles['engage-btn']}>Follow</button>
                <button
                  className={`${styles['engage-btn']} ${styles['engage-btn2']}`}
                >
                  Remove
                </button>
              </div>
            </article>
          </div>
        ) : (
          <div className={styles['users-container']}>
            <article className={styles.user}>
              <div className={styles['user-details']}>
                <span className={styles['img-box']}>
                  <img
                    className={styles['user-img']}
                    src="../../assets/images/users/user12.jpeg"
                  />
                </span>

                <div className={styles['name-box']}>
                  <span className={styles['user-name']}>Godfather👑👑</span>
                  <span className={styles['user-handle']}>dagodfather_001</span>
                </div>
              </div>

              <div className={styles['btn-div']}>
                <button
                  className={`${styles['engage-btn']} ${styles['engage-btn2']}`}
                >
                  Remove
                </button>
              </div>
            </article>
          </div>
        )}
      </div>
    </section>,
    target
  );
};

export default Engagements;
