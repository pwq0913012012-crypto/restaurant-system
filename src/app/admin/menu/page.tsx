'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'

type Category = {
  id: string; name: string; sortOrder: number; isActive: boolean;
  items: MenuItem[]
}
type MenuItem = {
  id: string; categoryId: string; name: string; description: string;
  price: number; image: string; isAvailable: boolean; isPopular: boolean;
  spicyLevel: number; tags: string[]; sortOrder: number
}

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<{ id?: string; name: string } | null>(null)
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> & { categoryId: string } | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  const fetchData = async () => {
    const res = await fetch('/api/categories?all=true')
    const result = await res.json()
    if (result.success) setCategories(result.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // Category CRUD
  const saveCategory = async () => {
    if (!editingCategory) return
    const method = editingCategory.id ? 'PUT' : 'POST'
    const url = editingCategory.id ? `/api/categories/${editingCategory.id}` : '/api/categories'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingCategory.name }),
    })
    const result = await res.json()
    if (result.success) {
      toast.success(editingCategory.id ? '已更新分類' : '已新增分類')
      setEditingCategory(null)
      fetchData()
    } else toast.error(result.error)
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('確定刪除此分類？所有菜品也會被刪除。')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    toast.success('已刪除')
    fetchData()
  }

  // Menu Item CRUD
  const saveItem = async () => {
    if (!editingItem) return
    const method = editingItem.id ? 'PUT' : 'POST'
    const url = editingItem.id ? `/api/menu-items/${editingItem.id}` : '/api/menu-items'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingItem),
    })
    const result = await res.json()
    if (result.success) {
      toast.success(editingItem.id ? '已更新菜品' : '已新增菜品')
      setEditingItem(null)
      fetchData()
    } else toast.error(result.error)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('確定刪除此菜品？')) return
    await fetch(`/api/menu-items/${id}`, { method: 'DELETE' })
    toast.success('已刪除')
    fetchData()
  }

  const toggleAvailability = async (item: MenuItem) => {
    const newVal = !item.isAvailable
    // Optimistic update: change locally so position stays fixed
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        items: cat.items.map(i =>
          i.id === item.id ? { ...i, isAvailable: newVal } : i
        ),
      }))
    )
    await fetch(`/api/menu-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: newVal }),
    })
  }

  if (loading) return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 text-accent animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">菜單管理</h1>
        <button
          onClick={() => setEditingCategory({ name: '' })}
          className="px-4 py-2 rounded-lg bg-accent text-background font-medium flex items-center gap-2 hover:bg-accent-light text-sm"
        >
          <Plus className="w-4 h-4" /> 新增分類
        </button>
      </div>

      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-surface rounded-xl border border-surface-light overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-light"
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
            >
              <div className="flex items-center gap-3">
                {expandedCat === cat.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <h3 className="font-bold text-lg">{cat.name}</h3>
                <span className="text-sm text-muted">({cat.items.length} 品項)</span>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => setEditingCategory({ id: cat.id, name: cat.name })} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedCat === cat.id && (
              <div className="border-t border-surface-light p-4">
                <button
                  onClick={() => setEditingItem({ categoryId: cat.id, name: '', price: 0, description: '', image: '', spicyLevel: 0, tags: [], isAvailable: true, isPopular: false, sortOrder: 0 })}
                  className="mb-3 px-3 py-1.5 rounded-lg border border-dashed border-muted text-sm text-muted hover:text-foreground hover:border-accent flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 新增菜品
                </button>

                <div className="space-y-2">
                  {cat.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-light">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleAvailability(item)}
                          className="group relative flex-shrink-0 w-11 h-6 rounded-full flex items-center px-[3px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-90 border"
                          style={{
                            backgroundColor: item.isAvailable ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)',
                            borderColor: item.isAvailable ? 'var(--success)' : 'var(--danger)',
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{
                              transform: item.isAvailable ? 'translateX(20px)' : 'translateX(0)',
                              backgroundColor: item.isAvailable ? 'var(--success)' : 'var(--danger)',
                            }}
                          />
                        </button>
                        <div>
                          <span
                            className="font-medium transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{ color: item.isAvailable ? 'var(--foreground)' : 'var(--muted)' }}
                          >
                            {item.name}
                          </span>
                          {item.isPopular && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-danger/20 text-danger">人氣</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-accent font-medium">{formatPrice(item.price)}</span>
                        <button onClick={() => setEditingItem({ ...item })} className="p-1 rounded hover:bg-surface text-muted hover:text-foreground">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1 rounded hover:bg-danger/10 text-muted hover:text-danger">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingCategory.id ? '編輯分類' : '新增分類'}</h3>
              <button onClick={() => setEditingCategory(null)}><X className="w-5 h-5" /></button>
            </div>
            <input
              type="text"
              placeholder="分類名稱"
              value={editingCategory.name}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-light rounded-lg mb-4 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button onClick={saveCategory} className="w-full py-2.5 rounded-lg bg-accent text-background font-bold hover:bg-accent-light">
              儲存
            </button>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingItem.id ? '編輯菜品' : '新增菜品'}</h3>
              <button onClick={() => setEditingItem(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input
                type="text" placeholder="菜品名稱" value={editingItem.name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <textarea
                placeholder="描述" value={editingItem.description || ''} rows={2}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted">價格</label>
                  <input
                    type="number" value={editingItem.price || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">辣度 (0-3)</label>
                  <input
                    type="number" min={0} max={3} value={editingItem.spicyLevel || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, spicyLevel: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
              <input
                type="text" placeholder="圖片網址" value={editingItem.image || ''}
                onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-light rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.isPopular || false}
                    onChange={(e) => setEditingItem({ ...editingItem, isPopular: e.target.checked })}
                    className="rounded" />
                  <span className="text-sm">人氣菜品</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.isAvailable !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                    className="rounded" />
                  <span className="text-sm">上架中</span>
                </label>
              </div>
            </div>
            <button onClick={saveItem} className="w-full mt-4 py-2.5 rounded-lg bg-accent text-background font-bold hover:bg-accent-light">
              儲存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
