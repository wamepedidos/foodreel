import { AppLayout } from './components/AppLayout';
import { OrderPage } from './components/OrderPage';
import { ToastProvider } from './components/Toast';
import { restaurantConfig } from './config/restaurant';

export default function OrderApp() {
  return (
    <ToastProvider>
      <AppLayout restaurant={restaurantConfig}>
        <OrderPage />
      </AppLayout>
    </ToastProvider>
  );
}
