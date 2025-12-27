import styles from '../styles/Switch.module.css';

type SwitchProps =
  | {
      setter: React.Dispatch<React.SetStateAction<boolean>>;
      value: boolean;
      className?: string;
    }
  | {
      interactions: boolean;
      type:
        | 'likes'
        | 'comments'
        | 'followers'
        | 'mentions'
        | 'profileViews'
        | 'messages';
      setter: React.Dispatch<
        React.SetStateAction<{
          likes: boolean;
          comments: boolean;
          followers: boolean;
          mentions: boolean;
          profileViews: boolean;
          messages: boolean;
        }>
      >;
      value: boolean;
      className?: string;
    };

const Switch = (props: SwitchProps) => {
  const handleChange = () => {
    if ('interactions' in props && 'type' in props) {
      const { type, setter } = props;
      setter((prevValue) => ({
        ...prevValue,
        [type]: !prevValue[type],
      }));
    } else {
      const { setter } = props;
      setter((prevValue: boolean) => !prevValue);
    }
  };

  return (
    <label className={`${styles.switch} ${props.className || ''}`}>
      <input type="checkbox" checked={props.value} onChange={handleChange} />
      <span className={styles.slider}></span>
    </label>
  );
};

export default Switch;
