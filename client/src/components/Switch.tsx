import styles from '../styles/Switch.module.css';

type SwitchProps =
  | {
      setter: React.Dispatch<React.SetStateAction<boolean>>;
      value: boolean;
    }
  | {
      interactions: boolean;
      type:
        | 'likes'
        | 'comments'
        | 'followers'
        | 'mentions'
        | 'views'
        | 'messages';
      setter: React.Dispatch<
        React.SetStateAction<{
          likes: boolean;
          comments: boolean;
          followers: boolean;
          mentions: boolean;
          views: boolean;
          messages: boolean;
        }>
      >;
      value: boolean;
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
    <label className={styles.switch}>
      <input type="checkbox" checked={props.value} onChange={handleChange} />
      <span className={styles.slider}></span>
    </label>
  );
};

export default Switch;
