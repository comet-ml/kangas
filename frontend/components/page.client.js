//import { StyledEngineProvider } from '@mui/material';

export default function Page({ children }) {
    return (
	<>
            <div className="main">
                <div className="page">{children}</div>
            </div>
        </>
    );
}
