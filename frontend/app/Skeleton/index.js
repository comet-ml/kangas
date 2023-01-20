import SkeletonClient from "./SkeletonClient";


// TODO Get rid of client
const Skeleton = ({message}) => {
    console.log(message);
    return (
        <SkeletonClient>
            Loading
        </SkeletonClient>
    )
}

export default Skeleton;