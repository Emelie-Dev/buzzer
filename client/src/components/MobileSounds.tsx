import { useRef } from 'react';
import styles from '../styles/MobileSounds.module.css';
import ReactDOM from 'react-dom';

type MobileSoundsProps = {
  setShowMobile: React.Dispatch<
    React.SetStateAction<{
      coverPhoto: boolean;
      sounds: boolean;
    }>
  >;
};

const MobileSounds = ({ setShowMobile }: MobileSoundsProps) => {
  const containerRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('sounds-portal') || document.body;

  // useEffect(() => {
  //   containerRef.current.animate(
  //     {
  //       height: ['0px', '230px'],
  //     },
  //     {
  //       fill: 'both',
  //       duration: 150,
  //     }
  //   );
  // }, []);

  return ReactDOM.createPortal(
    <section className={styles.section}>
      <div className={styles['filter-container']} ref={containerRef}>
        <span className={styles['container-head']}>Sounds</span>

        <div className={styles['close-btn-box']}>
          <button
            className={styles['close-btn']}
            onClick={() =>
              setShowMobile((prev) => ({ ...prev, sounds: false }))
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

export default MobileSounds;
