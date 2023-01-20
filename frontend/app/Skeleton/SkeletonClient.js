'use client';

import { useEffect } from "react";

const SkeletonClient = ({ children }) => {
    
    useEffect(() => {
        console.log('Mounting');
        return () => console.log('Unmounting')
    }, [])

    return (
        <>{ children }</>
    )
}

export default SkeletonClient;