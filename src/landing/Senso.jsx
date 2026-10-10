import { memo } from 'react';

// The mascot, floating gently with a few sparkles. `pose` picks one of the existing Senso images.
function Senso({ pose = 'wave', size = 160, className = '', style }) {
  return (
    <span className={`senso ${className}`} style={{ width: size, height: size, ...style }} aria-hidden="true">
      <img src={`/mascot/${pose}.png`} alt="" width={size} height={size} />
      <i className="senso-spark s1" /><i className="senso-spark s2" /><i className="senso-spark s3" />
    </span>
  );
}
export default memo(Senso);
