'use client';

import { CircularProgress, Dialog } from "@mui/material";
import { useContext, useEffect, useRef } from "react"
import { ViewContext } from "@kangas/app/contexts/ViewContext"

const TableClientWrapper = ({ data, children }) => {
    const { isLoading, completeLoading } = useContext(ViewContext);
    const prevData = useRef();

    useEffect(() => {
        if (data !== prevData?.current) {
            prevData.current = data
            if (isLoading) completeLoading();
        }
    }, [data, completeLoading, isLoading]);

    return (
        <>
            <Dialog open={isLoading}
                sx={{ '& .MuiBackdrop-root': { backgroundColor: 'transparent' } }}
                PaperProps={{
                    style: {
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        minHeight: '250px',
                        minWidth: '250px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    },
                }}
            >
                    <CircularProgress />
            </Dialog>
            { children }
        </>
    )
}

export default TableClientWrapper;