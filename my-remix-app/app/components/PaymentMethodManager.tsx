"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, X, Save } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { useFetchPaymentMethods } from "~/hooks/api/queries/useFetchPaymentMethods"
import { useFetchPlayerPaymentMethodDetail, type PlayerPaymentMethod } from "~/hooks/api/queries/useFetchPlayerPaymentMethodDetail"
import { toast } from "sonner"
import { supabase } from "~/hooks/use-auth"

interface PaymentMethodManagerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    playerId: string
    playerName: string
    onClose: () => void
}

interface PaymentMethod {
    id: string
    payment_method: string
}

export function PaymentMethodManager({
    open,
    onOpenChange,
    playerId,
    playerName,
    onClose,
}: PaymentMethodManagerProps) {
    const { data: availablePaymentMethods } = useFetchPaymentMethods()
    const { data: playerPaymentMethods, refetch } = useFetchPlayerPaymentMethodDetail(playerId)
    
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        payment_method: "",
        tag_name: "",
        qr_code: "",
    })

    const resetForm = () => {
        setFormData({
            payment_method: "",
            tag_name: "",
            qr_code: "",
        })
        setIsAdding(false)
        setEditingId(null)
    }

    const handleAddNew = () => {
        setIsAdding(true)
        setEditingId(null)
        setFormData({
            payment_method: "",
            tag_name: "",
            qr_code: "",
        })
    }

    const handleEdit = (method: PlayerPaymentMethod) => {
        setEditingId(method.id)
        setIsAdding(false)
        setFormData({
            payment_method: method.payment_method,
            tag_name: method.tag_name || "",
            qr_code: method.qr_code || "",
        })
    }

    const handleCancel = () => {
        resetForm()
    }

    const handleSave = async () => {
        if (!formData.payment_method) {
            toast.error("Please select a payment method")
            return
        }

        try {
            if (isAdding) {
                // Add new payment method
                const { error } = await supabase
                    .from('player_payment_methods')
                    .insert([{
                        player_id: playerId,
                        payment_method: formData.payment_method,
                        tag_name: formData.tag_name || null,
                        qr_code: formData.qr_code || null,
                    }])

                if (error) throw error
                toast.success("Payment method added successfully")
            } else if (editingId) {
                // Update existing payment method
                const { error } = await supabase
                    .from('player_payment_methods')
                    .update({
                        payment_method: formData.payment_method,
                        tag_name: formData.tag_name || null,
                        qr_code: formData.qr_code || null,
                    })
                    .eq('id', editingId)

                if (error) throw error
                toast.success("Payment method updated successfully")
            }

            resetForm()
            refetch()
        } catch (error) {
            console.error('Error saving payment method:', error)
            toast.error("Failed to save payment method")
        }
    }

    const handleDelete = async (methodId: string) => {
        if (!confirm("Are you sure you want to delete this payment method?")) {
            return
        }

        try {
            const { error } = await supabase
                .from('player_payment_methods')
                .delete()
                .eq('id', methodId)

            if (error) throw error
            toast.success("Payment method deleted successfully")
            refetch()
        } catch (error) {
            console.error('Error deleting payment method:', error)
            toast.error("Failed to delete payment method")
        }
    }

    const handleClose = () => {
        resetForm()
        onClose()
        onOpenChange(false)
    }

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            resetForm()
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">
                        Manage Payment Methods - {playerName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add New Payment Method Button */}
                    {!isAdding && !editingId && (
                        <Button
                            onClick={handleAddNew}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Payment Method
                        </Button>
                    )}

                    {/* Add/Edit Form */}
                    {(isAdding || editingId) && (
                        <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-white">
                                    {isAdding ? "Add New Payment Method" : "Edit Payment Method"}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancel}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label className="text-white">Payment Method <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.payment_method}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                                    >
                                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-gray-600">
                                            {availablePaymentMethods?.map((method) => (
                                                <SelectItem key={method.id} value={method.id}>
                                                    {method.payment_method}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-white">Tag Name</Label>
                                    <Input
                                        value={formData.tag_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tag_name: e.target.value }))}
                                        placeholder="e.g., Personal, Business, etc."
                                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                    />
                                </div>

                                <div>
                                    <Label className="text-white">QR Code URL</Label>
                                    <Input
                                        value={formData.qr_code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, qr_code: e.target.value }))}
                                        placeholder="QR code image URL (optional)"
                                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={handleSave}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {isAdding ? "Add" : "Update"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancel}
                                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Existing Payment Methods List */}
                    {playerPaymentMethods && playerPaymentMethods.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-white">Existing Payment Methods</h3>
                            <div className="space-y-2">
                                {playerPaymentMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        className="flex items-center justify-between p-3 bg-gray-800 border border-gray-600 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="text-white font-medium">
                                                {method.payment_methods?.payment_method || 'Unknown Method'}
                                            </p>
                                            {method.tag_name && (
                                                <p className="text-gray-400 text-sm">Tag: {method.tag_name}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(method)}
                                                className="text-blue-400 hover:text-blue-300"
                                                disabled={isAdding || editingId !== null}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(method.id)}
                                                className="text-red-400 hover:text-red-300"
                                                disabled={isAdding || editingId !== null}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Payment Methods Message */}
                    {playerPaymentMethods && playerPaymentMethods.length === 0 && !isAdding && (
                        <div className="text-center py-8">
                            <p className="text-gray-400">No payment methods found for this player</p>
                        </div>
                    )}

                    {/* Close Button */}
                    {!isAdding && !editingId && (
                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleClose}
                                className="bg-gray-600 hover:bg-gray-700"
                            >
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
} 