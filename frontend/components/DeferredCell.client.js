import { useInView } from 'react-intersection-observer';

const DeferredCell = ({ children }) => {
    const { ref, entry } = useInView({
        trackVisibility: true,
        delay: 100
      });

    return (
        <div ref={ref}>
            { entry?.isVisible && children }
        </div>
    )
}

export default DeferredCell;