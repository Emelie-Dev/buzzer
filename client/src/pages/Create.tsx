import { useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Create.module.css';
import { FaPhotoVideo } from 'react-icons/fa';
import { PiVideoBold } from 'react-icons/pi';
import AsideHeader from '../components/AsideHeader';

const Create = () => {
  const [category, setCategory] = useState<'reel' | 'content'>('content');

  const containerRef = useRef<HTMLDivElement>(null!);
  const fileRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (containerRef.current) {
      if (category === 'reel') {
        containerRef.current.scrollLeft += containerRef.current.offsetWidth;
      } else {
        containerRef.current.scrollLeft -= containerRef.current.offsetWidth;
      }
    }
  }, [category]);

  return (
    <>
      <NavBar page="create" />

      <section className={styles.main}>
        <section className={styles.section}>
          <ul className={styles['type-list']}>
            <li
              className={`${styles['type-item']} ${
                category === 'content' ? styles['active-item'] : ''
              }`}
              onClick={() => setCategory('content')}
            >
              Content
            </li>
            <li
              className={`${styles['type-item']} ${
                category === 'reel' ? styles['active-item'] : ''
              }`}
              onClick={() => setCategory('reel')}
            >
              Reel
            </li>
          </ul>

          <input
            className={styles['file-input']}
            type="file"
            ref={fileRef}
            accept={category === 'content' ? 'video/*,image/*' : 'video/*'}
            multiple={category === 'content'}
          />

          <div className={styles['category-container']} ref={containerRef}>
            <div className={styles['category-div']}>
              <div className={styles['upload-div']}>
                <FaPhotoVideo className={styles['content-icon']} />
                <span className={styles['upload-text']}>
                  {' '}
                  Select the photos and videos you want to post
                </span>
                <button
                  className={styles['select-btn']}
                  onClick={() => fileRef.current.click()}
                >
                  Select
                </button>
              </div>
            </div>

            <div className={styles['category-div']}>
              <div className={styles['upload-div']}>
                <PiVideoBold className={styles['content-icon']} />
                <span className={styles['upload-text']}>
                  {' '}
                  Select the video you want to post
                </span>
                <button
                  className={styles['select-btn']}
                  onClick={() => fileRef.current.click()}
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.aside}>
          <AsideHeader />

          <div className={styles['tips-container']}>
            <span className={styles['tips-text']}>Upload Guidelines</span>

            <ul className={styles['upload-guidelines']}>
              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>
                  Upload Limit (for content)
                </span>
                <br />
                <span className={styles['guideline-text']}>
                  Maximum number of files per post: 20.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>File Size</span>
                <br />
                <span className={styles['guideline-text']}>
                  Maximum file size: 1 GB.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>File Format</span>
                <br />
                <span className={styles['guideline-text']}>
                  Major file formats for photos and videos are supported.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>
                  Duration (for videos)
                </span>
                <br />
                <span className={styles['guideline-text']}>
                  Maximum Duration: 60 minutes.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>Resolution</span>
                <br />
                <span className={styles['guideline-text']}>
                  Minimum recommended resolution: 720p (for videos).
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>Aspect Ratio</span>
                <br />
                <span className={styles['guideline-text']}>
                  Recommended aspect ratio: 16:9 (for videos).
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>Safe Posting</span>
                <br />
                <span className={styles['guideline-text']}>
                  Ensure your content follows{' '}
                  <b className={styles['community-guidelines']}>
                    community guidelines
                  </b>
                  .
                </span>
              </li>
            </ul>
          </div>
        </section>
      </section>
    </>
  );
};
export default Create;
