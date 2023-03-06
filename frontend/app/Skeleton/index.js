import config from '../../config';
import SkeletonClient from "./SkeletonClient";


// TODO Get rid of client
const Skeleton = ({message}) => {
    if (config.debug && message) console.log(message);
    return (
        <SkeletonClient>
            Loading
        </SkeletonClient>
    );
};

export default Skeleton;
