# Error Handling System

Sistem error handling yang komprehensif untuk aplikasi React RetroSprint.

## Komponen Error Handling

### 1. ErrorBoundary
Komponen React Error Boundary yang menangkap JavaScript errors di component tree.

**Penggunaan:**
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

### 2. ProtectedRoute
Komponen untuk melindungi route yang memerlukan autentikasi.

**Penggunaan:**
```tsx
import ProtectedRoute from './components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

### 3. Error Pages
- **404 Page** (`/app/404/page.tsx`) - Halaman tidak ditemukan
- **500 Page** (`/app/500/page.tsx`) - Halaman server error

## Hooks dan Utilities

### useErrorHandler Hook
Hook untuk menangani error dan redirect ke halaman error yang sesuai.

**Penggunaan:**
```tsx
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleNetworkError, handleNotFound } = useErrorHandler();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        if (response.status === 401) {
          handleError({ status: 401, message: 'Unauthorized' }); // Redirect ke /login
        } else if (response.status === 404) {
          handleNotFound(); // Redirect ke /404
        } else if (response.status >= 500) {
          handleError({ status: response.status, message: 'Server error' }); // Redirect ke /500
        }
      }
    } catch (error) {
      handleNetworkError(); // Redirect ke /500 untuk network errors
    }
  };
};
```

### API Error Handler Utility
Utility untuk menangani API errors secara otomatis.

**Penggunaan:**
```tsx
import { createApiErrorHandler, withErrorHandling } from '../utils/apiErrorHandler';

const MyComponent = () => {
  const { handleApiError } = createApiErrorHandler();

  // Method 1: Manual handling
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: { message: 'API Error' }
          }
        };
      }
    } catch (error) {
      handleApiError(error); // Automatically redirects based on status code
    }
  };

  // Method 2: Using utility function
  const fetchDataWithUtility = async () => {
    const result = await withErrorHandling(
      async () => {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw {
            response: {
              status: response.status,
              data: { message: 'API Error' }
            }
          };
        }
        return response.json();
      },
      handleApiError
    );
  };
};
```

## Routing Configuration

Error pages sudah dikonfigurasi di `App.tsx`:

```tsx
<Routes>
  {/* Regular routes */}
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginPage />} />
  
  {/* Protected routes */}
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } />
  
  {/* Error pages */}
  <Route path="/404" element={<NotFoundPage />} />
  <Route path="/500" element={<ServerErrorPage />} />
  
  {/* Catch all route - 404 */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

## Error Status Code Mapping

| Status Code | Action | Redirect To |
|-------------|--------|-------------|
| 401, 403 | Unauthorized/Forbidden | `/login` |
| 404 | Not Found | `/404` |
| 500, 502, 503, 504 | Server Error | `/500` |
| Network Error | Connection Issue | `/500` |
| JavaScript Error | Component Error | Error Boundary UI |

## Best Practices

1. **Gunakan ErrorBoundary** di level tertinggi aplikasi
2. **Wrap protected routes** dengan `ProtectedRoute` component
3. **Gunakan useErrorHandler** untuk custom error handling
4. **Gunakan createApiErrorHandler** untuk API calls
5. **Test error scenarios** untuk memastikan redirect berfungsi

## Testing Error Handling

Untuk test error handling:

1. **404 Error**: Akses URL yang tidak ada
2. **401 Error**: Akses protected route tanpa login (akan redirect ke /login)
3. **500 Error**: Simulasi server error
4. **Network Error**: Matikan internet connection

## Customization

Anda dapat kustomisasi error pages dengan mengedit:
- `frontend/src/app/404/page.tsx`
- `frontend/src/app/500/page.tsx`
- `frontend/src/components/ErrorBoundary.tsx`
