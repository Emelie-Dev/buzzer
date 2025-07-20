import styles from '../styles/ConfirmModal.module.css';
import ReactDOM from 'react-dom';

type ConfirmModalProps = {
  item: string;
  setConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
  setterArray: {
    setter: React.Dispatch<React.SetStateAction<any>>;
    value: any;
    type: 'cancel' | 'delete' | 'both';
  }[];
};

const ConfirmModal = ({
  item,
  setConfirmModal,
  setterArray,
}: ConfirmModalProps) => {
  const target =
    document.getElementById('confirmation-portal') || document.body;

  const closeModal = (closeType: 'cancel' | 'delete') => () => {
    setterArray.forEach(({ setter, value, type }) => {
      if (type === 'both') {
        setter(value);
      } else {
        if (type === closeType) setter(value);
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
        <p className={styles.text}>
          Are you sure you want to delete this {item}?
        </p>

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
            Delete
          </button>
        </div>
      </div>
    </section>,
    target
  );
};

export default ConfirmModal;
