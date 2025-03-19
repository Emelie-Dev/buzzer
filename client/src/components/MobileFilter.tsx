import styles from '../styles/MobileFilter.module.css';
import ReactDOM from 'react-dom';
import { filters } from '../Utilities';
import { useEffect, useRef } from 'react';

type MobileFilterProps = {
  setShowMobile: React.Dispatch<
    React.SetStateAction<{
      filter: boolean;
      adjustments: boolean;
      sound: boolean;
    }>
  >;
  currentFileData: {
    filter: string;
    adjustments: {
      brightness: number;
      contrast: number;
      grayscale: number;
      'hue-rotate': number;
      saturate: number;
      sepia: number;
    };
  };
  setCurrentFileData: React.Dispatch<
    React.SetStateAction<{
      filter: string;
      adjustments: {
        brightness: number;
        contrast: number;
        grayscale: number;
        'hue-rotate': number;
        saturate: number;
        sepia: number;
      };
    }>
  >;
  cropImage: boolean;
};

const MobileFilter = ({
  setShowMobile,
  currentFileData,
  setCurrentFileData,
  cropImage,
}: MobileFilterProps) => {
  const containerRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('filter-portal') || document.body;

  useEffect(() => {
    containerRef.current.animate(
      {
        height: ['0px', '230px'],
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
        <span className={styles['container-head']}>Filters</span>

        <div className={styles['filters-div']}>
          {filters.map(({ name, filter }, index) => (
            <span
              className={`${styles['filter-box']} ${
                cropImage ? styles['disable-filter'] : ''
              }`}
              key={index}
              onClick={() =>
                !cropImage
                  ? setCurrentFileData({
                      ...currentFileData,
                      filter: name,
                    })
                  : null
              }
            >
              <span
                className={`${styles['filter-img-span']} ${
                  currentFileData.filter === name
                    ? styles['current-filter-span']
                    : ''
                }`}
              >
                <img
                  className={styles['filter-img']}
                  src="../../assets/filter.avif"
                  style={{ filter }}
                />
              </span>

              <span
                className={`${styles['filter-name']} ${
                  currentFileData.filter === name
                    ? styles['current-filter-name']
                    : ''
                }`}
              >
                {name}
              </span>
            </span>
          ))}
        </div>

        <div className={styles['close-btn-box']}>
          <button
            className={styles['close-btn']}
            onClick={() =>
              setShowMobile((prev) => ({ ...prev, filter: false }))
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

export default MobileFilter;
