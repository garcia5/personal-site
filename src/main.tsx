import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AwsRum, type AwsRumConfig } from 'aws-rum-web'
import './index.css'
import App from './App.tsx'

try {
  const config: AwsRumConfig = {
    sessionSampleRate: 1,
    identityPoolId: import.meta.env.VITE_RUM_IDENTITY_POOL_ID,
    endpoint: 'https://dataplane.rum.us-east-1.amazonaws.com',
    telemetries: ['performance', 'http'],
    allowCookies: true,
    enableXRay: false,
  }

  const APPLICATION_ID = import.meta.env.VITE_RUM_APP_ID
  const APPLICATION_VERSION = '1.0.0'
  const APPLICATION_REGION = 'us-east-1'

  new AwsRum(APPLICATION_ID, APPLICATION_VERSION, APPLICATION_REGION, config)
} catch {
  // ...
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
