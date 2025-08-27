import styles from '../styles/ConfirmModal.module.css';
import ReactDOM from 'react-dom';

type ConfirmModalProps = {
  heading: string;
  message: string;
  confirmText?: string;
  functionArray: {
    caller: any;
    value: any[];
    type: 'cancel' | 'delete' | 'both';
  }[];
  setConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const ConfirmModal = ({
  heading,
  message,
  confirmText = 'Delete',
  functionArray,
  setConfirmModal,
}: ConfirmModalProps) => {
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

  return ReactDOM.createPortal(
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal('cancel')();
      }}
    >
      <div className={styles.container}>
        <h2 className={styles.heading}>{heading}</h2>

        <p className={styles.text}>{message}</p>

        <div className={styles['btn-div']}>
          <button
            className={styles['cancel-btn']}
            onClick={closeModal('cancel')}
          >
            Cancel
          </button>
          <button
            className={styles['delete-btn']}
            onClick={closeModal('delete')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </section>,
    target
  );
};

export default ConfirmModal;
