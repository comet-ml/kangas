import { StyledEngineProvider } from '@mui/material';

export default function Page({ children }) {
    return (
        <StyledEngineProvider injectFirst>
            <div className="main">
                <div className="page">{children}</div>
            </div>
        </StyledEngineProvider>
    );
}
