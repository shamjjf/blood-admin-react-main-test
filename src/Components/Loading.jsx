import gsap from "gsap";
import { useEffect } from "react";

const LoadingScreen = () => {
  useEffect(() => {
    gsap.to(".loader", {});
  }, []);

  return (
    <div className="loading-screen">
      <div className="loader"></div>
    </div>
  );
};

export default LoadingScreen;
