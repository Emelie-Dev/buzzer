import styles from '../styles/Notifications.module.css';
import { TiPlus } from 'react-icons/ti';
import NotificationBox from '../components/NotificationBox';
import { useEffect, useRef, useState } from 'react';
import { TiMinus } from 'react-icons/ti';

type NotificationGroupProps = {
  selectCount: number;
  index: number;
  setSelectCount: React.Dispatch<React.SetStateAction<number>>;
};

const NotificationGroup = ({
  setSelectCount,
  index,
  selectCount,
}: NotificationGroupProps) => {
  const [collapse, setCollapse] = useState<boolean>(index === 0 ? false : true);

  const groupRef = useRef<HTMLDivElement>(null!);
  const checkBoxRef = useRef<HTMLInputElement[]>([]);

  const prevCollapseValue = useRef<boolean>(collapse);

  useEffect(() => {
    if (collapse) {
      groupRef.current.animate(
        {
          maxHeight: [`${groupRef.current.scrollHeight}px`, '40px'],
        },
        {
          fill: 'both',
          duration: 200,
        }
      );
    } else {
      groupRef.current.animate(
        {
          maxHeight: ['40px', `${groupRef.current.scrollHeight}px`],
        },
        {
          fill: 'both',
          duration: 200,
        }
      );
    }
  }, [collapse]);

  useEffect(() => {
    if (selectCount === 1) {
      prevCollapseValue.current = collapse;
      setCollapse(false);
    } else if (selectCount >= 1) {
      setCollapse(false);
    } else {
      setCollapse(prevCollapseValue.current);
      checkBoxRef.current.forEach((elem) => (elem.checked = false));
    }
  }, [selectCount]);

  const handleSelect = () => {
    const unCheckedLength = checkBoxRef.current.filter((elem) => {
      return !elem.checked;
    }).length;

    if (unCheckedLength === 0) {
      checkBoxRef.current.forEach((elem) => (elem.checked = false));
      setSelectCount((prev) => prev - checkBoxRef.current.length);
    } else {
      checkBoxRef.current.forEach((elem) => (elem.checked = true));
      setSelectCount((prev) => prev + unCheckedLength);
    }
  };

  return (
    <div className={styles['notifications-div']} ref={groupRef}>
      <span className={styles['notifications-head']}>
        <span className={styles['notifications-date']}>Today</span>

        {selectCount > 0 ? (
          <input
            type="checkbox"
            className={`${styles['group-checkbox']}`}
            checked={checkBoxRef.current.every((elem) => elem.checked)}
            onChange={handleSelect}
          />
        ) : collapse ? (
          <TiPlus
            className={styles['notifications-icon']}
            onClick={() => setCollapse(false)}
          />
        ) : (
          <TiMinus
            className={styles['notifications-icon']}
            onClick={() => setCollapse(true)}
          />
        )}
      </span>

      <div className={styles.notifications}>
        {new Array(3).fill(null).map((_, index) => (
          <NotificationBox
            key={index}
            checkBoxRef={checkBoxRef}
            setSelectCount={setSelectCount}
            selectCount={selectCount}
          />
        ))}
      </div>
    </div>
  );
};
export default NotificationGroup;
