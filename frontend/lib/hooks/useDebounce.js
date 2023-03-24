import { useCallback, useEffect, useState } from 'react'

const useDebounce = (callback, delay) => {
    const [timer, setTimer] = useState();
    const debouncedCallback = useCallback((args) => {
        if (timer) {
            clearTimeout(timer)
        }


        setTimer(setTimeout(() => callback(args), delay || 15))
    }, [callback, delay]);

    // Cleanup the timeout when this hook is removed
    useEffect(() => {
        return () => {
            clearTimeout(timer)
        }
    }, [timer])

  return debouncedCallback
}

export default useDebounce
