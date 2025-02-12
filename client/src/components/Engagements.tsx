import { useRef, useState } from 'react';
import styles from '../styles/Engagements.module.css';
import { IoClose, IoSearchSharp } from 'react-icons/io5';

type EngagementsProps = {
  value: 'followers' | 'following' | 'friends' | 'suggested' | null;
  setValue: React.Dispatch<
    React.SetStateAction<
      'followers' | 'following' | 'friends' | 'suggested' | null
    >
  >;
};

const Engagements = ({ value, setValue }: EngagementsProps) => {
  const [category, setCategory] = useState<
    'followers' | 'following' | 'friends' | 'suggested' | null
  >(value);
  const [searchValue, setSearchValue] = useState<string>('');

  const searchRef = useRef<HTMLInputElement>(null!);

  return (
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
          >
            Followers <span className={styles['category-value']}>2000</span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'following' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('following')}
          >
            Following <span className={styles['category-value']}>105</span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'friends' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('friends')}
          >
            Friends <span className={styles['category-value']}>15</span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'suggested' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('suggested')}
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
                <button className={styles['engage-btn']}>Follow</button>
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
    </section>
  );
};

export default Engagements;
