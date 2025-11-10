import styles from '../styles/Notifications.module.css';
import { TiPlus } from 'react-icons/ti';
import NotificationBox from '../components/NotificationBox';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { TiMinus } from 'react-icons/ti';
import { days, monthLabels } from '../Utilities';
import { NotificationContext } from '../Contexts';

type NotificationGroupProps = {
  index: number;
  date: string;
  category: 'all' | 'posts' | 'mentions' | 'followers' | 'requests' | 'system';
  data: any[];
};

const NotificationGroup = ({
  index,
  date,
  category,
  data,
}: NotificationGroupProps) => {
  const [collapse, setCollapse] = useState<boolean>(index === 0 ? false : true);
  const { deleteData, setDeleteData } = useContext(NotificationContext);

  const groupRef = useRef<HTMLDivElement>(null!);
  const checkBoxRef = useRef<HTMLInputElement[]>([]);

  const prevCollapseValue = useRef<boolean>(collapse);

  useEffect(() => {
    setCollapse(index === 0 ? false : true);
  }, [category]);

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
    if (deleteData.list.size === 1) {
      prevCollapseValue.current = collapse || prevCollapseValue.current;
      setCollapse(false);
    } else if (deleteData.list.size >= 1) {
      setCollapse(false);
    } else {
      setCollapse(prevCollapseValue.current);
    }
  }, [deleteData]);

  const isAllChecked = () => {
    return data.every((obj) => deleteData.list.has(obj._id));
  };

  const handleSelect = () => {
    const list = new Set(deleteData.list);

    if (isAllChecked()) {
      data.forEach((obj) => list.delete(obj._id));
    } else {
      data.forEach((obj) => list.add(obj._id));
    }

    setDeleteData((prev) => ({ ...prev, list }));
  };

  const getDateValue = (date: string) => {
    const dateValue = new Date(date);

    const year = dateValue.getFullYear();
    const month = dateValue.getMonth();
    const dateNumber = dateValue.getDate();
    const day = dateValue.getDay();

    return `${days[day]}, ${monthLabels[month]} ${dateNumber}, ${year}`;
  };

  return (
    <div className={styles['notifications-div']} ref={groupRef}>
      <span className={styles['notifications-head']}>
        <span className={styles['notifications-date']}>
          {getDateValue(date)}
        </span>

        {deleteData.list.size > 0 ? (
          <input
            type="checkbox"
            className={`${styles['group-checkbox']}`}
            checked={isAllChecked()}
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
        {data.map((value, index) => (
          <NotificationBox key={index} data={value} checkBoxRef={checkBoxRef} />
        ))}
      </div>
    </div>
  );
};
export default React.memo(NotificationGroup);
