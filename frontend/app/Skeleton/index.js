import SkeletonClient from "./SkeletonClient";


// TODO Get rid of client
const Skeleton = ({message}) => {
    if (message) console.log(message);
    return (
        <SkeletonClient>
            Loading
        </SkeletonClient>
    )
}

export default Skeleton;