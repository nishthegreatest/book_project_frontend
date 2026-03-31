import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken, getStoredUser } from '../lib/session';

const PublicRoute = () => {
    const token = getAccessToken();
    const user = getStoredUser();

    if (token) {
        return <Navigate to={user?.role === 'admin' ? "/superadmin" : "/"} replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
