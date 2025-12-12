import { useEffect, useRef } from 'react';
import styles from '../styles/MobileSound.module.css';
import ReactDOM from 'react-dom';
import LoadingAnimation from './LoadingAnimation';

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
      file: File;
    }>
  >;
  playStorySound: boolean;
  setPlayStorySound: React.Dispatch<React.SetStateAction<boolean>>;
  soundInputRef: React.MutableRefObject<HTMLInputElement>;
  storySoundRef: React.MutableRefObject<HTMLAudioElement>;
  processing: boolean;
  settings: {
    accessibility: number;
    disableComments: boolean;
    volume: {
      sound: number;
      story: number;
    };
  };
  setSettings: React.Dispatch<
    React.SetStateAction<{
      accessibility: number;
      disableComments: boolean;
      volume: {
        sound: number;
        story: number;
      };
    }>
  >;
};

const MobileSound = ({
  setShowMobile,
  storySound,
  setStorySound,
  playStorySound,
  setPlayStorySound,
  storySoundRef,
  soundInputRef,
  processing,
  settings,
  setSettings,
}: MobileSoundProps) => {
  const containerRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('sound-portal') || document.body;

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
        <span className={styles['container-head']}>Sound</span>

        <div className={styles['sound-div']}>
          {processing ? (
            <div className={styles['loader-box']}>
              <LoadingAnimation
                style={{
                  width: '3rem',
                  height: '3rem',
                  transform: 'scale(2.5)',
                }}
              />
            </div>
          ) : (
            storySound && (
              <>
                <div
                  className={`${styles['sound-box']} ${
                    playStorySound ? styles['active-sound'] : ''
                  }`}
                >
                  <span
                    className={styles['sound-details']}
                    onClick={() => setPlayStorySound(!playStorySound)}
                  >
                    <span className={styles['sound-name']}>
                      {storySound.name}
                    </span>
                    <span className={styles['sound-duration']}>
                      {storySound.duration}
                    </span>
                  </span>
                </div>

                <div className={styles['sound-volume-container']}>
                  <span className={styles['sound-volume-head']}>Volume</span>

                  <div className={styles['sound-volume-box']}>
                    <span className={styles['sound-volume-heading']}>
                      Sound Volume
                    </span>
                    <div className={styles['sound-volume-slider']}>
                      <input
                        type="range"
                        value={settings.volume.sound}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            volume: {
                              ...prev.volume,
                              sound: Number(e.target.value),
                            },
                          }));
                        }}
                      />
                      <span>{settings.volume.sound}%</span>
                    </div>
                  </div>

                  <div className={styles['sound-volume-box']}>
                    <span className={styles['sound-volume-heading']}>
                      Story Volume
                    </span>
                    <div className={styles['sound-volume-slider']}>
                      <input
                        type="range"
                        value={settings.volume.story}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            volume: {
                              ...prev.volume,
                              story: Number(e.target.value),
                            },
                          }));
                        }}
                      />
                      <span>{settings.volume.story}%</span>
                    </div>
                  </div>
                </div>
              </>
            )
          )}

          {!processing && (
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
          )}
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
