import { CircularProgress } from '@mui/material';
import { useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import Canvas from './Canvas.client';

const CanvasWrapper = ({ url, drawImage, dgid, scoreBound }) => {
  const { ref, inView, entry } = useInView({
    threshold: 0,
    rootMargin: '1000px',
    triggerOnce: true
  });

  const canvasRef = useRef();

  return (
    <div ref={ref}>
        { inView && <div ref={canvasRef}><Canvas url={url} drawImage={drawImage} dgid={dgid} scoreBound={scoreBound} /></div> }
        { !inView && <CircularProgress /> }
    </div>
  )
}
export default CanvasWrapper;