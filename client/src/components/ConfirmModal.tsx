import { useContext } from 'react';
import { AuthContext } from '../Contexts';
import styles from '../styles/ConfirmModal.module.css';
import ReactDOM from 'react-dom';

type ConfirmModalProps = {
  heading?: string;
  message?: string;
  confirmText?: string;
  functionArray: {
    caller: any;
    value: any[];
    type: 'cancel' | 'delete' | 'both';
  }[];
  setConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
  limitType?: string;
};

const ConfirmModal = ({
  heading,
  message,
  confirmText = 'Delete',
  functionArray,
  limitType,
  setConfirmModal,
}: ConfirmModalProps) => {
  const { user } = useContext(AuthContext);

  const target =
    document.getElementById('confirmation-portal') || document.body;

  const closeModal = (closeType: 'cancel' | 'delete') => () => {
    functionArray.forEach(({ caller, value, type }) => {
      if (type === 'both') {
        caller(...value);
      } else {
        if (type === closeType) caller(...value);
      }
    });
    setConfirmModal(false);
  };

  const getTime = () => {
    const value = user.settings.content.timeManagement.dailyLimit.value;

    if (value < 60) {
      return `${value} min`;
    } else {
      const hour = Math.trunc(value / 60);
      const min = Math.floor(value - hour * 60);

      return `${hour}hr${hour === 1 ? '' : 's'}${min ? `  ${min} min${min === 1 ? '' : 's'}` : ''}`;
    }
  };

  const getMessage = () => {
    if (limitType === 'daily-limit') {
      return `You’ve reached your daily screen limit of ${getTime()}. You can turn it off or update it in your settings.`;
    } else if (limitType === 'scroll-break') {
      return `You’ve been scrolling for a while. You can turn this off or update it in settings.`;
    } else if (limitType === 'sleep-reminders') {
      return `Bedtime hours are active. This reminder can be turned off or updated in settings.`;
    } else return message;
  };

  return ReactDOM.createPortal(
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal('cancel')();
      }}
    >
      <div className={styles.container}>
        <h2 className={styles.heading}>
          {limitType === 'daily-limit'
            ? 'Daily Limit'
            : limitType === 'scroll-break'
              ? 'Scroll Break'
              : limitType === 'sleep-reminders'
                ? 'Sleep Reminders'
                : heading}
        </h2>

        <p className={styles.text}>{getMessage()}</p>

        <div className={styles['btn-div']}>
          <button
            className={styles['cancel-btn']}
            onClick={closeModal('cancel')}
          >
            {limitType ? 'OK' : 'Cancel'}
          </button>

          {!limitType && (
            <button
              className={styles['delete-btn']}
              onClick={closeModal('delete')}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </section>,
    target,
  );
};

export default ConfirmModal;
