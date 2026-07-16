import { AppLayout } from './components/AppLayout';
import { ReelMenu } from './components/ReelMenu';
import { dishes } from './data/dishes';
import { restaurantConfig } from './config/restaurant';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <AppLayout restaurant={restaurantConfig}>
        <ReelMenu dishes={dishes} />
      </AppLayout>
    </ToastProvider>
  );
}
