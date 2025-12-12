import { useEffect, useRef } from 'react';
import styles from '../styles/MobileVolume.module.css';
import ReactDOM from 'react-dom';

type MobileVolumeProps = {
  setShowMobile: React.Dispatch<
    React.SetStateAction<{
      coverPhoto: boolean;
      sounds: boolean;
      volume: boolean;
    }>
  >;
  currentSound: string | null;
  volume: {
    sound: number;
    original: number;
  };
  setVolume: React.Dispatch<
    React.SetStateAction<{
      sound: number;
      original: number;
    }>
  >;
};

const MobileVolume = ({
  setShowMobile,
  currentSound,
  volume,
  setVolume,
}: MobileVolumeProps) => {
  const containerRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('volume-portal') || document.body;

  useEffect(() => {
    containerRef.current.animate(
      {
        height: ['0px', `${containerRef.current.scrollHeight + 50}px`],
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
        <span className={styles['container-head']}>Set sound volume</span>

        {currentSound ? (
          <div className={styles['sound-volume-container']}>
            <div className={styles['sound-volume-box']}>
              <span className={styles['sound-volume-heading']}>
                Sound Volume
              </span>
              <div className={styles['sound-volume-slider']}>
                <input
                  type="range"
                  value={volume.sound}
                  onChange={(e) => {
                    setVolume({
                      sound: Number(e.target.value),
                      original: 100 - Number(e.target.value),
                    });
                  }}
                />
                <span>{volume.sound}%</span>
              </div>
            </div>

            <div className={styles['sound-volume-box']}>
              <span className={styles['sound-volume-heading']}>
                Original Audio Volume
              </span>
              <div className={styles['sound-volume-slider']}>
                <input type="range" value={volume.original} disabled />
                <span>{volume.original}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles['add-sound-btn-div']}>
            <span className={styles['add-sound-txt']}>No sound selected</span>
          </div>
        )}

        <div className={styles['close-btn-box']}>
          <button
            className={styles['close-btn']}
            onClick={() =>
              setShowMobile((prev) => ({ ...prev, volume: false }))
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

export default MobileVolume;
