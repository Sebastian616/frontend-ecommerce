import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import LoginPage
    from "../features/auth/pages/LoginPage";

import ProductsPage
    from "../features/products/pages/ProductsPage";

import ProductIndex from '../features/products/pages/ProductIndex'

import ProtectedRoute
    from "./ProtectedRoute";
import AboutUsPage from "../pages/AboutUsPage";
import ContactPage from "../pages/Contact";

export default function AppRoutes() {

    return (
        <BrowserRouter>

            <Routes>

                {/* Ruta pública */}
                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                <Route
                    path="/"
                    element={<ProductIndex/>}
                    />

                {/* Rutas protegidas 
                <Route element={<ProtectedRoute />}>

                    <Route
                        path="/products"
                        element={<ProductsPage />}
                    />

                </Route>*/}

                <Route
                    path="/productos"
                    element={<ProductsPage />}
                />
                <Route
                    path="/nosotros"
                    element={<AboutUsPage />}
                />
                <Route
                    path="/contacto"
                    element={<ContactPage />}
                />

                {/* Ruta inicial 
                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/products"
                            replace
                        />
                    }
                />*/}

                {/* 404 */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/products"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}