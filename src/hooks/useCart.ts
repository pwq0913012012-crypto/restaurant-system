'use client'
import { useState, useCallback } from 'react'
import type { MenuItem } from '@/generated/prisma/client'
import type { CartItem } from '@/types'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((menuItem: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.menuItem.id === menuItem.id)
      if (existing) {
        return prev.map(i =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { menuItem, quantity: 1, note: '' }]
    })
  }, [])

  const removeItem = useCallback((menuItemId: string) => {
    setItems(prev => prev.filter(i => i.menuItem.id !== menuItemId))
  }, [])

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.menuItem.id !== menuItemId))
      return
    }
    setItems(prev =>
      prev.map(i =>
        i.menuItem.id === menuItemId ? { ...i, quantity } : i
      )
    )
  }, [])

  const updateNote = useCallback((menuItemId: string, note: string) => {
    setItems(prev =>
      prev.map(i =>
        i.menuItem.id === menuItemId ? { ...i, note } : i
      )
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0)

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateNote,
    clearCart,
    totalItems,
    totalAmount,
  }
}
