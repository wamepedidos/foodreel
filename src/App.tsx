import { AppLayout } from './components/AppLayout';
import { MenuExperience } from './components/MenuExperience';
import { dishes } from './data/dishes';
import { restaurantConfig } from './config/restaurant';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <AppLayout restaurant={restaurantConfig}>
        <MenuExperience dishes={dishes} />
      </AppLayout>
    </ToastProvider>
  );
}
