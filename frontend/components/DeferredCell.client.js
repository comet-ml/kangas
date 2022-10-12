import { useInView } from 'react-intersection-observer';

const DeferredCell = ({ children }) => {
    const { ref, inView, entry } = useInView({
        threshold: 0,
        rootMargin: '1000px'
      });

    return (
        <div ref={ref}>
            { inView && children }
        </div>
    )
}

export default DeferredCell;