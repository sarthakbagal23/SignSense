import { memo } from 'react';

const POSES = { wave: 'wave', pointing: 'read', read: 'read', excited: 'star', star: 'star', stars: 'stars' };

// The mascot, floating gently with a few sparkles. `pose` picks one of the existing Senso images.
function Senso({ pose = 'wave', size = 160, className = '', style }) {
  return (
    <span className={`senso ${className}`} style={{ width: size, height: size, ...style }} aria-hidden="true">
      <img src={`/media/story/senso-${POSES[pose] || POSES.wave}.jpg`} alt="" width={size} height={size} />
      <i className="senso-spark s1" /><i className="senso-spark s2" /><i className="senso-spark s3" />
    </span>
  );
}
export default memo(Senso);
