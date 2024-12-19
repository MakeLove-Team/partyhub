import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, isAuthenticated } from '../api/auth';
import { UserDashboard } from './dashboards/UserDashboard';
import { ClubDashboard } from './dashboards/ClubDashboard';
import { AdminDashboard } from './dashboards/AdminDashboard';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }
  }, [navigate]);

  if (!userRole) {
    return null;
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'club':
        return <ClubDashboard />;
      case 'user':
      default:
        return <UserDashboard />;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {renderDashboard()}
    </div>
  );
};
