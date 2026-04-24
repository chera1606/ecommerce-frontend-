/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/api';

const CartContext = createContext();

const normalizeOption = (value) => (value || '').trim().toLowerCase();
const getStockCount = (source) => Number(source?.inventoryLevel ?? source?.stock ?? 0);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { token, loading: authLoading } = useAuth();

  const loadCartFromDB = async () => {
    try {
      const res = await cartAPI.getCart();
      if (res.success && res.data?.items) {
        setCartItems((previousItems) => {
          const selectionMap = new Map(
            previousItems.map((item) => [item.cartItemId, item.selected])
          );

          return res.data.items
            .map((item) => ({
              ...(item.productId || {}),
              _id: item.productId?._id,
              cartItemId: item._id,
              quantity: item.quantity,
              selectedSize: item.size || '',
              selectedColor: item.color || '',
              price: item.price,
              availableStock: getStockCount(item.productId),
              selected: selectionMap.get(item._id) ?? true
            }))
            .filter((item) => item._id);
        });
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error("Failed to load cart from DB", err);
    }
  };

  const loadGuestCart = () => {
    const savedCart = localStorage.getItem('GUEST_CART');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse guest cart", e);
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  };

  const saveGuestCart = (items) => {
    localStorage.setItem('GUEST_CART', JSON.stringify(items));
    setCartItems(items);
  };

  useEffect(() => {
    if (authLoading) return;

    const syncCart = async () => {
      if (token) {
        // Handle merging guest cart if it exists
        const guestCartRaw = localStorage.getItem('GUEST_CART');
        if (guestCartRaw) {
          try {
            const guestItems = JSON.parse(guestCartRaw);
            if (guestItems.length > 0) {
              // Push guest items to DB
              await Promise.all(guestItems.map(item => 
                cartAPI.addToCart({
                  productId: item._id,
                  quantity: item.quantity,
                  size: item.selectedSize,
                  color: item.selectedColor
                })
              ));
              localStorage.removeItem('GUEST_CART');
            }
          } catch (e) {
            console.error("Merge error", e);
          }
        }
        await loadCartFromDB();
      } else {
        loadGuestCart();
      }
    };

    syncCart();
  }, [token, authLoading]);

  const addToCart = async (product, quantity = 1, size = '', color = '', options = {}) => {
    const normalizedQuantity = Math.max(1, Number(quantity) || 1);
    const mode = options.mode || 'increment';
    const openDrawer = options.openDrawer ?? true;
    const availableStock = getStockCount(product);
    
    const existingItem = cartItems.find(
      (item) =>
        item._id === product._id &&
        normalizeOption(item.selectedSize) === normalizeOption(size) &&
        normalizeOption(item.selectedColor) === normalizeOption(color)
    );
    
    const currentQuantity = existingItem ? Number(existingItem.quantity || 0) : 0;
    const requestedQuantity = mode === 'set' && existingItem
      ? normalizedQuantity
      : currentQuantity + normalizedQuantity;

    if (availableStock > 0 && requestedQuantity > availableStock) {
      alert(`Only ${availableStock} item(s) available in stock.`);
      return;
    }

    if (availableStock <= 0) {
      alert('This item is currently out of stock.');
      return;
    }

    if (!token) {
      // GUEST LOGIC
      let newItems;
      if (existingItem) {
        newItems = cartItems.map(item => 
          item.cartItemId === existingItem.cartItemId 
            ? { ...item, quantity: requestedQuantity } 
            : item
        );
      } else {
        newItems = [...cartItems, {
          ...product,
          cartItemId: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          quantity: normalizedQuantity,
          selectedSize: size || '',
          selectedColor: color || '',
          price: product.price,
          availableStock: availableStock,
          selected: true
        }];
      }
      saveGuestCart(newItems);
      if (openDrawer) setIsCartOpen(true);
      return;
    }

    // LOGGED IN LOGIC
    try {
      if (mode === 'set' && existingItem) {
        await cartAPI.updateCartItem(existingItem.cartItemId, { quantity: normalizedQuantity });
      } else {
        await cartAPI.addToCart({ 
          productId: product._id, 
          quantity: normalizedQuantity, 
          size, 
          color 
        });
      }

      await loadCartFromDB();
      if (openDrawer) {
        setIsCartOpen(true);
      }
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!token) {
      const newItems = cartItems.filter(item => item.cartItemId !== cartItemId);
      saveGuestCart(newItems);
      return;
    }
    try {
      setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
      await cartAPI.removeCartItem(cartItemId);
    } catch (err) {
      console.error(err);
      await loadCartFromDB();
    }
  };

  const updateQuantity = async (cartItemId, newQty) => {
    if (newQty < 1) return;
    const item = cartItems.find((entry) => entry.cartItemId === cartItemId);
    const availableStock = Number(item?.availableStock ?? item?.stock ?? 0);
    const targetQty = availableStock > 0 ? Math.min(newQty, availableStock) : newQty;
    
    if (availableStock > 0 && newQty > availableStock) {
      alert(`Only ${availableStock} item(s) available in stock.`);
    }

    if (!token) {
      const newItems = cartItems.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: targetQty } : item
      );
      saveGuestCart(newItems);
      return;
    }

    try {
      setCartItems(prev => prev.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: targetQty } : item
      ));
      await cartAPI.updateCartItem(cartItemId, { quantity: targetQty });
    } catch (err) {
      alert(err.message || "Failed to update quantity");
      await loadCartFromDB();
    }
  };

  const toggleItemSelection = (cartItemId) => {
    const newItems = cartItems.map(item => 
      item.cartItemId === cartItemId ? { ...item, selected: !item.selected } : item
    );
    setCartItems(newItems);
    if (!token) {
      saveGuestCart(newItems);
    }
  };

  const selectAll = (selected) => {
    const newItems = cartItems.map(item => ({ ...item, selected }));
    setCartItems(newItems);
    if (!token) {
      saveGuestCart(newItems);
    }
  };

  const clearCart = async () => {
    if (!token) {
      saveGuestCart([]);
      return;
    }
    try {
      await cartAPI.clearCart();
      setCartItems([]);
    } catch (err) {
      console.error(err);
    }
  };

  const removeSelectedItems = async () => {
    const selectedIds = cartItems
      .filter((item) => item.selected)
      .map((item) => item.cartItemId);

    if (selectedIds.length === 0) return;

    if (!token) {
      const newItems = cartItems.filter((item) => !item.selected);
      saveGuestCart(newItems);
      return;
    }

    const previousItems = cartItems;
    setCartItems((current) => current.filter((item) => !item.selected));

    try {
      await Promise.all(selectedIds.map((id) => cartAPI.removeCartItem(id)));
    } catch (err) {
      console.error(err);
      setCartItems(previousItems);
      await loadCartFromDB();
    }
  };

  const cartTotal = cartItems.reduce((total, item) => 
    item.selected ? total + (item.price * item.quantity) : total, 0
  );
  
  const selectedCount = cartItems.reduce((count, item) => 
    item.selected ? count + item.quantity : count, 0
  );

  const selectedLineCount = cartItems.filter((item) => item.selected).length;

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartLineCount = cartItems.length;

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      isCartOpen, 
      setIsCartOpen, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      toggleItemSelection,
      selectAll,
      clearCart,
      removeSelectedItems,
      refreshCart: loadCartFromDB,
      cartTotal,
      cartCount,
      cartLineCount,
      selectedCount,
      selectedLineCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
