import { api } from "../../../lib/api";
import type { Product } from "../../../types/product.types";

export const getProducts = async (): Promise<Product[]> => {

    const response = await api.get<Product[]>(
        "/api/product"
    );

    return response.data;
};