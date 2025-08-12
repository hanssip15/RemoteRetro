# Error Handling System

Sistem penanganan error yang komprehensif untuk aplikasi React ini mencakup berbagai jenis error dan memberikan pengalaman pengguna yang baik saat terjadi masalah.

## Komponen Error Handling

### 1. Error Pages

#### 404 Page (`/app/error/404/page.tsx`)
- Ditampilkan ketika halaman tidak ditemukan
- Navigasi kembali ke halaman sebelumnya atau beranda
- Desain responsif dan user-friendly

#### General Error Page (`/app/error/general/page.tsx`)
- Menangani error umum dalam aplikasi
- Menampilkan detail error di development mode
- Tombol retry dan navigasi ke beranda

#### Network Error Page (`/app/error/network/page.tsx`)
- Menangani masalah koneksi jaringan
- Monitoring status online/offline
- Auto-retry dengan exponential backoff
- Tips troubleshooting untuk pengguna

### 2. Error Boundary (`/components/ErrorBoundary.tsx`)
- Menangkap JavaScript errors dalam component tree
- Fallback UI yang informatif
- Logging error untuk debugging
- Integrasi dengan error reporting services

### 3. Network Status Monitoring

#### Network Status Hook (`/hooks/useNetworkStatus.ts`)
- Monitoring koneksi internet
- Health check server secara berkala
- Auto-retry dengan exponential backoff
- Status real-time

#### Network Status Indicator (`/components/NetworkStatusIndicator.tsx`)
- Indikator visual status koneksi
- Posisi fixed di bottom-right
- Detail status saat di-hover

### 4. API Error Handling

#### Error Handler Utils (`/utils/errorHandler.ts`)
- Class untuk berbagai jenis error
- Fungsi untuk handle API errors
- Redirect otomatis ke halaman error yang sesuai
- Global error handling

#### API Hook (`/hooks/useApi.ts`)
- Custom hook untuk API calls
- Built-in error handling
- Retry logic dengan configurable options
- Timeout handling

## Cara Penggunaan

### 1. Menggunakan Error Boundary

```tsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### 2. Menggunakan Network Status

```tsx
import { useNetworkStatus } from './hooks/useNetworkStatus';
import NetworkStatusIndicator from './components/NetworkStatusIndicator';

function MyComponent() {
  const { isOnline, isServerReachable } = useNetworkStatus();
  
  return (
    <div>
      <NetworkStatusIndicator showDetails={true} />
      {!isOnline && <p>Anda sedang offline</p>}
    </div>
  );
}
```

### 3. Menggunakan API Hook

```tsx
import { useApi } from './hooks/useApi';

function MyComponent() {
  const { data, loading, error, get, retry } = useApi({
    retryCount: 3,
    timeout: 10000
  });

  const fetchData = async () => {
    try {
      await get('/api/data');
    } catch (error) {
      // Error akan di-handle otomatis
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && (
        <div>
          <p>Error: {error}</p>
          <button onClick={retry}>Coba Lagi</button>
        </div>
      )}
      {data && <p>Data: {JSON.stringify(data)}</p>}
    </div>
  );
}
```

### 4. Manual Error Handling

```tsx
import { handleApiError } from './utils/errorHandler';
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleError = (error) => {
    handleApiError(error, navigate, (message, type) => {
      // Show notification
      console.log(message, type);
    });
  };

  // Use in try-catch
  try {
    // Your code
  } catch (error) {
    handleError(error);
  }
}
```

## Konfigurasi

### Environment Variables

```env
# Health check endpoint
REACT_APP_HEALTH_CHECK_URL=/api/health

# Error reporting service (optional)
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

### Customization

#### Mengubah Error Messages
Edit file error pages untuk mengubah pesan error sesuai kebutuhan.

#### Mengubah Retry Logic
Modify `useNetworkStatus.ts` dan `useApi.ts` untuk mengubah retry behavior.

#### Mengubah Error Reporting
Integrate dengan services seperti Sentry, LogRocket, atau custom solution.

## Error Types

### 1. Network Errors
- Koneksi internet terputus
- Server tidak dapat diakses
- Timeout requests

### 2. HTTP Errors
- 401: Unauthorized (redirect ke login)
- 403: Forbidden
- 404: Not Found (redirect ke 404 page)
- 500: Internal Server Error
- 502/503/504: Server Unavailable

### 3. JavaScript Errors
- Runtime errors
- Component errors
- Unhandled promise rejections

## Best Practices

1. **Always wrap your app with ErrorBoundary**
2. **Use the useApi hook for all API calls**
3. **Handle specific errors appropriately**
4. **Provide meaningful error messages**
5. **Include retry mechanisms**
6. **Log errors for debugging**
7. **Test error scenarios**

## Testing Error Scenarios

### Simulasi Network Error
```javascript
// Di browser console
navigator.serviceWorker?.postMessage({ type: 'OFFLINE' });
```

### Simulasi Server Error
```javascript
// Mock fetch untuk return error
global.fetch = jest.fn(() => 
  Promise.reject(new Error('Network error'))
);
```

## Monitoring dan Analytics

Sistem ini dapat diintegrasikan dengan:
- Sentry untuk error tracking
- Google Analytics untuk user behavior
- Custom logging solution
- Performance monitoring tools
