import { useEffect, useRef } from 'react';
import styles from '../styles/MobileSound.module.css';
import ReactDOM from 'react-dom';

type MobileSoundProps = {
  setShowMobile: React.Dispatch<
    React.SetStateAction<{
      filter: boolean;
      adjustments: boolean;
      sound: boolean;
    }>
  >;
  storySound: {
    name: string;
    duration: string;
    src: string;
  };
  setStorySound: React.Dispatch<
    React.SetStateAction<{
      name: string;
      duration: string;
      src: string;
    }>
  >;
  playStorySound: boolean;
  setPlayStorySound: React.Dispatch<React.SetStateAction<boolean>>;
  soundInputRef: React.MutableRefObject<HTMLInputElement>;
  storySoundRef: React.MutableRefObject<HTMLAudioElement>;
};

const MobileSound = ({
  setShowMobile,
  storySound,
  setStorySound,
  playStorySound,
  setPlayStorySound,
  storySoundRef,
  soundInputRef,
}: MobileSoundProps) => {
  const containerRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('sound-portal') || document.body;

  useEffect(() => {
    containerRef.current.animate(
      {
        height: ['0px', '261px'],
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
        <span className={styles['container-head']}>Sound</span>

        <div className={styles['sound-div']}>
          {storySound && (
            <div
              className={`${styles['sound-box']} ${
                playStorySound ? styles['active-sound'] : ''
              }`}
            >
              <span
                className={styles['sound-details']}
                onClick={() => setPlayStorySound(!playStorySound)}
              >
                <span className={styles['sound-name']}>{storySound.name}</span>
                <span className={styles['sound-duration']}>
                  {storySound.duration}
                </span>
              </span>
            </div>
          )}

          <div className={styles['sound-btn-div']}>
            <button
              className={styles['sound-btn']}
              onClick={() => soundInputRef.current.click()}
            >
              {storySound ? 'Change' : 'Select Sound'}
            </button>
            {storySound && (
              <button
                className={styles['remove-btn']}
                onClick={() => {
                  URL.revokeObjectURL(storySound.src);
                  storySoundRef.current.src = '';
                  setPlayStorySound(false);
                  setStorySound(null!);
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className={styles['close-btn-box']}>
          <button
            className={styles['close-btn']}
            onClick={() => setShowMobile((prev) => ({ ...prev, sound: false }))}
          >
            Done
          </button>
        </div>
      </div>
    </section>,
    target
  );
};

export default MobileSound;
