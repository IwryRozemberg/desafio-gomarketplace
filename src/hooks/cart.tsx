import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsCart = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsCart) {
        setProducts(JSON.parse(productsCart));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      setProducts(prevState => {
        const newState = prevState.map((product: Product) => {
          if (product.id === id) {
            const newQuantity = product.quantity + 1;
            return { ...product, quantity: newQuantity };
          }
          return product;
        });

        return newState;
      });

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productFind = products.find(prod => prod.id === id);
      if (productFind && productFind.quantity === 1) {
        if (products.length === 1) {
          setProducts([]);
        } else {
          const newProducts = products.filter(
            product => product !== productFind,
          );
          setProducts(newProducts);
        }
      } else {
        setProducts(prevState => {
          const newState = prevState.map((product: Product) => {
            if (product.id === id) {
              const newQuantity = product.quantity - 1;
              return { ...product, quantity: newQuantity };
            }

            return product;
          });

          return newState;
        });
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productFind = products.find(prod => prod.id === product.id);

      if (productFind) {
        increment(productFind.id);
        return;
      }

      setProducts(prevState => [...prevState, { ...product, quantity: 1 }]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
