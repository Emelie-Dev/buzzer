import Lottie from 'lottie-react';
import loadingAnimation from '../../public/assets/Loading animation blue.json';

type LoadingAnimationProps = {
  style?: object;
};

const LoadingAnimation = ({ style }: LoadingAnimationProps) => {
  return <Lottie animationData={loadingAnimation} loop={true} style={style} />;
};

export default LoadingAnimation;
