import styles from '../styles/MobileFilter.module.css';
import ReactDOM from 'react-dom';
import { filters } from '../Utilities';
import { useEffect, useRef } from 'react';

type MobileFilterProps = {
  setShowMobileFilter: React.Dispatch<React.SetStateAction<boolean>>;
};

const MobileFilter = ({ setShowMobileFilter }: MobileFilterProps) => {
  const containerRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('filter-portal') || document.body;

  useEffect(() => {
    containerRef.current.animate(
      {
        height: ['0px', '219px'],
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
            <span className={`${styles['filter-box']}`} key={index}>
              <span className={`${styles['filter-img-span']} `}>
                {' '}
                <img
                  className={styles['filter-img']}
                  src="../../assets/filter.avif"
                  style={{ filter }}
                />
              </span>

              <span className={`${styles['filter-name']}`}>{name}</span>
            </span>
          ))}
        </div>

        <div className={styles['close-btn-box']}>
          <button
            className={styles['close-btn']}
            onClick={() => setShowMobileFilter(false)}
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
