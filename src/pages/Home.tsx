import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-500">Welcome to Gift Switch!</h1>
    </div>
  );
};

export default Home;
