import styles from '../styles/MobileAdjustments.module.css';
import ReactDOM from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { TbBrightnessUpFilled } from 'react-icons/tb';
import { IoContrastSharp } from 'react-icons/io5';
import { BiSolidColor } from 'react-icons/bi';
import { RiContrastDrop2Line } from 'react-icons/ri';

type MobileAdjustmentsProps = {
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

const MobileAdjustments = ({
  setShowMobile,
  cropImage,
  currentFileData,
  setCurrentFileData,
}: MobileAdjustmentsProps) => {
  const [currentAdjustment, setCurrentAdjustment] = useState<
    | 'brightness'
    | 'contrast'
    | 'grayscale'
    | 'hue-rotate'
    | 'saturate'
    | 'sepia'
  >('brightness');

  const containerRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null!);

  const target = document.getElementById('adjustment-portal') || document.body;

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

  useEffect(() => {
    changeBackground(inputRef.current);
  }, [currentAdjustment]);

  const changeBackground = (target: HTMLInputElement) => {
    const value = parseFloat(target.value);

    if (inputRef.current) {
      if (currentAdjustment === 'grayscale' || currentAdjustment === 'sepia') {
        inputRef.current.style.background = `linear-gradient(to right, #a855f7 ${value}%, rgba(0, 0, 0, 0.7) ${value}%`;
      } else {
        if (value > 0) {
          inputRef.current.style.background = `linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.7) 50%, #a855f7 50%, #a855f7 ${
            50 + value / 2
          }%, rgba(0, 0, 0, 0.7) ${50 + value / 2}%, rgba(0, 0, 0, 0.7) 100%`;
        } else {
          inputRef.current.style.background = `linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.7) ${
            (value + 100) / 2
          }%, #a855f7 ${
            (value + 100) / 2
          }%, #a855f7 50%, rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0.7) 100%`;
        }
      }
    }
  };

  const changeAdjustmentValue =
    (reset?: boolean) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.MouseEvent<HTMLSpanElement, MouseEvent>
    ) => {
      if (reset) {
        setCurrentFileData({
          ...currentFileData,
          adjustments: {
            ...currentFileData.adjustments,
            [currentAdjustment]: 0,
          },
        });

        if (inputRef.current)
          inputRef.current.style.background = `rgba(0, 0, 0, 0.7)`;
      } else {
        const target = e.target as HTMLInputElement;
        const value = parseFloat(target.value);

        setCurrentFileData({
          ...currentFileData,
          adjustments: {
            ...currentFileData.adjustments,
            [currentAdjustment]: value,
          },
        });

        changeBackground(target);
      }
    };

  return ReactDOM.createPortal(
    <section className={styles.section}>
      <div className={styles['filter-container']} ref={containerRef}>
        <span className={styles['container-head']}>Adjustments</span>

        <div className={styles['input-div']}>
          <span className={styles['input-box']}>
            <input
              className={`${styles.input} ${cropImage ? styles.input2 : ''}`}
              type="range"
              disabled={cropImage}
              min={
                currentAdjustment === 'sepia' ||
                currentAdjustment === 'grayscale'
                  ? 0
                  : -100
              }
              max={100}
              value={currentFileData.adjustments[currentAdjustment]}
              onChange={changeAdjustmentValue()}
              ref={inputRef}
            />
          </span>

          <span className={styles['adjustment-value']}>
            {currentFileData.adjustments[currentAdjustment]}
          </span>
        </div>

        <div className={styles['adjustments-container']}>
          <span
            className={`${styles['adjustment-box']} ${
              currentAdjustment === 'brightness'
                ? styles['current-adjustment-box']
                : ''
            }`}
            onClick={() => setCurrentAdjustment('brightness')}
          >
            <TbBrightnessUpFilled className={styles['adjustment-icon']} />
            <span className={styles['adjustment-text']}>Brightness</span>
          </span>

          <span
            className={`${styles['adjustment-box']} ${
              currentAdjustment === 'contrast'
                ? styles['current-adjustment-box']
                : ''
            }`}
            onClick={() => setCurrentAdjustment('contrast')}
          >
            <IoContrastSharp className={styles['adjustment-icon']} />
            <span className={styles['adjustment-text']}>Contrast</span>
          </span>

          <span
            className={`${styles['adjustment-box']} ${
              currentAdjustment === 'hue-rotate'
                ? styles['current-adjustment-box']
                : ''
            }`}
            onClick={() => setCurrentAdjustment('hue-rotate')}
          >
            <BiSolidColor className={styles['adjustment-icon']} />
            <span className={styles['adjustment-text']}>Hue-rotate</span>
          </span>

          <span
            className={`${styles['adjustment-box']} ${
              currentAdjustment === 'saturate'
                ? styles['current-adjustment-box']
                : ''
            }`}
            onClick={() => setCurrentAdjustment('saturate')}
          >
            <RiContrastDrop2Line className={styles['adjustment-icon']} />
            <span className={styles['adjustment-text']}>Saturate</span>
          </span>

          <span
            className={`${styles['adjustment-box']} ${
              currentAdjustment === 'grayscale'
                ? styles['current-adjustment-box']
                : ''
            }`}
            onClick={() => setCurrentAdjustment('grayscale')}
          >
            <img
              className={styles['adjustment-icon2']}
              src="../../assets/images/others/grayscale.png"
            />
            <span className={styles['adjustment-text']}>Grayscale</span>
          </span>

          <span
            className={`${styles['adjustment-box']} ${
              currentAdjustment === 'sepia'
                ? styles['current-adjustment-box']
                : ''
            }`}
            onClick={() => setCurrentAdjustment('sepia')}
          >
            <svg
              className={styles['adjustment-icon']}
              viewBox="-4 0 32 32"
              version="1.1"
            >
              <path d="M1.531 17.563c-1.875 1.313-0.75 2.969 0.813 3.063 1.563 0.125 2.875 1.188 2.5 2.469-0.688 2.188-0.25 4 3.313 2.188 1.813-0.906 3.031-3.156 5.375 0.938 1.375 2.406 4.875 0.813 4.406-1.938-0.219-1.344 0.531-2.156 3.156-2.938 4.781-1.406 2.75-5.375 0.375-6.375s-2.719-2.719-1.875-4.469c0.813-1.688-1.5-4.406-3.531-2.594-1.625 1.438-3.656 0.125-3.688-0.375s-1.781-4.156-2.813-1.063c-0.688 1.969 0.406 5.375-5.656 1.844-3.844-2.25-5.719 3.531-1.531 5.563 1.969 0.969 1.031 2.406-0.844 3.688z"></path>
            </svg>
            <span className={styles['adjustment-text']}>Sepia</span>
          </span>
        </div>

        <div className={styles['close-btn-box']}>
          <span
            className={styles['reset-btn']}
            onClick={changeAdjustmentValue(true)}
          >
            Reset
          </span>
          <button
            className={styles['close-btn']}
            onClick={() =>
              setShowMobile((prev) => ({ ...prev, adjustments: false }))
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

export default MobileAdjustments;
