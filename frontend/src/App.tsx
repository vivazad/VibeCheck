import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { OAuthProvider } from './components/ui/GoogleButton';
import { Toaster } from 'react-hot-toast';
import {
    HomePage,
    RatePage,
    ThankYouPage,
    LoginPage,
    SignupPage,
    OnboardingPage,
    Dashboard,
    SettingsPage,
    TasksPage,
    IntegrationPage
} from './pages';
import { ResponsesPage } from './pages/ResponsesPage';

function App() {
    return (
        <ThemeProvider>
            <OAuthProvider>
                <BrowserRouter>
                    <Toaster position="top-center" />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/rate" element={<RatePage />} />
                        <Route path="/thank-you" element={<ThankYouPage />} />

                        {/* Auth Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/onboarding" element={<OnboardingPage />} />

                        {/* Protected Routes (Should implement RequireAuth wrapper later) */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/dashboard/settings" element={<SettingsPage />} />
                        <Route path="/dashboard/responses" element={<ResponsesPage />} />
                        <Route path="/dashboard/tasks" element={<TasksPage />} />
                        <Route path="/dashboard/integrations" element={<IntegrationPage />} />
                    </Routes>
                </BrowserRouter>
            </OAuthProvider>
        </ThemeProvider>
    );
}

export default App;
