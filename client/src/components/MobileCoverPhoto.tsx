import { useEffect, useRef } from 'react';
import styles from '../styles/MobileCoverPhoto.module.css';
import ReactDOM from 'react-dom';
import { IoClose } from 'react-icons/io5';

type MobileCoverPhotoProps = {
  coverUrls: string[];
  coverIndex: number | 'local' | null;
  playVideo: (index: number | null, local?: boolean) => () => void;
  setCoverIndex: (value: React.SetStateAction<number | 'local' | null>) => void;
  localCoverUrl: string;
  coverRef: React.MutableRefObject<HTMLInputElement>;
  setPauseVideo: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMobile: React.Dispatch<
    React.SetStateAction<{
      coverPhoto: boolean;
      sounds: boolean;
      volume: boolean;
    }>
  >;
  coverPhotoBoxRef: React.MutableRefObject<HTMLDivElement>;
};

const MobileCoverPhoto = ({
  coverUrls,
  coverIndex,
  playVideo,
  setCoverIndex,
  localCoverUrl,
  coverRef,
  setPauseVideo,
  setShowMobile,
  coverPhotoBoxRef,
}: MobileCoverPhotoProps) => {
  const containerRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('cover-portal') || document.body;

  useEffect(() => {
    containerRef.current.animate(
      {
        height: ['0px', `${containerRef.current.scrollHeight + 25}px`],
      },
      {
        fill: 'both',
        duration: 150,
      }
    );
  }, []);

  return ReactDOM.createPortal(
    <section className={styles.section}>
      <div className={styles['filter-container']} ref={containerRef}>
        <span className={styles['container-head']}>Select cover photo</span>

        <div className={styles['cover-photo-container']}>
          <div className={styles['cover-photo-div']} ref={coverPhotoBoxRef}>
            {localCoverUrl && (
              <span
                className={`${styles['cover-photo-box']} ${
                  coverIndex === 'local' ? styles['current-cover'] : ''
                }`}
                onClick={playVideo(null, true)}
              >
                {coverIndex === 'local' && (
                  <span
                    className={styles['remove-cover-box']}
                    onClick={() => setCoverIndex(null)}
                  >
                    <IoClose className={styles['remove-cover-icon']} />
                  </span>
                )}

                <img
                  src={localCoverUrl}
                  className={styles['cover-photo-img']}
                />
              </span>
            )}

            {coverUrls.length > 0 &&
              coverUrls.map((src, index) => (
                <span
                  key={index}
                  className={`${styles['cover-photo-box']} ${
                    index === coverIndex ? styles['current-cover'] : ''
                  }`}
                  onClick={playVideo(index)}
                >
                  {index === coverIndex && (
                    <span
                      className={styles['remove-cover-box']}
                      onClick={() => setCoverIndex(null)}
                    >
                      <IoClose className={styles['remove-cover-icon']} />
                    </span>
                  )}
                  <img src={src} className={styles['cover-photo-img']} />
                </span>
              ))}
          </div>

          <div className={styles['cover-photo-btn-div']}>
            <button
              className={styles['cover-photo-btn']}
              onClick={() => {
                coverRef.current.click();
                setPauseVideo(true);
              }}
            >
              Select from computer
            </button>
          </div>
        </div>

        <div className={styles['close-btn-box']}>
          <button
            className={styles['close-btn']}
            onClick={() =>
              setShowMobile((prev) => ({ ...prev, coverPhoto: false }))
            }
          >
            Done
          </button>
        </div>
      </div>
    </section>,
    target
  );
};

export default MobileCoverPhoto;
