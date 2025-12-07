import Lottie from 'lottie-react';
import loadingAnimation from '../../public/assets/Loading animation blue.json';

type LoadingAnimationProps = {
  style?: object;
  className?: string;
};

const LoadingAnimation = ({ style, className }: LoadingAnimationProps) => {
  return (
    <Lottie
      animationData={loadingAnimation}
      loop={true}
      style={style}
      className={className}
    />
  );
};

export default LoadingAnimation;
