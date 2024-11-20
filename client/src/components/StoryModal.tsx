import styles from '../styles/StoryModal.module.css';

type StoryModalProps = {
  setViewStory: React.Dispatch<React.SetStateAction<boolean>>;
};

const StoryModal = ({ setViewStory }: StoryModalProps) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setViewStory(false);
  };

  return <section className={styles.section} onClick={handleClick}></section>;
};

export default StoryModal;
