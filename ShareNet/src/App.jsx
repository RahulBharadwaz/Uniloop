import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ProtectedRoute } from './components/layout';
import useAuthStore from './stores/authStore';
import useNotificationStore from './stores/notificationStore';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import MyItems from './pages/MyItems';
import CreateItem from './pages/CreateItem';
import EditItem from './pages/EditItem';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Requests from './pages/Requests';
import Notifications from './pages/Notifications';
import LostFoundIndex from './pages/LostFound/index';
import LostFoundDetail from './pages/LostFound/LostFoundDetail';
import MyClaims from './pages/LostFound/MyClaims';
import ClaimChat from './pages/LostFound/ClaimChat';
import CreateLostFoundPost from './pages/LostFound/CreateLostFoundPost';
import EditLostFoundPost from './pages/LostFound/EditLostFoundPost';
import WantedItemsIndex from './pages/WantedItems/index';
import WantedItemDetail from './pages/WantedItems/WantedItemDetail';
import CreateWantedItem from './pages/WantedItems/CreateWantedItem';
import EditWantedItem from './pages/WantedItems/EditWantedItem';
import MyOffers from './pages/WantedItems/MyOffers';
import OfferChat from './pages/WantedItems/OfferChat';
import HowToUse from './pages/HowToUse';

function App() {
    const { checkAuth, isAuthenticated } = useAuthStore();
    const { fetchUnreadCount, setupSocketListeners } = useNotificationStore();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCount();
            setupSocketListeners();
        }
    }, [isAuthenticated]);

    return (
        <BrowserRouter>
            <Routes>
                {/* Full-screen page without navbar */}
                <Route path="/how-to-use" element={<HowToUse />} />

                <Route element={<Layout />}>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/items" element={<Items />} />
                    <Route path="/items/:id" element={<ItemDetail />} />

                    {/* Protected Routes */}
                    <Route path="/profile" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                    } />
                    <Route path="/my-items" element={
                        <ProtectedRoute><MyItems /></ProtectedRoute>
                    } />
                    <Route path="/my-items/new" element={
                        <ProtectedRoute><CreateItem /></ProtectedRoute>
                    } />
                    <Route path="/my-items/:id/edit" element={
                        <ProtectedRoute><EditItem /></ProtectedRoute>
                    } />
                    <Route path="/transactions" element={
                        <ProtectedRoute><Transactions /></ProtectedRoute>
                    } />
                    <Route path="/transactions/:id" element={
                        <ProtectedRoute><TransactionDetail /></ProtectedRoute>
                    } />
                    <Route path="/requests" element={
                        <ProtectedRoute><Requests /></ProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                        <ProtectedRoute><Notifications /></ProtectedRoute>
                    } />
                    <Route path="/lost-found" element={
                        <ProtectedRoute><LostFoundIndex /></ProtectedRoute>
                    } />
                    <Route path="/lost-found/create" element={
                        <ProtectedRoute><CreateLostFoundPost /></ProtectedRoute>
                    } />
                    <Route path="/lost-found/claims" element={
                        <ProtectedRoute><MyClaims /></ProtectedRoute>
                    } />
                    <Route path="/lost-found/chat" element={
                        <ProtectedRoute><ClaimChat /></ProtectedRoute>
                    } />
                    <Route path="/lost-found/chat/:claimId" element={
                        <ProtectedRoute><ClaimChat /></ProtectedRoute>
                    } />
                    <Route path="/lost-found/:id/edit" element={
                        <ProtectedRoute><EditLostFoundPost /></ProtectedRoute>
                    } />
                    <Route path="/lost-found/:id" element={
                        <ProtectedRoute><LostFoundDetail /></ProtectedRoute>
                    } />

                    {/* Wanted Items Routes */}
                    <Route path="/wanted" element={
                        <ProtectedRoute><WantedItemsIndex /></ProtectedRoute>
                    } />
                    <Route path="/wanted/create" element={
                        <ProtectedRoute><CreateWantedItem /></ProtectedRoute>
                    } />
                    <Route path="/wanted/my-offers" element={
                        <ProtectedRoute><MyOffers /></ProtectedRoute>
                    } />
                    <Route path="/wanted/chat/:offerId" element={
                        <ProtectedRoute><OfferChat /></ProtectedRoute>
                    } />
                    <Route path="/wanted/:id/edit" element={
                        <ProtectedRoute><EditWantedItem /></ProtectedRoute>
                    } />
                    <Route path="/wanted/:id" element={
                        <ProtectedRoute><WantedItemDetail /></ProtectedRoute>
                    } />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
